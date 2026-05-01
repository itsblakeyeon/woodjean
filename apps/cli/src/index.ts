import { Command } from "commander";
import * as p from "@clack/prompts";
import { splash } from "./splash";
import { pickSlot } from "./flow/slot";
import { buildCart } from "./flow/menu";
import { collectDelivery } from "./flow/delivery";
import { collectCustomer } from "./flow/customer";
import { collectConsent } from "./flow/consent";
import { confirmAndSubmit } from "./flow/confirm";

const program = new Command();

program
  .name("woodjean")
  .description("우드진 판교점 단체주문 CLI — 회의용 음료 5~30잔 예약 배달")
  .version("1.0.0");

program
  .command("order", { isDefault: true })
  .description("단체주문을 시작합니다")
  .action(async () => {
    splash();
    p.intro("우드진 단체주문");

    try {
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

      await confirmAndSubmit({
        deliveryAt: slot.deliveryAt,
        cart,
        delivery,
        customer,
      });

      p.outro("감사합니다.");
    } catch (e) {
      p.cancel(`오류: ${e instanceof Error ? e.message : String(e)}`);
      process.exit(1);
    }
  });

program.parseAsync(process.argv).catch((e) => {
  console.error(e);
  process.exit(1);
});
