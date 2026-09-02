// Testes de navegador contra o build estático. Cobre o fluxo de quem codifica:
// abrir, navegar, responder, salvar, exportar, importar planilha, trocar idioma.
//
//   bun run build && python3 -m http.server 3100 -d out
//   bun run test:e2e
//
// Usa o Chrome instalado via puppeteer-core. Falha com código 1 se algum passo quebrar.

import path from "node:path";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as XLSX from "xlsx";
import puppeteer from "puppeteer-core";
import { buildTemplateWorkbook } from "../lib/round-import.js";
import { execFileSync } from "node:child_process";

const BASE = process.env.E2E_BASE || "http://127.0.0.1:3100";
const CHROME =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const results = [];
let page;

function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${name}${detail && !ok ? `  → ${detail}` : ""}`);
}

async function expectEq(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  check(name, ok, ok ? "" : `esperado ${JSON.stringify(expected)}, veio ${JSON.stringify(actual)}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// O Chrome headless não garante o esquema de cor do sistema. Fixar deixa o
// teste determinístico e ainda permite exercitar o caminho "seguir o sistema".
async function prefer(scheme) {
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: scheme }]);
}

// Helpers de página --------------------------------------------------------

async function goto(url, { clear = false } = {}) {
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle0" });
  if (clear) {
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle0" });
  }
  await page.waitForSelector("h1");
  await sleep(400);
}

const status = () =>
  page.evaluate(() => document.querySelector('[class*="statusRow"]')?.innerText.replace(/\s+/g, " ") || "");

const h1 = () => page.evaluate(() => document.querySelector("h1")?.textContent.trim());

async function clickButton(text) {
  const handle = await page.evaluateHandle(
    (t) => [...document.querySelectorAll("button, a")].find((b) => b.textContent.trim() === t),
    text,
  );
  const el = handle.asElement();
  if (!el) throw new Error(`botão "${text}" não encontrado`);
  await el.click();
  await sleep(250);
}

async function fieldRow(header) {
  return page.evaluateHandle(
    (h) =>
      [...document.querySelectorAll('[class*="fieldRow"]')].find(
        (r) => r.querySelector('[class*="fieldKey"]')?.textContent.trim().startsWith(h),
      ),
    header,
  );
}

async function setBoolean(header, yes) {
  const row = await fieldRow(header);
  const btn = await row.evaluateHandle((r, y) => [...r.querySelectorAll("button")][y ? 1 : 0], yes);
  await btn.asElement().click();
  await sleep(150);
}

async function booleanState(header) {
  const row = await fieldRow(header);
  return row.evaluate((r) => {
    const btns = [...r.querySelectorAll("button")];
    return btns.map((b) => b.getAttribute("aria-checked"));
  });
}

// Captura do que iria para a área de transferência e para download.
async function installSpies() {
  await page.evaluateOnNewDocument(() => {
    window.__clip = null;
    window.__blob = null;
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async (t) => { window.__clip = t; } },
      configurable: true,
    });
    const orig = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (blob) => {
      blob.text().then((t) => { window.__blob = { type: blob.type, text: t }; });
      return orig(blob);
    };
    // Não abre o diálogo real de download no headless.
    HTMLAnchorElement.prototype.click = function () {};
  });
}

// Cenários -----------------------------------------------------------------

async function scenarioHome() {
  console.log("\n— Página inicial e idioma");
  await goto("/", { clear: true });
  await expectEq("abre em português", await h1(), "Codificação manual sem a planilha aberta do lado.");
  await expectEq("html lang pt-BR", await page.evaluate(() => document.documentElement.lang), "pt-BR");

  await clickButton("EN");
  await expectEq("switch troca o título", await h1(), "Manual coding, without the spreadsheet open beside you.");
  await expectEq("html lang en", await page.evaluate(() => document.documentElement.lang), "en");
  await expectEq("CTA em inglês", await page.evaluate(() => document.querySelector(".site-nav-cta .btn").textContent.trim()), "Start coding");

  await page.reload({ waitUntil: "networkidle0" });
  await sleep(400);
  await expectEq("idioma persiste no reload", await h1(), "Manual coding, without the spreadsheet open beside you.");

  await clickButton("PT");
  await expectEq("volta para português", await h1(), "Codificação manual sem a planilha aberta do lado.");

  const menu = await page.evaluate(() => [...document.querySelectorAll(".site-nav-links a")].map((a) => a.textContent.trim()));
  await expectEq("menu com Guia, Exemplo e Código", menu, ["Guia", "Exemplo", "Código"]);
}

