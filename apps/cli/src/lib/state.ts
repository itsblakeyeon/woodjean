import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import type { CartItem } from "../flow/menu";

const STATE_DIR = join(homedir(), ".woodjean");
export const STATE_PATH = join(STATE_DIR, "state.json");
export const ID_PATH = join(STATE_DIR, "id");

const DeliverySchema = z.object({
  building: z.string(),
  floor: z.string().optional(),
  recipient: z.string(),
  location: z.string().optional(),
});

const CartItemSchema = z.object({
  menuSlug: z.string(),
  size: z.enum(["R", "L"]),
  temp: z.enum(["ICE", "HOT"]),
  variant: z.string().nullable().optional(),
  options: z.object({
    shot: z.boolean(),
    milkChange: z.boolean(),
    decaf: z.boolean(),
  }),
  displayName: z.string(),
  subtotal: z.number().int(),
});

const LastOrderSchema = z.object({
  savedAt: z.string(),
  deliveryAtISO: z.string(),
  nickname: z.string(),
  phone: z.string(),
  delivery: DeliverySchema,
  cart: z.array(CartItemSchema),
  orderId: z.string(),
});

const StateV1Schema = z.object({
  schemaVersion: z.literal(1),
  lastOrder: LastOrderSchema.optional(),
  recentBuildings: z.array(z.string()).default([]),
  visitCount: z.number().int().nonnegative().default(0),
});

export type LastOrder = z.infer<typeof LastOrderSchema>;
export type WoodjeanState = z.infer<typeof StateV1Schema>;
export type VisitTier = "hot" | "warm" | "cold" | "expired";

export async function ensureDeviceId(): Promise<string> {
  try {
    const existing = (await readFile(ID_PATH, "utf8")).trim();
    if (z.string().uuid().safeParse(existing).success) return existing;
  } catch {
    // Missing or unreadable id is repaired below.
  }

  const id = randomUUID();
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(ID_PATH, `${id}\n`, { encoding: "utf8", mode: 0o600 });
  await chmod(ID_PATH, 0o600);
  return id;
}

export async function loadState(): Promise<WoodjeanState | null> {
  try {
    const raw = await readFile(STATE_PATH, "utf8");
    const parsed = StateV1Schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function saveState(state: WoodjeanState): Promise<void> {
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(STATE_PATH, JSON.stringify(state, null, 2), { encoding: "utf8", mode: 0o600 });
  await chmod(STATE_PATH, 0o600);
}

export async function saveLastOrder(lastOrder: LastOrder): Promise<void> {
  const current = await loadState();
  const recentBuildings = [
    lastOrder.delivery.building,
    ...(current?.recentBuildings ?? []).filter((building) => building !== lastOrder.delivery.building),
  ].slice(0, 10);

  await saveState({
    schemaVersion: 1,
    lastOrder,
    recentBuildings,
    visitCount: (current?.visitCount ?? 0) + 1,
  });
}

export function getTier(savedAt: string): VisitTier {
  const saved = new Date(savedAt).getTime();
  if (!Number.isFinite(saved)) return "expired";
  const ageDays = (Date.now() - saved) / 86_400_000;
  if (ageDays <= 7) return "hot";
  if (ageDays <= 30) return "warm";
  if (ageDays <= 60) return "cold";
  return "expired";
}

export function lastOrderToCart(lastOrder: LastOrder): CartItem[] {
  return lastOrder.cart.map((item) => ({ ...item }));
}
