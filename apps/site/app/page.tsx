import Image from "next/image";
import Link from "next/link";
import { Section, SectionLabel } from "@/components/Section";
import { MenuCard } from "@/components/MenuCard";
import { MENU_BY_CATEGORY } from "@/lib/data/menu";
import { GROUP_ORDER } from "@/lib/data/group-order";
import { STORE, HERO_LINE, HERO_SUBLINE, SLOGAN_EN, SLOGAN_KR } from "@/lib/data/store";

export default function HomePage() {
  const signatures = MENU_BY_CATEGORY.signature;

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/interior/8.jpg"
            alt="WOODJEAN 판교점 매장 인테리어"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-ink)]/55 via-[var(--color-ink)]/25 to-[var(--color-ink)]/65" />
        </div>
        <div className="mx-auto max-w-7xl px-6 py-32 sm:px-8 md:py-44 lg:px-10">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/70">
            Pangyo Techno Valley · Since 2026
          </div>
          <h1 className="mt-4 serif text-5xl leading-tight text-white md:text-7xl">
            {HERO_LINE}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
            {HERO_SUBLINE}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/order"
              className="inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-bg)]"
            >
              단체주문 시작하기
            </Link>
            <Link
              href="/menu"
              className="inline-flex h-11 items-center rounded-full border border-white/40 px-6 text-sm text-white transition hover:bg-white/10"
            >
              메뉴 보기
            </Link>
          </div>
        </div>
      </section>

      {/* Brand statement */}
      <Section className="py-24">
        <div className="grid gap-10 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-5">
            <SectionLabel>WOODJEAN</SectionLabel>
            <h2 className="mt-4 serif text-3xl leading-snug md:text-4xl">{SLOGAN_EN}</h2>
          </div>
          <div className="md:col-span-7 md:pt-2">
            <p className="text-base leading-loose text-[var(--color-ink-soft)] md:text-lg">
              {SLOGAN_KR}.
            </p>
            <p className="mt-6 text-base leading-loose text-[var(--color-ink-soft)]">
              호주 멜번에서 바리스타로 일하던 창업자가 가져온 호주식 카페 문화.
              간결하지만 완성도 높은 한 잔, 그리고 편안한 일상의 시간.
              우드진 판교점은 회색 빌딩 숲의 한가운데, 유스페이스1 광장에서
              여러분을 맞이합니다.
            </p>
          </div>
        </div>
      </Section>

      <div className="divider mx-auto max-w-7xl" />

      {/* Signature menu */}
      <Section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <SectionLabel>Signature</SectionLabel>
            <h2 className="mt-3 serif text-3xl md:text-4xl">시그니처 5종</h2>
          </div>
          <Link
            href="/menu"
            className="text-sm text-[var(--color-ink-soft)] underline-offset-4 hover:underline"
          >
            전체 메뉴 →
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-5 md:gap-x-8">
          {signatures.map((m) => (
            <MenuCard key={m.slug} item={m} />
          ))}
        </div>
      </Section>

      {/* Group order */}
      <section className="bg-[var(--color-paper)] paper-texture">
        <Section>
          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <SectionLabel>Group Order</SectionLabel>
              <h2 className="mt-3 serif text-3xl leading-snug md:text-4xl">
                회의에 어울리는<br />
                10잔부터 30잔까지
              </h2>
              <p className="mt-6 text-base leading-loose text-[var(--color-ink-soft)]">
                판교 테크노밸리 사무실로 미리 예약 배달해 드립니다.
                시간 슬롯제로 진행되며, 한 번에 30잔까지 주문할 수 있습니다.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/order"
                  className="inline-flex h-11 items-center rounded-full bg-[var(--color-ink)] px-6 text-sm font-medium text-[var(--color-bg)] transition hover:bg-[var(--color-wood-deep)]"
                >
                  주문 안내 보기
                </Link>
                <a
                  href={`tel:${STORE.phone}`}
                  className="inline-flex h-11 items-center rounded-full border border-[var(--color-line)] bg-[var(--color-bg)] px-5 text-sm text-[var(--color-ink-soft)] transition hover:bg-[var(--color-paper)]"
                >
                  {STORE.phone}
                </a>
              </div>
            </div>
            <div className="md:col-span-7">
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {GROUP_ORDER.leadTime.map((rule) => (
                  <li
                    key={rule.range}
                    className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] p-5"
                  >
                    <div className="text-xs uppercase tracking-[0.16em] text-[var(--color-ink-mute)]">
                      예약 안내
                    </div>
                    <div className="mt-3 serif text-2xl">{rule.range}</div>
                    <div className="mt-2 text-sm text-[var(--color-ink-soft)]">{rule.hours}</div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 grid gap-3 text-sm text-[var(--color-ink-soft)] sm:grid-cols-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-[var(--color-ink-mute)]">슬롯</span>
                  <span>30분 단위 · 시간당 최대 {GROUP_ORDER.hourlyCapacity}잔</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-[var(--color-ink-mute)]">결제</span>
                  <span>토스페이먼츠 카드결제</span>
                </div>
              </div>
            </div>
          </div>
        </Section>
      </section>

      {/* Visit */}
      <Section>
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <SectionLabel>Visit</SectionLabel>
            <h2 className="mt-3 serif text-3xl md:text-4xl">매장 방문</h2>
            <div className="mt-8 space-y-4 text-sm">
              <div>
                <div className="text-[var(--color-ink-mute)]">주소</div>
                <div className="mt-1 leading-relaxed">{STORE.address}</div>
              </div>
              <div>
                <div className="text-[var(--color-ink-mute)]">전화</div>
                <div className="mt-1">{STORE.phone}</div>
              </div>
              <div>
                <div className="text-[var(--color-ink-mute)]">운영시간</div>
                <ul className="mt-1 space-y-0.5">
                  {STORE.hours.map((h) => (
                    <li key={h.label} className="flex justify-between gap-6">
                      <span>{h.label}</span>
                      <span className="text-[var(--color-ink-soft)]">{h.value}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 text-xs text-[var(--color-ink-mute)]">{STORE.lastOrder}</div>
              </div>
            </div>
          </div>
          <div className="md:col-span-7 grid grid-cols-2 gap-3">
            {[7, 8, 4, 10].map((n) => (
              <div
                key={n}
                className="relative aspect-[4/3] overflow-hidden rounded-md border border-[var(--color-line)]"
              >
                <Image
                  src={`/interior/${n}.jpg`}
                  alt="우드진 매장"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 30vw"
                />
              </div>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
