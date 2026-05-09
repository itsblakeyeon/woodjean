import { Command } from "commander";
import * as p from "@clack/prompts";
import { splash } from "./splash";
import { stepPickSlot } from "./flow/slot";
import { CATEGORY_ORDER, formatMenuPrice, stepBuildCart } from "./flow/menu";
import { stepCollectDelivery } from "./flow/delivery";
import { stepCollectCustomer } from "./flow/customer";
import { stepCollectConsent } from "./flow/consent";
import { runHistory } from "./flow/history";
import { runRouter } from "./flow/router";
import { CATEGORY_LABEL, MENU_BY_CATEGORY } from "@woodjean/shared/menu";
import {
  buildCartFromPayload,
  confirmAndSubmitFromDraft,
  confirmAndSubmitPayload,
  loadDraft,
  type SubmitStatus,
} from "./flow/confirm";
import { ensureDeviceId, loadState } from "./lib/state";
import type { OrderDraft, Step } from "./flow/draft";
import packageJson from "../package.json";

const program = new Command();
const EXIT_USER_CANCEL = 1;
const EXIT_NETWORK_FAILURE = 5;
const EXIT_SERVER_REJECTION = 6;

type OrderOptions = {
  yes?: boolean;
  new?: boolean;
  paste?: string | boolean;
  clipboard?: boolean;
  noSplash?: boolean;
  brand?: boolean;
  json?: boolean;
  debug?: boolean;
};

program
  .name("woodjean")
  .description("우드진 판교점 단체주문 CLI — 회의용 음료 5~30잔 예약 배달")
  .version(packageJson.version)
  .showHelpAfterError()
  .addHelpText("after", `

Examples:
  $ npx woodjean order
  $ npx woodjean order --new
  $ pbpaste | npx woodjean order --paste
  $ npx woodjean menu
  $ npx woodjean history

Environment:
  WOODJEAN_API_URL      주문 API URL override
  NO_COLOR             ANSI 색상 비활성화
  WOODJEAN_DEBUG=1     API 호출 디버그 로그 (휴대폰 마스킹)
  WOODJEAN_FAST=1      빠른 실행 모드

영업시간:
  평일 09:00~11:00, 13:30~16:30
  주말 휴무
  매장 010-8484-2120

Exit codes:
  0  success
  1  user cancellation
  2  input validation failure
  3  slot unavailable / out of business hours
  4  blacklisted phone
  5  API/network failure (retryable)
  6  server-side rejection (not retryable)
  7  config/env error
`);

program
  .command("menu")
  .description("우드진 전체 메뉴 + 가격을 보여줘요")
  .action(() => {
    splash();
    for (const category of CATEGORY_ORDER) {
      console.log(`\n  ${CATEGORY_LABEL[category]}`);
      for (const menu of MENU_BY_CATEGORY[category]) {
        console.log(`    • ${menu.name.padEnd(20)} ${formatMenuPrice(menu)}`);
      }
    }
  });

program
  .command("history")
  .description("이 디바이스의 최근 주문 이력을 보여줘요")
  .action(async () => {
    const state = await loadState();
    await handleHistory(state);
  });

const ORDER_STEPS: Step[] = [
  stepPickSlot,
  stepBuildCart,
  stepCollectDelivery,
  stepCollectCustomer,
  stepCollectConsent,
];

// KAI-167 locked copy for upcoming paste surfaces:
// LLM down: "메뉴 자동 인식이 잠시 멈췄어요. 직접 선택 모드로 넘어갈까요? (또는 --paste 다시 시도)"
// LLM rate limit: "오늘 자동 인식 사용량 한도에 도달했어요. 직접 선택 모드로 진행해 주세요."
// LLM price mismatch: "메뉴를 인식했지만 가격이 안 맞아요. 사장님 메뉴와 맞춰서 다시 확인해 주세요."

