import { MENU } from "./data";

export function menuManifestForLLM(): string {
  return JSON.stringify(
    MENU.map((item) => ({
      slug: item.slug,
      name: item.name,
      variants: item.variants ?? [],
      sizes: Object.entries(item.prices)
        .filter(([, price]) => price != null)
        .map(([size, price]) => ({ size, price })),
      temps: item.temps,
      options: Object.entries(item.options ?? {})
        .filter(([, enabled]) => enabled)
        .map(([key]) => key),
    })),
  );
}
