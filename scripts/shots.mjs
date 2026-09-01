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

const shots = [
  // Português
  { file: "pt/01-inicial.png", url: "/", lang: "pt", caption: "Página inicial (completa)", fullPage: true },
  { file: "pt/02-inicial-dobra.png", url: "/", lang: "pt", caption: "Página inicial, primeira dobra" },
  { file: "pt/03-codificacao.png", url: "/demo/", lang: "pt", caption: "Tela de codificação" },
  {
    file: "pt/04-livro-de-codigos.png",
    url: "/demo/",
    lang: "pt",
    caption: "Livro de códigos aplicado à unidade",
    scrollTo: "[class*=fieldGroup]",
    nth: 1,
    offset: 0,
  },
  { file: "pt/05-importar.png", url: "/codificar/", lang: "pt", caption: "Carregar a própria planilha" },
  // Tema escuro
  { file: "pt/06-escuro-inicial.png", url: "/", lang: "pt", theme: "dark", caption: "Página inicial no escuro" },
  { file: "pt/07-escuro-codificacao.png", url: "/demo/", lang: "pt", theme: "dark", caption: "Tela de codificação no escuro" },
  // English
  { file: "en/01-home.png", url: "/", lang: "en", caption: "Home (full page)", fullPage: true },
  { file: "en/02-home-fold.png", url: "/", lang: "en", caption: "Home, first fold" },
  { file: "en/03-coding.png", url: "/demo/", lang: "en", caption: "Coding screen" },
  {
    file: "en/04-codebook.png",
    url: "/demo/",
    lang: "en",
    caption: "Codebook applied to the unit",
    scrollTo: "[class*=fieldGroup]",
    nth: 1,
    offset: 0,
  },
  { file: "en/05-import.png", url: "/codificar/", lang: "en", caption: "Load your own spreadsheet" },
  { file: "en/06-dark-coding.png", url: "/demo/", lang: "en", theme: "dark", caption: "Coding screen, dark" },
];

const DEMO_KEYS = ["codifica-colab:demo:v1", "codifica-colab:demo:en:v1"];

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
      await page.emulateMediaFeatures([
        { name: "prefers-color-scheme", value: shot.theme === "dark" ? "dark" : "light" },
      ]);
      // Idioma, tema e rascunho fixos: todo print sai no mesmo estado.
      await page.evaluateOnNewDocument(
        (lang, theme, keys) => {
          localStorage.setItem("codlab:lang", lang);
          localStorage.setItem("codlab:theme", theme);
          keys.forEach((k) => localStorage.removeItem(k));
        },
        shot.lang,
        shot.theme || "light",
        DEMO_KEYS,
      );
      await page.goto(`${BASE}${shot.url}`, { waitUntil: "networkidle0" });
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

      await mkdir(path.dirname(path.join(OUT, shot.file)), { recursive: true });
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
