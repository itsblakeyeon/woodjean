import { supabase } from "./supabase";

// 영업시간 윈도우 (HH:MM, KST)
type HourWindow = { start: string; end: string };
type BusinessHours = { weekday: HourWindow[]; weekend: HourWindow[] };

const DEFAULT_HOURS: BusinessHours = {
  // 5/18~ 정상 (사장님 확정 2026-04-29). 시간은 KST 기준.
  weekday: [
    { start: "09:00", end: "11:00" },
    { start: "13:30", end: "16:30" },
  ],
  weekend: [],
};

const LEAD_MS = 60 * 60 * 1000;
const SLOT_MS = 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export type Slot = {
  /** ISO datetime UTC (DB delivery_at에 저장될 값) */
  deliveryAt: string;
  /** 사람 표시용 KST "16:00~16:15" */
  displayWindow: string;
  available: boolean;
  reason?: "past_lead" | "outside_hours" | "paused" | "slot_taken";
};

async function loadSettings(): Promise<{ hours: BusinessHours; pausedUntil: string | null }> {
  const { data } = await supabase()
    .from("settings")
    .select("key, value")
    .in("key", ["business_hours", "paused_until"]);
  const map = new Map((data ?? []).map((r: { key: string; value: unknown }) => [r.key, r.value] as const));
  return {
    hours: (map.get("business_hours") as BusinessHours) ?? DEFAULT_HOURS,
    pausedUntil: (map.get("paused_until") as string | null) ?? null,
  };
}

async function loadConfirmedDeliveryHours(fromIso: string, toIso: string): Promise<Set<number>> {
  const { data } = await supabase()
    .from("orders")
    .select("delivery_at")
    .eq("status", "confirmed")
    .gte("delivery_at", fromIso)
    .lt("delivery_at", toIso);
  const taken = new Set<number>();
  for (const row of data ?? []) {
    const t = new Date(row.delivery_at as string).getTime();
    // hour bucket — KST 기준 시간을 정수 키로 (UTC ms / 3600000)
    taken.add(Math.floor(t / SLOT_MS));
  }
  return taken;
}

function parseHHMM(hhmm: string): { h: number; m: number } {
  const [h, m] = hhmm.split(":").map(Number);
  return { h: h ?? 0, m: m ?? 0 };
}

/**
 * KST 시각을 UTC Date로 변환.
 * KST는 UTC+9 (DST 없음). 즉 KST 09:00 = UTC 00:00 (같은 날) 또는 KST 13:30 5/18 = UTC 04:30 5/18.
 */
function kstToUtc(year: number, monthIdx: number, day: number, hour: number, minute: number): Date {
  // Date.UTC는 UTC 기준 timestamp 반환. KST는 UTC+9이므로 hour - 9.
  return new Date(Date.UTC(year, monthIdx, day, hour - 9, minute, 0, 0));
}

/** UTC Date → KST 표현 (year/month/day/hour/minute) */
function utcToKstParts(d: Date): { year: number; month: number; day: number; hour: number; minute: number; dow: number } {
  const kstMs = d.getTime() + KST_OFFSET_MS;
  const kst = new Date(kstMs);
  return {
    year: kst.getUTCFullYear(),
    month: kst.getUTCMonth(),
    day: kst.getUTCDate(),
    hour: kst.getUTCHours(),
    minute: kst.getUTCMinutes(),
    dow: kst.getUTCDay(),
  };
}

