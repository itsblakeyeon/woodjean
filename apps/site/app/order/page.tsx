import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionLabel } from "@/components/Section";
import { GROUP_ORDER } from "@/lib/data/group-order";
import { STORE } from "@/lib/data/store";

export const metadata: Metadata = {
  title: "단체주문",
  description:
    "판교 테크노밸리 사무실로 회의용 음료 10~30잔을 미리 예약 배달합니다. 토스페이먼츠 카드결제 지원.",
};

export default function OrderPage() {
  return (
    <>
      <Section className="pb-10 pt-20">
        <SectionLabel>Group Order</SectionLabel>
        <h1 className="mt-3 serif text-4xl md:text-5xl">단체주문 안내</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-ink-soft)]">
          회의실에 정성스럽게 추출한 우드진 음료를 미리 도착하게 준비합니다.
          판교 테크노밸리 사무실 한정으로 10잔부터 30잔까지 운영합니다.
        </p>

        <div className="mt-10 rounded-md border border-[var(--color-wood)]/40 bg-[var(--color-paper)] p-6 md:p-8">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[var(--color-wood-deep)]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            준비 중 / Coming Soon
          </div>
          <h2 className="mt-4 serif text-2xl md:text-3xl">
            온라인 주문 페이지는 곧 오픈합니다
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--color-ink-soft)]">
            지금은 결제 시스템 가맹 심사 중입니다. 단체주문이 필요하시면
            매장으로 직접 전화 주시거나 이메일로 문의해 주세요.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={`tel:${STORE.phone}`}
              className="inline-flex h-11 items-center rounded-full bg-[var(--color-ink)] px-5 text-sm text-[var(--color-bg)] transition hover:bg-[var(--color-wood-deep)]"
            >
              {STORE.phone} 매장 전화
            </a>
            <a
              href={`mailto:${STORE.email}`}
              className="inline-flex h-11 items-center rounded-full border border-[var(--color-line)] bg-[var(--color-bg)] px-5 text-sm text-[var(--color-ink-soft)] transition hover:bg-[var(--color-bg)]"
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
            { step: "01", title: "수량과 시간 선택", desc: "10잔~30잔, 30분 단위 슬롯에서 픽업/배달 시간을 정합니다." },
            { step: "02", title: "메뉴 구성", desc: "시그니처/커피/논커피 30종 중 자유롭게 조합합니다." },
            { step: "03", title: "결제", desc: "토스페이먼츠 카드결제로 안전하게 진행합니다." },
            { step: "04", title: "배달/픽업", desc: "예약 시간에 맞춰 사무실 또는 매장에서 받으세요." },
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
        <h2 className="serif text-2xl md:text-3xl">예약 시간 안내</h2>
        <p className="mt-4 max-w-2xl text-sm text-[var(--color-ink-soft)]">
          정성껏 추출하기 위해, 수량별로 최소 예약 시간이 다릅니다.
        </p>
        <div className="mt-8 overflow-hidden rounded-md border border-[var(--color-line)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-paper)] text-xs uppercase tracking-[0.16em] text-[var(--color-ink-mute)]">
              <tr>
                <th className="px-6 py-4 font-medium">수량</th>
                <th className="px-6 py-4 font-medium">최소 예약 시간</th>
              </tr>
            </thead>
            <tbody>
              {GROUP_ORDER.leadTime.map((r, i) => (
                <tr
                  key={r.range}
                  className={i === GROUP_ORDER.leadTime.length - 1 ? "" : "border-b border-[var(--color-line)]"}
                >
                  <td className="px-6 py-5 serif text-base">{r.range}</td>
                  <td className="px-6 py-5 text-[var(--color-ink-soft)]">{r.hours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid gap-3 text-sm text-[var(--color-ink-soft)] sm:grid-cols-2">
          <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--color-ink-mute)]">슬롯 운영</div>
            <div className="mt-2">30분 단위 · 시간당 최대 {GROUP_ORDER.hourlyCapacity}잔</div>
          </div>
          <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--color-ink-mute)]">최소 / 최대</div>
            <div className="mt-2">
              {GROUP_ORDER.minQty}잔 ~ {GROUP_ORDER.maxQty}잔 / 1주문
            </div>
          </div>
        </div>

        <p className="mt-10 text-xs text-[var(--color-ink-mute)]">
          ※ 휴무일·라스트오더 이후 시간대는 슬롯이 닫혀 있을 수 있습니다.{" "}
          <Link href="/about" className="underline-offset-4 hover:underline">
            매장 운영시간 보기
          </Link>
        </p>
      </Section>
    </>
  );
}
