import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { listAvailableSlots } from "@/lib/slots";
import { fireNotify, loadPendingNotifyTargets } from "@/lib/notify-targets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 향후 7일 안에 가능한 슬롯이 하나라도 있으면 모든 pending notify_targets에 SMS 발송.
 * 슬롯이 0이면 skip (기다린다).
 */
export async function POST(req: Request) {
  if (!env.CRON_SECRET) {
    console.error("[cron notify-slots] CRON_SECRET not configured — rejecting");
    return NextResponse.json({ ok: false, error: "misconfigured" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const slots = await listAvailableSlots({ days: 7 });
  const open = slots.filter((s) => s.available);
  if (open.length === 0) {
    return NextResponse.json({ ok: true, fired: 0, reason: "no_open_slots" });
  }

  const targets = await loadPendingNotifyTargets();
  let fired = 0;
  for (const t of targets) {
    const result = await fireNotify(t);
    if (result.ok) fired += 1;
  }
  return NextResponse.json({ ok: true, fired, total: targets.length, openSlots: open.length });
}

export const GET = POST;
