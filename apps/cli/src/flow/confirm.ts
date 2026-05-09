import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import * as p from "@clack/prompts";
import qrcode from "qrcode-terminal";
import stringWidth from "string-width";
import { priceItem } from "@woodjean/shared/pricing";
import { createOrder, type CreateOrderPayload } from "../lib/api";
import { formatKstWindow, formatPhoneRedacted, formatPrice } from "../lib/format";
import type { CartItem } from "./menu";
import type { DeliveryAddress } from "./delivery";
import type { Customer } from "./customer";
import type { OrderDraft } from "./draft";

type ConfirmInput = {
  deliveryAt: string;
  cart: CartItem[];
  delivery: DeliveryAddress;
  customer: Customer;
};

export async function confirmAndSubmitFromDraft(draft: OrderDraft): Promise<SubmitStatus> {
  if (!draft.slot || !draft.cart || !draft.delivery || !draft.customer || !draft.agreed) {
    throw new Error("OrderDraft 미완 — confirm 단계 호출 전 모든 step 통과 필요");
  }
  return confirmAndSubmit({
    deliveryAt: draft.slot.deliveryAt,
    cart: draft.cart,
    delivery: draft.delivery,
    customer: draft.customer,
  });
}

export type SubmitStatus = "submitted" | "cancelled" | "network_failed" | "server_rejected" | "slot_taken";

export type PersistedDraft = {
  schemaVersion: 1;
  savedAt: string;
  payload: CreateOrderPayload;
};

const DRAFT_DIR = join(homedir(), ".woodjean");
export const DRAFT_PATH = join(DRAFT_DIR, "draft.json");
const MAX_SUBMIT_ATTEMPTS = 3;
const MAX_SUMMARY_WIDTH = 78;

async function saveDraft(payload: CreateOrderPayload): Promise<void> {
  await mkdir(DRAFT_DIR, { recursive: true });
  await writeFile(
    DRAFT_PATH,
    JSON.stringify(
      {
        schemaVersion: 1,
        savedAt: new Date().toISOString(),
        payload,
      },
      null,
      2,
    ),
    { encoding: "utf8", mode: 0o600 },
  );
  await chmod(DRAFT_PATH, 0o600);
}

export async function clearDraft(): Promise<void> {
  await rm(DRAFT_PATH, { force: true });
}

