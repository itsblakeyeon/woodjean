import { MENU, priceItem, type OrderItemInput } from "@woodjean/shared";
import type { ParsedCartItem } from "./parse";

type FuzzyResult = { items: ParsedCartItem[]; unresolved: string[]; confidence: number };

export function parseCartFuzzy(text: string): FuzzyResult {
  const matches = [
    ...text.matchAll(/(\d+)\s*잔?\s+([^\n,;]+)/g),
    ...text.matchAll(/([^\n,;]+?)\s+(\d+)\s*잔?/g),
  ];
  const items: ParsedCartItem[] = [];
  const unresolved: string[] = [];

  for (const match of matches) {
    const qty = Number(match[1] && /^\d+$/.test(match[1]) ? match[1] : match[2]);
    const token = String(match[1] && /^\d+$/.test(match[1]) ? match[2] : match[1]).trim();
    if (!Number.isInteger(qty) || qty < 1 || !token) continue;

    const menu = bestMenuMatch(token);
    if (!menu) {
      unresolved.push(token);
      continue;
    }

    const input: OrderItemInput = {
      menuSlug: menu.slug,
      size: menu.prices.R != null ? "R" : "L",
      temp: menu.temps.includes("ICE") ? "ICE" : "HOT",
      variant: menu.variants?.[0] ?? null,
      options: { shot: false, milkChange: false, decaf: false },
    };
    try {
      const priced = priceItem(input);
      items.push({
        menuSlug: priced.menuSlug,
        qty,
        size: priced.size,
        temp: priced.temp,
        variant: priced.variant,
        options: priced.options,
        subtotal: priced.subtotal * qty,
      });
    } catch {
      unresolved.push(token);
    }
  }

  const total = items.length + unresolved.length;
  return {
    items,
    unresolved,
    confidence: total === 0 ? 0 : items.length / total,
  };
}

function bestMenuMatch(token: string): (typeof MENU)[number] | null {
  const normalized = normalize(token);
  let best: { menu: (typeof MENU)[number]; score: number } | null = null;
  for (const menu of MENU) {
    for (const candidate of [menu.name, ...(menu.aliases ?? [])]) {
      const score = similarity(normalized, normalize(candidate));
      if (!best || score > best.score) best = { menu, score };
    }
  }
  return best && best.score >= 0.7 ? best.menu : null;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "").replace(/[^\p{L}\p{N}]/gu, "");
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a.includes(b) || b.includes(a)) return 1;
  const max = Math.max(a.length, b.length);
  const distance = levenshtein(a, b);
  return 1 - distance / max;
}

function levenshtein(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = Array.from({ length: b.length + 1 }, () => 0);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1]! + 1, prev[j]! + 1, prev[j - 1]! + cost);
    }
    prev.splice(0, prev.length, ...curr);
  }
  return prev[b.length] ?? 0;
}
