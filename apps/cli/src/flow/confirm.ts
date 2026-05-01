import * as p from "@clack/prompts";
import qrcode from "qrcode-terminal";
import { createOrder, type CreateOrderPayload } from "../lib/api";
import { formatKstWindow, formatPhone, formatPrice } from "../lib/format";
import type { CartItem } from "./menu";
import type { DeliveryAddress } from "./delivery";
import type { Customer } from "./customer";

type ConfirmInput = {
  deliveryAt: string;
  cart: CartItem[];
  delivery: DeliveryAddress;
  customer: Customer;
};

export async function confirmAndSubmit({ deliveryAt, cart, delivery, customer }: ConfirmInput): Promise<void> {
  const total = cart.reduce((s, it) => s + it.subtotal, 0);

  // 요약 표시
  console.log("");
  p.log.message([
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    `🕒 도착: ${formatKstWindow(deliveryAt)}`,
    `📦 잔수: ${cart.length}잔  💰 ${formatPrice(total)} (현장 후불)`,
    `👤 ${customer.nickname} · ${formatPhone(customer.phone)}`,
    `📍 ${delivery.building}${delivery.floor ? " " + delivery.floor : ""}${delivery.location ? " (" + delivery.location + ")" : ""} / ${delivery.recipient}`,
    "",
    ...cart.map((it) => `  • ${it.displayName} — ${formatPrice(it.subtotal)}`),
    customer.memo ? `\n📝 ${customer.memo}` : "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  ].filter(Boolean).join("\n"));

  const finalOk = await p.confirm({
    message: "위 내용으로 주문을 접수할까요?",
    initialValue: true,
  });
  if (p.isCancel(finalOk) || !finalOk) {
    p.cancel("주문이 취소되었습니다.");
    return;
  }

  const payload: CreateOrderPayload = {
    nickname: customer.nickname,
    phone: customer.phone,
    items: cart.map((it) => ({
      menuSlug: it.menuSlug,
      size: it.size,
      temp: it.temp,
      variant: it.variant,
      options: it.options,
    })),
    deliveryAt,
    deliveryAddress: delivery,
    memo: customer.memo,
    pipaConsented: true,
    termsConsented: true,
  };

  const s = p.spinner();
  s.start("주문 접수 중");
  let result;
  try {
    result = await createOrder(payload);
  } catch (e) {
    s.stop("접수 실패");
    p.log.error(e instanceof Error ? e.message : String(e));
    return;
  }

  if (!result.ok) {
    s.stop("접수 실패");
    p.log.error(`[${result.error}] ${result.message}`);
    return;
  }
  s.stop("주문 접수됨!");

  // 영수증
  const recvUrl = `https://woodjean-pangyo.com/order/${result.orderId}`;
  console.log("");
  p.log.success([
    "✅  주문이 접수됐습니다.",
    `   주문 ID: ${result.orderId}`,
    `   ${formatKstWindow(result.deliveryAt)} 도착 예정`,
    `   ${result.cupCount}잔 · ${formatPrice(result.totalAmount)} (현장 후불)`,
    "",
    `   영수증: ${recvUrl}`,
  ].join("\n"));

  console.log("");
  console.log("\x1b[2m  QR로 영수증 열기:\x1b[0m");
  qrcode.generate(recvUrl, { small: true });
}