async function scenarioGuide() {
  console.log("\n— Guia");
  await goto("/", { clear: true });
  await clickButton("Guia");
  await sleep(900);
  // No Pages o site mora em /codlab, então compara pelo fim do caminho.
  const caminho = await page.evaluate(() => location.pathname);
  check("a navegação leva ao guia", caminho.endsWith("/guia/"), caminho);

  const pagina = await page.evaluate(() => ({
    h1: document.querySelector("h1")?.textContent.trim(),
    secoes: [...document.querySelectorAll(".band[id]")].map((b) => b.id),
    titulos: [...document.querySelectorAll(".band[id] h2")].map((h) => h.textContent.trim()),
    indice: [...document.querySelectorAll(".guide-toc a")].map((a) => a.getAttribute("href")),
  }));
  await expectEq("seis seções, na ordem", pagina.secoes, [
    "files", "sheet", "doc", "coding", "reliability", "downloads",
  ]);
  await expectEq("o índice aponta para todas elas", pagina.indice, pagina.secoes.map((id) => `#${id}`));
  const conf = await page.evaluate(() => document.querySelector("#reliability").innerText);
  check("explica o alpha de Krippendorff", /Krippendorff/.test(conf) && /0,800|0\.800/.test(conf), "");
  check("explica o Brennan-Prediger", /Brennan-Prediger/.test(conf) && /po/.test(conf), "");
  check("explica por que reportar os dois", /paradoxo do kappa|kappa paradox/i.test(conf), "");

  // Âncora não pode parar embaixo da navegação fixa.
  await page.evaluate(() => document.querySelector('.guide-toc a[href="#reliability"]').click());
  await sleep(700);
  const pos = await page.evaluate(() => {
    const nav = document.querySelector(".site-nav").getBoundingClientRect();
    const alvo = document.querySelector("#reliability h2").getBoundingClientRect();
    return { navBottom: Math.round(nav.bottom), tituloTop: Math.round(alvo.top) };
  });
  check("o título da seção não fica sob a navegação fixa", pos.tituloTop > pos.navBottom, JSON.stringify(pos));

  // Downloads: o arquivo é montado no navegador, sem servidor.
  const baixados = await page.evaluate(async () => {
    const nomes = [];
    const orig = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download) nomes.push(this.download);
    };
    for (const b of [...document.querySelectorAll("#downloads button")]) {
      b.click();
      await new Promise((r) => setTimeout(r, 500));
    }
    HTMLAnchorElement.prototype.click = orig;
    return nomes;
  });
  await expectEq("os quatro exemplos baixam do próprio site", baixados.sort(), [
    "exemplo-uma-aba-por-codificador.xlsx",
    "livro-de-codigos.docx",
    "livro-de-codigos.md",
    "modelo-codlab.xlsx",
  ]);

  await clickButton("EN");
  await sleep(600);
  await expectEq("guia em inglês", await page.evaluate(() => document.querySelector("h1").textContent.trim()),
    "How to prepare the files, and how to code.");
  const confEn = await page.evaluate(() => document.querySelector("#reliability").innerText);
  check("confiabilidade traduzida", /kappa paradox/i.test(confEn) && /Brennan-Prediger/.test(confEn), "");
  await clickButton("PT");
}

