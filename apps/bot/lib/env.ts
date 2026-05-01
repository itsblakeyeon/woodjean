import { z } from "zod";

const EnvSchema = z.object({
  // Supabase (필수)
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Telegram (필수)
  TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
  TELEGRAM_OWNER_CHAT_ID: z.string().min(1).optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(1).optional(),

  // Solapi SMS (필수)
  SOLAPI_API_KEY: z.string().min(1).optional(),
  SOLAPI_API_SECRET: z.string().min(1).optional(),
  SOLAPI_FROM_NUMBER: z.string().min(1).optional(),

  // Cron 보호용 (Vercel Cron 헤더)
  CRON_SECRET: z.string().min(1).optional(),

  // 사이트/봇 URL (Telegram 메시지 링크용)
  PUBLIC_SITE_URL: z.string().url().default("https://woodjean-pangyo.com"),
  PUBLIC_BOT_URL: z.string().url().optional(),

  // 모드
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = EnvSchema.parse(process.env);

export function requireEnv<K extends keyof typeof env>(key: K): NonNullable<(typeof env)[K]> {
  const v = env[key];
  if (v == null || v === "") {
    throw new Error(`Missing required env: ${String(key)}. See .env.example.`);
  }
  return v as NonNullable<(typeof env)[K]>;
}

// Production strict mode — auth secrets must be set, no fail-open.
// CSO finding #1, #2, #3 (2026-05-01): if (env.X && check) 패턴이 env 미설정 시
// 검증을 건너뜀. production에서는 startup에서 강제로 throw.
const REQUIRED_IN_PROD = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_OWNER_CHAT_ID",
  "TELEGRAM_WEBHOOK_SECRET",
  "CRON_SECRET",
  "SOLAPI_API_KEY",
  "SOLAPI_API_SECRET",
  "SOLAPI_FROM_NUMBER",
] as const;

// Build phase는 검증 우회 (Next.js가 모듈 import만 하고 실행 안 함).
// 실제 runtime (production server start)에서만 강제.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
if (env.NODE_ENV === "production" && !isBuildPhase) {
  const missing = REQUIRED_IN_PROD.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `[env] FATAL: production requires the following env vars but they are not set: ${missing.join(", ")}. ` +
        `See apps/bot/.env.example.`,
    );
  }
}

export const isStubMode = !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY;
