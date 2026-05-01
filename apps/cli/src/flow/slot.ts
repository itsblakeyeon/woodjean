import * as p from "@clack/prompts";
import { listSlots, type Slot } from "../lib/api";
import { formatKstWindow } from "../lib/format";

export async function pickSlot(): Promise<Slot | null> {
  const s = p.spinner();
  s.start("주문 가능한 시간 조회 중");
  let slots: Slot[];
  try {
    slots = await listSlots(3);
  } catch (e) {
    s.stop("시간 조회 실패");
    p.log.error(e instanceof Error ? e.message : String(e));
    return null;
  }
  s.stop(`${slots.length}개 슬롯 가능`);

  if (slots.length === 0) {
    p.log.warn("향후 3일 동안 가능한 슬롯이 없습니다. 매장 상황 / 영업시간을 확인해 주세요.");
    return null;
  }

  // 일자별 그룹핑
  const byDay = new Map<string, Slot[]>();
  for (const s of slots) {
    const day = s.deliveryAt.slice(0, 10);
    const arr = byDay.get(day) ?? [];
    arr.push(s);
    byDay.set(day, arr);
  }

  const choice = await p.select<string>({
    message: "도착 시간을 선택해 주세요 (lead time 1시간)",
    options: slots.map((s) => ({
      value: s.deliveryAt,
      label: formatKstWindow(s.deliveryAt),
    })),
  });
  if (p.isCancel(choice)) return null;
  return slots.find((s) => s.deliveryAt === choice) ?? null;
}
