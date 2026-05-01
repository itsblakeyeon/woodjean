import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionLabel } from "@/components/Section";
import { GROUP_ORDER } from "@/lib/data/group-order";
import { STORE } from "@/lib/data/store";

export const metadata: Metadata = {
  title: "단체주문",
  description:
    "판교 테크노밸리 사무실로 회의용 음료 5~30잔을 미리 예약 배달합니다. 결제는 현장 후불 (카드/송금/이체).",
};

export default function OrderPage() {
  return (
    <>
      <Section className="pb-10 pt-20">
        <SectionLabel>Group Order</SectionLabel>
        <h1 className="mt-3 serif text-4xl md:text-5xl">단체주문</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-ink-soft)]">
          회의실에 정성스럽게 추출한 우드진 음료를 미리 도착하게 준비합니다.
          판교 테크노밸리 사무실 한정으로 5잔부터 30잔까지 운영합니다.
        </p>

        <div className="mt-10 rounded-md border border-[var(--color-wood)]/40 bg-[var(--color-paper)] p-6 md:p-8">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[var(--color-wood-deep)]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            CLI · 터미널에서 시작
          </div>
          <h2 className="mt-4 serif text-2xl md:text-3xl">
            한 줄로 주문을 시작합니다
          </h2>
          <pre className="mono mt-6 overflow-x-auto rounded-md bg-[var(--color-ink)] px-5 py-4 text-sm leading-relaxed text-[var(--color-bg)]">
            <code>$ npx woodjean order</code>
          </pre>
          <p className="mt-4 text-base leading-relaxed text-[var(--color-ink-soft)]">
            메뉴 선택 → 사이즈/온도/옵션 → 잔수 → 배달지 → 닉네임 + 휴대폰 →
            동의. 1분이면 끝납니다. 결제는 사람과 사람으로 — 배달 시
            사장님이 현장에서 카드·송금·이체로 받습니다.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={`tel:${STORE.phone}`}
              className="inline-flex h-11 items-center rounded-full border border-[var(--color-line)] bg-[var(--color-bg)] px-5 text-sm text-[var(--color-ink-soft)] transition hover:bg-[var(--color-paper)]"
            >
              {STORE.phone} 매장 전화
            </a>
            <a
              href={`mailto:${STORE.email}`}
              className="inline-flex h-11 items-center rounded-full border border-[var(--color-line)] bg-[var(--color-bg)] px-5 text-sm text-[var(--color-ink-soft)] transition hover:bg-[var(--color-paper)]"
            >
              {STORE.email}
            </a>
          </div>
        </div>
      </Section>

      {/* How it works */}
      <Section className="py-12">
        <h2 className="serif text-2xl md:text-3xl">이용 방법</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            { step: "01", title: "CLI 실행", desc: "터미널에서 npx woodjean order — 한 줄로 시작합니다." },
            { step: "02", title: "메뉴 + 시간", desc: "27종 음료 자유 조합, 1시간 단위 도착 슬롯." },
            { step: "03", title: "사장님 알림", desc: "텔레그램으로 사장님에게 즉시 전달, 자동 수락." },
            { step: "04", title: "현장 후불", desc: "예약 시간에 도착, 사장님께 카드/송금/이체로 결제." },
          ].map((s) => (
            <li
              key={s.step}
              className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] p-6"
            >
              <div className="mono text-xs text-[var(--color-wood-deep)]">{s.step}</div>
              <div className="mt-3 serif text-lg">{s.title}</div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">{s.desc}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Lead time + caps */}
      <Section className="py-12">
        <h2 className="serif text-2xl md:text-3xl">예약 안내</h2>
        <p className="mt-4 max-w-2xl text-sm text-[var(--color-ink-soft)]">
          한 번에 정성껏 추출하기 위해 1시간 전 예약, 시간당 1건만 받습니다.
        </p>

        <div className="mt-8 grid gap-3 text-sm text-[var(--color-ink-soft)] sm:grid-cols-3">
          <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--color-ink-mute)]">예약 lead</div>
            <div className="mt-2 serif text-lg text-[var(--color-ink)]">1시간 전</div>
            <div className="mt-1 text-xs text-[var(--color-ink-mute)]">잔수 무관, 단일</div>
          </div>
          <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--color-ink-mute)]">슬롯</div>
            <div className="mt-2 serif text-lg text-[var(--color-ink)]">1시간 단위</div>
            <div className="mt-1 text-xs text-[var(--color-ink-mute)]">시간당 1건</div>
          </div>
          <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--color-ink-mute)]">잔수</div>
            <div className="mt-2 serif text-lg text-[var(--color-ink)]">{GROUP_ORDER.minQty} ~ {GROUP_ORDER.maxQty}잔</div>
            <div className="mt-1 text-xs text-[var(--color-ink-mute)]">1주문 기준</div>
          </div>
        </div>

        <p className="mt-10 text-xs text-[var(--color-ink-mute)]">
          ※ 점심 피크타임(11:30~13:30)은 5월 한정 단체주문을 받지 않습니다.
          휴무일·라스트오더 이후 시간대는 슬롯이 닫힙니다.{" "}
          <Link href="/about" className="underline-offset-4 hover:underline">
            매장 운영시간 보기
          </Link>
        </p>
      </Section>
    </>
  );
}
