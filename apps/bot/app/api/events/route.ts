import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EventSchema = z.object({
  event: z.string().min(1).max(80),
  deviceIdHash: z.string().max(64).optional(),
  payload: z.record(z.unknown()).default({}),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = EventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  try {
    await supabase().from("cli_events").insert({
      event: parsed.data.event,
      device_id_hash: parsed.data.deviceIdHash ?? null,
      payload: parsed.data.payload,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[events POST]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
