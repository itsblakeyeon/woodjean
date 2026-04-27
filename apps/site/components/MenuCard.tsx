import Image from "next/image";
import { type MenuItem } from "@/lib/data/menu";

export function MenuCard({ item }: { item: MenuItem }) {
  return (
    <div className="group">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-[var(--color-line)] bg-[var(--color-paper)]">
        <Image
          src={`/menu/${item.slug}.jpg`}
          alt={item.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        {item.note && (
          <div className="absolute right-2 top-2 rounded-full bg-[var(--color-ink)]/85 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--color-bg)]">
            {item.note}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-sm font-medium text-[var(--color-ink)]">{item.name}</div>
        <div className="mono text-sm tabular-nums text-[var(--color-ink-soft)]">
          {item.price.toLocaleString()}원
        </div>
      </div>
      {item.description && (
        <div className="mt-1 text-xs leading-relaxed text-[var(--color-ink-mute)]">
          {item.description}
        </div>
      )}
    </div>
  );
}
