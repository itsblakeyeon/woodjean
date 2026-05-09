import * as p from "@clack/prompts";
import { listSlots, type Slot } from "../lib/api";
import { formatKstWindow } from "../lib/format";
import { cancel, ok, type StepResult } from "./draft";
import type { OrderDraft } from "./draft";

export async function stepPickSlot(draft: OrderDraft): Promise<StepResult> {
  const slot = await pickSlot();
  if (!slot) return cancel();
  return ok({ ...draft, slot });
}

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

  const day = await p.select<string>({
    message: "도착 날짜를 선택해 주세요",
    options: [...byDay.entries()].map(([day, slots]) => ({
      value: day,
      label: formatDayLabel(day),
      hint: `${slots.length}개 슬롯`,
    })),
  });
  if (p.isCancel(day)) return null;

  const daySlots = byDay.get(day) ?? [];
  const choice = await p.select<string>({
    message: "도착 시간을 선택해 주세요 (lead time 1시간)",
    options: daySlots.map((s) => ({
      value: s.deliveryAt,
      label: formatKstWindow(s.deliveryAt),
    })),
  });
  if (p.isCancel(choice)) return null;
  return daySlots.find((s) => s.deliveryAt === choice) ?? null;
}

function formatDayLabel(day: string): string {
  const d = new Date(`${day}T00:00:00+09:00`);
  const month = d.getMonth() + 1;
  const date = d.getDate();
  const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${month}/${date} (${dayOfWeek})`;
}
