import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^ord_[A-Za-z0-9]{16}$/.test(id)) {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }

  // PII 최소 노출 (Codex #11): delivery_address, memo, phone 제외.
  // unauth endpoint이라 누구나 ord_id를 알면 조회 가능 — 영수증 표시에 필요한 minimum만.
  const { data, error } = await supabase()
    .from("orders")
    .select("id, nickname, status, total_amount, cup_count, delivery_at, items, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[orders GET]", error);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, order: data });
}