function formatKstWindow(d: Date): string {
  const k = utcToKstParts(d);
  const k2 = utcToKstParts(new Date(d.getTime() + 15 * 60_000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(k.hour)}:${pad(k.minute)}~${pad(k2.hour)}:${pad(k2.minute)}`;
}

function isWeekendKst(dow: number): boolean {
  return dow === 0 || dow === 6;
}

/**
 * 향후 N일 동안의 1시간 단위 슬롯 (KST 영업시간 기준).
 * - delivery_at은 UTC ISO로 반환 (DB와 일관)
 * - displayWindow는 KST HH:MM~HH:MM
 *
 * @param opts.now UTC current time (테스트용 주입)
 */
export async function listAvailableSlots(opts?: { now?: Date; days?: number }): Promise<Slot[]> {
  const now = opts?.now ?? new Date();
  const days = opts?.days ?? 7;
  const { hours, pausedUntil } = await loadSettings();
  const pausedUntilDate = pausedUntil ? new Date(pausedUntil) : null;

  const earliest = new Date(now.getTime() + LEAD_MS);
  const horizonEnd = new Date(now.getTime() + days * 24 * 3600 * 1000);
  const taken = await loadConfirmedDeliveryHours(now.toISOString(), horizonEnd.toISOString());

  const slots: Slot[] = [];
  const todayKst = utcToKstParts(now);

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    // KST 기준 dayOffset일 후의 날짜 (24시간 더하면 시간/일 자동 계산)
    const dayStartUtc = kstToUtc(todayKst.year, todayKst.month, todayKst.day + dayOffset, 0, 0);
    const k = utcToKstParts(dayStartUtc);
    const windows = isWeekendKst(k.dow) ? hours.weekend : hours.weekday;
    if (windows.length === 0) continue;

    for (const win of windows) {
      const { h: sH, m: sM } = parseHHMM(win.start);
      const { h: eH, m: eM } = parseHHMM(win.end);
      const winStart = kstToUtc(k.year, k.month, k.day, sH, sM);
      const winEnd = kstToUtc(k.year, k.month, k.day, eH, eM);

      for (let t = winStart.getTime(); t + SLOT_MS <= winEnd.getTime() + 1; t += SLOT_MS) {
        const slotStart = new Date(t);
        const reasons: Slot["reason"][] = [];

        if (slotStart < earliest) reasons.push("past_lead");
        if (pausedUntilDate && slotStart < pausedUntilDate) reasons.push("paused");
        if (taken.has(Math.floor(t / SLOT_MS))) reasons.push("slot_taken");

        slots.push({
          deliveryAt: slotStart.toISOString(),
          displayWindow: formatKstWindow(slotStart),
          available: reasons.length === 0,
          reason: reasons[0],
        });
      }
    }
  }

  return slots;
}

/**
 * 서버측 slot 검증 — 클라이언트가 보낸 deliveryAt이 실제 가능한 슬롯인지 atomic하게 확인.
 * createOrder에서 호출. 단순히 listAvailableSlots와 비교하지 않고 불변 조건을 직접 체크
 * (영업시간 + lead + paused). DB 슬롯 cap unique index가 동시성 마지막 방어선.
 */
export async function validateDeliverySlot(
  deliveryAt: string,
  now: Date = new Date(),
): Promise<{ ok: true } | { ok: false; reason: "past_lead" | "outside_hours" | "paused" | "not_aligned" }> {
  const at = new Date(deliveryAt);
  if (isNaN(at.getTime())) return { ok: false, reason: "outside_hours" };

  // 1시간 정각 정렬 (KST 기준 분/초/ms = 0)
  const k = utcToKstParts(at);
  if (k.minute !== 0) return { ok: false, reason: "not_aligned" };
  if (at.getUTCSeconds() !== 0 || at.getUTCMilliseconds() !== 0) return { ok: false, reason: "not_aligned" };

  // lead time 1시간
  if (at.getTime() < now.getTime() + LEAD_MS) return { ok: false, reason: "past_lead" };

  const { hours, pausedUntil } = await loadSettings();

  // paused
  if (pausedUntil && at < new Date(pausedUntil)) return { ok: false, reason: "paused" };

  // 영업시간 (KST)
  const windows = isWeekendKst(k.dow) ? hours.weekend : hours.weekday;
  if (windows.length === 0) return { ok: false, reason: "outside_hours" };

  const slotMinutes = k.hour * 60 + k.minute;
  const inWindow = windows.some((w) => {
    const { h: sH, m: sM } = parseHHMM(w.start);
    const { h: eH, m: eM } = parseHHMM(w.end);
    const sMin = sH * 60 + sM;
    const eMin = eH * 60 + eM;
    // slot_start이 [start, end-60min] 범위에 있어야 1시간 슬롯이 영업시간 내에 끝남
    return slotMinutes >= sMin && slotMinutes + 60 <= eMin + 1;
  });
  if (!inWindow) return { ok: false, reason: "outside_hours" };

  return { ok: true };
}