async function scenarioDemoNavigation() {
  console.log("\n— Demo: navegação e estado");
  await goto("/demo/", { clear: true });
  check("abre no registro 005 já em andamento", (await status()).startsWith("Registro 005/30"), await status());
  check("17/30 revisados", (await status()).includes("17/30 revisados · 57%"), await status());

  await clickButton("Próxima");
  check("Próxima → 006", (await status()).startsWith("Registro 006/30"), await status());
  await page.keyboard.press("ArrowLeft");
  await sleep(250);
  check("seta esquerda → 005", (await status()).startsWith("Registro 005/30"), await status());
  await page.keyboard.press("ArrowRight");
  await sleep(250);
  check("seta direita → 006", (await status()).startsWith("Registro 006/30"), await status());

  // Select do navegador
  await page.select('select[aria-label="Selecionar registro"]', "17");
  await sleep(250);
  check("select vai ao registro 018", (await status()).startsWith("Registro 018/30"), await status());

  const shape = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('[class*="fieldRow"]')];
    return {
      linhas: rows.length,
      travadas: document.querySelectorAll('[class*="lockedBadge"]').length,
      semControle: rows.filter((r) => !r.querySelector("button, select, textarea, input")).length,
      herdadas: document.querySelectorAll('[class*="inheritedStrip"]').length,
    };
  });
  await expectEq("23 linhas, todas respondíveis, nenhuma travada", shape, {
    linhas: 23,
    travadas: 0,
    semControle: 0,
    herdadas: 0,
  });
}

async function scenarioDemoCoding() {
  console.log("\n— Demo: codificar, salvar, revisar");
  await goto("/demo/", { clear: true });
  await page.select('select[aria-label="Selecionar registro"]', "17"); // 018, não revisado
  await sleep(250);

  await expectEq("booleana começa em Não", await booleanState("Marco_Apelo"), ["true", "false"]);
  await setBoolean("Marco_Apelo", true);
  await expectEq("clique em Sim marca Sim", await booleanState("Marco_Apelo"), ["false", "true"]);

  const row = await fieldRow("Assunto_1");
  const sel = await row.$("select");
  await sel.select("Saúde e Bem-estar");
  await sleep(200);

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("codifica-colab:demo:v1")));
  await expectEq("rascunho salvo no localStorage", [saved.records[17].Marco_Apelo, saved.records[17].Assunto_1, saved.index], [true, "Saúde e Bem-estar", 17]);

  await page.reload({ waitUntil: "networkidle0" });
  await sleep(500);
  check("reload mantém o registro", (await status()).startsWith("Registro 018/30"), await status());
  await expectEq("reload mantém a resposta", await booleanState("Marco_Apelo"), ["false", "true"]);

  await page.keyboard.press("Enter");
  await sleep(350);
  check("Enter marca revisado e avança", (await status()).startsWith("Registro 019/30") && (await status()).includes("18/30 revisados"), await status());

  await page.keyboard.press("ArrowLeft");
  await sleep(250);
  const doneLabel = await page.evaluate(() => [...document.querySelectorAll("footer button")].pop().textContent.trim());
  await expectEq("botão mostra Revisado · avançar", doneLabel, "Revisado · avançar");
}

