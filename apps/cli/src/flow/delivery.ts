import * as p from "@clack/prompts";
import { cancel, ok, type StepResult } from "./draft";
import type { OrderDraft } from "./draft";
import type { LastOrder } from "../lib/state";

export type DeliveryAddress = {
  building: string;
  floor?: string;
  recipient: string;
  location?: string;
};

export async function stepCollectDelivery(draft: OrderDraft): Promise<StepResult> {
  const delivery = await collectDelivery(draft.previousLastOrder);
  if (!delivery) return cancel();
  return ok({ ...draft, delivery });
}

export async function collectDelivery(previousLastOrder?: LastOrder): Promise<DeliveryAddress | null> {
  p.log.info("배달지를 입력해 주세요. 우드진 반경 1km 이내 (도보 20분).");

  const building = await p.text({
    message: "건물명 (예: 유스페이스2 A동)",
    initialValue: previousLastOrder?.delivery.building,
    validate: (v) => (v && v.trim().length > 0 ? undefined : "건물명이 필요해요. 예: 유스페이스2 A동, H스퀘어 N동, 알파리움타워"),
  });
  if (p.isCancel(building)) return null;

  const floor = await p.text({
    message: "층/호 (예: 9F 902호) — 선택",
    placeholder: "선택사항",
    initialValue: previousLastOrder?.delivery.floor,
  });
  if (p.isCancel(floor)) return null;

  const recipient = await p.text({
    message: "수령자 이름",
    initialValue: previousLastOrder?.delivery.recipient,
    validate: (v) => (v && v.trim().length > 0 ? undefined : "수령자 이름이 필요해요. 도착 안내에 사용해요."),
  });
  if (p.isCancel(recipient)) return null;

  const location = await p.text({
    message: "수령 위치 (예: 1층 로비, 사무실 입구) — 선택",
    placeholder: "선택사항",
    initialValue: previousLastOrder?.delivery.location,
  });
  if (p.isCancel(location)) return null;

  return {
    building: building.trim(),
    floor: floor.trim() || undefined,
    recipient: recipient.trim(),
    location: location.trim() || undefined,
  };
}
