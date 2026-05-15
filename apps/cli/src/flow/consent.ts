import * as p from "@clack/prompts";
import { CONSENT_SUMMARY } from "../lib/consent-text";
import { cancel, ok, type StepResult } from "./draft";
import type { OrderDraft } from "./draft";

export async function stepCollectConsent(draft: OrderDraft): Promise<StepResult> {
  const agreed = await collectConsent();
  if (!agreed) return cancel("동의하지 않아 주문이 접수되지 않았어요. 단체주문 접수·배달에는 이 동의가 필요해요.");
  return ok({ ...draft, agreed: true });
}

export async function collectConsent(): Promise<boolean> {
  p.log.message(CONSENT_SUMMARY);
  const accepted = await p.confirm({
    message: "위 내용에 모두 동의하시나요?",
    initialValue: false,
  });
  if (p.isCancel(accepted)) return false;
  return accepted === true;
}
