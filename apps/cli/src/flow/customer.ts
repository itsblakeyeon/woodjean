import * as p from "@clack/prompts";

export type Customer = {
  nickname: string;
  phone: string;
  memo?: string;
};

export async function collectCustomer(): Promise<Customer | null> {
  const nickname = await p.text({
    message: "닉네임 (사장님이 영수증/메시지에 사용)",
    validate: (v) => {
      if (!v || v.trim().length === 0) return "닉네임을 입력해 주세요.";
      if (v.length > 20) return "20자 이내로 입력해 주세요.";
      return undefined;
    },
  });
  if (p.isCancel(nickname)) return null;

  const phone = await p.text({
    message: "휴대폰 번호 (- 없이 11자리)",
    placeholder: "01012345678",
    validate: (v) => {
      const cleaned = v.replace(/\D/g, "");
      if (!/^01\d{8,9}$/.test(cleaned)) return "올바른 휴대폰 번호를 입력해 주세요.";
      return undefined;
    },
  });
  if (p.isCancel(phone)) return null;

  const memo = await p.text({
    message: "추가 메모 (200자) — 선택",
    placeholder: "예: 알레르기, 도착 안내 등",
    validate: (v) => (v.length > 200 ? "200자 이내로 입력해 주세요." : undefined),
  });
  if (p.isCancel(memo)) return null;

  p.log.warn("⚠️  발송된 SMS는 회신 불가입니다. 변경/취소는 매장(010-8484-2120)으로 연락 주세요.");

  return {
    nickname: nickname.trim(),
    phone: phone.replace(/\D/g, ""),
    memo: memo.trim() || undefined,
  };
}
