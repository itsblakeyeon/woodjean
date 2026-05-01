import * as p from "@clack/prompts";
import { CONSENT_SUMMARY } from "../lib/consent-text";

export async function collectConsent(): Promise<boolean> {
  p.log.message(CONSENT_SUMMARY);
  const ok = await p.confirm({
    message: "위 내용에 모두 동의하시겠습니까?",
    initialValue: false,
  });
  if (p.isCancel(ok)) return false;
  return ok === true;
}
