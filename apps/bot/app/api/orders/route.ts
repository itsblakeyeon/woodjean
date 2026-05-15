import { NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  try {
    const result = await createOrder(body);
    if (!result.ok) {
      const status =
        result.error === "validation" ? 400 :
        result.error === "blacklisted" ? 403 :
        result.error === "rate_limited" ? 429 :
        result.error === "slot_taken" ? 409 :
        400;
      return NextResponse.json(result, { status });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    console.error("[orders POST]", e);
    return NextResponse.json({
      ok: false,
      error: "internal",
      message: "주문 서버에서 문제가 발생했어요. 매장(010-8484-2120)으로 연락해 주세요.",
    }, { status: 500 });
  }
}
