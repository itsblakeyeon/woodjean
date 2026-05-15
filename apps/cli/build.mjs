#!/usr/bin/env node
import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const cliRoot = path.dirname(fileURLToPath(import.meta.url));
const outFile = path.join(cliRoot, "dist", "cli.mjs");

await esbuild.build({
  entryPoints: [path.join(cliRoot, "src/index.ts")],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "esm",
  outfile: outFile,
  banner: {
    js: [
      "#!/usr/bin/env node",
      "import { createRequire as __wj_cr } from 'node:module';",
      "const require = __wj_cr(import.meta.url);",
    ].join("\n"),
  },
  // CJS deps가 require로 부르는 node 빌트인은 require로 처리해야 함 (banner shim)
  external: [],
  minify: true,
  treeShaking: true,
  legalComments: "none",
  // ESM banner shim — `require` / `__dirname` 같은 CJS 헬퍼가 의존성에 있으면 polyfill
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  inject: [],
});

// chmod +x for the bin
fs.chmodSync(outFile, 0o755);

// 마케팅 README는 monorepo 루트 단일 소스. publish tarball(files: ["dist","README.md"])에
// 들어가도록 빌드 시 루트 README를 apps/cli로 복사 → npm 페이지 = GitHub 첫 화면 동일.
// apps/cli/README.md는 git에 안 올림(.gitignore) — 이 복사본이 단일 진실.
const rootReadme = path.join(cliRoot, "..", "..", "README.md");
const cliReadme = path.join(cliRoot, "README.md");
fs.copyFileSync(rootReadme, cliReadme);
console.log(`✓ Synced README from ${path.relative(process.cwd(), rootReadme)}`);

const stat = fs.statSync(outFile);
const sizeKb = (stat.size / 1024).toFixed(1);
console.log(`✓ Built ${path.relative(process.cwd(), outFile)} — ${sizeKb} KB`);
