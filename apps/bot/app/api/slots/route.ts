import { NextResponse } from "next/server";
import { listAvailableSlots } from "@/lib/slots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const requestedDays = Number(url.searchParams.get("days") ?? "7");
  const days = Number.isFinite(requestedDays)
    ? Math.max(7, Math.min(14, requestedDays))
    : 7;

  try {
    const slots = await listAvailableSlots({ days });
    // 가능한 슬롯만 반환 (사용자 측은 가능한 시간만 보면 됨)
    return NextResponse.json({ ok: true, slots: slots.filter((s) => s.available) });
  } catch (e) {
    console.error("[slots GET]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
