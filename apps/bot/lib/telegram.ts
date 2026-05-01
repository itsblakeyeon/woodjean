import { env } from "./env";

const API = "https://api.telegram.org";

export type InlineKeyboardButton = {
  text: string;
  callback_data?: string;
  url?: string;
};

export type InlineKeyboardMarkup = {
  inline_keyboard: InlineKeyboardButton[][];
};

export function isTelegramConfigured(): boolean {
  return Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_OWNER_CHAT_ID);
}

async function call<T = unknown>(method: string, body: Record<string, unknown>): Promise<T> {
  if (!env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN missing");
  }
  const res = await fetch(`${API}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { ok: boolean; result?: T; description?: string };
  if (!json.ok) throw new Error(`Telegram ${method} failed: ${json.description}`);
  return json.result as T;
}

export async function sendOwnerMessage(text: string, opts?: { reply_markup?: InlineKeyboardMarkup }): Promise<{ message_id: number }> {
  if (!env.TELEGRAM_OWNER_CHAT_ID) throw new Error("TELEGRAM_OWNER_CHAT_ID missing");
  return call("sendMessage", {
    chat_id: env.TELEGRAM_OWNER_CHAT_ID,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: opts?.reply_markup,
  });
}

export async function editOwnerMessage(messageId: number, text: string, opts?: { reply_markup?: InlineKeyboardMarkup }): Promise<void> {
  if (!env.TELEGRAM_OWNER_CHAT_ID) throw new Error("TELEGRAM_OWNER_CHAT_ID missing");
  await call("editMessageText", {
    chat_id: env.TELEGRAM_OWNER_CHAT_ID,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: opts?.reply_markup,
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
  await call("answerCallbackQuery", { callback_query_id: callbackQueryId, text });
}

export function orderActionKeyboard(orderId: string, current: "confirmed" | "completed" | "cancelled" | "no_show"): InlineKeyboardMarkup {
  if (current === "confirmed") {
    return {
      inline_keyboard: [
        [
          { text: "✅ 완료", callback_data: `order:complete:${orderId}` },
          { text: "❌ 노쇼", callback_data: `order:noshow:${orderId}` },
        ],
        [{ text: "🚫 취소", callback_data: `order:cancel:${orderId}` }],
      ],
    };
  }
  // 종결 상태는 액션 없음
  return { inline_keyboard: [] };
}
