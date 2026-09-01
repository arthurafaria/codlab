// Converte o CSV do projeto Desinfo em src/data/texts.js.
//
// Uso:
//   bun run generate:texts                          (usa data/code_desinfo_sample.csv)
//   bun run generate:texts "caminho/para/arquivo.csv"
//
// Layout do CSV (colunas por posição):
//   0 ID · 1 dia · 2 hora · 3 grupo · 4 telefone · 5 emoji_cod · 6 emoji_nome
//   7 Link · 8 Outlet · 9 texto(J) · 10..37 = variáveis codificáveis (K..AL)
//
// A codificação é feita sobre `texto` (coluna J). O bloco K..AL é o que o app
// gera no "Copiar valores". Binário default = Não/0 (só gravamos os TRUE).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { editableFields } from "../src/data/codebook-desinfo.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const outFile = path.resolve(root, "src/data/texts.js");
const csvPath = path.resolve(process.argv[2] || path.join(root, "data/code_desinfo_sample.csv"));

const CODED_START = 10; // coluna K (0-indexed)

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const raw = fs.readFileSync(csvPath, "utf8").replace(/^﻿/, "");
const table = parseCsv(raw).filter((r) => r.some((c) => c.trim() !== ""));
const dataRows = table.slice(1);

const records = dataRows.map((cells, index) => {
  const get = (i) => (cells[i] ?? "").trim();
  const record = {
    id: index + 1,
    ID: get(0),
    dia: get(1),
    hora: get(2),
    grupo: get(3),
    telefone: get(4),
    Outlet: get(8),
    Link: get(7),
    texto: (cells[9] ?? "").trim(),
  };
  editableFields.forEach((field, i) => {
    const value = get(CODED_START + i);
    if (field.type === "boolean") {
      if (value.toUpperCase() === "TRUE" || value === "1") record[field.key] = true;
    } else if (value !== "") {
      record[field.key] = value;
    }
  });
  return record;
});

const file = `// GERADO por scripts/generate_texts.mjs a partir de ${path.basename(csvPath)}.
// Não edite à mão — rode \`bun run generate:texts\` para atualizar.
// Codificação sobre \`texto\` (coluna J). Binários omitidos = Não/0 (default).

export const project = {
  eyebrow: "Sample Arthur",
  title: "Codificação Desinfo",
  storageKey: "desinfo-coder:arthur:v1",
};

export const records = ${JSON.stringify(records, null, 2)};
`;

fs.writeFileSync(outFile, file);
console.log(`OK · ${records.length} registros gravados em ${path.relative(process.cwd(), outFile)}`);
