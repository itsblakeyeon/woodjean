import { createHash } from "node:crypto";
import { ensureDeviceId, getTier, type WoodjeanState } from "./state";

const API_BASE = process.env.WOODJEAN_API_URL ?? "https://bot.woodjean-pangyo.com";

export async function emitEvent(event: string, payload: Record<string, unknown> = {}): Promise<void> {
  if (process.env.WOODJEAN_TELEMETRY_OFF === "1") return;
  try {
    const deviceIdHash = await getDeviceIdHash();
    void fetch(`${API_BASE}/api/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event, deviceIdHash, payload }),
    }).catch(() => undefined);
  } catch {
    // Telemetry is fire-and-forget and must never affect ordering.
  }
}

export async function getDeviceIdHash(): Promise<string> {
  const deviceId = await ensureDeviceId();
  return createHash("sha256").update(deviceId).digest("hex").slice(0, 16);
}

export function isHotState(state: WoodjeanState | null): boolean {
  return Boolean(state?.lastOrder && getTier(state.lastOrder.savedAt) === "hot");
}
