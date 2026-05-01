import figlet from "figlet";
import gradient from "gradient-string";

const ETHOS = "WOOD JEAN IN THE GREY BUILDINGS";

export function splash(): void {
  const banner = figlet.textSync("WOODJEAN", { font: "ANSI Shadow", horizontalLayout: "default" });
  const wood = gradient(["#3b2a1d", "#8b6f47", "#d4a574"]);
  console.log("");
  console.log(wood.multiline(banner));
  console.log("");
  console.log(gradient(["#d4a574", "#8b6f47"])(`  ${ETHOS}`));
  console.log("\x1b[2m  판교 우드진 — 회의용 음료 단체주문 (5~30잔)\x1b[0m");
  console.log("");
}
