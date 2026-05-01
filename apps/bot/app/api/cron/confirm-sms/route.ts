import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import { sendSms, SMS_TEMPLATES } from "@/lib/solapi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 배달 30분 전 자동 컨펌 SMS.
 * Vercel Cron(매 5분) 또는 외부 스케줄러로 호출.
 *
 * 멱등 보장 (Codex #7 fix, 2026-05-01):
 * sms_reminder_sent_at 컬럼을 atomic UPDATE로 claim — 단 1회만 발송.
 * 동시 cron 호출이 같은 row를 동시에 update해도 PostgreSQL row lock으로 한 쪽만 성공.
 */
export async function POST(req: Request) {
  if (!env.CRON_SECRET) {
    console.error("[cron] CRON_SECRET not configured — rejecting");
    return NextResponse.json({ ok: false, error: "misconfigured" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // delivery_at이 [now+25min, now+35min] 범위. 즉 30분 전 ±5분.
  const windowStart = new Date(now.getTime() + 25 * 60_000).toISOString();
  const windowEnd = new Date(now.getTime() + 35 * 60_000).toISOString();

  // 1단계: claim 후보 조회 (status=confirmed, 윈도우 안, 아직 sent 안 됨)
  const { data: candidates, error: queryErr } = await supabase()
    .from("orders")
    .select("id, nickname, phone, delivery_at")
    .eq("status", "confirmed")
    .is("sms_reminder_sent_at", null)
    .gte("delivery_at", windowStart)
    .lte("delivery_at", windowEnd);

  if (queryErr) {
    console.error("[cron confirm-sms] query failed", queryErr);
    return NextResponse.json({ ok: false, error: queryErr.message }, { status: 500 });
  }

  let sent = 0;
  let raced = 0;

  for (const order of candidates ?? []) {
    // 2단계: atomic claim — sms_reminder_sent_at IS NULL일 때만 update.
    // 동시 cron이 같은 row를 시도하면 한 쪽만 성공 (row 반환), 다른 쪽은 빈 결과.
    const { data: claimed, error: claimErr } = await supabase()
      .from("orders")
      .update({ sms_reminder_sent_at: now.toISOString() })
      .eq("id", order.id)
      .is("sms_reminder_sent_at", null)
      .eq("status", "confirmed")
      .select("id")
      .maybeSingle();

    if (claimErr) {
      console.error("[cron confirm-sms] claim failed", { id: order.id, err: claimErr });
      continue;
    }
    if (!claimed) { raced++; continue; }

    // 3단계: SMS 발송. 실패해도 sms_reminder_sent_at은 이미 set — 재시도 안 함 (멱등 우선).
    // (재시도가 필요하면 별도 retry 큐 도입해야 하나 v1.0 단순함 우선)
    const deliveryAt = new Date(order.delivery_at as string);
    // KST 표시
    const kst = new Date(deliveryAt.getTime() + 9 * 3600_000);
    const hm = `${String(kst.getUTCHours()).padStart(2, "0")}:${String(kst.getUTCMinutes()).padStart(2, "0")}`;
    try {
      await sendSms(order.phone as string, SMS_TEMPLATES.thirtyMinReminder(order.nickname as string, hm));
      await supabase().from("order_events").insert({
        order_id: order.id,
        event: "sms_sent",
        actor: "system",
        payload: { template: "thirty_min_reminder" },
      });
      sent++;
    } catch (e) {
      console.error("[cron confirm-sms] send failed (claim already committed)", { id: order.id, e });
    }
  }

  return NextResponse.json({ ok: true, sent, raced, candidates: candidates?.length ?? 0 });
}

export const GET = POST;
