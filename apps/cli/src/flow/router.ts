import * as p from "@clack/prompts";
import { formatPrice } from "../lib/format";
import { getTier, lastOrderToCart, type WoodjeanState } from "../lib/state";
import type { OrderDraft } from "./draft";

type RouterResult =
  | { action: "manual"; draft: OrderDraft }
  | { action: "repeat"; draft: OrderDraft }
  | { action: "history" }
  | { action: "cancelled"; reason?: string };

export async function runRouter(
  state: WoodjeanState | null,
  opts: { declinedDraft?: boolean } = {},
): Promise<RouterResult> {
  const lastOrder = state?.lastOrder;
  if (!lastOrder) return runColdRouter(opts);

  const tier = getTier(lastOrder.savedAt);
  if (tier === "expired") return runColdRouter(opts);

  if (tier === "hot") {
    const total = lastOrder.cart.reduce((sum, item) => sum + item.subtotal, 0);
    const choice = await p.select<"repeat" | "new" | "history">({
      message: [
        `👋 다시 오셨네요, ${lastOrder.nickname}.`,
        `지난 주문: ${formatShortDate(lastOrder.deliveryAtISO)} · ${lastOrder.cart.length}잔 · ${formatPrice(total)} · ${lastOrder.delivery.building}`,
      ].join("\n"),
      options: [
        { value: "repeat", label: "같은 걸로 — 시간만 새로 고를게요" },
        { value: "new", label: "이번엔 다르게 — 처음부터" },
        { value: "history", label: "주문 이력 보기" },
      ],
      initialValue: "repeat",
    });
    if (p.isCancel(choice)) return { action: "cancelled" };
    if (choice === "history") return { action: "history" };
    if (choice === "new") return { action: "manual", draft: {} };
    return {
      action: "repeat",
      draft: {
        previousLastOrder: lastOrder,
        cart: lastOrderToCart(lastOrder),
        delivery: lastOrder.delivery,
        customer: {
          nickname: lastOrder.nickname,
          phone: lastOrder.phone,
        },
        agreed: true,
      },
    };
  }

  if (tier === "warm") {
    const usePrefill = await p.confirm({
      message: "다시 오셨네요! 배달지·연락처는 지난번 그대로 쓰고, 메뉴는 처음부터 골라드릴까요?",
      initialValue: true,
    });
    if (p.isCancel(usePrefill)) return { action: "cancelled" };
    return { action: "manual", draft: usePrefill ? { previousLastOrder: lastOrder } : {} };
  }

  p.log.info(`지난 주문 배달지는 ${lastOrder.delivery.building}였어요. 필요하면 입력 단계에서 다시 쓸 수 있어요.`);
  return { action: "manual", draft: { previousLastOrder: lastOrder } };
}

async function runColdRouter(opts: { declinedDraft?: boolean } = {}): Promise<RouterResult> {
  if (opts.declinedDraft) {
    p.log.info("지난 미제출 주문은 복원하지 않을게요. 새로 주문을 시작할게요.");
  } else {
    p.log.info("처음 방문해주셔서 감사해요. 메뉴에서 하나씩 골라드릴게요.");
  }
  return { action: "manual", draft: {} };
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
