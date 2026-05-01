import { z } from "zod";
import { MENU_BY_SLUG, OPTION_PRICES, type MenuItem, type Size, type Temp } from "../menu/data";

// ============================================================================
// 입력 스키마 (zod) — API/CLI 입력 검증용
// ============================================================================

export const SizeSchema = z.enum(["R", "L"]);
export const TempSchema = z.enum(["ICE", "HOT"]);

export const OrderItemOptionsSchema = z.object({
  shot: z.boolean().optional().default(false),
  milkChange: z.boolean().optional().default(false),
  decaf: z.boolean().optional().default(false),
});

export const OrderItemInputSchema = z.object({
  menuSlug: z.string().min(1),
  size: SizeSchema,
  temp: TempSchema,
  variant: z.string().nullish(),
  options: OrderItemOptionsSchema.optional().default({ shot: false, milkChange: false, decaf: false }),
});

export type OrderItemOptions = z.infer<typeof OrderItemOptionsSchema>;
export type OrderItemInput = z.infer<typeof OrderItemInputSchema>;

// ============================================================================
// 출력 — DB items jsonb에 저장될 형태
// ============================================================================

export type OrderItemPriced = {
  menuSlug: string;
  menuName: string;
  size: Size;
  temp: Temp;
  variant: string | null;
  options: OrderItemOptions;
  unitPrice: number;     // 베이스 가격 (사이즈별)
  extrasPrice: number;   // 옵션 가격 합계
  subtotal: number;      // unit + extras
};

export type PricingError =
  | { kind: "menu_not_found"; menuSlug: string }
  | { kind: "menu_inactive"; menuSlug: string }
  | { kind: "size_not_available"; menuSlug: string; size: Size; available: Size[] }
  | { kind: "temp_not_available"; menuSlug: string; temp: Temp; available: Temp[] }
  | { kind: "variant_required"; menuSlug: string; variants: string[] }
  | { kind: "variant_invalid"; menuSlug: string; variant: string; valid: string[] }
  | { kind: "option_not_available"; menuSlug: string; option: keyof OrderItemOptions };

export class PricingException extends Error {
  constructor(public readonly error: PricingError) {
    super(`PricingError: ${error.kind} (${JSON.stringify(error)})`);
    this.name = "PricingException";
  }
}

// ============================================================================
// 핵심: 단일 아이템 가격 계산 (서버 권위)
// ============================================================================

export function priceItem(input: OrderItemInput): OrderItemPriced {
  const parsed = OrderItemInputSchema.parse(input);
  const menu = MENU_BY_SLUG[parsed.menuSlug];

  if (!menu) {
    throw new PricingException({ kind: "menu_not_found", menuSlug: parsed.menuSlug });
  }

  // 사이즈
  const unitPrice = menu.prices[parsed.size];
  if (unitPrice == null) {
    const available = (Object.keys(menu.prices) as Size[]).filter((k) => menu.prices[k] != null);
    throw new PricingException({
      kind: "size_not_available",
      menuSlug: menu.slug,
      size: parsed.size,
      available,
    });
  }

  // 온도
  if (!menu.temps.includes(parsed.temp)) {
    throw new PricingException({
      kind: "temp_not_available",
      menuSlug: menu.slug,
      temp: parsed.temp,
      available: menu.temps,
    });
  }

  // variant
  if (menu.variants && menu.variants.length > 0) {
    if (!parsed.variant) {
      throw new PricingException({
        kind: "variant_required",
        menuSlug: menu.slug,
        variants: menu.variants,
      });
    }
    if (!menu.variants.includes(parsed.variant)) {
      throw new PricingException({
        kind: "variant_invalid",
        menuSlug: menu.slug,
        variant: parsed.variant,
        valid: menu.variants,
      });
    }
  }

  // 옵션 — 메뉴별 허용 여부 + 가격 합계
  const opts = parsed.options;
  let extrasPrice = 0;

  if (opts.shot) {
    if (!menu.options?.shot) {
      throw new PricingException({ kind: "option_not_available", menuSlug: menu.slug, option: "shot" });
    }
    extrasPrice += OPTION_PRICES.shot;
  }
  if (opts.milkChange) {
    if (!menu.options?.milkChange) {
      throw new PricingException({ kind: "option_not_available", menuSlug: menu.slug, option: "milkChange" });
    }
    extrasPrice += OPTION_PRICES.milkChange;
  }
  if (opts.decaf) {
    if (!menu.options?.decaf) {
      throw new PricingException({ kind: "option_not_available", menuSlug: menu.slug, option: "decaf" });
    }
    extrasPrice += OPTION_PRICES.decaf[parsed.size];
  }

  return {
    menuSlug: menu.slug,
    menuName: menu.name,
    size: parsed.size,
    temp: parsed.temp,
    variant: parsed.variant ?? null,
    options: opts,
    unitPrice,
    extrasPrice,
    subtotal: unitPrice + extrasPrice,
  };
}

// ============================================================================
// 주문 단위 계산 — 여러 아이템의 합 + 잔수 검증
// ============================================================================

export const MIN_CUPS = 5;
export const MAX_CUPS = 30;

export type OrderQuote = {
  items: OrderItemPriced[];
  cupCount: number;
  totalAmount: number;
};

export function priceOrder(inputs: OrderItemInput[]): OrderQuote {
  if (inputs.length === 0) {
    throw new Error("주문 아이템이 비어있습니다.");
  }
  const items = inputs.map(priceItem);
  const cupCount = items.length;
  if (cupCount < MIN_CUPS || cupCount > MAX_CUPS) {
    throw new Error(`잔수는 ${MIN_CUPS}~${MAX_CUPS}잔이어야 합니다 (현재: ${cupCount}).`);
  }
  const totalAmount = items.reduce((sum, it) => sum + it.subtotal, 0);
  return { items, cupCount, totalAmount };
}

// 메뉴별로 사용 가능한 아이템인지만 가볍게 검증 (가격 계산 없이)
export function isOrderItemValid(input: OrderItemInput): boolean {
  try {
    priceItem(input);
    return true;
  } catch {
    return false;
  }
}