async function scenarioExport() {
  console.log("\n— Demo: copiar valores e exportar");
  await goto("/demo/", { clear: true });

  await clickButton("Copiar valores");
  const clip = await page.evaluate(() => window.__clip);
  const lines = clip.split("\n");
  await expectEq("TSV tem 30 linhas", lines.length, 30);
  await expectEq("toda linha tem as mesmas 23 colunas", new Set(lines.map((l) => l.split("\t").length)).size === 1 && lines[0].split("\t").length, 23);
  check("registro 005 sai com Assunto e TRUE em Marco_Numeros", lines[4].startsWith("Segurança Urbana\tGestão Municipal\tTRUE\tFALSE\tTRUE\tTRUE"), lines[4].slice(0, 80));
  const cols18 = lines[17].split("\t");
  check(
    "registro 018 (não codificado) sai vazio nas seleções e FALSE nas booleanas",
    cols18.length === 23 && cols18[0] === "" && cols18[22] === "" && cols18.filter((v) => v === "FALSE").length === 20,
    lines[17],
  );
  const hint = await page.evaluate(() => document.querySelector('[class*="pasteHint"]').innerText);
  check("dica aponta I→AE e não fala em colunas automáticas", hint.includes("I→AE") && !hint.includes("automáticas"), hint);

  await page.select('[class*="formatPicker"] select', "0/1");
  await sleep(200);
  await clickButton("Copiar valores");
  const clip01 = await page.evaluate(() => window.__clip);
  check("formato 0/1 troca TRUE por 1", clip01.split("\n")[4].includes("\t1\t0\t1\t1") && !clip01.includes("TRUE"), clip01.split("\n")[4].slice(0, 60));

  await clickButton("Copiar com cabeçalho");
  const withHeader = await page.evaluate(() => window.__clip);
  await expectEq("cabeçalho começa em Assunto_1 e termina em OBS", [withHeader.split("\n")[0].split("\t")[0], withHeader.split("\n")[0].split("\t").pop(), withHeader.split("\n").length], ["Assunto_1", "OBS", 31]);

  await clickButton("CSV");
  await sleep(400);
  const csv = await page.evaluate(() => window.__blob);
  // Blob.text() remove o BOM na decodificação; o arquivo em disco o mantém.
  check("CSV baixado com cabeçalho e 30 linhas", csv && csv.type.startsWith("text/csv") && csv.text.startsWith("Assunto_1,Assunto_2,") && csv.text.trim().split("\n").length === 31, csv?.text.slice(0, 40));

  await clickButton("Baixar backup");
  await sleep(400);
  const backup = await page.evaluate(() => window.__blob);
  const parsed = JSON.parse(backup.text);
  await expectEq("backup JSON tem 30 registros e 17 revisados", [parsed.records.length, Object.keys(parsed.reviewed).length, parsed.storageKey], [30, 17, "codifica-colab:demo:v1"]);
  check("backup só tem campos codificados", !("texto" in parsed.records[0]) && "Marco_Numeros" in parsed.records[0]);
}

async function scenarioRestore() {
  console.log("\n— Demo: restaurar");
  await goto("/demo/", { clear: true });
  page.once("dialog", (d) => d.accept());
  await clickButton("Restaurar");
  await sleep(400);
  check("Restaurar zera progresso e volta ao 001", (await status()).startsWith("Registro 001/30") && (await status()).includes("0/30 revisados"), await status());
}

async function scenarioImporter() {
  console.log("\n— Importar planilha própria");
  const dir = await mkdtemp(path.join(tmpdir(), "codlab-"));
  const file = path.join(dir, "minha rodada.xlsx");
  await writeFile(file, Buffer.from(XLSX.write(buildTemplateWorkbook(), { type: "array", bookType: "xlsx" })));

  await goto("/codificar/", { clear: true });
  const input = await page.$('input[type=file]');
  await input.uploadFile(file);
  await sleep(1200);

  await expectEq("abre com o nome do arquivo", await h1(), "minha rodada");
  check("2 unidades, começa no 001", (await status()).startsWith("Registro 001/2"), await status());
  check("dica de colagem E→H (4 colunas de item antes)", await page.evaluate(() => document.querySelector('[class*="pasteHint"]').innerText.includes("E→H")));

  const groups = await page.evaluate(() => [...document.querySelectorAll('[class*="fieldGroup"] h2')].map((h) => h.textContent));
  await expectEq("grupos do modelo", groups, ["Caracterização", "Enquadramento", "Observação"]);

  const reviewBtn = async () => page.evaluate(() => { const b = [...document.querySelectorAll("footer button")].pop(); return { text: b.textContent.trim(), disabled: b.disabled }; });
  await expectEq("obrigatória em branco trava o revisado", await reviewBtn(), { text: "1 obrigatória em branco", disabled: true });

  await page.keyboard.press("Enter");
  await sleep(250);
  check("Enter com obrigatória vazia não avança", (await status()).startsWith("Registro 001/2"), await status());

  const row = await fieldRow("Assunto");
  await (await row.$("select")).select("Saúde");
  await sleep(200);
  await expectEq("preencher obrigatória libera o botão", await reviewBtn(), { text: "Marcar revisado (Enter)", disabled: false });

  const multiRow = await fieldRow("Recursos");
  const boxes = await multiRow.$$('input[type=checkbox]');
  await boxes[0].click(); await boxes[2].click();
  await sleep(200);
  await clickButton("Copiar valores");
  const clip = await page.evaluate(() => window.__clip);
  check("multi_select sai separado por | na ordem do livro", clip.split("\n")[0].split("\t")[2] === "Números|Autoridade", clip.split("\n")[0]);

  await page.keyboard.press("Enter");
  await sleep(300);
  check("revisado avança para 002 com 1/2", (await status()).startsWith("Registro 002/2") && (await status()).includes("1/2 revisados"), await status());

  await clickButton("Trocar rodada");
  await sleep(300);
  const storedTitle = await page.evaluate(() => document.querySelector(".stored-round h3")?.textContent);
  await expectEq("rodada aparece na lista do navegador", storedTitle, "minha rodada");
  await clickButton("Continuar");
  await sleep(600);
  check("Continuar retoma no registro 002", (await status()).startsWith("Registro 002/2"), await status());

  await goto("/codificar/");
  await clickButton("Baixar modelo .xlsx");
  await sleep(400);
  const tpl = await page.evaluate(() => window.__blob);
  check("modelo .xlsx é gerado no navegador", tpl && tpl.type.includes("spreadsheet") || tpl?.type.includes("octet"), tpl?.type);
}

