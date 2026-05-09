import { Command } from "commander";
import * as p from "@clack/prompts";
import { splash } from "./splash";
import { stepPickSlot } from "./flow/slot";
import { CATEGORY_ORDER, formatMenuPrice, stepBuildCart } from "./flow/menu";
import { stepCollectDelivery } from "./flow/delivery";
import { stepCollectCustomer } from "./flow/customer";
import { stepCollectConsent } from "./flow/consent";
import { CATEGORY_LABEL, MENU_BY_CATEGORY } from "@woodjean/shared/menu";
import {
  buildCartFromPayload,
  confirmAndSubmitFromDraft,
  confirmAndSubmitPayload,
  loadDraft,
  type SubmitStatus,
} from "./flow/confirm";
import type { OrderDraft, Step } from "./flow/draft";
import packageJson from "../package.json";

const program = new Command();

program
  .name("woodjean")
  .description("우드진 판교점 단체주문 CLI — 회의용 음료 5~30잔 예약 배달")
  .version(packageJson.version);

program
  .command("menu")
  .description("우드진 전체 메뉴 + 가격을 보여줍니다")
  .action(() => {
    splash();
    for (const category of CATEGORY_ORDER) {
      console.log(`\n  ${CATEGORY_LABEL[category]}`);
      for (const menu of MENU_BY_CATEGORY[category]) {
        console.log(`    • ${menu.name.padEnd(20)} ${formatMenuPrice(menu)}`);
      }
    }
  });

const ORDER_STEPS: Step[] = [
  stepPickSlot,
  stepBuildCart,
  stepCollectDelivery,
  stepCollectCustomer,
  stepCollectConsent,
];

program
  .command("order", { isDefault: true })
  .description("단체주문을 시작합니다")
  .action(async () => {
    splash();
    p.intro("우드진 단체주문");

    try {
      const persisted = await loadDraft();
      if (persisted) {
        const restore = await p.confirm({
          message: "지난 미제출 주문이 있습니다. 복원할까요?",
          initialValue: true,
        });
        if (p.isCancel(restore)) return p.cancel("주문이 취소되었습니다.");
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

      let draft: OrderDraft = {};
      for (const step of ORDER_STEPS) {
        const result = await step(draft);
        if (!result.ok) return p.cancel(result.reason ?? "주문이 취소되었습니다.");
        draft = result.draft;
      }

      let submitStatus = await confirmAndSubmitFromDraft(draft);
      if (submitStatus === "slot_taken") {
        submitStatus = await retryWithNewSlot(draft);
      }
      return finishSubmit(submitStatus);
    } catch (e) {
      p.cancel(`오류: ${e instanceof Error ? e.message : String(e)}`);
      process.exit(1);
    }
  });

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
    p.outro("감사합니다.");
    return;
  }
  if (status === "network_failed") {
    process.exitCode = 5;
    return;
  }
  if (status === "server_rejected") {
    process.exitCode = 6;
    return;
  }
}

program.parseAsync(process.argv).catch((e) => {
  console.error(e);
  process.exit(1);
});
