import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import { answerCallbackQuery, editOwnerMessage, orderActionKeyboard, sendOwnerMessage } from "@/lib/telegram";
import { updateOrderStatus } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Telegram update payload (필요한 부분만 검증)
const UpdateSchema = z.object({
  update_id: z.number(),
  message: z.object({
    message_id: z.number(),
    chat: z.object({ id: z.number() }),
    from: z.object({ id: z.number() }).optional(),
    text: z.string().optional(),
  }).optional(),
  callback_query: z.object({
    id: z.string(),
    from: z.object({ id: z.number() }),
    data: z.string().optional(),
    message: z.object({ message_id: z.number(), chat: z.object({ id: z.number() }) }).optional(),
  }).optional(),
});

export async function POST(req: Request) {
  // 시크릿 검증 (Telegram setWebhook --secret-token)
  // env.ts production validator가 미설정을 startup에서 막지만, 추가 안전망으로 dev에서도 fail-closed.
  if (!env.TELEGRAM_WEBHOOK_SECRET) {
    console.error("[telegram] TELEGRAM_WEBHOOK_SECRET not configured — rejecting all requests");
    return NextResponse.json({ ok: false, error: "misconfigured" }, { status: 500 });
  }
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: true }); // 무시 (Telegram이 retry 안 하도록 200)
  }
  const update = parsed.data;
  const eventKey = `telegram:${update.update_id}`;

  // Idempotency
  const { error: insErr } = await supabase().from("webhook_events").insert({
    event_key: eventKey,
    provider: "telegram",
    payload: body as object,
  });
  if (insErr && insErr.code === "23505") {
    return NextResponse.json({ ok: true, deduped: true });
  }

  // 사장님(owner) 외 무시 — defense in depth (secret 검증 + chat_id 검증)
  if (!env.TELEGRAM_OWNER_CHAT_ID) {
    console.error("[telegram] TELEGRAM_OWNER_CHAT_ID not configured — rejecting");
    return NextResponse.json({ ok: false, error: "misconfigured" }, { status: 500 });
  }
  const fromId = update.callback_query?.from.id ?? update.message?.from?.id;
  if (String(fromId) !== env.TELEGRAM_OWNER_CHAT_ID) {
    return NextResponse.json({ ok: true, ignored: "non_owner" });
  }

  try {
    if (update.callback_query) {
      await handleCallback(update.callback_query);
    } else if (update.message?.text) {
      await handleCommand(update.message.text);
    }
  } catch (e) {
    console.error("[telegram webhook]", e);
  }

  return NextResponse.json({ ok: true });
}

// ============================================================================
// 인라인 버튼: order:complete:<id> | order:noshow:<id> | order:cancel:<id>
// ============================================================================

async function handleCallback(cb: NonNullable<z.infer<typeof UpdateSchema>["callback_query"]>): Promise<void> {
  const data = cb.data ?? "";
  const match = /^order:(complete|noshow|cancel):(ord_[A-Za-z0-9]{16})$/.exec(data);
  if (!match) {
    await answerCallbackQuery(cb.id, "알 수 없는 명령");
    return;
  }
  const action = match[1] as "complete" | "noshow" | "cancel";
  const orderId = match[2]!;
  const next = action === "complete" ? "completed" : action === "noshow" ? "no_show" : "cancelled";

  const result = await updateOrderStatus(orderId, next, "owner");
  if (!result.ok) {
    await answerCallbackQuery(cb.id, `처리 실패: ${result.error}`);
    return;
  }

  // 메시지 업데이트 (인라인 키보드 제거 + 상태 표시)
  if (cb.message) {
    const label = next === "completed" ? "✅ 완료됨" : next === "no_show" ? "❌ 노쇼" : "🚫 취소됨";
    try {
      await editOwnerMessage(cb.message.message_id, `[${label}]\n원본 주문은 데이터베이스에 보관됩니다.\n<code>${orderId}</code>`, {
        reply_markup: orderActionKeyboard(orderId, next),
      });
    } catch (e) {
      console.error("[telegram] edit failed", e);
    }
  }

  await answerCallbackQuery(cb.id, `처리됨: ${next}`);
}

// ============================================================================
// 명령어: /중지 오늘 | /중지 내일 | /재개 | /상태
// ============================================================================

async function handleCommand(text: string): Promise<void> {
  const trimmed = text.trim();

  if (trimmed === "/시작" || trimmed === "/start") {
    await sendOwnerMessage(
      "우드진 단체주문 봇이 연결됐습니다.\n\n사용 가능 명령:\n/중지 오늘 — 오늘 영업 종료\n/중지 내일 — 내일까지 영업 중지\n/재개 — 즉시 재개\n/상태 — 현재 주문 + 일시중지 상태",
    );
    return;
  }

  if (trimmed === "/중지 오늘") {
    await pauseUntil(endOfTodayKst());
    await sendOwnerMessage("오늘 영업 종료되었습니다. 새 주문이 차단됩니다. /재개 명령으로 즉시 재개 가능합니다.");
    return;
  }

  if (trimmed === "/중지 내일") {
    await pauseUntil(endOfTomorrowKst());
    await sendOwnerMessage("내일까지 영업 중지되었습니다. /재개 명령으로 즉시 재개 가능합니다.");
    return;
  }

  if (trimmed === "/재개") {
    await pauseUntil(null);
    await sendOwnerMessage("주문 접수가 재개되었습니다.");
    return;
  }

  if (trimmed === "/상태") {
    await sendOwnerMessage(await statusSummary());
    return;
  }

  // 사장님이 임의로 보낸 메시지는 무시 (혹은 안내)
  // 대부분은 봇이 알림 메시지에 답장 형태로 무시됨
}

async function pauseUntil(iso: string | null): Promise<void> {
  // Codex #9 fix: JSONB로 명시적 null/string 직렬화. JS null을 그냥 보내면 SQL NULL이 되어
  // value JSONB NOT NULL 제약 위반. JSON.stringify로 명시.
  const valueJson = iso === null ? "null" : JSON.stringify(iso);
  const { error } = await supabase()
    .from("settings")
    .upsert({ key: "paused_until", value: JSON.parse(valueJson) }, { onConflict: "key" });
  if (error) {
    console.error("[telegram /중지] settings upsert failed", error);
    throw error; // 호출자가 에러 처리 (사장님께 실패 알림)
  }
}

async function statusSummary(): Promise<string> {
  const now = new Date();
  const dayEnd = endOfTodayKst();
  const { data: settings } = await supabase()
    .from("settings")
    .select("key, value")
    .eq("key", "paused_until")
    .maybeSingle();
  const paused = settings?.value as string | null;

  const { data: orders } = await supabase()
    .from("orders")
    .select("id, nickname, cup_count, delivery_at, status")
    .eq("status", "confirmed")
    .gte("delivery_at", now.toISOString())
    .lte("delivery_at", dayEnd)
    .order("delivery_at");

  const lines = [
    `<b>📊 현재 상태</b>`,
    paused ? `⏸ 일시중지: ${paused} 까지` : `▶️ 정상 운영`,
    "",
    `오늘 남은 confirmed 주문 ${orders?.length ?? 0}건:`,
  ];
  for (const o of orders ?? []) {
    const t = new Date(o.delivery_at as string);
    const hm = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
    lines.push(`• ${hm} ${o.nickname} ${o.cup_count}잔`);
  }
  return lines.join("\n");
}

function endOfTodayKst(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function endOfTomorrowKst(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}
