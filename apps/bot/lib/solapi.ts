import crypto from "node:crypto";
import { env, requireEnv } from "./env";

const API = "https://api.solapi.com";

function authHeader(): string {
  const apiKey = requireEnv("SOLAPI_API_KEY");
  const apiSecret = requireEnv("SOLAPI_API_SECRET");
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString("hex");
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(date + salt)
    .digest("hex");
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

export function isSolapiConfigured(): boolean {
  return Boolean(env.SOLAPI_API_KEY && env.SOLAPI_API_SECRET && env.SOLAPI_FROM_NUMBER);
}

export async function sendSms(to: string, text: string): Promise<{ messageId: string } | { skipped: true }> {
  if (!isSolapiConfigured()) {
    console.warn("[solapi] not configured — SMS skipped:", { to, text: text.slice(0, 30) });
    return { skipped: true };
  }
  const res = await fetch(`${API}/messages/v4/send`, {
    method: "POST",
    headers: { "Authorization": authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        to: to.replace(/\D/g, ""),
        from: env.SOLAPI_FROM_NUMBER,
        text,
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Solapi send failed: ${res.status} ${body}`);
  }
  const json = (await res.json()) as { messageId: string };
  return { messageId: json.messageId };
}

export const SMS_TEMPLATES = {
  orderConfirmed: (nickname: string, deliveryAt: string, cupCount: number) =>
    `[우드진] ${nickname}님 주문 ${cupCount}잔 ${deliveryAt} 도착 예정으로 접수됐어요. 회신 불가.`,
  thirtyMinReminder: (nickname: string, deliveryAt: string) =>
    `[우드진] ${nickname}님, ${deliveryAt} 도착 30분 전입니다. 변경/취소는 매장(010-8484-2120)으로 연락 주세요.`,
  cancelled: (nickname: string, reason?: string) =>
    `[우드진] ${nickname}님 주문이 취소됐어요${reason ? ` (${reason})` : ""}. 매장 010-8484-2120.`,
} as const;
