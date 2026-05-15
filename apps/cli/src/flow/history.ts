import * as p from "@clack/prompts";
import { formatPrice } from "../lib/format";
import { lastOrderToCart, type LastOrder, type WoodjeanState } from "../lib/state";
import type { OrderDraft } from "./draft";

type HistoryResult =
  | { action: "repeat"; draft: OrderDraft }
  | { action: "back" }
  | { action: "cancelled"; reason?: string };

export async function runHistory(state: WoodjeanState | null): Promise<HistoryResult> {
  const orders = state?.recentOrders?.length ? state.recentOrders : state?.lastOrder ? [state.lastOrder] : [];
  if (orders.length === 0) {
    p.log.info("이 디바이스에 저장된 주문 이력이 아직 없어요.");
    return { action: "back" };
  }

  p.log.message([
    "당신의 우드진 이력 (이 디바이스 기준)",
    patternHint(orders),
  ].filter(Boolean).join("\n\n"));

  const selected = await p.select<string>({
    message: "다시 주문할 이력을 선택해 주세요",
    options: [
      ...orders.map((order) => ({
        value: order.orderId,
        label: formatHistoryRow(order),
      })),
      { value: "back", label: "← 뒤로" },
    ],
  });
  if (p.isCancel(selected)) return { action: "cancelled" };
  if (selected === "back") return { action: "back" };

  const order = orders.find((item) => item.orderId === selected);
  if (!order) return { action: "back" };
  return {
    action: "repeat",
    draft: {
      previousLastOrder: order,
      cart: lastOrderToCart(order),
      delivery: order.delivery,
      customer: {
        nickname: order.nickname,
        phone: order.phone,
      },
      agreed: true,
    },
  };
}

function formatHistoryRow(order: LastOrder): string {
  const total = order.cart.reduce((sum, item) => sum + item.subtotal, 0);
  const floor = order.delivery.floor ? ` ${order.delivery.floor}` : "";
  return `${formatShortDate(order.deliveryAtISO)} · ${order.cart.length}잔 · ${formatPrice(total)} · ${order.delivery.building}${floor}`;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${month}/${day}(${dayOfWeek}) ${hh}:${mm}`;
}

function patternHint(orders: LastOrder[]): string | null {
  if (orders.length < 3) return null;
  const buckets = new Map<string, number>();
  for (const order of orders) {
    const d = new Date(order.deliveryAtISO);
    const key = `${d.getDay()}-${d.getHours()}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const best = [...buckets.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!best || best[1] < 3) return null;
  const [day, hour] = best[0].split("-").map(Number);
  if (day == null || hour == null) return null;
  const dayLabel = ["일", "월", "화", "수", "목", "금", "토"][day] ?? "";
  return `💡 매주 ${dayLabel}요일 ${hour}:00 패턴이 보여요!`;
}
