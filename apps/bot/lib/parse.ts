import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { menuManifestForLLM, priceItem, type OrderItemInput } from "@woodjean/shared";
import { env } from "./env";
import { parseCartFuzzy } from "./parse-fuzzy";

export const ParsedCartItemSchema = z.object({
  menuSlug: z.string(),
  qty: z.number().int().min(1).max(30),
  size: z.enum(["R", "L"]),
  temp: z.enum(["ICE", "HOT"]),
  variant: z.string().nullable().optional(),
  options: z.object({
    shot: z.boolean().optional().default(false),
    milkChange: z.boolean().optional().default(false),
    decaf: z.boolean().optional().default(false),
  }).default({}),
  subtotal: z.number().int(),
});

export type ParsedCartItem = z.infer<typeof ParsedCartItemSchema>;

const LlmItemSchema = z.object({
  slug: z.string(),
  qty: z.number().int().min(1).max(30).default(1),
  size: z.enum(["R", "L"]),
  temp: z.enum(["ICE", "HOT"]),
  variant: z.string().nullable().optional(),
  options: z.object({
    shot: z.boolean().optional().default(false),
    milkChange: z.boolean().optional().default(false),
    decaf: z.boolean().optional().default(false),
  }).default({}),
});

const LlmResponseSchema = z.object({
  items: z.array(LlmItemSchema).default([]),
  unresolved: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0),
});

export async function parseCartWithLLM(text: string): Promise<{ items: ParsedCartItem[]; unresolved: string[]; confidence: number }> {
  if (env.PARSE_FUZZY_ONLY === "1" || !env.ANTHROPIC_API_KEY) return parseCartFuzzy(text);

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const started = Date.now();
  let response;
  try {
    response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    temperature: 0,
    system: [
      {
        type: "text",
        text: [
          "You parse cafe group orders into Woodjean menu JSON.",
          "Return only JSON with shape {\"items\":[{\"slug\",\"qty\",\"size\",\"temp\",\"variant\",\"options\"}],\"unresolved\":[],\"confidence\":0.0}.",
          "Use only this menu manifest. If unsure, put the original line in unresolved.",
          menuManifestForLLM(),
        ].join("\n"),
        cache_control: { type: "ephemeral" },
      } as Anthropic.Messages.TextBlockParam,
    ],
    messages: [
      {
        role: "user",
        content: [
          "Examples:",
          "아아 5잔 -> americano ICE R qty 5",
          "라떼 핫 라지 2, 바닐라라떼 아이스 3 -> match sizes/temps",
          "모르는 메뉴는 unresolved로 보내.",
          "",
          text,
        ].join("\n"),
      },
    ],
    });
  } catch {
    return parseCartFuzzy(text);
  }

  const raw = response.content.find((block) => block.type === "text")?.text ?? "{}";
  const parsed = LlmResponseSchema.parse(JSON.parse(extractJson(raw)));
  const items: ParsedCartItem[] = [];
  const unresolved = [...parsed.unresolved];

  for (const item of parsed.items) {
    const input: OrderItemInput = {
      menuSlug: item.slug,
      size: item.size,
      temp: item.temp,
      variant: item.variant ?? null,
      options: item.options,
    };
    try {
      const priced = priceItem(input);
      items.push({
        menuSlug: priced.menuSlug,
        qty: item.qty,
        size: priced.size,
        temp: priced.temp,
        variant: priced.variant,
        options: priced.options,
        subtotal: priced.subtotal * item.qty,
      });
    } catch {
      unresolved.push(item.slug);
    }
  }

  console.info("[parse-cart]", { latencyMs: Date.now() - started, items: items.length, unresolved: unresolved.length });
  return { items, unresolved, confidence: parsed.confidence };
}

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return text;
  return text.slice(start, end + 1);
}
