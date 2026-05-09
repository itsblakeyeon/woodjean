import * as p from "@clack/prompts";
import {
  CATEGORY_LABEL,
  MENU_BY_CATEGORY,
  MENU_BY_SLUG,
  type MenuCategory,
  type MenuItem,
  type Size,
  type Temp,
} from "@woodjean/shared/menu";
import { priceItem, type OrderItemInput } from "@woodjean/shared/pricing";
import { formatPrice } from "../lib/format";
import { cancel, ok, type StepResult } from "./draft";
import type { OrderDraft } from "./draft";

export type CartItem = OrderItemInput & { displayName: string; subtotal: number };

export const CATEGORY_ORDER: MenuCategory[] = ["signature", "coffee", "non-coffee"];

export async function stepBuildCart(draft: OrderDraft): Promise<StepResult> {
  const cart = await buildCart();
  if (!cart || cart.length === 0) return cancel();
  return ok({ ...draft, cart });
}

export async function buildCart(): Promise<CartItem[] | null> {
  const cart: CartItem[] = [];

  while (true) {
    p.log.info(
      cart.length === 0
        ? "음료를 추가해 주세요 (최소 5잔 / 최대 30잔)"
        : `현재 ${cart.length}잔 — ${formatPrice(cart.reduce((s, it) => s + it.subtotal, 0))}`,
    );

    const action = await p.select<"add" | "review" | "done" | "cancel">({
      message: "다음 작업을 선택해 주세요",
      options: [
        { value: "add", label: "➕ 음료 추가" },
        ...(cart.length > 0 ? ([{ value: "review", label: "🛒 카트 보기/삭제" }] as const) : []),
        ...(cart.length >= 5 ? ([{ value: "done", label: "✅ 주문 진행 (잔수 OK)" }] as const) : []),
        { value: "cancel", label: "❌ 주문 취소" },
      ],
    });

    if (p.isCancel(action) || action === "cancel") return null;

    if (action === "done") return cart;

    if (action === "review") {
      const removed = await reviewCart(cart);
      if (removed != null) cart.splice(removed, 1);
      continue;
    }

    // add
    if (cart.length >= 30) {
      p.log.warn("최대 30잔까지 주문 가능해요.");
      continue;
    }
    const item = await pickOneItem();
    if (!item) continue;
    cart.push(item);
  }
}

async function reviewCart(cart: CartItem[]): Promise<number | null> {
  if (cart.length === 0) return null;
  const idx = await p.select<number | -1>({
    message: "삭제할 음료를 선택하거나 뒤로",
    options: [
      ...cart.map((it, i) => ({
        value: i,
        label: `${it.displayName} — ${formatPrice(it.subtotal)}`,
      })),
      { value: -1, label: "← 뒤로" },
    ],
  });
  if (p.isCancel(idx) || idx === -1) return null;
  return idx;
}

async function pickOneItem(): Promise<CartItem | null> {
  // 1. 카테고리
  const category = await p.select<MenuCategory>({
    message: "카테고리",
    options: CATEGORY_ORDER.map((c) => ({
      value: c,
      label: `${CATEGORY_LABEL[c]} (${MENU_BY_CATEGORY[c].length}종)`,
    })),
  });
  if (p.isCancel(category)) return null;

  // 2. 메뉴
  const menus = MENU_BY_CATEGORY[category];
  const slug = await p.select<string>({
    message: "메뉴",
    options: menus.map((m) => ({
      value: m.slug,
      label: `${m.name} — ${formatMenuPrice(m)}`,
      hint: m.description,
    })),
  });
  if (p.isCancel(slug)) return null;
  const menu = MENU_BY_SLUG[slug]!;

  // 3. variant (있으면)
  let variant: string | null = null;
  if (menu.variants && menu.variants.length > 0) {
    const v = await p.select<string>({
      message: "옵션 선택",
      options: menu.variants.map((v) => ({ value: v, label: v })),
    });
    if (p.isCancel(v)) return null;
    variant = v;
  }

  // 4. 사이즈
  const sizes = (Object.keys(menu.prices) as Size[]).filter((k) => menu.prices[k] != null);
  let size: Size;
  if (sizes.length === 1) {
    size = sizes[0]!;
  } else {
    const s = await p.select<Size>({
      message: "사이즈",
      options: sizes.map((sz) => ({
        value: sz,
        label: `${sz} (${formatPrice(menu.prices[sz]!)})`,
      })),
    });
    if (p.isCancel(s)) return null;
    size = s;
  }

  // 5. 온도
  let temp: Temp;
  if (menu.temps.length === 1) {
    temp = menu.temps[0]!;
  } else {
    const t = await p.select<Temp>({
      message: "온도",
      options: menu.temps.map((t) => ({
        value: t,
        label: t === "ICE" ? "🧊 아이스" : "♨️  핫",
      })),
    });
    if (p.isCancel(t)) return null;
    temp = t;
  }

  // 6. 옵션
  const opts = menu.options ?? {};
  const optionList: Array<{ key: "shot" | "milkChange" | "decaf"; label: string }> = [];
  if (opts.shot) optionList.push({ key: "shot", label: "샷 추가 (+500원)" });
  if (opts.milkChange) optionList.push({ key: "milkChange", label: "우유 변경 (+500원)" });
  if (opts.decaf) optionList.push({ key: "decaf", label: `디카페인 (${size === "L" ? "+1,000" : "+500"}원)` });

  let chosenOpts: { shot: boolean; milkChange: boolean; decaf: boolean } = { shot: false, milkChange: false, decaf: false };
  if (optionList.length > 0) {
    const picks = await p.multiselect<"shot" | "milkChange" | "decaf">({
      message: "옵션 (없으면 Enter)",
      options: optionList.map((o) => ({ value: o.key, label: o.label })),
      required: false,
    });
    if (p.isCancel(picks)) return null;
    for (const k of picks) chosenOpts[k] = true;
  }

  // 가격 계산
  const priced = priceItem({ menuSlug: menu.slug, size, temp, variant, options: chosenOpts });
  const displayName = `${menu.name} ${size}${temp === "ICE" ? "·아이스" : "·핫"}${variant ? `·${variant}` : ""}${formatOptions(chosenOpts)}`;

  return {
    menuSlug: menu.slug,
    size,
    temp,
    variant,
    options: chosenOpts,
    displayName,
    subtotal: priced.subtotal,
  };
}

export function formatMenuPrice(m: MenuItem): string {
  const r = m.prices.R;
  const l = m.prices.L;
  if (r != null && l != null) return `${r.toLocaleString()}~${l.toLocaleString()}원`;
  if (r != null) return `${r.toLocaleString()}원`;
  if (l != null) return `${l.toLocaleString()}원`;
  return "";
}

function formatOptions(o: { shot: boolean; milkChange: boolean; decaf: boolean }): string {
  const parts: string[] = [];
  if (o.shot) parts.push("샷+");
  if (o.milkChange) parts.push("우유변경");
  if (o.decaf) parts.push("디카페인");
  return parts.length > 0 ? ` [${parts.join(",")}]` : "";
}
