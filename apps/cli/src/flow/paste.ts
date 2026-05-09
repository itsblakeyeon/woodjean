import * as p from "@clack/prompts";
import { loadState, markPasteConsented } from "../lib/state";

export async function ensurePasteConsent(): Promise<boolean> {
  const state = await loadState();
  if (state?.pasteConsentedAt) return true;

  p.log.message([
    "[L2 paste 모드 안내]",
    "붙여넣은 내용이 AI(Anthropic)로 전송되어 메뉴와 매칭돼요.",
    "- 원문 텍스트는 매칭 후 즉시 삭제돼요 (서버 저장 X)",
    "- 매칭 실패 시 직접 선택 모드로 자동 전환돼요",
  ].join("\n"));

  const accepted = await p.confirm({
    message: "계속하시겠어요?",
    initialValue: true,
  });
  if (p.isCancel(accepted) || !accepted) return false;
  await markPasteConsented();
  return true;
}