program
  .command("order", { isDefault: true })
  .description("단체주문을 시작해요")
  .option("-y, --yes", "non-interactive로 같은 주문을 재제출해요 (L1 repeat 준비)")
  .option("--new", "저장된 단골 정보를 건너뛰고 새 주문으로 시작해요")
  .option("--paste [source]", "붙여넣은 메뉴 목록을 자동 인식해요. @file.txt 또는 stdin 지원 예정")
  .option("--clipboard", "--paste와 함께 클립보드 내용을 사용해요")
  .option("--no-splash", "시작 배너를 생략해요")
  .option("--brand", "방문 횟수와 무관하게 풀 브랜드 배너를 보여줘요")
  .option("--json", "machine-readable 영수증을 출력해요")
  .option("--debug", "verbose API 호출 로그를 켜요 (휴대폰 마스킹)")
  .action(async (options: OrderOptions) => {
    if (options.debug) process.env.WOODJEAN_DEBUG = "1";

    try {
      try {
        await ensureDeviceId();
      } catch (e) {
        p.log.warn(`디바이스 ID 저장 실패: ${e instanceof Error ? e.message : String(e)}`);
      }
      const state = await loadState();
      if (!options.noSplash) {
        splash({
          visitCount: state?.visitCount,
          nickname: state?.lastOrder?.nickname,
          forceBrand: options.brand,
        });
      }
      p.intro("우드진 단체주문");
      warnForPinnedPlaceholders(options);

      const persisted = await loadDraft();
      if (persisted) {
        const restore = await p.confirm({
          message: "지난 미제출 주문이 있어요. 복원할까요?",
          initialValue: true,
        });
        if (p.isCancel(restore)) return cancelOrder("주문이 취소됐어요.");
        if (restore) {
          const submitStatus = await confirmAndSubmitPayload(persisted.payload, persisted.savedAt);
          if (submitStatus !== "slot_taken") return finishSubmit(submitStatus);

          const recovered: OrderDraft = {
            cart: buildCartFromPayload(persisted.payload),
            delivery: persisted.payload.deliveryAddress,
            customer: {
              nickname: persisted.payload.nickname,
              phone: persisted.payload.phone,
              memo: persisted.payload.memo ?? undefined,
            },
            agreed: true,
          };
          return finishSubmit(await retryWithNewSlot(recovered));
        }
      }

      if (!options.new) {
        const router = await runRouter(state);
        if (router.action === "cancelled") return cancelOrder(router.reason ?? "주문이 취소됐어요.");
        if (router.action === "history") {
          return handleHistory(state);
        }
        if (router.action === "repeat") {
          return submitRepeatDraft(router.draft);
        }
        return runManualOrder(router.draft);
      }

      return runManualOrder({});
    } catch (e) {
      p.cancel(`오류: ${e instanceof Error ? e.message : String(e)}`);
      process.exitCode = EXIT_NETWORK_FAILURE;
    }
  });

async function runManualOrder(initialDraft: OrderDraft): Promise<void> {
  let draft: OrderDraft = initialDraft;
  for (const step of ORDER_STEPS) {
    const result = await step(draft);
    if (!result.ok) return cancelOrder(result.reason ?? "주문이 취소됐어요.");
    draft = result.draft;
  }

  let submitStatus = await confirmAndSubmitFromDraft(draft);
  if (submitStatus === "slot_taken") {
    submitStatus = await retryWithNewSlot(draft);
  }
  return finishSubmit(submitStatus);
}

async function handleHistory(state: Awaited<ReturnType<typeof loadState>>): Promise<void> {
  const history = await runHistory(state);
  if (history.action === "cancelled") return cancelOrder(history.reason ?? "주문이 취소됐어요.");
  if (history.action === "repeat") return submitRepeatDraft(history.draft);
}

async function submitRepeatDraft(draft: OrderDraft): Promise<void> {
  const slotResult = await stepPickSlot(draft);
  if (!slotResult.ok) return cancelOrder(slotResult.reason ?? "주문이 취소됐어요.");
  let submitStatus = await confirmAndSubmitFromDraft(slotResult.draft);
  if (submitStatus === "slot_taken") {
    submitStatus = await retryWithNewSlot(slotResult.draft);
  }
  return finishSubmit(submitStatus);
}

function warnForPinnedPlaceholders(options: OrderOptions): void {
  if (options.yes) p.log.warn("--yes는 L1 repeat 구현 후 자동 재제출로 연결돼요. 지금은 수동 확인으로 진행해요.");
  if (options.paste || options.clipboard) p.log.warn("--paste는 L2 paste 구현 후 자동 인식으로 연결돼요. 지금은 직접 선택으로 진행해요.");
  if (options.json) p.log.warn("--json은 영수증 출력 구현 후 machine-readable 출력으로 연결돼요. 지금은 기본 출력으로 진행해요.");
}

function cancelOrder(message: string): void {
  p.cancel(message);
  process.exitCode ??= EXIT_USER_CANCEL;
}

async function retryWithNewSlot(draft: OrderDraft): Promise<SubmitStatus> {
  while (true) {
    const result = await stepPickSlot({ ...draft, slot: undefined });
    if (!result.ok) return "cancelled";
    const submitStatus = await confirmAndSubmitFromDraft(result.draft);
    if (submitStatus !== "slot_taken") return submitStatus;
  }
}

async function finishSubmit(status: SubmitStatus): Promise<void> {
  if (status === "submitted") {
    p.outro("감사해요.");
    return;
  }
  if (status === "network_failed") {
    process.exitCode = EXIT_NETWORK_FAILURE;
    return;
  }
  if (status === "server_rejected") {
    process.exitCode = EXIT_SERVER_REJECTION;
    return;
  }
  if (status === "cancelled") {
    process.exitCode = EXIT_USER_CANCEL;
    return;
  }
}

program.parseAsync(process.argv).catch((e) => {
  console.error(e);
  process.exitCode = EXIT_NETWORK_FAILURE;
});
