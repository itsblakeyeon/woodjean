import * as p from "@clack/prompts";
import { cancel, ok, type StepResult } from "./draft";
import type { OrderDraft } from "./draft";
import type { LastOrder } from "../lib/state";

export type DeliveryAddress = {
  building: string;
  floor?: string;
  recipient?: string;
  location?: string;
};

export async function stepCollectDelivery(draft: OrderDraft): Promise<StepResult> {
  const delivery = await collectDelivery(draft.previousLastOrder);
  if (!delivery) return cancel();
  return ok({ ...draft, delivery });
}

export async function collectDelivery(previousLastOrder?: LastOrder): Promise<DeliveryAddress | null> {
  p.log.info("도보 30분 내 권장. 범위 밖이면 사장님이 확인 후 연락드릴 수 있어요.");

  const address = await p.text({
    message: "배달지 (건물·층/호·수령 위치)",
    placeholder: "예: 유스페이스2 A동 9층 회의실 앞",
    initialValue: formatPreviousDelivery(previousLastOrder),
    validate: (v) => (v && v.trim().length > 0 ? undefined : "배달지를 입력해 주세요. 예: 유스페이스2 A동 9층 회의실 앞"),
  });
  if (p.isCancel(address)) return null;

  return {
    building: address.trim(),
  };
}

function formatPreviousDelivery(previousLastOrder?: LastOrder): string | undefined {
  const delivery = previousLastOrder?.delivery;
  if (!delivery) return undefined;
  return [delivery.building, delivery.floor, delivery.location].filter(Boolean).join(" ") || undefined;
}
