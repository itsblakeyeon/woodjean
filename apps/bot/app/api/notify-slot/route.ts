import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { insertNotifyTarget } from "@/lib/notify-targets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  phone: z.string().regex(/^01\d{8,9}$/),
  deviceIdHash: z.string().min(1).max(128).optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  const limited = await isRateLimited(req);
  if (limited) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  try {
    const { expiresAt } = await insertNotifyTarget(parsed.data.phone, parsed.data.deviceIdHash);
    return NextResponse.json({ ok: true, expiresAt }, { status: 201 });
  } catch (e) {
    console.error("[notify-slot POST]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}

async function isRateLimited(req: Request): Promise<boolean> {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return false;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `notify-slot:${ip}`;
  try {
    const count = await redisIncr(key);
    if (count === 1) await redisExpire(key, 60);
    return count > 5;
  } catch (e) {
    console.warn("[notify-slot rate-limit skipped]", e);
    return false;
  }
}

async function redisIncr(key: string): Promise<number> {
  const res = await fetch(`${env.UPSTASH_REDIS_REST_URL!}/incr/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN!}` },
  });
  const json = (await res.json()) as { result: number };
  return json.result;
}

async function redisExpire(key: string, seconds: number): Promise<void> {
  await fetch(`${env.UPSTASH_REDIS_REST_URL!}/expire/${encodeURIComponent(key)}/${seconds}`, {
    headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN!}` },
  });
}
