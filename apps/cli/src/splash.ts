import figlet from "figlet";
import ansiShadowFont from "figlet/fonts/ANSI Shadow";
import gradient from "gradient-string";

figlet.parseFont("ANSI Shadow", ansiShadowFont);

const ETHOS = "WOOD JEAN IN THE GREY BUILDINGS";

type SplashOptions = {
  visitCount?: number;
  nickname?: string;
  forceBrand?: boolean;
};

export function splash(options: SplashOptions = {}): void {
  const colorEnabled = !process.env.NO_COLOR;
  if (process.env.WOODJEAN_FAST === "1") {
    printCompact(options.nickname, colorEnabled);
    return;
  }

  if (!options.forceBrand && (options.visitCount ?? 0) >= 3) {
    printCompact(options.nickname, colorEnabled);
    return;
  }

  const banner = figlet.textSync("WOODJEAN", { font: "ANSI Shadow", horizontalLayout: "default" });
  const wood = gradient(["#5a3f29", "#8b6f47", "#d4a574"]);
  console.log("");
  console.log(colorEnabled ? wood.multiline(banner) : banner);
  console.log("");
  console.log(colorEnabled ? gradient(["#d4a574", "#8b6f47"])(`  ${ETHOS}`) : `  ${ETHOS}`);
  console.log(colorEnabled ? "\x1b[2m  판교 우드진 — 회의용 음료 단체주문 (5~30잔)\x1b[0m" : "  판교 우드진 — 회의용 음료 단체주문 (5~30잔)");
  console.log("");
}

function printCompact(nickname: string | undefined, colorEnabled: boolean): void {
  const line = nickname ? `WOODJEAN · ${nickname}, 다시 오셨네요` : "WOODJEAN";
  console.log("");
  console.log(colorEnabled ? gradient(["#d4a574", "#8b6f47"])(`  ${line}`) : `  ${line}`);
  console.log("");
}
