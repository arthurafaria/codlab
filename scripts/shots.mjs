// Prints do site em alta resolução, contra o build estático.
//
//   bun run build
//   python3 -m http.server 3100 -d out
//   bun scripts/shots.mjs
//
// Usa o Chrome instalado (puppeteer-core, sem baixar navegador). Roda contra o
// `out/` para não capturar o indicador de dev do Next.
// Toda tela de codificação usa a amostra demonstrativa — nenhum dado real.

import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE = process.env.SHOTS_BASE || "http://127.0.0.1:3100";
const OUT = path.resolve(process.cwd(), "docs-shots");
const CHROME =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const SCALE = 2;
const WIDTH = 1600;
const HEIGHT = 1000;

const DEMO_KEY = "codifica-colab:demo:v1";

const shots = [
  { file: "01-home.png", url: "/", caption: "Página inicial", fullPage: true },
  { file: "02-home-dobra.png", url: "/", caption: "Página inicial — primeira dobra" },
  { file: "03-codificador.png", url: "/demo/", caption: "Tela do codificador" },
  {
    file: "04-livro-de-codigos.png",
    url: "/demo/",
    caption: "Livro de códigos aplicado à unidade",
    scrollTo: "[class*=fieldGroup]",
    nth: 1,
    offset: 0,
  },
  {
    file: "05-variavel-travada.png",
    url: "/demo/",
    caption: "Variável descontinuada mantém a coluna",
    scrollTo: "[class*=fieldRowLocked]",
    nth: -1,
    offset: -340,
  },
  { file: "06-importador.png", url: "/codificar/", caption: "Carregar a própria planilha" },
];

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: SCALE },
    args: ["--hide-scrollbars", "--force-color-profile=srgb", "--font-render-hinting=none"],
  });

  try {
    for (const shot of shots) {
      const page = await browser.newPage();
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
      await page.goto(`${BASE}${shot.url}`, { waitUntil: "networkidle0" });
      // Zera o rascunho da demo para todo print sair no mesmo estado.
      await page.evaluate((key) => localStorage.removeItem(key), DEMO_KEY);
      await page.reload({ waitUntil: "networkidle0" });
      await page.waitForSelector("h1", { timeout: 15000 });
      await new Promise((r) => setTimeout(r, 900));

      if (shot.scrollTo) {
        await page.evaluate(
          (sel, nth, offset) => {
            const all = [...document.querySelectorAll(sel)];
            const el = nth < 0 ? all[all.length + nth] : all[nth || 0];
            if (el) {
              const top = el.getBoundingClientRect().top + window.scrollY + (offset || 0);
              window.scrollTo({ top, behavior: "instant" });
            }
          },
          shot.scrollTo,
          shot.nth ?? 0,
          shot.offset,
        );
        await new Promise((r) => setTimeout(r, 600));
      }

      await page.screenshot({
        path: path.join(OUT, shot.file),
        type: "png",
        fullPage: Boolean(shot.fullPage),
      });
      console.log(`✓ ${shot.file} — ${shot.caption}`);
      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`\nPrints em: ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
