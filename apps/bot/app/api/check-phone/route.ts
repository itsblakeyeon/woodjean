import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { isPhoneBlacklisted } from "@/lib/blacklist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PhoneSchema = z.string().regex(/^01\d{8,9}$/);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const phone = url.searchParams.get("phone") ?? "";
  const parsed = PhoneSchema.safeParse(phone);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  const limited = await isRateLimited(req);
  if (limited) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  try {
    const blacklisted = await isPhoneBlacklisted(parsed.data);
    return NextResponse.json({ ok: true, blacklisted });
  } catch (e) {
    console.error("[check-phone GET]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}

async function isRateLimited(req: Request): Promise<boolean> {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return false;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `check-phone:${ip}`;
  try {
    const count = await redisCommand<number>(["INCR", key]);
    if (count === 1) await redisCommand(["EXPIRE", key, "60"]);
    return count > 5;
  } catch (e) {
    console.warn("[check-phone rate-limit skipped]", e);
    return false;
  }
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
