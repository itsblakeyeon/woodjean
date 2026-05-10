import * as p from "@clack/prompts";
import { splash } from "./splash";
import { formatSummaryBox } from "./flow/confirm";

function section(title: string): void {
  console.log("");
  console.log(`\x1b[2m── ${title} ─────────────────────────────────\x1b[0m`);
  console.log("");
}

async function main(): Promise<void> {
  section("1. Splash — figlet ANSI Shadow + gradient (#5a3f29 → #d4a574)");
  splash({ forceBrand: true });

  section("2. Splash compact — 단골 모드 (visitCount ≥ 3)");
  splash({ visitCount: 5, nickname: "blake" });

  section("3. Summary box — confirm.ts와 동일한 helper (한국어 wide char padding)");
  p.log.message(
    formatSummaryBox([
      "🕒 도착: 5/12(월) 14:00 ~ 15:00",
      "📦 잔수: 8잔  💰 32,000원 (현장 후불)",
      "👤 blake · 010-XXXX-1234",
      "📍 유스페이스2 A동 902호 / blake",
      "",
      "  • 아메리카노 R·아이스 ×3 — 11,700원",
      "  • 카페라떼 L·핫 [샷+] ×2 — 10,800원",
      "  • 바닐라라떼 R·아이스 ×3 — 9,500원",
      "",
      "📝 회의 시작 5분 전 도착 부탁드려요",
    ]),
  );

  section("4. Emoji 폭 — 코드에서 실제 사용되는 글리프 한 줄");
  console.log("  🧊  ♨️  ➕  🛒  ✅  ❌  🕒  📦  💰  👤  📍  📝");
  console.log("  ↑ 각 emoji 사이 간격이 균일하게 보여야 정상 (변동 = 폰트/터미널 폭 보정 실패)");

  section("5. dim 가시성 — \\x1b[2m");
  console.log("\x1b[2m  이 줄이 흐릿하게 보여야 정상입니다 (\\x1b[2m).\x1b[0m");
  console.log("  바로 위 줄과 명도 차이가 거의 없으면 dim 미지원입니다.");

  console.log("");
  p.outro("docs/qa/kai-173-matrix.md에 결과를 기록해 주세요.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
