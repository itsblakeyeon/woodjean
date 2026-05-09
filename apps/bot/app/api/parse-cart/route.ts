import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { parseCartWithLLM } from "@/lib/parse";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  text: z.string().min(1).max(5000),
  deviceHint: z.string().max(128).optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  const limited = await isRateLimited(req, parsed.data.deviceHint);
  if (limited) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const started = Date.now();
  try {
    const result = await parseCartWithLLM(parsed.data.text);
    await recordParseEvent("parse_cart", parsed.data.deviceHint, {
      ok: true,
      itemCount: result.items.length,
      unresolvedCount: result.unresolved.length,
      latencyMs: Date.now() - started,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const error = message === "llm_unavailable" ? "llm_unavailable" : "validation";
    await recordParseEvent("parse_cart", parsed.data.deviceHint, {
      ok: false,
      error,
      latencyMs: Date.now() - started,
    });
    return NextResponse.json({ ok: false, error }, { status: error === "llm_unavailable" ? 503 : 400 });
  }
}

async function isRateLimited(req: Request, deviceHint?: string): Promise<boolean> {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return false;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const keys = [`parse-cart:ip:${ip}`];
  if (deviceHint) keys.push(`parse-cart:device:${deviceHint}`);
  try {
    for (const key of keys) {
      const count = await redisCommand<number>(["INCR", key]);
      if (count === 1) await redisCommand(["EXPIRE", key, "60"]);
      if (count > (key.includes(":device:") ? 5 : 10)) return true;
    }
  } catch (e) {
    console.warn("[parse-cart rate-limit skipped]", e);
  }
  return false;
}

async function redisCommand<T = unknown>(command: string[]): Promise<T> {
  const res = await fetch(env.UPSTASH_REDIS_REST_URL!, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`Upstash command failed (${res.status})`);
  const json = (await res.json()) as { result: T };
  return json.result;
}

async function recordParseEvent(event: string, deviceIdHash: string | undefined, payload: Record<string, unknown>): Promise<void> {
  try {
    await supabase().from("cli_events").insert({
      event,
      device_id_hash: deviceIdHash ?? null,
      payload,
    });
  } catch (e) {
    console.warn("[parse-cart event skipped]", e);
  }
}
