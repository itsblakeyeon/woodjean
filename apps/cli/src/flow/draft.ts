import type { Slot } from "../lib/api";
import type { LastOrder } from "../lib/state";
import type { Customer } from "./customer";
import type { DeliveryAddress } from "./delivery";
import type { CartItem } from "./menu";

export type OrderDraft = Partial<{
  slot: Slot;
  cart: CartItem[];
  delivery: DeliveryAddress;
  customer: Customer;
  agreed: boolean;
  previousLastOrder: LastOrder;
}>;

export type StepResult =
  | { ok: true; draft: OrderDraft }
  | { ok: false; reason?: string };

export type Step = (draft: OrderDraft) => Promise<StepResult>;

export const ok = (draft: OrderDraft): StepResult => ({ ok: true, draft });
export const cancel = (reason?: string): StepResult => ({ ok: false, reason });
