import { Command } from "commander";
import * as p from "@clack/prompts";
import { splash } from "./splash";
import { pickSlot } from "./flow/slot";
import { buildCart } from "./flow/menu";
import { collectDelivery } from "./flow/delivery";
import { collectCustomer } from "./flow/customer";
import { collectConsent } from "./flow/consent";
import {
  buildCartFromPayload,
  confirmAndSubmit,
  confirmAndSubmitPayload,
  loadDraft,
  type SubmitStatus,
} from "./flow/confirm";
import packageJson from "../package.json";

const program = new Command();

program
  .name("woodjean")
  .description("우드진 판교점 단체주문 CLI — 회의용 음료 5~30잔 예약 배달")
  .version(packageJson.version);

program
  .command("order", { isDefault: true })
  .description("단체주문을 시작합니다")
  .action(async () => {
    splash();
    p.intro("우드진 단체주문");

    try {
      const draft = await loadDraft();
      if (draft) {
        const restore = await p.confirm({
          message: "지난 미제출 주문이 있습니다. 복원할까요?",
          initialValue: true,
        });
        if (p.isCancel(restore)) return p.cancel("주문이 취소되었습니다.");
        if (restore) {
          const submitStatus = await confirmAndSubmitPayload(draft.payload, draft.savedAt);
          if (submitStatus !== "slot_taken") return finishSubmit(submitStatus);

          const restoredCart = buildCartFromPayload(draft.payload);
          const restoredDelivery = draft.payload.deliveryAddress;
          const restoredCustomer = {
            nickname: draft.payload.nickname,
            phone: draft.payload.phone,
            memo: draft.payload.memo ?? undefined,
          };
          const restoredStatus = await retryWithNewSlot(restoredCart, restoredDelivery, restoredCustomer);
          return finishSubmit(restoredStatus);
        }
      }

      const slot = await pickSlot();
      if (!slot) return p.cancel("주문이 취소되었습니다.");

      const cart = await buildCart();
      if (!cart || cart.length === 0) return p.cancel("주문이 취소되었습니다.");

      const delivery = await collectDelivery();
      if (!delivery) return p.cancel("주문이 취소되었습니다.");

      const customer = await collectCustomer();
      if (!customer) return p.cancel("주문이 취소되었습니다.");

      const agreed = await collectConsent();
      if (!agreed) return p.cancel("동의 거부 — 주문이 접수되지 않았습니다.");

      let submitStatus = await confirmAndSubmit({ deliveryAt: slot.deliveryAt, cart, delivery, customer });
      if (submitStatus === "slot_taken") {
        submitStatus = await retryWithNewSlot(cart, delivery, customer);
      }
      return finishSubmit(submitStatus);
    } catch (e) {
      p.cancel(`오류: ${e instanceof Error ? e.message : String(e)}`);
      process.exit(1);
    }
  });

async function retryWithNewSlot(
  cart: Parameters<typeof confirmAndSubmit>[0]["cart"],
  delivery: Parameters<typeof confirmAndSubmit>[0]["delivery"],
  customer: Parameters<typeof confirmAndSubmit>[0]["customer"],
): Promise<SubmitStatus> {
  while (true) {
    const slot = await pickSlot();
    if (!slot) return "cancelled";
    const submitStatus = await confirmAndSubmit({ deliveryAt: slot.deliveryAt, cart, delivery, customer });
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
