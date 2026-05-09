import { z } from "zod";

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

export async function getOrder(orderId: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}`);
  if (!res.ok) return null;
  return res.json();
}