async function scenarioMultiSheet() {
  console.log("\n— Planilha com uma aba por codificador");
  const dir = await mkdtemp(path.join(tmpdir(), "codlab-"));
  const file = path.join(dir, "Rodada Piloto.xlsx");
  execFileSync("bun", ["scripts/make_test_workbook.mjs", file], { stdio: "pipe" });

  await goto("/codificar/", { clear: true });
  await (await page.$("input[type=file]")).uploadFile(file);
  await sleep(1400);

  const picker = await page.evaluate(() => ({
    titulo: document.querySelector("h1")?.textContent.trim(),
    abas: [...document.querySelectorAll(".sheet-row-name")].map((n) => n.textContent),
    meta: document.querySelector(".sheet-row-meta")?.textContent,
    semFicha: !document.querySelector('[class*="fieldRow"]'),
  }));
  await expectEq("oferece as 4 abas em vez de adivinhar", picker.abas, [
    "Amostra", "Amostra_Ana", "Amostra_Bruno", "Amostra_Carla",
  ]);
  check("pergunta qual aba antes de abrir", picker.semFicha && /aba/i.test(picker.titulo), picker.titulo);
  check("mostra linhas, variáveis e a coluna do material", /60 linhas · 24 variáveis · material em texto/.test(picker.meta), picker.meta);

  // Escolhe a segunda aba: a rodada aberta tem que ser a dela.
  await page.evaluate(() => {
    const linha = [...document.querySelectorAll(".sheet-row")].find((r) =>
      r.querySelector(".sheet-row-name").textContent === "Amostra_Ana",
    );
    linha.querySelector("button").click();
  });
  await sleep(1400);

  const aberta = await page.evaluate(() => ({
    titulo: document.querySelector("h1")?.textContent.trim(),
    status: document.querySelector('[class*=statusRow]')?.innerText.replace(/\s+/g, " "),
    aviso: document.querySelector(".inferred-notice")?.textContent || "",
    grupos: [...document.querySelectorAll('[class*=fieldGroup] h2')].map((h) => h.textContent),
    linhas: document.querySelectorAll('[class*="fieldRow"]').length,
    hint: document.querySelector('[class*="pasteHint"]')?.innerText,
    meta: [...document.querySelectorAll('[class*="metadata"] div')].map((d) => d.innerText.replace(/\n/g, "=")),
  }));
  await expectEq("abre a aba escolhida", aberta.titulo, "Rodada Piloto · Amostra_Ana");
  check("60 registros", aberta.status.startsWith("Registro 001/60"), aberta.status);
  await expectEq("24 variáveis, todas na ficha", aberta.linhas, 24);
  check("avisa que o livro de códigos foi deduzido", /deduzido/i.test(aberta.aviso), aberta.aviso.slice(0, 70));
  await expectEq("agrupa pelo prefixo repetido", aberta.grupos, [
    "Outras variáveis", "Tema", "Conteudo", "Desinfo", "Efeito",
  ]);
  check("bloco de colagem começa depois do material (I)", aberta.hint.includes("I→AF"), aberta.hint);

  // innerText aplica o text-transform do CSS, então o rótulo vem em maiúsculas.
  const dia = aberta.meta.find((m) => m.toLowerCase().startsWith("dia="));
  const hora = aberta.meta.find((m) => m.toLowerCase().startsWith("hora="));
  check("data do Excel vira data legível", /=\d{4}-\d{2}-\d{2}$/.test(dia || ""), dia);
  check("hora do Excel vira hora legível", /=\d{2}:\d{2}$/.test(hora || ""), hora);

  // Os valores já codificados na planilha chegam preenchidos na ficha.
  const preenchidos = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('[class*="fieldRow"]')];
    const sim = rows.filter((r) => {
      const b = [...r.querySelectorAll("button")];
      return b.length === 2 && b[1].getAttribute("aria-checked") === "true";
    }).length;
    const selects = rows.filter((r) => r.querySelector("select")?.value).length;
    return { sim, selects };
  });
  check("respostas que já estavam na planilha aparecem marcadas", preenchidos.sim + preenchidos.selects > 0, JSON.stringify(preenchidos));

  await clickButton("Copiar valores");
  const clip = await page.evaluate(() => window.__clip);
  const linhas = clip.split("\n");
  await expectEq("exporta 60 linhas × 24 colunas", [linhas.length, linhas[0].split("\t").length], [60, 24]);
}

