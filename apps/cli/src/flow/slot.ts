import * as p from "@clack/prompts";
import { listSlots, registerNotify, type Slot } from "../lib/api";
import { formatKstWindow } from "../lib/format";
import { emitEvent } from "../lib/telemetry";
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
    slots = await listSlots(7);
  } catch (e) {
    s.stop("시간 조회 실패");
    p.log.error(e instanceof Error ? e.message : String(e));
    return null;
  }
  s.stop(`${slots.length}개 슬롯 가능`);

  if (slots.length === 0) {
    return offerNotifyAndExit();
  }

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
  const slot = daySlots.find((s) => s.deliveryAt === choice) ?? null;
  if (slot) {
    await emitEvent("slot_picked", {
      leadMinutes: Math.max(0, Math.round((new Date(slot.deliveryAt).getTime() - Date.now()) / 60_000)),
      hour: new Date(slot.deliveryAt).getHours(),
    });
  }
  return slot;
}

async function offerNotifyAndExit(): Promise<Slot | null> {
  p.log.warn("향후 3일 슬롯이 모두 마감됐어요.");

  const action = await p.select<"notify" | "store" | "cancel">({
    message: "다음 가능 시간이 열리면 어떻게 할까요?",
    options: [
      { value: "notify", label: "SMS로 알림 받기" },
      { value: "store", label: "매장(010-8484-2120)에 직접 문의" },
      { value: "cancel", label: "그만두기" },
    ],
  });
  if (p.isCancel(action) || action !== "notify") return null;

  const phone = await p.text({
    message: "알림 받을 휴대폰 번호 (숫자만)",
    placeholder: "01012345678",
    validate: (v) => {
      const digits = v.replace(/\D/g, "");
      if (!/^01\d{8,9}$/.test(digits)) return "010 또는 011로 시작하는 10~11자리 번호를 입력해 주세요.";
      return undefined;
    },
  });
  if (p.isCancel(phone)) return null;

  const spinner = p.spinner();
  spinner.start("알림 등록 중");
  const result = await registerNotify(phone.replace(/\D/g, ""));
  if (!result.ok) {
    spinner.stop("알림 등록 실패");
    p.log.error(`등록에 실패했어요 (${result.error}). 매장으로 직접 문의 부탁드려요.`);
    return null;
  }
  spinner.stop("알림 등록됐어요");
  p.log.info("7일 안에 새 슬롯이 열리면 SMS로 알려드릴게요.");
  return null;
}

function formatDayLabel(day: string): string {
  const d = new Date(`${day}T00:00:00+09:00`);
  const month = d.getMonth() + 1;
  const date = d.getDate();
  const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${month}/${date} (${dayOfWeek})`;
}
