export type MenuCategory = "signature" | "coffee" | "non-coffee";

export type MenuItem = {
  slug: string;
  name: string;
  category: MenuCategory;
  price: number;
  note?: string;
  description?: string;
};

export const CATEGORY_LABEL: Record<MenuCategory, string> = {
  signature: "시그니처",
  coffee: "커피",
  "non-coffee": "논커피",
};

export const MENU: MenuItem[] = [
  // 시그니처
  { slug: "woody-spaner", name: "우디슈페너", category: "signature", price: 4000, note: "ICE ONLY", description: "에스프레소 위에 부드러운 우유크림을 얹은 시그니처" },
  { slug: "pistachio-spaner", name: "피스타치오슈페너", category: "signature", price: 4000, note: "ICE ONLY", description: "고소한 피스타치오 크림을 올린 시그니처" },
  { slug: "choco-spaner", name: "초코슈페너", category: "signature", price: 4000, note: "ICE ONLY", description: "진한 초콜릿 시럽과 크림의 조합" },
  { slug: "earl-grey-milk-tea", name: "얼그레이 밀크티", category: "signature", price: 4500, description: "베르가못 향이 깊은 얼그레이 밀크티" },
  { slug: "dark-choco-latte", name: "다크초코라떼", category: "signature", price: 4500, description: "묵직한 다크 초콜릿 베이스" },

  // 커피
  { slug: "piccolo", name: "피콜로", category: "coffee", price: 3000, description: "에스프레소 위에 우유 한 스푼" },
  { slug: "flat-white", name: "플랫화이트", category: "coffee", price: 3800, description: "우유 거품 없이 진하게 즐기는 호주식 라떼" },
  { slug: "aussie-cappuccino", name: "AUSSIE 카푸치노", category: "coffee", price: 3800, note: "HOT ONLY", description: "초코파우더가 올라가는 호주식 카푸치노" },
  { slug: "dirty-chai-latte", name: "더티차이라떼", category: "coffee", price: 4500, description: "차이 라떼에 에스프레소 한 샷" },
  { slug: "espresso", name: "에스프레소", category: "coffee", price: 2800 },
  { slug: "americano", name: "아메리카노", category: "coffee", price: 3500 },
  { slug: "latte", name: "라떼", category: "coffee", price: 3800 },
  { slug: "soy-latte", name: "소이라떼", category: "coffee", price: 4000 },
  { slug: "almond-latte", name: "아몬드라떼", category: "coffee", price: 4000 },
  { slug: "vanilla-latte", name: "바닐라라떼", category: "coffee", price: 4300 },
  { slug: "hazelnut-latte", name: "헤이즐넛라떼", category: "coffee", price: 4300 },
  { slug: "caramel-latte", name: "카라멜라떼", category: "coffee", price: 4300 },
  { slug: "cafe-mocha", name: "카페모카", category: "coffee", price: 4300 },

  // 논커피
  { slug: "toffee-nut-latte", name: "토피넛라떼", category: "non-coffee", price: 4300 },
  { slug: "matcha-latte", name: "말차라떼", category: "non-coffee", price: 4300 },
  { slug: "five-grain-latte", name: "오곡라떼", category: "non-coffee", price: 4300 },
  { slug: "french-earl-grey", name: "프렌치얼그레이", category: "non-coffee", price: 4500, description: "라벤더와 베르가못 향의 프리미엄 얼그레이" },
  { slug: "melbourne-breakfast", name: "맬번브랙퍼스트", category: "non-coffee", price: 4500, description: "묵직한 멜번 스타일 블랙퍼스트 티" },
  { slug: "sencha-green-tea", name: "센차그린티", category: "non-coffee", price: 4500, description: "일본식 정통 센차" },
  { slug: "peppermint", name: "페퍼민트", category: "non-coffee", price: 4500 },
  { slug: "lemongrass-ginger", name: "레몬그라스 & 진저", category: "non-coffee", price: 4500 },
  { slug: "chamomile", name: "카모마일", category: "non-coffee", price: 4500 },
  { slug: "triple-berry-ade", name: "트리플베리에이드", category: "non-coffee", price: 4800 },
  { slug: "pina-colada-ade", name: "피나콜라다에이드", category: "non-coffee", price: 4800 },
  { slug: "bundaberg-ade", name: "분다버그에이드", category: "non-coffee", price: 4300, note: "망고 / 진저비어 / 자몽 / 레몬라임" },
];

export const MENU_BY_CATEGORY: Record<MenuCategory, MenuItem[]> = {
  signature: MENU.filter((m) => m.category === "signature"),
  coffee: MENU.filter((m) => m.category === "coffee"),
  "non-coffee": MENU.filter((m) => m.category === "non-coffee"),
};
