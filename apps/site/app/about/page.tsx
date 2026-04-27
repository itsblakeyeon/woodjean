import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Section, SectionLabel } from "@/components/Section";
import { STORE, SLOGAN_EN, SLOGAN_KR } from "@/lib/data/store";

export const metadata: Metadata = {
  title: "매장 소개",
  description:
    "우드진 판교테크노밸리점 매장 소개. 호주식 카페 우드진의 브랜드 스토리, 매장 위치, 운영시간.",
};

export default function AboutPage() {
  return (
    <>
      <Section className="pb-10 pt-20">
        <SectionLabel>About</SectionLabel>
        <h1 className="mt-3 serif text-4xl md:text-5xl">매장 소개</h1>
      </Section>

      {/* Story */}
      <Section className="py-12">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="text-xs uppercase tracking-[0.22em] text-[var(--color-wood-deep)]">
              Story
            </div>
            <h2 className="mt-3 serif text-3xl leading-snug md:text-4xl">{SLOGAN_EN}</h2>
            <p className="mt-6 text-base leading-loose text-[var(--color-ink-soft)]">
              {SLOGAN_KR}.
            </p>
          </div>
          <div className="md:col-span-7">
            <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-[var(--color-line)]">
              <Image
                src="/interior/11.jpg"
                alt="WOODJEAN 판교점 인테리어"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 60vw"
              />
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div>
            <div className="serif text-xl">간결한 한 잔</div>
            <p className="mt-3 text-sm leading-loose text-[var(--color-ink-soft)]">
              다양한 음료보다, 정성껏 만든 한 잔. 호주식 카페 문화의 핵심을
              한국식 일상에 맞게 풀었습니다.
            </p>
          </div>
          <div>
            <div className="serif text-xl">우드와 데님</div>
            <p className="mt-3 text-sm leading-loose text-[var(--color-ink-soft)]">
              차가운 콘크리트 대신 따뜻한 나무. 불편한 정장 대신 편안한 데님.
              매장의 모든 디테일이 같은 메시지를 향합니다.
            </p>
          </div>
          <div>
            <div className="serif text-xl">회색 빌딩 숲</div>
            <p className="mt-3 text-sm leading-loose text-[var(--color-ink-soft)]">
              판교 테크노밸리 한가운데 유스페이스1 광장. 회의 사이의 짧은 휴식,
              긴 코드 리뷰의 여유 한 모금.
            </p>
          </div>
        </div>
      </Section>

      {/* Interior gallery */}
      <Section className="py-12">
        <div className="mb-8 text-xs uppercase tracking-[0.22em] text-[var(--color-wood-deep)]">
          Interior
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[1, 6, 8, 11, 7, 4, 12, 2].map((n) => (
            <div
              key={n}
              className="relative aspect-square overflow-hidden rounded-md border border-[var(--color-line)]"
            >
              <Image
                src={`/interior/${n}.jpg`}
                alt="WOODJEAN 매장 인테리어"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Visit info */}
      <Section className="py-12">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-[var(--color-wood-deep)]">
              Location
            </div>
            <h2 className="mt-3 serif text-2xl md:text-3xl">우드진 판교점</h2>
            <ul className="mt-6 space-y-4 text-sm">
              <li>
                <div className="text-[var(--color-ink-mute)]">주소</div>
                <div className="mt-1 leading-relaxed">{STORE.address}</div>
              </li>
              <li>
                <div className="text-[var(--color-ink-mute)]">전화</div>
                <div className="mt-1">
                  <a href={`tel:${STORE.phone}`} className="hover:underline">
                    {STORE.phone}
                  </a>
                </div>
              </li>
              <li>
                <div className="text-[var(--color-ink-mute)]">이메일</div>
                <div className="mt-1">
                  <a href={`mailto:${STORE.email}`} className="hover:underline">
                    {STORE.email}
                  </a>
                </div>
              </li>
              <li>
                <Link
                  href={STORE.naverMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center text-sm underline-offset-4 hover:underline"
                >
                  네이버 지도에서 보기 →
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-[var(--color-wood-deep)]">
              Hours
            </div>
            <h2 className="mt-3 serif text-2xl md:text-3xl">운영시간</h2>
            <ul className="mt-6 space-y-3 text-sm">
              {STORE.hours.map((h) => (
                <li key={h.label} className="flex justify-between border-b border-[var(--color-line)] pb-3">
                  <span>{h.label}</span>
                  <span className="text-[var(--color-ink-soft)]">{h.value}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-[var(--color-ink-mute)]">{STORE.lastOrder}</p>
          </div>
        </div>
      </Section>
    </>
  );
}
