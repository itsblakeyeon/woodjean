import * as p from "@clack/prompts";
import { cancel, ok, type StepResult } from "./draft";
import type { OrderDraft } from "./draft";

export type Customer = {
  nickname: string;
  phone: string;
  memo?: string;
};

export async function stepCollectCustomer(draft: OrderDraft): Promise<StepResult> {
  const customer = await collectCustomer();
  if (!customer) return cancel();
  return ok({ ...draft, customer });
}

export async function collectCustomer(): Promise<Customer | null> {
  const nickname = await p.text({
    message: "닉네임 (사장님이 영수증/메시지에 사용)",
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

  const memo = await p.text({
    message: "추가 메모 (200자) — 선택",
    placeholder: "예: 알레르기, 도착 안내 등",
    validate: (v) => (v.length > 200 ? `메모는 200자까지 가능해요 (현재 ${v.length}자).` : undefined),
  });
  if (p.isCancel(memo)) return null;

  p.log.warn("⚠️  발송된 SMS는 회신이 안 돼요. 변경/취소는 매장(010-8484-2120)으로 연락해 주세요.");

  return {
    nickname: nickname.trim(),
    phone: phone.replace(/\D/g, ""),
    memo: memo.trim() || undefined,
  };
}
