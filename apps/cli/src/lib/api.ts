import { z } from "zod";
import { getDeviceIdHash } from "./telemetry";

const API_BASE = process.env.WOODJEAN_API_URL ?? "https://bot.woodjean-pangyo.com";

const SlotSchema = z.object({
  deliveryAt: z.string(),
  displayWindow: z.string(),
  available: z.boolean(),
  reason: z.string().nullish(),
});

export type Slot = z.infer<typeof SlotSchema>;

export async function listSlots(days = 7): Promise<Slot[]> {
  const res = await fetch(`${API_BASE}/api/slots?days=${days}`);
  if (!res.ok) throw new Error(`슬롯 조회 실패 (${res.status})`);
  const json = (await res.json()) as { ok: boolean; slots?: unknown };
  if (!json.ok) throw new Error("슬롯 조회 실패");
  return z.array(SlotSchema).parse(json.slots ?? []);
}

export type CreateOrderPayload = {
  nickname: string;
  phone: string;
  items: Array<{
    menuSlug: string;
    size: "R" | "L";
    temp: "ICE" | "HOT";
    variant?: string | null;
    options: { shot?: boolean; milkChange?: boolean; decaf?: boolean };
  }>;
  deliveryAt: string;
  deliveryAddress: { building: string; floor?: string; recipient: string; location?: string };
  memo?: string | null;
  pipaConsented: true;
  termsConsented: true;
};

export type CreateOrderResult =
  | { ok: true; orderId: string; totalAmount: number; cupCount: number; deliveryAt: string }
  | { ok: false; error: string; message: string };

export async function createOrder(payload: CreateOrderPayload): Promise<CreateOrderResult> {
  const res = await fetch(`${API_BASE}/api/orders`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as CreateOrderResult;
  return json;
}

const CheckPhoneResultSchema = z.object({
  ok: z.boolean(),
  blacklisted: z.boolean().optional(),
  error: z.string().optional(),
});

export async function checkPhone(phone: string): Promise<{ ok: true; blacklisted: boolean } | { ok: false; error: string }> {
  const res = await fetch(`${API_BASE}/api/check-phone?phone=${encodeURIComponent(phone)}`);
  const json = CheckPhoneResultSchema.parse(await res.json());
  if (!res.ok || !json.ok) return { ok: false, error: json.error ?? `http_${res.status}` };
  return { ok: true, blacklisted: json.blacklisted === true };
}

const NotifySlotResultSchema = z.object({
  ok: z.boolean(),
  expiresAt: z.string().optional(),
  error: z.string().optional(),
});

export async function registerNotify(
  phone: string,
): Promise<{ ok: true; expiresAt: string } | { ok: false; error: string }> {
  const deviceIdHash = await getDeviceIdHash();
  const res = await fetch(`${API_BASE}/api/notify-slot`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ phone, deviceIdHash }),
  });
  let json: z.infer<typeof NotifySlotResultSchema>;
  try {
    json = NotifySlotResultSchema.parse(await res.json());
  } catch {
    return { ok: false, error: `http_${res.status}` };
  }
  if (!res.ok || !json.ok) return { ok: false, error: json.error ?? `http_${res.status}` };
  return { ok: true, expiresAt: json.expiresAt ?? "" };
}

export async function getOrder(orderId: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}`);
  if (!res.ok) return null;
  return res.json();
}
