import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import { sendOwnerMessage, isTelegramConfigured } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GRACE_MINUTES = 30;

/**
 * 배달 시간 + 30분 grace 후에도 confirmed인 주문은 사장님께 노쇼 판단 알림.
 * (자동 노쇼 처리는 사장님 텔레그램 [노쇼] 버튼 클릭 시 실행됨 — 여기서는 알림만)
 *
 * 자동 블랙리스트 등록은 updateOrderStatus(no_show)에서 발생.
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
  const lateBefore = new Date(now.getTime() - GRACE_MINUTES * 60_000).toISOString();

  const { data: orders, error } = await supabase()
    .from("orders")
    .select("id, nickname, phone, cup_count, delivery_at")
    .eq("status", "confirmed")
    .lte("delivery_at", lateBefore);

  if (error) {
    console.error("[cron no-show-check] query failed", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let notified = 0;
  for (const order of orders ?? []) {
    // 이미 알림 보냈는지 (order_events.payload.template='no_show_alert')
    const { data: existing } = await supabase()
      .from("order_events")
      .select("id")
      .eq("order_id", order.id)
      .eq("event", "telegram_sent")
      .contains("payload", { template: "no_show_alert" })
      .maybeSingle();
    if (existing) continue;

    if (!isTelegramConfigured()) continue;

    const deliveryAt = new Date(order.delivery_at as string);
    const hm = `${String(deliveryAt.getHours()).padStart(2, "0")}:${String(deliveryAt.getMinutes()).padStart(2, "0")}`;
    try {
      await sendOwnerMessage(
        `⚠️ <b>노쇼 의심</b>\n${hm} 도착 예정이던 ${order.nickname} ${order.cup_count}잔이 ${GRACE_MINUTES}분이 지나도 [완료]/[취소]/[노쇼] 처리되지 않았습니다.\n\n해당 주문 메시지의 버튼으로 처리해 주세요.\n<code>${order.id}</code>`,
      );
      await supabase().from("order_events").insert({
        order_id: order.id,
        event: "telegram_sent",
        actor: "system",
        payload: { template: "no_show_alert" },
      });
      notified++;
    } catch (e) {
      console.error("[cron no-show-check] send failed", { id: order.id, e });
    }
  }

  return NextResponse.json({ ok: true, notified, total: orders?.length ?? 0 });
}

export const GET = POST;