// O documento entra junto com a planilha e vira o critério de cada variável.
async function scenarioCodebookDoc(ext) {
  console.log(`\n— Livro de códigos em .${ext}`);
  const dir = await mkdtemp(path.join(tmpdir(), "codlab-"));
  const planilha = path.join(dir, "Rodada.xlsx");
  execFileSync("bun", ["scripts/make_test_workbook.mjs", planilha], { stdio: "pipe" });
  execFileSync("bun", ["scripts/make_codebook_doc.mjs", dir], { stdio: "pipe" });
  const doc = path.join(dir, `livro-de-codigos.${ext}`);

  await goto("/codificar/", { clear: true });
  await (await page.$("input[type=file]")).uploadFile(planilha, doc);
  await sleep(ext === "pdf" ? 3200 : 1800);

  const chips = await page.evaluate(() => [...document.querySelectorAll(".file-chip")].map((c) => c.textContent));
  check("reconhece planilha e livro de códigos separadamente", chips.length === 2 && chips.some((c) => /Rodada\.xlsx/.test(c)) && chips.some((c) => /livro-de-codigos/.test(c)), chips.join(" | "));

  await page.evaluate(() => {
    const linha = [...document.querySelectorAll(".sheet-row")].find((r) => r.querySelector(".sheet-row-name").textContent === "Amostra_Ana");
    linha.querySelector("button").click();
  });
  await sleep(1600);

  const ficha = await page.evaluate(() => {
    const rowOf = (h) => [...document.querySelectorAll('[class*="fieldRow"]')].find((r) => r.querySelector('[class*="fieldKey"]')?.textContent.trim().startsWith(h));
    const ler = (h) => {
      const r = rowOf(h);
      if (!r) return null;
      const sel = r.querySelector("select");
      return {
        pergunta: r.querySelector('[class*="fieldQuestion"]')?.textContent.trim(),
        criterio: r.querySelector('[class*="fieldHelp"]')?.textContent.trim(),
        opcoes: sel ? [...sel.options].map((o) => o.textContent).filter((o) => o !== "—") : null,
        binaria: r.querySelectorAll('[class*="segmented"] button').length === 2,
      };
    };
    return { tipo: ler("Tipo_URL"), panico: ler("Efeito_Panico"), obs: ler("OBS") };
  });

  check("a pergunta do documento substitui o nome da coluna", ficha.tipo.pergunta === "Que tipo de fonte a URL aponta?", ficha.tipo.pergunta);
  check("o critério do documento aparece sob a pergunta", /Classifique pelo domínio/.test(ficha.tipo.criterio), ficha.tipo.criterio?.slice(0, 60));
  check("a pergunta não se repete no critério", !/Que tipo de fonte/.test(ficha.tipo.criterio), ficha.tipo.criterio?.slice(0, 60));
  await expectEq("as opções do documento viram a lista", ficha.tipo.opcoes, ["Mídias Sociais e Mensageria", "Veículo Jornalístico", "Outros"]);
  check('"variável binária" no documento vira Não/Sim', ficha.panico.binaria, JSON.stringify(ficha.panico));
  check("OBS continua campo aberto", ficha.obs.opcoes === null && !ficha.obs.binaria, JSON.stringify(ficha.obs));

  // Painel com o documento inteiro, inclusive o que não casou com variável.
  await clickButton("Livro de códigos");
  await sleep(500);
  const painel = await page.evaluate(() => {
    const el = document.querySelector(".codebook-panel-body");
    return { aberto: !!el, texto: el?.textContent || "" };
  });
  check("painel abre com o documento completo", painel.aberto && /LIVRO DE C/i.test(painel.texto), String(painel.aberto));
  check("guarda o que não casou com nenhuma variável", /coordena/i.test(painel.texto), painel.texto.slice(-70));
  await page.keyboard.press("Escape");
  await sleep(300);
  check("Esc fecha o painel", await page.evaluate(() => !document.querySelector(".codebook-panel")));
}

