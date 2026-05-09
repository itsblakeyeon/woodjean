import { supabase } from "./supabase";
import { sendSms, isSolapiConfigured, SMS_TEMPLATES } from "./solapi";

export type NotifyTargetRow = {
  id: number;
  phone: string;
  registered_at: string;
};

/** 활성(fire되지 않았고 만료되지 않은) 알림 등록 row 조회 */
export async function loadPendingNotifyTargets(now: Date = new Date()): Promise<NotifyTargetRow[]> {
  const { data, error } = await supabase()
    .from("notify_targets")
    .select("id, phone, registered_at")
    .is("fired_at", null)
    .gt("expires_at", now.toISOString());
  if (error) throw error;
  return (data ?? []) as NotifyTargetRow[];
}

/** 알림 발송 후 fired_at 갱신. SMS 실패 시 재시도 가능하도록 fired_at은 성공 시에만 set. */
export async function fireNotify(
  target: NotifyTargetRow,
): Promise<{ ok: true } | { ok: false; reason: "sms_disabled" | "send_failed" }> {
  if (!isSolapiConfigured()) return { ok: false, reason: "sms_disabled" };
  try {
    await sendSms(target.phone, SMS_TEMPLATES.slotAvailable());
  } catch (e) {
    console.error("[notify-targets fire] send failed", { id: target.id, e });
    return { ok: false, reason: "send_failed" };
  }
  const { error } = await supabase()
    .from("notify_targets")
    .update({ fired_at: new Date().toISOString() })
    .eq("id", target.id);
  if (error) {
    console.error("[notify-targets fire] mark fired_at failed", { id: target.id, error });
    return { ok: false, reason: "send_failed" };
  }
  return { ok: true };
}

export async function insertNotifyTarget(phone: string, deviceIdHash?: string): Promise<{ id: number; expiresAt: string }> {
  const { data, error } = await supabase()
    .from("notify_targets")
    .insert({ phone, device_id_hash: deviceIdHash ?? null })
    .select("id, expires_at")
    .single();
  if (error) throw error;
  return { id: data.id as number, expiresAt: data.expires_at as string };
}
