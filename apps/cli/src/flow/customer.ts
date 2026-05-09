import * as p from "@clack/prompts";
import { checkPhone } from "../lib/api";
import { cancel, ok, type StepResult } from "./draft";
import type { OrderDraft } from "./draft";
import type { LastOrder } from "../lib/state";

export type Customer = {
  nickname: string;
  phone: string;
  memo?: string;
};

export async function stepCollectCustomer(draft: OrderDraft): Promise<StepResult> {
  const customer = await collectCustomer(draft.previousLastOrder);
  if (!customer) return cancel();
  return ok({ ...draft, customer });
}

export async function collectCustomer(previousLastOrder?: LastOrder): Promise<Customer | null> {
  const nickname = await p.text({
    message: "닉네임 (사장님이 영수증/메시지에 사용)",
    initialValue: previousLastOrder?.nickname,
    validate: (v) => {
      if (!v || v.trim().length === 0) return "닉네임이 필요해요. 사장님이 영수증·SMS에 사용해요.";
      if (v.length > 20) return `닉네임은 20자까지 가능해요 (현재 ${v.length}자).`;
      return undefined;
    },
  });
  if (p.isCancel(nickname)) return null;

  const phone = await p.text({
    message: "휴대폰 번호 (- 없이 11자리)",
    placeholder: "01012345678",
    initialValue: previousLastOrder?.phone,
    validate: (v) => {
      const cleaned = v.replace(/\D/g, "");
      if (cleaned.length === 0) return "휴대폰 번호가 필요해요. 예: 01012345678";
      if (!cleaned.startsWith("010") && !cleaned.startsWith("011")) return "010 또는 011로 시작하는 휴대폰 번호를 입력해 주세요.";
      if (cleaned.length < 10) return `휴대폰 번호 자릿수가 부족해요 (현재 ${cleaned.length}자리).`;
      if (cleaned.length > 11) return `휴대폰 번호 자릿수가 너무 많아요 (현재 ${cleaned.length}자리).`;
      if (!/^01\d{8,9}$/.test(cleaned)) return "숫자만 남기면 10~11자리 휴대폰 번호여야 해요.";
      return undefined;
    },
  });
  if (p.isCancel(phone)) return null;
  const cleanedPhone = phone.replace(/\D/g, "");

  const s = p.spinner();
  let spinnerStopped = false;
  s.start("휴대폰 주문 가능 여부 확인 중");
  try {
    const preflight = await checkPhone(cleanedPhone);
    if (preflight.ok && preflight.blacklisted) {
      s.stop("확인 완료");
      spinnerStopped = true;
      p.log.error("이 번호로는 주문 접수가 어려워요. 사장님(010-8484-2120)으로 직접 연락 부탁드립니다.");
      process.exitCode = 4;
      return null;
    }
    if (!preflight.ok && preflight.error !== "rate_limited") {
      p.log.warn("휴대폰 사전 확인을 완료하지 못했어요. 주문 제출 단계에서 다시 확인할게요.");
    }
  } catch {
    p.log.warn("휴대폰 사전 확인을 완료하지 못했어요. 주문 제출 단계에서 다시 확인할게요.");
  } finally {
    if (!spinnerStopped) s.stop("확인 완료");
  }

  const memo = await p.text({
    message: "추가 메모 (200자) — 선택",
    placeholder: "예: 알레르기, 도착 안내 등",
    validate: (v) => (v.length > 200 ? `메모는 200자까지 가능해요 (현재 ${v.length}자).` : undefined),
  });
  if (p.isCancel(memo)) return null;

  p.log.warn("⚠️  발송된 SMS는 회신이 안 돼요. 변경/취소는 매장(010-8484-2120)으로 연락해 주세요.");

  return {
    nickname: nickname.trim(),
    phone: cleanedPhone,
    memo: memo.trim() || undefined,
  };
}