async function scenarioImporterErrors() {
  console.log("\n— Importar: erros legíveis");
  const dir = await mkdtemp(path.join(tmpdir(), "codlab-"));
  const bad = path.join(dir, "sem-variables.xlsx");
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ texto: "x" }]), "items");
  await writeFile(bad, Buffer.from(XLSX.write(wb, { type: "array", bookType: "xlsx" })));

  await goto("/codificar/", { clear: true });
  await (await page.$('input[type=file]')).uploadFile(bad);
  await sleep(800);
  const msg = await page.evaluate(() => document.querySelector('[role="alert"]')?.textContent || "");
  check("erro em português menciona a aba que falta", msg.includes('"variables"') && msg.includes("Encontrei"), msg);

  await clickButton("EN");
  await (await page.$('input[type=file]')).uploadFile(bad);
  await sleep(800);
  const msgEn = await page.evaluate(() => document.querySelector('[role="alert"]')?.textContent || "");
  check("mesmo erro traduzido em inglês", msgEn.includes('"variables"') && msgEn.includes("Found"), msgEn);
}

async function scenarioTheme() {
  console.log("\n— Tema claro e escuro");
  await goto("/", { clear: true });

  const read = () =>
    page.evaluate(() => {
      const cs = getComputedStyle(document.body);
      return {
        attr: document.documentElement.getAttribute("data-theme"),
        bg: cs.backgroundColor,
        fg: cs.color,
        saved: localStorage.getItem("codlab:theme"),
      };
    });

  const claro = await read();
  await expectEq("sem escolha, nenhum data-theme no html", claro.attr, null);
  check("segue o sistema em claro", claro.bg === "rgb(251, 251, 250)", claro.bg);

  await prefer("dark");
  await sleep(250);
  const sistemaEscuro = await read();
  await expectEq("sem escolha, segue o sistema em escuro", [sistemaEscuro.attr, sistemaEscuro.bg], [null, "rgb(13, 26, 32)"]);
  await prefer("light");
  await sleep(250);

  const botao = await page.$(".theme-switch");
  check("botão de tema existe na navegação", !!botao);
  await botao.click();
  await sleep(400);

  const escuro = await read();
  await expectEq("clique marca data-theme=dark e salva", [escuro.attr, escuro.saved], ["dark", "dark"]);
  check("escolha vence o sistema claro", escuro.bg === "rgb(13, 26, 32)", escuro.bg);
  check("texto claro sobre o escuro", escuro.fg === "rgb(227, 234, 237)", escuro.fg);

  const contraste = await page.evaluate(() => {
    const lum = (c) => {
      const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const cs = getComputedStyle(document.body);
    const a = lum(cs.color) + 0.05;
    const b = lum(cs.backgroundColor) + 0.05;
    return Math.round((Math.max(a, b) / Math.min(a, b)) * 10) / 10;
  });
  check(`contraste do corpo no escuro passa em AAA (${contraste}:1)`, contraste >= 7, String(contraste));

  await page.reload({ waitUntil: "networkidle0" });
  await sleep(400);
  const depois = await read();
  await expectEq("escolha sobrevive ao reload, sem piscar", depois.attr, "dark");

  await goto("/demo/");
  const demoEscura = await page.evaluate(() => ({
    attr: document.documentElement.getAttribute("data-theme"),
    root: getComputedStyle(document.querySelector('[class*="root"]')).backgroundColor,
    caixa: getComputedStyle(document.querySelector('[class*="textBox"]')).backgroundColor,
  }));
  await expectEq("tela de codificação também no escuro", demoEscura.attr, "dark");
  check("cartão do material sobe do fundo", demoEscura.caixa === "rgb(18, 35, 43)", demoEscura.caixa);

  await (await page.$(".theme-switch")).click();
  await sleep(300);
  const volta = await read();
  await expectEq("volta para o claro", [volta.attr, volta.saved], ["light", "light"]);
}

async function scenarioEnglishDemo() {
  console.log("\n— Demo em inglês");
  await goto("/demo/", { clear: true });
  await clickButton("EN");
  await sleep(500);
  await expectEq("título da demo em inglês", await h1(), "Framing Analysis: Vila Aurora");
  check("status em inglês", (await status()).includes("Record 005/30") && (await status()).includes("reviewed"), await status());
  const q = await page.evaluate(() => document.querySelector('[class*="fieldQuestion"]').textContent);
  await expectEq("primeira pergunta em inglês", q, "Main topic of the message");
  const meta = await page.evaluate(() => [...document.querySelectorAll('[class*="metadata"] span')].map((s) => s.textContent));
  await expectEq("metadados em inglês", meta.slice(0, 3), ["ID", "Date", "Time"]);
  const val = await (await fieldRow("Assunto_1")).evaluate((r) => r.querySelector("select").value);
  await expectEq("valor codificado traduzido", val, "Public safety");
  const keys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.includes("demo")));
  check("storage separado por idioma", keys.includes("codifica-colab:demo:en:v1"), keys.join(","));

  await clickButton("PT");
  await sleep(500);
  await expectEq("volta para a demo em português", await h1(), "Análise de Enquadramento: Vila Aurora");
}

// Execução ------------------------------------------------------------------

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    args: ["--hide-scrollbars"],
  });
  page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 160)));
  await installSpies();

  const scenarios = [
    scenarioHome,
    scenarioGuide,
    scenarioDemoNavigation,
    scenarioDemoCoding,
    scenarioExport,
    scenarioRestore,
    scenarioImporter,
    scenarioImporterErrors,
    scenarioMultiSheet,
    () => scenarioCodebookDoc("docx"),
    () => scenarioCodebookDoc("pdf"),
    () => scenarioCodebookDoc("md"),
    scenarioTheme,
    scenarioEnglishDemo,
  ];

  for (const run of scenarios) {
    try {
      await run();
    } catch (err) {
      check(`${run.name || "cenário"} (exceção)`, false, String(err.message || err).slice(0, 200));
    }
  }

  check("nenhum erro de JavaScript na página", pageErrors.length === 0, pageErrors.join(" | "));

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} verificações passaram`);
  if (failed.length) {
    console.log("Falhas:");
    failed.forEach((f) => console.log(`  ✗ ${f.name}${f.detail ? `  → ${f.detail}` : ""}`));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
