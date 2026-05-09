export type MenuCategory = "signature" | "coffee" | "non-coffee";
export type Size = "R" | "L";
export type Temp = "ICE" | "HOT";

export type MenuOptions = {
  shot?: boolean;
  milkChange?: boolean;
  decaf?: boolean;
};

export type MenuItem = {
  slug: string;
  name: string;
  category: MenuCategory;
  prices: { R?: number; L?: number };
  temps: Temp[];
  variants?: string[];
  options?: MenuOptions;
  description?: string;
};

export const OPTION_PRICES = {
  shot: 500,
  milkChange: 500,
  decaf: { R: 500, L: 1000 },
} as const;

export const CATEGORY_LABEL: Record<MenuCategory, string> = {
  signature: "시그니처",
  coffee: "커피",
  "non-coffee": "논커피",
};

export const MENU: MenuItem[] = [
  // 시그니처 — WOODJEAN-MADE
  {
    slug: "woody-spaner",
    name: "우디슈페너",
    category: "signature",
    prices: { R: 4000 },
    temps: ["ICE"],
    variants: ["오리지널", "피스타치오", "초코"],
    options: { shot: true, milkChange: true, decaf: true },
    description: "에스프레소 위에 부드러운 크림을 얹은 시그니처 (오리지널 / 피스타치오 / 초코)",
  },
  {
    slug: "earl-grey-milk-tea",
    name: "얼그레이 밀크티",
    category: "signature",
    prices: { R: 4500, L: 5000 },
    temps: ["ICE", "HOT"],
    options: { milkChange: true },
    description: "베르가못 향이 깊은 얼그레이 밀크티",
  },
  {
    slug: "dark-choco-latte",
    name: "다크초코라떼",
    category: "signature",
    prices: { R: 4500, L: 5000 },
    temps: ["ICE", "HOT"],
    options: { shot: true, milkChange: true, decaf: true },
    description: "묵직한 다크 초콜릿 베이스",
  },

  // 커피 — A.U STYLE COFFEE
  {
    slug: "piccolo",
    name: "피콜로",
    category: "coffee",
    prices: { R: 3000 },
    temps: ["HOT"],
    options: { shot: true, milkChange: true, decaf: true },
    description: "에스프레소 위에 우유 한 스푼",
  },
  {
    slug: "flat-white",
    name: "플랫화이트",
    category: "coffee",
    prices: { R: 3800 },
    temps: ["ICE", "HOT"],
    options: { shot: true, milkChange: true, decaf: true },
    description: "우유 거품 없이 진하게 즐기는 호주식 라떼",
  },
  {
    slug: "aussie-cappuccino",
    name: "AUSSIE 카푸치노",
    category: "coffee",
    prices: { R: 3800, L: 4300 },
    temps: ["HOT"],
    options: { shot: true, milkChange: true, decaf: true },
    description: "초코파우더가 올라가는 호주식 카푸치노",
  },
  {
    slug: "dirty-chai-latte",
    name: "더티차이라떼",
    category: "coffee",
    prices: { R: 4500, L: 5000 },
    temps: ["ICE", "HOT"],
    options: { shot: true, milkChange: true, decaf: true },
    description: "차이 라떼에 에스프레소 한 샷",
  },

  // 커피 — BLACK COFFEE
  {
    slug: "espresso",
    name: "에스프레소",
    category: "coffee",
    prices: { R: 2800 },
    temps: ["HOT"],
    options: { shot: true, decaf: true },
  },
  {
    slug: "americano",
    name: "아메리카노",
    category: "coffee",
    prices: { R: 3000, L: 3500 },
    temps: ["ICE", "HOT"],
    options: { shot: true, decaf: true },
  },

  // 커피 — WHITE COFFEE
  {
    slug: "latte",
    name: "라떼",
    category: "coffee",
    prices: { R: 3800, L: 4300 },
    temps: ["ICE", "HOT"],
    options: { shot: true, milkChange: true, decaf: true },
  },
  {
    slug: "soy-latte",
    name: "소이라떼",
    category: "coffee",
    prices: { R: 4000, L: 4500 },
    temps: ["ICE", "HOT"],
    options: { shot: true, milkChange: true, decaf: true },
  },
  {
    slug: "almond-latte",
    name: "아몬드라떼",
    category: "coffee",
    prices: { R: 4000, L: 4500 },
    temps: ["ICE", "HOT"],
    options: { shot: true, milkChange: true, decaf: true },
  },

  // 커피 — SWEET COFFEE
  {
    slug: "vanilla-latte",
    name: "바닐라라떼",
    category: "coffee",
    prices: { R: 4300, L: 4800 },
    temps: ["ICE", "HOT"],
    options: { shot: true, milkChange: true, decaf: true },
  },
  {
    slug: "hazelnut-latte",
    name: "헤이즐넛라떼",
    category: "coffee",
    prices: { R: 4300, L: 4800 },
    temps: ["ICE", "HOT"],
    options: { shot: true, milkChange: true, decaf: true },
  },
  {
    slug: "caramel-latte",
    name: "카라멜라떼",
    category: "coffee",
    prices: { R: 4300, L: 4800 },
    temps: ["ICE", "HOT"],
    options: { shot: true, milkChange: true, decaf: true },
  },
  {
    slug: "cafe-mocha",
    name: "카페모카",
    category: "coffee",
    prices: { R: 4300, L: 4800 },
    temps: ["ICE", "HOT"],
    options: { shot: true, milkChange: true, decaf: true },
  },

  // 논커피 — NON-COFFEE LATTE
  {
    slug: "toffee-nut-latte",
    name: "토피넛라떼",
    category: "non-coffee",
    prices: { R: 4300, L: 4800 },
    temps: ["ICE", "HOT"],
    options: { shot: true, milkChange: true },
  },
  {
    slug: "matcha-latte",
    name: "말차라떼",
    category: "non-coffee",
    prices: { R: 4300, L: 4800 },
    temps: ["ICE", "HOT"],
    options: { shot: true, milkChange: true },
  },
  {
    slug: "five-grain-latte",
    name: "오곡라떼",
    category: "non-coffee",
    prices: { R: 4300, L: 4800 },
    temps: ["ICE", "HOT"],
    options: { shot: true, milkChange: true },
  },

  // 논커피 — TEA (모두 L only)
  {
    slug: "french-earl-grey",
    name: "프렌치얼그레이",
    category: "non-coffee",
    prices: { L: 4500 },
    temps: ["ICE", "HOT"],
    description: "라벤더와 베르가못 향의 프리미엄 얼그레이",
  },
  {
    slug: "melbourne-breakfast",
    name: "맬번브랙퍼스트",
    category: "non-coffee",
    prices: { L: 4500 },
    temps: ["ICE", "HOT"],
    description: "묵직한 멜번 스타일 블랙퍼스트 티",
  },
  {
    slug: "peppermint",
    name: "페퍼민트",
    category: "non-coffee",
    prices: { L: 4500 },
    temps: ["ICE", "HOT"],
  },
  {
    slug: "lemongrass-ginger",
    name: "레몬그라스 & 진저",
    category: "non-coffee",
    prices: { L: 4500 },
    temps: ["ICE", "HOT"],
  },
  {
    slug: "chamomile",
    name: "카모마일",
    category: "non-coffee",
    prices: { L: 4500 },
    temps: ["ICE", "HOT"],
  },

  // 논커피 — ADE (모두 L only, ICE only)
  {
    slug: "triple-berry-ade",
    name: "트리플베리 에이드",
    category: "non-coffee",
    prices: { L: 4800 },
    temps: ["ICE"],
  },
  {
    slug: "pina-colada-ade",
    name: "피나콜라다 에이드",
    category: "non-coffee",
    prices: { L: 4800 },
    temps: ["ICE"],
  },
  {
    slug: "bundaberg-ade",
    name: "분다버그 에이드",
    category: "non-coffee",
    prices: { L: 4300 },
    temps: ["ICE"],
    variants: ["망고", "진저비어", "자몽", "레몬라임"],
  },
];

export const MENU_BY_CATEGORY: Record<MenuCategory, MenuItem[]> = {
  signature: MENU.filter((m) => m.category === "signature"),
  coffee: MENU.filter((m) => m.category === "coffee"),
  "non-coffee": MENU.filter((m) => m.category === "non-coffee"),
};

export const MENU_BY_SLUG: Record<string, MenuItem> = Object.fromEntries(
  MENU.map((m) => [m.slug, m]),
);

export function displayPrice(item: MenuItem): string {
  const { R, L } = item.prices;
  if (R != null && L != null) return `${R.toLocaleString()}~${L.toLocaleString()}원`;
  if (R != null) return `${R.toLocaleString()}원`;
  if (L != null) return `${L.toLocaleString()}원`;
  return "";
}

export function displayTemp(item: MenuItem): string | null {
  if (item.temps.length === 1) {
    return item.temps[0] === "HOT" ? "HOT ONLY" : "ICE ONLY";
  }
  return null;
}
