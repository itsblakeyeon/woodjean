import { readFile } from "node:fs/promises";
import { stdin } from "node:process";
import * as p from "@clack/prompts";
import { priceItem } from "@woodjean/shared/pricing";
import { parseCart, type ParsedCartItem } from "../lib/api";
import { loadState, markPasteConsented } from "../lib/state";
import { buildCart, type CartItem } from "./menu";
import { cancel, ok, type StepResult } from "./draft";
import type { OrderDraft } from "./draft";

export type PasteOptions = {
  paste?: string | boolean;
  clipboard?: boolean;
  stdinText?: string;
};

export async function stepPaste(draft: OrderDraft, options: PasteOptions): Promise<StepResult> {
  const accepted = await ensurePasteConsent();
  if (!accepted) return cancel("paste 모드 동의가 없어 직접 선택으로 진행해 주세요.");

  const text = await readPasteInput(options);
  if (text.trim().length === 0) {
    p.log.warn("내용이 비어있어요. 직접 선택으로 넘어갈게요.");
    const cart = await buildCart(draft.cart);
    return cart ? ok({ ...draft, cart }) : cancel();
  }

  const result = await parseCart(text);
  if (!result.ok) {
    if (result.error === "rate_limited") p.log.warn("오늘 자동 인식 사용량 한도에 도달했어요. 직접 선택 모드로 진행해 주세요.");
    else p.log.warn("메뉴 자동 인식이 잠시 멈췄어요. 직접 선택 모드로 넘어갈게요.");
    const cart = await buildCart(draft.cart);
    return cart ? ok({ ...draft, cart }) : cancel();
  }

  let cart = expandParsedItems(result.items);
  if (cart.length === 0) {
    p.log.warn("메뉴와 매칭되는 게 없어요. 직접 선택으로 넘어갈게요.");
    const manual = await buildCart(draft.cart);
    return manual ? ok({ ...draft, cart: manual }) : cancel();
  }

  p.log.success(result.unresolved.length === 0 ? "✓ 모두 인식됐어요." : `✓ ${cart.length}잔을 인식했어요. 미확인 ${result.unresolved.length}건은 직접 확인해 주세요.`);
  if (result.unresolved.length > 0) {
    p.log.message(["미확인 항목:", ...result.unresolved.map((item) => `  - ${item}`)].join("\n"));
  }

  if (cart.length > 30) {
    p.log.warn(`총 ${cart.length}잔이에요. 30잔 cap이라 앞에서 30잔까지만 담을게요.`);
    cart = cart.slice(0, 30);
  }

  if (cart.length < 5) {
    p.log.warn(`총 ${cart.length}잔이에요. 5잔이 최소라 추가할게요.`);
    const completed = await buildCart(cart);
    return completed ? ok({ ...draft, cart: completed }) : cancel();
  }

  const confirmed = await p.confirm({
    message: `${cart.length}잔으로 주문을 진행할까요?`,
    initialValue: true,
  });
  if (p.isCancel(confirmed) || !confirmed) {
    const manual = await buildCart(cart);
    return manual ? ok({ ...draft, cart: manual }) : cancel();
  }

  return ok({ ...draft, cart });
}

export async function ensurePasteConsent(): Promise<boolean> {
  const state = await loadState();
  if (state?.pasteConsentedAt) return true;

  p.log.message([
    "[L2 paste 모드 안내]",
    "붙여넣은 내용이 AI(Anthropic)로 전송되어 메뉴와 매칭돼요.",
    "- 원문 텍스트는 매칭 후 즉시 삭제돼요 (서버 저장 X)",
    "- 매칭 실패 시 직접 선택 모드로 자동 전환돼요",
  ].join("\n"));

  const accepted = await p.confirm({
    message: "계속하시겠어요?",
    initialValue: true,
  });
  if (p.isCancel(accepted) || !accepted) return false;
  await markPasteConsented();
  return true;
}

async function readPasteInput(options: PasteOptions): Promise<string> {
  if (options.stdinText != null) return options.stdinText;
  if (options.clipboard) {
    const clipboard = await import("clipboardy");
    return clipboard.default.read();
  }
  if (typeof options.paste === "string" && options.paste.startsWith("@")) {
    return readFile(options.paste.slice(1), "utf8");
  }
  if (typeof options.paste === "string" && options.paste.length > 0) return options.paste;
  return readStdin();
}

async function readStdin(): Promise<string> {
  if (stdin.isTTY) return "";
  const chunks: Buffer[] = [];
  for await (const chunk of stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

function expandParsedItems(items: ParsedCartItem[]): CartItem[] {
  const cart: CartItem[] = [];
  for (const item of items) {
    const priced = priceItem({
      menuSlug: item.menuSlug,
      size: item.size,
      temp: item.temp,
      variant: item.variant ?? null,
      options: {
        shot: item.options.shot ?? false,
        milkChange: item.options.milkChange ?? false,
        decaf: item.options.decaf ?? false,
      },
    });
    const cartItem: CartItem = {
      menuSlug: priced.menuSlug,
      size: priced.size,
      temp: priced.temp,
      variant: priced.variant,
      options: {
        shot: priced.options.shot ?? false,
        milkChange: priced.options.milkChange ?? false,
        decaf: priced.options.decaf ?? false,
      },
      displayName: `${priced.menuName} ${priced.size}${priced.temp === "ICE" ? "·아이스" : "·핫"}${priced.variant ? `·${priced.variant}` : ""}`,
      subtotal: priced.subtotal,
    };
    for (let i = 0; i < item.qty; i++) cart.push({ ...cartItem });
  }
  return cart;
}
