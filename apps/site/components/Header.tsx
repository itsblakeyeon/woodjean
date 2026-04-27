import Link from "next/link";

const NAV = [
  { href: "/menu", label: "메뉴" },
  { href: "/order", label: "단체주문" },
  { href: "/about", label: "매장 소개" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[var(--color-bg)]/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-8 lg:px-10">
        <Link href="/" className="group flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-wood-deep)] text-[var(--color-bg)]">
            <span className="serif text-sm font-medium">W</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="serif text-base tracking-wide sm:text-lg">WOODJEAN</span>
            <span className="hidden text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-mute)] sm:block">
              Pangyo Techno Valley
            </span>
          </div>
        </Link>
        <nav className="flex shrink-0 items-center gap-4 whitespace-nowrap sm:gap-7">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-xs text-[var(--color-ink-soft)] transition hover:text-[var(--color-ink)] sm:text-sm"
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/order"
            className="hidden h-9 items-center rounded-full bg-[var(--color-ink)] px-4 text-xs text-[var(--color-bg)] transition hover:bg-[var(--color-wood-deep)] lg:inline-flex"
          >
            단체주문 시작
          </Link>
        </nav>
      </div>
    </header>
  );
}
