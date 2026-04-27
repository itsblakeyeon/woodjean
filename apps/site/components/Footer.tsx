import Link from "next/link";
import { STORE } from "@/lib/data/store";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--color-line)] bg-[var(--color-paper)]">
      <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-10">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="serif text-xl">WOODJEAN</div>
            <div className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--color-ink-mute)]">
              Pangyo Techno Valley
            </div>
            <p className="mt-5 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              회색 빌딩 숲의 우드진.<br />
              판교 테크노밸리에서 만나는 호주식 카페.
            </p>
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-ink-mute)]">
              매장
            </div>
            <ul className="mt-4 space-y-2 text-sm text-[var(--color-ink-soft)]">
              <li>{STORE.address}</li>
              <li>전화 {STORE.phone}</li>
              <li>이메일 {STORE.email}</li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-ink-mute)]">
              메뉴
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/menu" className="hover:underline">
                  전체 메뉴
                </Link>
              </li>
              <li>
                <Link href="/order" className="hover:underline">
                  단체주문 안내
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:underline">
                  매장 소개
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:underline">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:underline">
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 divider" />

        <div className="mt-8 grid gap-2 text-xs leading-relaxed text-[var(--color-ink-mute)] md:grid-cols-2">
          <div>
            <span className="font-medium text-[var(--color-ink-soft)]">상호</span>{" "}
            {STORE.legalName}
            <span className="mx-2 text-[var(--color-line)]">|</span>
            <span className="font-medium text-[var(--color-ink-soft)]">대표자</span>{" "}
            {STORE.ceoName}
          </div>
          <div>
            <span className="font-medium text-[var(--color-ink-soft)]">사업자등록번호</span>{" "}
            {STORE.bizNumber}
          </div>
          <div className="md:col-span-2">
            <span className="font-medium text-[var(--color-ink-soft)]">주소</span> {STORE.address}
          </div>
          <div className="md:col-span-2">
            <span className="font-medium text-[var(--color-ink-soft)]">고객센터</span>{" "}
            {STORE.phone}
            <span className="mx-2 text-[var(--color-line)]">|</span>
            <span className="font-medium text-[var(--color-ink-soft)]">이메일</span>{" "}
            {STORE.email}
          </div>
        </div>

        <div className="mt-6 text-xs text-[var(--color-ink-mute)]">
          © {new Date().getFullYear()} {STORE.legalName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
