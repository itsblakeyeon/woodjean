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
import { emitEvent } from "../lib/telemetry";
import { cancel, ok, type StepResult } from "./draft";
import type { OrderDraft } from "./draft";

export type CartItem = OrderItemInput & { displayName: string; subtotal: number };

export const CATEGORY_ORDER: MenuCategory[] = ["signature", "coffee", "non-coffee"];
const BACK = "__woodjean_back__" as const;
type BackValue = typeof BACK;

export async function stepBuildCart(draft: OrderDraft): Promise<StepResult> {
  const cart = await buildCart();
  if (!cart || cart.length === 0) return cancel();
  return ok({ ...draft, cart });
}

export async function buildCart(): Promise<CartItem[] | null> {
  const cart: CartItem[] = [];
  const startedAt = Date.now();

  while (true) {
    if (cart.length === 0) {
      p.log.info("음료를 추가해 주세요 (최소 5잔 / 최대 30잔)");
    } else {
      const total = cart.reduce((s, it) => s + it.subtotal, 0);
      const groups = groupCart(cart);
      const lines = groups.map((g, i) => {
        const qty = g.quantity === 1 ? "" : ` × ${g.quantity}잔`;
        return `  ${i + 1}. ${g.displayName}${qty} — ${formatPrice(g.subtotal)}`;
      });
      p.note(
        lines.join("\n"),
        `🛒 현재 카트 (${cart.length}잔, ${formatPrice(total)})`,
      );
    }

    const action = await p.select<"add" | "review" | "done" | "cancel">({
      message: "다음 작업을 선택해 주세요",
      options: [
        { value: "add", label: "➕ 음료 추가" },
        ...(cart.length > 0 ? ([{ value: "review", label: "🗑  카트에서 삭제" }] as const) : []),
        ...(cart.length >= 5 ? ([{ value: "done", label: "✅ 주문 진행 (잔수 OK)" }] as const) : []),
        { value: "cancel", label: "❌ 주문 취소" },
      ],
    });

    if (p.isCancel(action) || action === "cancel") return null;

    if (action === "done") {
      await emitEvent("cart_completed", {
        cupCount: cart.length,
        nUniqueItems: new Set(cart.map((item) => item.displayName)).size,
        timeToCompleteMs: Date.now() - startedAt,
      });
      return cart;
    }

    if (action === "review") {
      const removed = await reviewCart(cart);
      if (removed != null) cart.splice(removed, 1);
      continue;
    }

    // add
    if (cart.length >= 30) {
      p.log.warn("최대 30잔까지 주문 가능해요. 30잔이 넘으면 한 번 더 시키시는 걸 추천드려요!");
      continue;
    }
    const items = await pickItems(30 - cart.length);
    if (!items) continue;
    cart.push(...items);
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

async function pickItems(maxQuantity: number): Promise<CartItem[] | null> {
  type Step = "category" | "menu" | "variant" | "size" | "temp" | "options" | "quantity";
  type AddOnKey = "shot" | "milkChange" | "decaf";
  type OptionChoice = AddOnKey | "none";

  let step: Step = "category";
  let category: MenuCategory | null = null;
  let menu: MenuItem | null = null;
  let variant: string | null = null;
  let size: Size | null = null;
  let temp: Temp | null = null;
  let chosenOpts: { shot: boolean; milkChange: boolean; decaf: boolean } = {
    shot: false,
    milkChange: false,
    decaf: false,
  };

  const sizesFor = (m: MenuItem): Size[] =>
    (Object.keys(m.prices) as Size[]).filter((k) => m.prices[k] != null);

  const optionListFor = (
    m: MenuItem,
    selectedSize: Size,
  ): Array<{ key: AddOnKey; label: string }> => {
    const opts = m.options ?? {};
    const list: Array<{ key: AddOnKey; label: string }> = [];
    if (opts.shot) list.push({ key: "shot", label: "샷 추가 (+500원)" });
    if (opts.milkChange) list.push({ key: "milkChange", label: "우유 변경 (+500원)" });
    if (opts.decaf) {
      list.push({
        key: "decaf",
        label: `디카페인 (${selectedSize === "L" ? "+1,000" : "+500"}원)`,
      });
    }
    return list;
  };

  const previousStep = (current: Step): Step | null => {
    if (current === "category") return null;
    if (current === "menu") return "category";
    if (!menu) return "category";
    if (current === "variant") return "menu";

    const hasVariants = (menu.variants?.length ?? 0) > 0;
    const hasSizeChoice = sizesFor(menu).length > 1;
    const hasTempChoice = menu.temps.length > 1;
    const hasOptions = size ? optionListFor(menu, size).length > 0 : false;

    if (current === "size") return hasVariants ? "variant" : "menu";
    if (current === "temp") {
      if (hasSizeChoice) return "size";
      if (hasVariants) return "variant";
      return "menu";
    }
    if (current === "options") {
      if (hasTempChoice) return "temp";
      if (hasSizeChoice) return "size";
      if (hasVariants) return "variant";
      return "menu";
    }
    if (hasOptions) return "options";
    if (hasTempChoice) return "temp";
    if (hasSizeChoice) return "size";
    if (hasVariants) return "variant";
    return "menu";
  };

  const backLabel = (current: Step): string => {
    const previous = previousStep(current);
    if (previous === "category") return "← 뒤로 (카테고리 다시 선택)";
    if (previous === "menu") return "← 뒤로 (메뉴 다시 선택)";
    if (previous === "variant") return "← 뒤로 (메뉴 옵션 다시 선택)";
    if (previous === "size") return "← 뒤로 (사이즈 다시 선택)";
    if (previous === "temp") return "← 뒤로 (온도 다시 선택)";
    if (previous === "options") return "← 뒤로 (옵션 다시 선택)";
    return "← 뒤로 (카트 화면으로)";
  };

  while (true) {
    if (step === "category") {
      const selected = await p.select<MenuCategory | BackValue>({
        message: "카테고리",
        options: [
          ...CATEGORY_ORDER.map((c) => ({
            value: c,
            label: `${CATEGORY_LABEL[c]} (${MENU_BY_CATEGORY[c].length}종)`,
          })),
          { value: BACK, label: "← 뒤로 (카트 화면으로)" },
        ],
      });
      if (p.isCancel(selected) || selected === BACK) return null;
      category = selected;
      menu = null;
      variant = null;
      size = null;
      temp = null;
      chosenOpts = { shot: false, milkChange: false, decaf: false };
      step = "menu";
      continue;
    }

    if (step === "menu") {
      if (!category) {
        step = "category";
        continue;
      }
      const menus = MENU_BY_CATEGORY[category];
      const slug = await p.select<string | BackValue>({
        message: "메뉴",
        options: [
          ...menus.map((m) => ({
            value: m.slug,
            label: `${m.name} — ${formatMenuPrice(m)}`,
            hint: m.description,
          })),
          { value: BACK, label: backLabel("menu") },
        ],
      });
      if (p.isCancel(slug)) return null;
      if (slug === BACK) {
        step = previousStep("menu") ?? "category";
        continue;
      }
      menu = MENU_BY_SLUG[slug]!;
      variant = null;
      size = null;
      temp = null;
      chosenOpts = { shot: false, milkChange: false, decaf: false };
      step = "variant";
      continue;
    }

    if (!menu) {
      step = "menu";
      continue;
    }

    if (step === "variant") {
      if (!menu.variants || menu.variants.length === 0) {
        variant = null;
        step = "size";
        continue;
      }
      const selected = await p.select<string | BackValue>({
        message: "옵션 선택",
        options: [
          ...menu.variants.map((v) => ({ value: v, label: v })),
          { value: BACK, label: backLabel("variant") },
        ],
      });
      if (p.isCancel(selected)) return null;
      if (selected === BACK) {
        step = previousStep("variant") ?? "category";
        continue;
      }
      variant = selected;
      size = null;
      temp = null;
      chosenOpts = { shot: false, milkChange: false, decaf: false };
      step = "size";
      continue;
    }

    if (step === "size") {
      const selectedMenu = menu;
      const sizes = sizesFor(selectedMenu);
      if (sizes.length === 1) {
        size = sizes[0]!;
        step = "temp";
        continue;
      }
      const selected = await p.select<Size | BackValue>({
        message: "사이즈",
        options: [
          ...sizes.map((sz) => ({
            value: sz,
            label: `${sz} (${formatPrice(selectedMenu.prices[sz]!)})`,
          })),
          { value: BACK, label: backLabel("size") },
        ],
      });
      if (p.isCancel(selected)) return null;
      if (selected === BACK) {
        step = previousStep("size") ?? "category";
        continue;
      }
      size = selected;
      temp = null;
      chosenOpts = { shot: false, milkChange: false, decaf: false };
      step = "temp";
      continue;
    }

    if (!size) {
      step = "size";
      continue;
    }

    if (step === "temp") {
      if (menu.temps.length === 1) {
        temp = menu.temps[0]!;
        step = "options";
        continue;
      }
      const selected = await p.select<Temp | BackValue>({
        message: "온도",
        options: [
          ...menu.temps.map((t) => ({
            value: t,
            label: t === "ICE" ? "🧊 아이스" : "♨️  핫",
          })),
          { value: BACK, label: backLabel("temp") },
        ],
      });
      if (p.isCancel(selected)) return null;
      if (selected === BACK) {
        step = previousStep("temp") ?? "category";
        continue;
      }
      temp = selected;
      chosenOpts = { shot: false, milkChange: false, decaf: false };
      step = "options";
      continue;
    }

    if (!temp) {
      step = "temp";
      continue;
    }

    if (step === "options") {
      const optionList = optionListFor(menu, size);
      chosenOpts = { shot: false, milkChange: false, decaf: false };
      if (optionList.length === 0) {
        step = "quantity";
        continue;
      }

      const picks = await p.multiselect<OptionChoice | BackValue>({
        message: "옵션",
        options: [
          { value: "none", label: "옵션 없음" },
          ...optionList.map((o) => ({ value: o.key, label: o.label })),
          { value: BACK, label: backLabel("options") },
        ],
        required: false,
      });
      if (p.isCancel(picks)) return null;
      if (picks.includes(BACK)) {
        step = previousStep("options") ?? "category";
        continue;
      }
      if (!picks.includes("none")) {
        for (const k of picks.filter((pick): pick is AddOnKey => pick !== "none" && pick !== BACK)) {
          chosenOpts[k] = true;
        }
      }
      step = "quantity";
      continue;
    }

    const priced = priceItem({ menuSlug: menu.slug, size, temp, variant, options: chosenOpts });
    const displayName = `${menu.name} ${size}${temp === "ICE" ? "·아이스" : "·핫"}${variant ? `·${variant}` : ""}${formatOptions(chosenOpts)}`;
    const quantity = await pickQuantity(menu.name, maxQuantity, backLabel("quantity"));
    if (quantity === BACK) {
      step = previousStep("quantity") ?? "category";
      continue;
    }
    if (quantity == null) return null;

    const item = {
      menuSlug: menu.slug,
      size,
      temp,
      variant,
      options: chosenOpts,
      displayName,
      subtotal: priced.subtotal,
    };
    p.log.success(
      quantity === 1
        ? `👍 ${displayName} 추가됐어요.`
        : `👍 ${displayName} × ${quantity}잔 추가됐어요.`,
    );
    return Array.from({ length: quantity }, () => ({ ...item }));
  }
}

async function pickQuantity(
  menuName: string,
  maxQuantity: number,
  backLabel = "← 뒤로",
): Promise<number | BackValue | null> {
  const choices: Array<{ value: string | BackValue; label: string }> = [
    { value: "1", label: "1잔만" },
    ...(maxQuantity >= 3 ? [{ value: "3", label: "3잔" }] : []),
    ...(maxQuantity >= 5 ? [{ value: "5", label: "5잔" }] : []),
    { value: "custom", label: "다른 개수 입력" },
    { value: BACK, label: backLabel },
  ];
  const choice = await p.select<string | BackValue>({
    message: `👍 ${menuName} 추가됨. 몇 잔으로 할까요?`,
    options: choices,
  });
  if (p.isCancel(choice)) return null;
  if (choice === BACK) return BACK;
  if (choice !== "custom") return Number(choice);

  const custom = await p.text({
    message: "몇 잔으로 할까요?",
    placeholder: "예: 2",
    validate: (v) => {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 1) return "1잔 이상 정수로 입력해 주세요.";
      if (n > maxQuantity) return `최대 30잔까지 주문 가능해요. 지금은 ${maxQuantity}잔까지만 더 추가할 수 있어요.`;
      return undefined;
    },
  });
  if (p.isCancel(custom)) return null;
  return Number(custom);
}

export function formatMenuPrice(m: MenuItem): string {
  const prices = (Object.values(m.prices).filter((price): price is number => price != null));
  if (prices.length === 0) return "";
  const min = Math.min(...prices);
  if (prices.length > 1) return `${min.toLocaleString()}원~`;
  return `${min.toLocaleString()}원`;
}

function formatOptions(o: { shot: boolean; milkChange: boolean; decaf: boolean }): string {
  const parts: string[] = [];
  if (o.shot) parts.push("샷+");
  if (o.milkChange) parts.push("우유변경");
  if (o.decaf) parts.push("디카페인");
  return parts.length > 0 ? ` [${parts.join(",")}]` : "";
}

function groupCart(
  cart: CartItem[],
): Array<{ displayName: string; quantity: number; subtotal: number }> {
  const groups = new Map<string, { displayName: string; quantity: number; subtotal: number }>();
  for (const item of cart) {
    const existing = groups.get(item.displayName);
    if (existing) {
      existing.quantity += 1;
      existing.subtotal += item.subtotal;
    } else {
      groups.set(item.displayName, {
        displayName: item.displayName,
        quantity: 1,
        subtotal: item.subtotal,
      });
    }
  }
  return [...groups.values()];
}
