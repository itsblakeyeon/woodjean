import type { Metadata } from "next";
import { Section, SectionLabel } from "@/components/Section";
import { MenuCard } from "@/components/MenuCard";
import { CATEGORY_LABEL, MENU_BY_CATEGORY, type MenuCategory } from "@/lib/data/menu";

export const metadata: Metadata = {
  title: "메뉴",
  description:
    "우드진 판교점 전체 메뉴. 시그니처 3종, 커피 13종, 논커피 11종 — 호주식 카페에서 만나는 27종의 음료.",
};

const ORDER: MenuCategory[] = ["signature", "coffee", "non-coffee"];

export default function MenuPage() {
  return (
    <>
      <Section className="pb-12 pt-20">
        <SectionLabel>Menu</SectionLabel>
        <h1 className="mt-3 serif text-4xl md:text-5xl">전체 메뉴</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-ink-soft)]">
          호주 멜번 스타일의 커피, 시그니처 슈페너, 그리고 차분한 차와 에이드까지.
          모든 음료는 매장에서 직접 추출하고, 단체주문 시에도 동일한 잔으로 제공됩니다.
        </p>
      </Section>

      {ORDER.map((cat) => {
        const items = MENU_BY_CATEGORY[cat];
        return (
          <Section key={cat} className="py-12">
            <div className="mb-10 flex items-baseline justify-between border-b border-[var(--color-line)] pb-4">
              <h2 className="serif text-2xl md:text-3xl">{CATEGORY_LABEL[cat]}</h2>
              <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-ink-mute)]">
                {items.length} items
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4 md:gap-x-8 lg:grid-cols-5">
              {items.map((m) => (
                <MenuCard key={m.slug} item={m} />
              ))}
            </div>
          </Section>
        );
      })}
    </>
  );
}
