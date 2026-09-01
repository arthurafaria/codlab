// Teste ponta-a-ponta do "Copiar valores" → colar na planilha.
// 1. Preenche uma codificação de exemplo em alguns registros.
// 2. Gera o bloco TSV igual ao botão "Copiar valores" (formato 0/1).
// 3. Simula Ctrl+V na célula K2 de uma cópia da aba Sample_Arthur.
// 4. Salva data/Code_Desinfo_TESTE.xlsx e reabre para conferir célula a célula.
//
// Uso: bun run scripts/verify_paste.mjs

import * as XLSX from "xlsx";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { records as sourceRecords } from "../src/data/texts.js";
import { editableFields, binaryFormats } from "../src/data/codebook-desinfo.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcXlsx = path.join(root, "data/code_desinfo.xlsx");
const outXlsx = path.join(root, "data/Code_Desinfo_TESTE.xlsx");
const SHEET = "Sample_Arthur";
const CODED_BLOCK_START = 10; // K (0-indexed)
// A colagem começa na 1ª coluna não-automática/não-herdada (pula K..N).
const firstCodeIndex = editableFields.findIndex((f) => !f.locked && !f.inherited);
const pasteFields = editableFields.slice(firstCodeIndex);
const PASTE_COL = CODED_BLOCK_START + firstCodeIndex; // O (0-indexed 14)
const HEADER_ROWS = 1; // linha 1 = cabeçalho; dados começam na linha 2

// --- 1. codificação de exemplo (o que um humano marcaria) ---
const records = sourceRecords.map((r) => ({ ...r }));
Object.assign(records[1], {
  Tema_1: "Economia",
  Tema_2: "Política ou Eleições",
  Conteudo_Eleitoral: true,
  Desinfo_Emocional: true,
  Desinfo_Maniqueismo: true,
  Efeito_Opiniao: true,
  OBS: "teste ✅🤡 emoji preservado",
});
Object.assign(records[6], {
  Desinfo_Conspiracao: true,
  Desinfo_ForaContexto: true,
  Efeito_ConfiancaInstituicoes: true,
  Efeito_Panico: true,
});

// --- 2. bloco TSV igual ao app (binário FALSE/TRUE, casa com checkboxes) ---
const fmt = binaryFormats["FALSE/TRUE"];
const serialize = (record, field) =>
  field.type === "boolean"
    ? record[field.key] === true
      ? fmt.yes
      : fmt.no
    : String(record[field.key] ?? "").replace(/[\t\r\n]+/g, " ").trim();
const tsv = records.map((r) => pasteFields.map((f) => serialize(r, f)).join("\t")).join("\n");

// --- 3. simular Ctrl+V na 1ª coluna codificável (O) ---
const grid = tsv.split("\n").map((line) => line.split("\t"));
const wb = XLSX.readFile(srcXlsx);
const ws = wb.Sheets[SHEET];
// guarda valores originais das colunas automáticas K/L/M para provar que NÃO são tocadas
const origK2 = ws.K2 ? ws.K2.v : undefined;
const origL2 = ws.L2 ? ws.L2.v : undefined;
const origM2 = ws.M2 ? ws.M2.v : undefined;
grid.forEach((cols, i) => {
  cols.forEach((value, j) => {
    const addr = XLSX.utils.encode_cell({ r: HEADER_ROWS + i, c: PASTE_COL + j });
    // Google Sheets: colar TRUE/FALSE numa célula-checkbox vira booleano.
    if (value === "TRUE" || value === "FALSE") {
      ws[addr] = { t: "b", v: value === "TRUE" };
    } else {
      ws[addr] = { t: "s", v: value };
    }
  });
});
XLSX.writeFile(wb, outXlsx);

// --- 4. reabrir e conferir ---
const check = XLSX.readFile(outXlsx);
const cs = check.Sheets[SHEET];
const cell = (a) => (cs[a] ? cs[a].v : undefined);
const colAbs = (name) => CODED_BLOCK_START + editableFields.findIndex((f) => f.header === name || f.key === name);
const addrFor = (recIndex, fieldName) =>
  XLSX.utils.encode_cell({ r: HEADER_ROWS + recIndex, c: colAbs(fieldName) });

const cases = [
  // registro 2 (index 1) — checkboxes viram booleano TRUE/FALSE
  ["reg2 Tema Principal (O3)", addrFor(1, "Tema Principal"), "Economia"],
  ["reg2 Conteudo_Eleitoral (Q3)", addrFor(1, "Conteudo_Eleitoral"), true],
  ["reg2 Desinfo_Emocional (V3)", addrFor(1, "Desinfo_Emocional"), true],
  ["reg2 SelecaoEvidencias travada=FALSE (X3)", addrFor(1, "Desinfo_SelecaoEvidencias"), false],
  ["reg2 Efeito_Opiniao (AI3)", addrFor(1, "Efeito_Opiniao"), true],
  ["reg2 OBS emoji (AL3)", addrFor(1, "OBS"), "teste ✅🤡 emoji preservado"],
  // colunas automáticas NÃO tocadas pela colagem (mantêm o original)
  ["reg1 Emoji (K2) intacto", "K2", origK2],
  ["reg1 Posicao (L2) intacto", "L2", origL2],
  ["reg1 Tipo_URL (M2) intacto", "M2", origM2],
  // registro 7 (index 6)
  ["reg7 Desinfo_Conspiracao (AD8)", addrFor(6, "Desinfo_Conspiracao"), true],
  // registro default (index 20) — tudo FALSE
  ["reg21 Efeito_Radicalismo=FALSE (AK22)", addrFor(20, "Efeito_Radicalismo"), false],
];

let pass = 0;
const startLetter = XLSX.utils.encode_col(PASTE_COL);
console.log(`Aba: ${SHEET} | colar na coluna ${startLetter} | bloco: ${grid.length} linhas × ${grid[0].length} colunas\n`);
for (const [label, addr, expected] of cases) {
  const got = cell(addr);
  const ok = String(got) === String(expected);
  if (ok) pass += 1;
  console.log(`${ok ? "✅" : "❌"}  ${label.padEnd(38)} ${addr.padEnd(5)} → ${JSON.stringify(got)}  (esperado ${JSON.stringify(expected)})`);
}
const lastCol = XLSX.utils.encode_col(PASTE_COL + pasteFields.length - 1);
console.log(`\nBloco vai de ${startLetter} até ${lastCol} (esperado O→AL) ${startLetter === "O" && lastCol === "AL" ? "✅" : "❌"}`);
console.log(`\n${pass}/${cases.length} conferências OK · arquivo: ${path.relative(process.cwd(), outXlsx)}`);
