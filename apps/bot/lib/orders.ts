import { z } from "zod";
import {
  OrderItemInputSchema,
  priceOrder,
  PricingException,
  type OrderItemPriced,
  MIN_CUPS,
  MAX_CUPS,
} from "@woodjean/shared/pricing";
import { supabase } from "./supabase";
import { newOrderId } from "./ids";
import { sendOwnerMessage, orderActionKeyboard, isTelegramConfigured } from "./telegram";
import { sendSms, SMS_TEMPLATES } from "./solapi";
import { validateDeliverySlot } from "./slots";

// HTML escape — Telegram parse_mode HTML 보호 (Codex #6, 2026-05-01).
// 사용자 입력에 <, >, & 가 들어오면 메시지 전체가 거절될 수 있어 사장님이 알림을 못 봄.
function htmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const PhoneSchema = z.string().regex(/^01\d{8,9}$/, "휴대폰 번호 형식이 올바르지 않습니다.");

export const DeliveryAddressSchema = z.object({
  building: z.string().min(1).max(100),
  floor: z.string().max(20).optional(),
  recipient: z.string().min(1).max(50),
  location: z.string().max(100).optional(),
});

export const CreateOrderSchema = z.object({
  nickname: z.string().min(1).max(20),
  phone: PhoneSchema,
  items: z.array(OrderItemInputSchema).min(MIN_CUPS).max(MAX_CUPS),
  deliveryAt: z.string().datetime({ offset: true }),
  deliveryAddress: DeliveryAddressSchema,
  memo: z.string().max(200).nullish(),
  pipaConsented: z.literal(true),
  termsConsented: z.literal(true),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export type CreateOrderResult =
  | { ok: true; orderId: string; totalAmount: number; cupCount: number; deliveryAt: string }
  | { ok: false; error: "blacklisted" | "rate_limited" | "slot_taken" | "outside_hours" | "paused" | "past_lead" | "not_aligned" | "validation"; message: string };

export async function createOrder(raw: unknown): Promise<CreateOrderResult> {
  // 1. 입력 검증
  const parsed = CreateOrderSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "validation", message: parsed.error.message };
  }
  const input = parsed.data;

  // 2. 블랙리스트 체크
  const { data: blkRow } = await supabase()
    .from("blacklist")
    .select("phone")
    .eq("phone", input.phone)
    .maybeSingle();
  if (blkRow) {
    return { ok: false, error: "blacklisted", message: "노쇼 이력으로 주문이 제한되었습니다. 매장 010-8484-2120으로 연락 부탁드립니다." };
  }

  // 2.5. Phone rate limit — SMS amplification 방지 (CSO #4, 2026-05-01)
  // 5분 내 동일 phone으로 시도된 주문이 있으면 reject. SMS 폭격 스팸 차단.
  const RATE_WINDOW_MS = 5 * 60 * 1000;
  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
  const { count: recentCount } = await supabase()
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("phone", input.phone)
    .gte("created_at", since);
  if ((recentCount ?? 0) >= 1) {
    return {
      ok: false,
      error: "rate_limited",
      message: "최근 5분 내 동일 휴대폰 번호로 주문된 건이 있습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  // 3. 가격 서버 재계산 (클라이언트 amount 신뢰 X)
  // PricingException은 invalid input → 400 validation으로 변환 (Codex #10).
  let quote;
  try {
    quote = priceOrder(input.items);
  } catch (e) {
    if (e instanceof PricingException) {
      return { ok: false, error: "validation", message: `메뉴 옵션 오류: ${e.error.kind}` };
    }
    if (e instanceof Error) {
      return { ok: false, error: "validation", message: e.message };
    }
    throw e;
  }

  // 4. 서버측 슬롯 검증 (Codex #2): 클라이언트 deliveryAt이 영업시간/lead/슬롯 정렬에 맞는지.
  const deliveryAtDate = new Date(input.deliveryAt);
  const now = new Date();
  const slotCheck = await validateDeliverySlot(input.deliveryAt, now);
  if (!slotCheck.ok) {
    const messages: Record<typeof slotCheck.reason, string> = {
      past_lead: "주문 시점 기준 1시간 이상 뒤로 도착 시간을 선택해 주세요.",
      outside_hours: "선택하신 시간은 영업시간 외입니다.",
      paused: "선택하신 시간은 매장 사정으로 주문을 받지 않습니다.",
      not_aligned: "도착 시간은 매시 정각이어야 합니다 (예: 14:00, 15:00).",
    };
    return { ok: false, error: slotCheck.reason, message: messages[slotCheck.reason] };
  }

  // 5. orders insert (slot cap은 unique index가 atomic하게 거부)
  const orderId = newOrderId();
  const { error } = await supabase().from("orders").insert({
    id: orderId,
    nickname: input.nickname,
    phone: input.phone,
    items: quote.items,
    total_amount: quote.totalAmount,
    cup_count: quote.cupCount,
    delivery_at: input.deliveryAt,
    delivery_address: input.deliveryAddress,
    memo: input.memo ?? null,
    payment_method: "cash_on_delivery",
    status: "confirmed",
    pipa_consented_at: now.toISOString(),
    terms_consented_at: now.toISOString(),
  });

  if (error) {
    if (error.code === "23505" /* unique violation */ && error.message.includes("idx_orders_slot_unique")) {
      return { ok: false, error: "slot_taken", message: "선택하신 시간이 방금 다른 주문으로 마감되었습니다. 다른 시간으로 다시 시도해 주세요." };
    }
    throw error;
  }

  // 6. order_events
  await supabase().from("order_events").insert({
    order_id: orderId,
    event: "created",
    actor: "customer",
    payload: { source: "cli", total_amount: quote.totalAmount, cup_count: quote.cupCount },
  });

  // 7. Telegram 사장님 알림 (best-effort)
  // 첫 주문 여부 — phone 기준 이전 completed 주문 카운트
  let isFirstOrder = false;
  try {
    const { count } = await supabase()
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("phone", input.phone)
      .eq("status", "completed");
    isFirstOrder = (count ?? 0) === 0;
  } catch {
    /* best-effort */
  }

  if (isTelegramConfigured()) {
    try {
      const msg = formatOwnerNotification(orderId, input, quote, { isFirstOrder });
      const sent = await sendOwnerMessage(msg, { reply_markup: orderActionKeyboard(orderId, "confirmed") });
      await supabase().from("order_events").insert({
        order_id: orderId,
        event: "telegram_sent",
        actor: "system",
        payload: { message_id: sent.message_id },
      });
    } catch (e) {
      console.error("[telegram] notify failed", e);
    }
  }

  // 8. 고객 SMS (best-effort)
  try {
    await sendSms(input.phone, SMS_TEMPLATES.orderConfirmed(input.nickname, formatKstWindow(deliveryAtDate), quote.cupCount));
  } catch (e) {
    console.error("[sms] confirm failed", e);
  }

  return { ok: true, orderId, totalAmount: quote.totalAmount, cupCount: quote.cupCount, deliveryAt: input.deliveryAt };
}

// ============================================================================
// 상태 변경 (사장님 텔레그램 액션)
// ============================================================================

export async function updateOrderStatus(
  orderId: string,
  next: "completed" | "cancelled" | "no_show",
  actor: "owner" | "system",
  note?: string,
): Promise<{ ok: true; previous: string } | { ok: false; error: string }> {
  // Race fix (Codex #1, 2026-05-01): UPDATE ... WHERE status='confirmed' RETURNING.
  // 동시 클릭 시 한 쪽만 row를 받고 다른 쪽은 빈 결과 → 사이드 이펙트 (이벤트/SMS/블랙리스트) 막음.
  const { data: updated, error: updErr } = await supabase()
    .from("orders")
    .update({ status: next })
    .eq("id", orderId)
    .eq("status", "confirmed")
    .select("id, nickname, phone, status")
    .maybeSingle();

  if (updErr) return { ok: false, error: updErr.message };
  if (!updated) {
    // row가 없거나 status가 이미 변경됨. 어느 쪽인지 확인.
    const { data: cur } = await supabase()
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .maybeSingle();
    if (!cur) return { ok: false, error: "not_found" };
    return { ok: false, error: `already_${cur.status}` };
  }

  await supabase().from("order_events").insert({
    order_id: orderId,
    event: next,
    actor,
    note: note ?? null,
  });

  // 노쇼는 자동 블랙리스트
  if (next === "no_show") {
    await supabase().from("blacklist").upsert({
      phone: updated.phone,
      reason: "no_show",
      source_order_id: orderId,
    });
    await supabase().from("cli_events").insert({
      event: "no_show_marked",
      payload: { orderId },
    });
  }

  // 취소 시 고객 SMS
  if (next === "cancelled") {
    try {
      await sendSms(updated.phone, SMS_TEMPLATES.cancelled(updated.nickname, note ?? undefined));
    } catch (e) {
      console.error("[sms] cancel failed", e);
    }
  }

  return { ok: true, previous: "confirmed" };
}

// ============================================================================
// 표시 헬퍼
// ============================================================================

function formatKstWindow(d: Date): string {
  const kst = new Date(d.getTime() + 9 * 3600 * 1000);
  const h = String(kst.getUTCHours()).padStart(2, "0");
  const m = String(kst.getUTCMinutes()).padStart(2, "0");
  const month = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kst.getUTCDate()).padStart(2, "0");
  return `${month}/${day} ${h}:${m}`;
}

// 사장님 알림용 — raw digits를 010-XXXX-XXXX로. 마스킹 아님(신뢰 경계 내부),
// 확인 콜 위해 읽기/탭 편의 (KAI-244, 2026-05-15).
function formatPhoneForOwner(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (/^01\d{9}$/.test(d)) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (/^01\d{8}$/.test(d)) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return raw;
}

function summarizeItems(items: OrderItemPriced[]): string {
  const counts = new Map<string, number>();
  for (const it of items) {
    // 메뉴 이름과 variant도 사용자 source가 아니지만 일관성 위해 escape
    const key = `${htmlEscape(it.menuName)} ${it.size}${it.temp === "ICE" ? "·아이스" : "·핫"}${it.variant ? `·${htmlEscape(it.variant)}` : ""}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, qty]) => `• ${name} × ${qty}`)
    .join("\n");
}

function formatOwnerNotification(
  orderId: string,
  input: CreateOrderInput,
  quote: { items: OrderItemPriced[]; totalAmount: number; cupCount: number },
  flags?: { isFirstOrder?: boolean },
): string {
  const deliveryAtKst = formatKstWindow(new Date(input.deliveryAt));
  // 모든 사용자 입력 escape (Codex #6)
  const nick = htmlEscape(input.nickname);
  const phone = htmlEscape(formatPhoneForOwner(input.phone));
  const building = htmlEscape(input.deliveryAddress.building);
  const floor = input.deliveryAddress.floor ? htmlEscape(input.deliveryAddress.floor) : "";
  const location = input.deliveryAddress.location ? htmlEscape(input.deliveryAddress.location) : "";
  const recipient = htmlEscape(input.deliveryAddress.recipient);
  const memo = input.memo ? htmlEscape(input.memo) : "";

  const addr = `${building}${floor ? ` ${floor}` : ""}${location ? ` (${location})` : ""} / ${recipient}`;
  const lines = [
    `<b>📦 신규 주문 ${quote.cupCount}잔</b>`,
    `🕒 ${deliveryAtKst} 도착`,
    `👤 ${nick} · ${phone}`,
    `📍 ${addr}`,
    `💰 ${quote.totalAmount.toLocaleString()}원 (현장 후불)`,
    "",
    summarizeItems(quote.items),
  ];
  if (memo) lines.push("", `📝 ${memo}`);

  const hedges: string[] = [];
  if (flags?.isFirstOrder) hedges.push("🆕 <b>첫 주문</b> — 확인 콜 권장");
  if (quote.cupCount >= 20) hedges.push("⚠️ <b>20잔 이상</b> — 확인 콜 권장");
  if (hedges.length > 0) lines.push("", ...hedges);

  lines.push("", `<code>${orderId}</code>`);
  return lines.join("\n");
}