export async function loadDraft(): Promise<PersistedDraft | null> {
  try {
    const raw = await readFile(DRAFT_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<PersistedDraft>;
    if (parsed.schemaVersion !== 1 || typeof parsed.savedAt !== "string" || !parsed.payload) {
      return null;
    }
    return parsed as PersistedDraft;
  } catch {
    return null;
  }
}

export async function confirmAndSubmit({ deliveryAt, cart, delivery, customer }: ConfirmInput): Promise<SubmitStatus> {
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

  return confirmAndSubmitPayload(payload);
}

export async function confirmAndSubmitPayload(payload: CreateOrderPayload, restoredFrom?: string): Promise<SubmitStatus> {
  const cart = buildCartFromPayload(payload);
  const total = cart.reduce((s, it) => s + it.subtotal, 0);

  // 요약 표시
  console.log("");
  if (restoredFrom) {
    p.log.info(`지난 미제출 주문을 복원했어요. 저장 시각: ${formatKstInstant(restoredFrom)}`);
  }
  p.log.message(formatSummaryBox([
    `🕒 도착: ${formatKstWindow(payload.deliveryAt)}`,
    `📦 잔수: ${cart.length}잔  💰 ${formatPrice(total)} (현장 후불)`,
    `👤 ${payload.nickname} · ${formatPhoneRedacted(payload.phone)}`,
    `📍 ${payload.deliveryAddress.building}${payload.deliveryAddress.floor ? " " + payload.deliveryAddress.floor : ""}${payload.deliveryAddress.location ? " (" + payload.deliveryAddress.location + ")" : ""} / ${payload.deliveryAddress.recipient}`,
    "",
    ...cart.map((it) => `  • ${it.displayName} — ${formatPrice(it.subtotal)}`),
    ...(payload.memo ? ["", `📝 ${payload.memo}`] : []),
  ]));

  const finalOk = await p.confirm({
    message: "위 내용으로 주문을 접수할까요?",
    initialValue: true,
  });
  if (p.isCancel(finalOk) || !finalOk) {
    p.cancel("주문이 취소됐어요.");
    return "cancelled";
  }

  try {
    await saveDraft(payload);
  } catch (e) {
    p.log.warn(`주문 draft 저장 실패: ${e instanceof Error ? e.message : String(e)}`);
  }

  const s = p.spinner();
  let attempt = 1;
  while (true) {
    s.start(attempt === 1 ? "주문 접수 중" : `재시도 중 (${attempt}/${MAX_SUBMIT_ATTEMPTS})`);
    let result;
    try {
      result = await createOrder(payload);
    } catch (e) {
      s.stop("접수 실패");
      const message = e instanceof Error ? e.message : String(e);
      if (attempt >= MAX_SUBMIT_ATTEMPTS) {
        p.log.error([
          "네트워크 오류로 주문이 접수되지 않았어요.",
          `원인: ${message}`,
          "해결: 잠시 후 다시 시도해 주세요. 급하시면 매장(010-8484-2120)으로 전화 주세요.",
          `주문 정보는 ${DRAFT_PATH}에 저장됐어요.`,
        ].join("\n"));
        return "network_failed";
      }
      attempt += 1;
      continue;
    }

    if (!result.ok) {
      s.stop("접수 실패");
      if (result.error === "slot_taken") {
        p.log.warn([
          "선택한 시간이 방금 마감됐어요.",
          `원인: ${result.message}`,
          "해결: 다른 도착 시간을 선택해 주세요. 카트와 연락처는 그대로 유지됩니다.",
          `주문 정보는 ${DRAFT_PATH}에 저장됐어요.`,
        ].join("\n"));
        return "slot_taken";
      }
      if (result.error === "outside_radius") {
        p.log.error([
          `${payload.deliveryAddress.building}이(가) 우드진 반경 1km 밖이에요.`,
          `원인: ${result.message}`,
          "해결: 다른 건물로 변경하거나 매장(010-8484-2120)으로 문의해 주세요.",
          `주문 정보는 ${DRAFT_PATH}에 저장됐어요.`,
        ].join("\n"));
        return "server_rejected";
      }
      if (result.error === "blacklisted") {
        p.log.error("이 번호로는 주문 접수가 어려워요. 사장님(010-8484-2120)으로 직접 연락 부탁드립니다.");
        return "server_rejected";
      }
      if (result.error === "outside_hours" || result.error === "paused") {
        p.log.error([
          "지금은 주문 접수 시간이 아니에요.",
          `원인: ${result.message}`,
          "해결: 다음 가능 시간을 다시 선택해 주세요. 알림은 매장으로 카카오 부탁드려요.",
        ].join("\n"));
        return "server_rejected";
      }
      p.log.error([
        "서버가 주문 접수를 거절했어요.",
        `원인: [${result.error}] ${result.message}`,
        "해결: 메시지에 맞춰 다시 시도해 주세요. 급하시면 매장(010-8484-2120)으로 전화 주세요.",
        `주문 정보는 ${DRAFT_PATH}에 저장됐어요.`,
      ].join("\n"));
      return "server_rejected";
    }

    s.stop("주문 접수됨!");
    try {
      await clearDraft();
    } catch {
      // 성공한 주문의 stale draft 정리는 best-effort.
    }

    // 영수증
    const recvUrl = `https://woodjean-pangyo.com/order/${result.orderId}`;
    console.log("");
    p.log.success([
      "✅  주문이 접수됐어요.",
      `   주문 ID: ${result.orderId}`,
      `   ${formatKstWindow(result.deliveryAt)} 도착 예정`,
      `   ${result.cupCount}잔 · ${formatPrice(result.totalAmount)} (현장 후불)`,
      "",
      `   영수증: ${recvUrl}`,
    ].join("\n"));

    console.log("");
    console.log("\x1b[2m  QR로 영수증 열기:\x1b[0m");
    qrcode.generate(recvUrl, { small: true });
    return "submitted";
  }
}

export function buildCartFromPayload(payload: CreateOrderPayload): CartItem[] {
  return payload.items.map((item) => {
    const normalizedItem = {
      ...item,
      options: {
        shot: item.options.shot ?? false,
        milkChange: item.options.milkChange ?? false,
        decaf: item.options.decaf ?? false,
      },
    };
    const priced = priceItem(normalizedItem);
    return {
      ...normalizedItem,
      displayName: `${priced.menuName} ${priced.size}${priced.temp === "ICE" ? "·아이스" : "·핫"}${priced.variant ? `·${priced.variant}` : ""}${formatOptions(priced.options)}`,
      subtotal: priced.subtotal,
    };
  });
}

function formatOptions(o: { shot?: boolean; milkChange?: boolean; decaf?: boolean }): string {
  const parts: string[] = [];
  if (o.shot) parts.push("샷+");
  if (o.milkChange) parts.push("우유변경");
  if (o.decaf) parts.push("디카페인");
  return parts.length > 0 ? ` [${parts.join(",")}]` : "";
}

function formatKstInstant(iso: string): string {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${month}/${day}(${dayOfWeek}) ${hh}:${mm}`;
}

function formatSummaryBox(lines: string[]): string {
  const cols = Math.max(36, Math.min(process.stdout.columns ?? 80, 80) - 2);
  const width = Math.min(cols, MAX_SUMMARY_WIDTH);
  const rule = "━".repeat(width);
  return [
    rule,
    ...lines.map((line) => padToWidth(truncateToWidth(line, width), width)),
    rule,
  ].join("\n");
}

function padToWidth(line: string, width: number): string {
  const padding = Math.max(0, width - stringWidth(line));
  return `${line}${" ".repeat(padding)}`;
}

function truncateToWidth(line: string, width: number): string {
  if (stringWidth(line) <= width) return line;

  const suffix = "...";
  const target = Math.max(0, width - stringWidth(suffix));
  let result = "";
  let used = 0;
  for (const char of line) {
    const next = stringWidth(char);
    if (used + next > target) break;
    result += char;
    used += next;
  }
  return `${result}${suffix}`;
}
