// Leitura de rodada no navegador. Nenhum byte sai da máquina: o arquivo é lido
// com FileReader, convertido aqui e guardado no localStorage.
//
// Dois formatos são aceitos:
//
// 1. Declarado — abas `variables` e `items`. É o modelo que a ferramenta gera e
//    o único que carrega pergunta, critério, obrigatoriedade e trava.
//
// 2. Deduzido — uma planilha de codificação comum, sem aba de variáveis. A
//    coluna do material (texto, mensagem, prompt…) parte a aba em duas: o que
//    vem antes é metadado de leitura, o que vem depois são as variáveis. O tipo
//    de cada uma sai dos valores já presentes na coluna. É o caso de planilhas
//    com uma aba por codificador.
//
// Tipos: boolean, single_select, multi_select, text, number.
// Opções de seleção separadas por "|".

import * as XLSX from "xlsx";
import { strings, fmt } from "./strings";
import { BINARY_FORMATS, DEFAULT_BINARY_FORMAT } from "./coding";
import { parseCodebookDoc, applyCodebookDoc } from "./codebook-doc";

export const SHEET_VARIABLES = "variables";
export const SHEET_ITEMS = "items";

// Nomes que costumam carregar o material a ser codificado, em ordem de preferência.
const TEXT_COLUMN_HINTS = [
  "texto",
  "text",
  "conteudo",
  "conteúdo",
  "mensagem",
  "message",
  "prompt",
  "transcricao",
  "transcrição",
  "corpo",
  "body",
  "content",
  "post",
  "legenda",
];

const TYPE_MAP = {
  boolean: "boolean",
  bool: "boolean",
  binaria: "boolean",
  binária: "boolean",
  single_select: "select",
  select: "select",
  multi_select: "multi",
  multi: "multi",
  text: "text",
  texto: "text",
  number: "number",
  numero: "number",
  número: "number",
};

const truthy = (value) =>
  ["1", "true", "sim", "yes", "y", "x", "verdadeiro"].includes(String(value ?? "").trim().toLowerCase());

// Erro com código: a interface traduz pelo dicionário do idioma ativo; a
// mensagem em pt vai no Error para quem lê err.message fora do React.
export function importError(code, params = {}) {
  const err = new Error(fmt(strings.pt.importer.errors[code] || code, params));
  err.code = code;
  err.params = params;
  return err;
}

function norm(value) {
  return String(value ?? "").trim();
}

function sheetToObjects(workbook, name) {
  const match = workbook.SheetNames.find((s) => s.trim().toLowerCase() === name);
  if (!match) return null;
  return XLSX.utils.sheet_to_json(workbook.Sheets[match], { defval: "", raw: false });
}

function rowsOfSheet(workbook, exactName) {
  const ws = workbook.Sheets[exactName];
  if (!ws) return [];
  return XLSX.utils
    .sheet_to_json(ws, { defval: "", raw: false })
    .filter((row) => Object.values(row).some((v) => norm(v)));
}

// --- Metadados que o Excel guarda como número -------------------------------
// Uma data vira 46110 e um horário vira 0,9631. Sem formato na célula não há o
// que ler, então a conversão vem do nome da coluna mais a faixa dos valores.

const DATE_HINTS = ["dia", "data", "date", "day", "timestamp"];
const TIME_HINTS = ["hora", "horario", "horário", "time", "hour"];

const isNumeric = (v) => v !== "" && Number.isFinite(Number(String(v).replace(",", ".")));
const num = (v) => Number(String(v).replace(",", "."));

function excelSerialToDate(serial) {
  // O Excel conta dias desde 1899-12-30 (o bug do ano bissexto de 1900 incluso).
  const ms = Math.round((serial - 25569) * 86400 * 1000);
  return new Date(ms);
}

function detectSerialKind(column, values) {
  const name = column.trim().toLowerCase();
  const nums = values.filter(isNumeric).map(num);
  if (!nums.length || nums.length < values.length) return null;
  if (DATE_HINTS.some((h) => name === h || name.includes(h))) {
    if (nums.every((n) => n > 20000 && n < 80000)) return "date";
  }
  if (TIME_HINTS.some((h) => name === h || name.includes(h))) {
    if (nums.every((n) => n >= 0 && n < 1)) return "time";
  }
  return null;
}

function formatSerial(kind, value) {
  if (!isNumeric(value)) return value;
  const n = num(value);
  if (kind === "date") return excelSerialToDate(n).toISOString().slice(0, 10);
  const total = Math.round(n * 24 * 60);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Reescreve no lugar as colunas de data e hora que vieram como número.
function humanizeSerialColumns(rows, columns) {
  const converted = [];
  for (const column of columns) {
    const values = rows.map((r) => norm(r[column])).filter(Boolean);
    const kind = detectSerialKind(column, values);
    if (!kind) continue;
    rows.forEach((row) => {
      row[column] = formatSerial(kind, row[column]);
    });
    converted.push({ column, kind });
  }
  return converted;
}

// --- Dedução do livro de códigos a partir das colunas ------------------------

const BOOL_WORDS = new Set([
  "true", "false", "verdadeiro", "falso", "sim", "nao", "não", "yes", "no", "1", "0", "x",
]);

const humanize = (key) =>
  key.replace(/[_]+/g, " ").replace(/\s+/g, " ").trim().replace(/^./, (c) => c.toUpperCase());

// Colunas que são campo aberto por natureza, mesmo com poucas respostas.
const FREE_TEXT_HINTS = ["obs", "observacao", "observação", "nota", "notas", "comentario", "comentário", "note", "notes", "comment"];

// Variável de livro de códigos existe para ser marcada. Campo aberto é a
// exceção, não o padrão: só quando o nome diz que é anotação, ou quando os
// valores presentes são longos demais para caber numa lista.
function inferType(values, column = "") {
  const distinct = [...new Set(values)];
  const name = column.trim().toLowerCase();
  if (FREE_TEXT_HINTS.some((h) => name === h || name.startsWith(`${h}_`) || name.endsWith(`_${h}`))) {
    return { type: "text", options: [] };
  }
  // Coluna em branco: a planilha não diz o tipo. Booleana é o palpite útil,
  // porque dá para marcar; o livro de códigos corrige se for outra coisa.
  if (!distinct.length) return { type: "boolean", options: [] };
  if (distinct.every((v) => BOOL_WORDS.has(v.toLowerCase()))) return { type: "boolean", options: [] };
  if (distinct.every(isNumeric)) return { type: "number", options: [] };
  if (distinct.length <= 20 && distinct.every((v) => v.length <= 80)) {
    return { type: "select", options: distinct.sort((a, b) => a.localeCompare(b, "pt")) };
  }
  return { type: "text", options: [] };
}

// Prefixo antes do primeiro "_" ou espaço vira grupo, desde que duas ou mais
// colunas o compartilhem. Sozinho não é grupo, é coluna solta.
function inferGroups(keys) {
  const count = {};
  const prefixOf = (k) => (k.match(/^([^_\s]+)[_\s]/) || [])[1] || null;
  keys.forEach((k) => {
    const p = prefixOf(k);
    if (p) count[p] = (count[p] || 0) + 1;
  });
  const out = {};
  keys.forEach((k) => {
    const p = prefixOf(k);
    out[k] = p && count[p] >= 2 ? p : "Outras variáveis";
  });
  return out;
}

// A coluna do material parte a aba: antes dela é metadado, depois é variável.
export function inferRoundFromRows(rows, { sheetName = "" } = {}) {
  if (!rows.length) throw importError("noItems");
  const columns = Object.keys(rows[0]);
  const textField = pickTextColumn(rows);
  if (!textField) throw importError("noTextColumn");

  const cut = columns.indexOf(textField);
  const metaColumns = columns.slice(0, cut);
  const variableColumns = columns.slice(cut + 1);
  if (!variableColumns.length) throw importError("noVariablesAfterText", { text: textField });

  humanizeSerialColumns(rows, metaColumns);

  const groups = inferGroups(variableColumns);
  const editableFields = variableColumns.map((column, index) => {
    const values = rows.map((r) => norm(r[column])).filter(Boolean);
    const { type, options } = inferType(values, column);
    return {
      key: column,
      header: column,
      group: groups[column],
      type,
      question: humanize(column),
      help: "",
      options,
      required: false,
      locked: false,
      inherited: false,
      defaultValue: "",
      outputOrder: index,
      _order: index,
    };
  });

  return {
    textField,
    metaColumns,
    editableFields,
    codedBlockStart: cut + 1,
    inferred: true,
    sheetName,
  };
}

// Lista o que dá para codificar num arquivo, para a tela oferecer a escolha.
export function inspectWorkbook(buffer) {
  const workbook = XLSX.read(buffer, { type: "array" });
  const hasTemplate =
    sheetToObjects(workbook, SHEET_VARIABLES) !== null && sheetToObjects(workbook, SHEET_ITEMS) !== null;
  if (hasTemplate) return { mode: "template", sheets: [] };

  const sheets = workbook.SheetNames.map((name) => {
    const rows = rowsOfSheet(workbook, name);
    if (!rows.length) return { name, rows: 0, usable: false, reason: "vazia" };
    const columns = Object.keys(rows[0]);
    const textField = pickTextColumn(rows);
    if (!textField) return { name, rows: rows.length, usable: false, reason: "sem coluna de material" };
    const after = columns.length - columns.indexOf(textField) - 1;
    if (!after) return { name, rows: rows.length, usable: false, reason: "sem colunas depois do material" };
    return { name, rows: rows.length, columns: columns.length, textField, variables: after, usable: true };
  });

  return { mode: "infer", sheets };
}

function pickTextColumn(rows) {
  if (!rows.length) return null;
  const columns = Object.keys(rows[0]);
  for (const hint of TEXT_COLUMN_HINTS) {
    const found = columns.find((c) => c.trim().toLowerCase() === hint);
    if (found) return found;
  }
  // Sem nome conhecido: fica a coluna com o texto mais longo em média — o material
  // costuma ser bem mais comprido que id, data ou rótulo.
  let best = null;
  let bestLength = 0;
  for (const column of columns) {
    const lengths = rows.map((row) => norm(row[column]).length);
    const average = lengths.reduce((a, b) => a + b, 0) / (lengths.length || 1);
    if (average > bestLength) {
      bestLength = average;
      best = column;
    }
  }
  return bestLength >= 25 ? best : null;
}

function normalizeVariable(row, index) {
  const key = norm(row.variable_key || row.key || row.variavel || row.variável);
  if (!key) return null;
  const rawType = norm(row.type || row.tipo).toLowerCase();
  const type = TYPE_MAP[rawType] || "text";
  const options = norm(row.options || row.opcoes || row.opções)
    .split("|")
    .map((o) => o.trim())
    .filter(Boolean);

  return {
    key,
    header: key,
    group: norm(row.group || row.grupo) || "Variáveis",
    type,
    question: norm(row.label || row.pergunta || row.question) || key,
    help: norm(row.help || row.criterio || row.critério || row.ajuda),
    options,
    required: truthy(row.required ?? row.obrigatoria ?? row.obrigatória),
    locked: truthy(row.locked ?? row.travada ?? row.descontinuada),
    lockedNote: norm(row.locked_note || row.nota_travada) || "não preencher",
    inherited: truthy(row.inherited ?? row.herdada),
    defaultValue: norm(row.default_value || row.valor_padrao || row.valor_padrão),
    outputOrder: Number(row.output_order ?? index) || index,
    _order: index,
  };
}

export function parseRoundWorkbook(buffer, { fileName = "rodada", sheetName = "", codebookDoc = null } = {}) {
  const workbook = XLSX.read(buffer, { type: "array" });

  const variableRows = sheetToObjects(workbook, SHEET_VARIABLES);
  const itemRows = sheetToObjects(workbook, SHEET_ITEMS);

  // Sem as duas abas do modelo, deduz o livro de códigos das próprias colunas.
  if (!variableRows || !itemRows) {
    return buildInferredRound(workbook, { fileName, sheetName, codebookDoc });
  }

  const editableFields = variableRows
    .map(normalizeVariable)
    .filter(Boolean)
    .sort((a, b) => a.outputOrder - b.outputOrder || a._order - b._order);

  if (!editableFields.length) {
    throw importError("noVariables");
  }

  const items = itemRows.filter((row) => Object.values(row).some((v) => norm(v)));
  if (!items.length) {
    throw importError("noItems");
  }

  const textField = pickTextColumn(items);
  if (!textField) {
    throw importError("noTextColumn");
  }

  const itemColumns = Object.keys(items[0]);
  const idColumn =
    itemColumns.find((c) => ["item_id", "id"].includes(c.trim().toLowerCase())) || null;

  // Metadados = tudo que não é o material nem a chave de variável codificável.
  const variableKeys = new Set(editableFields.map((f) => f.key));
  const metaFields = itemColumns
    .filter((c) => c !== textField && !variableKeys.has(c))
    .map((c) => ({ key: c, label: c.replace(/_/g, " ") }));

  const records = items.map((row, index) => {
    const record = { ...row, id: index + 1 };
    record.ID = idColumn ? norm(row[idColumn]) || String(index + 1) : String(index + 1);
    // Valor padrão declarado na aba variables entra como ponto de partida.
    editableFields.forEach((field) => {
      if (record[field.key] === undefined && field.defaultValue) {
        record[field.key] = field.type === "boolean" ? truthy(field.defaultValue) : field.defaultValue;
      }
    });
    return record;
  });

  // Onde o bloco codificável começa na planilha do usuário: na primeira coluna que
  // já casa com uma variável ou, se ainda não existirem, logo depois da última
  // coluna de item — que é onde elas vão ser coladas.
  const firstVariableColumn = itemColumns.findIndex((c) => variableKeys.has(c));
  const codedBlockStart = firstVariableColumn >= 0 ? firstVariableColumn : itemColumns.length;

  humanizeSerialColumns(records, metaFields.map((m) => m.key));

  const roundId = `${Date.now().toString(36)}`;
  const title = fileName.replace(/\.(xlsx|xlsm|csv)$/i, "").replace(/[_-]+/g, " ");

  const doc = codebookDoc ? parseCodebookDoc(codebookDoc, editableFields.map((f) => f.key)) : null;

  return {
    project: {
      id: roundId,
      eyebrow: "",
      title,
      storageKey: `codlab:round:${roundId}`,
      exportBasename: (title || "codlab").replace(/\s+/g, "_").toLowerCase(),
      backupBasename: "codlab",
      sheetName: "codificacao",
      codedBlockStart,
      exampleRow: 2,
    },
    records,
    codebook: {
      editableFields: applyCodebookDoc(editableFields, doc),
      metaFields,
      textField,
      binaryFormats: BINARY_FORMATS,
      defaultBinaryFormat: DEFAULT_BINARY_FORMAT,
    },
    codebookDoc: doc ? { text: doc.text, matched: doc.matched.length, unmatched: doc.unmatched } : null,
    summary: {
      fileName,
      items: records.length,
      variables: editableFields.length,
      codable: editableFields.filter((f) => !f.locked && !f.inherited).length,
      textField,
      groups: [...new Set(editableFields.map((f) => f.group))],
      inferred: false,
      docMatched: doc ? doc.matched.length : 0,
    },
  };
}

// Rodada deduzida: escolhe a aba, lê as colunas e monta o mesmo formato de
// retorno da rodada declarada, para a tela não precisar saber a diferença.
function buildInferredRound(workbook, { fileName, sheetName, codebookDoc = null }) {
  const usable = workbook.SheetNames.map((name) => ({ name, rows: rowsOfSheet(workbook, name) })).filter(
    (s) => {
      if (!s.rows.length) return false;
      const cols = Object.keys(s.rows[0]);
      const t = pickTextColumn(s.rows);
      return Boolean(t) && cols.indexOf(t) < cols.length - 1;
    },
  );

  if (!usable.length) {
    throw importError("missingSheets", {
      missing: `"${SHEET_VARIABLES}", "${SHEET_ITEMS}"`,
      found: workbook.SheetNames.map((s) => `"${s}"`).join(", "),
    });
  }

  const chosen = usable.find((s) => s.name === sheetName) || usable[0];
  const inferredCodebook = inferRoundFromRows(chosen.rows, { sheetName: chosen.name });

  const idColumn =
    inferredCodebook.metaColumns.find((c) => ["item_id", "id"].includes(c.trim().toLowerCase())) || null;

  const records = chosen.rows.map((row, index) => {
    const record = { ...row, id: index + 1 };
    record.ID = idColumn ? norm(row[idColumn]) || String(index + 1) : String(index + 1);
    return record;
  });

  const doc = codebookDoc
    ? parseCodebookDoc(codebookDoc, inferredCodebook.editableFields.map((f) => f.key))
    : null;
  const fields = applyCodebookDoc(inferredCodebook.editableFields, doc);

  const roundId = `${Date.now().toString(36)}`;
  const base = fileName.replace(/\.(xlsx|xlsm|csv)$/i, "").replace(/[_-]+/g, " ");
  const title = usable.length > 1 ? `${base} · ${chosen.name}` : base;

  return {
    project: {
      id: roundId,
      eyebrow: "",
      title,
      storageKey: `codlab:round:${roundId}`,
      exportBasename: `${base}_${chosen.name}`.replace(/\s+/g, "_").toLowerCase(),
      backupBasename: "codlab",
      sheetName: chosen.name,
      codedBlockStart: inferredCodebook.codedBlockStart,
      exampleRow: 2,
    },
    records,
    codebook: {
      editableFields: fields,
      metaFields: inferredCodebook.metaColumns.map((c) => ({ key: c, label: c.replace(/_/g, " ") })),
      textField: inferredCodebook.textField,
      binaryFormats: BINARY_FORMATS,
      defaultBinaryFormat: DEFAULT_BINARY_FORMAT,
    },
    codebookDoc: doc ? { text: doc.text, matched: doc.matched.length, unmatched: doc.unmatched } : null,
    summary: {
      fileName,
      items: records.length,
      variables: fields.length,
      codable: fields.length,
      textField: inferredCodebook.textField,
      groups: [...new Set(fields.map((f) => f.group))],
      inferred: true,
      sheet: chosen.name,
      sheets: usable.map((s) => s.name),
      docMatched: doc ? doc.matched.length : 0,
    },
  };
}

// Aba de variáveis entregue à parte, como .csv ou .xlsx de uma aba só.
export function parseVariablesFile(buffer, { isCsv = false } = {}) {
  const workbook = isCsv
    ? XLSX.read(new TextDecoder().decode(buffer), { type: "string" })
    : XLSX.read(buffer, { type: "array" });
  const named = sheetToObjects(workbook, SHEET_VARIABLES);
  const rows = named || rowsOfSheet(workbook, workbook.SheetNames[0]);
  const fields = (rows || []).map(normalizeVariable).filter(Boolean);
  if (!fields.length) throw importError("noVariables");
  return fields.sort((a, b) => a.outputOrder - b.outputOrder || a._order - b._order);
}

// Modelo em branco, gerado no navegador — mesma estrutura que o leitor espera.
export function buildTemplateWorkbook() {
  const variables = [
    {
      variable_key: "Assunto",
      label: "Assunto predominante da unidade",
      type: "single_select",
      group: "Caracterização",
      required: "sim",
      options: "Política|Saúde|Economia|Educação|Outro",
      help: "Escolha o tema que organiza a unidade como um todo.",
      output_order: 1,
    },
    {
      variable_key: "Mencao_Institucional",
      label: "Menciona órgão ou serviço público?",
      type: "boolean",
      group: "Caracterização",
      required: "sim",
      options: "",
      help: "Vale citação nominal ou referência inequívoca.",
      output_order: 2,
    },
    {
      variable_key: "Recursos",
      label: "Quais recursos retóricos aparecem?",
      type: "multi_select",
      group: "Enquadramento",
      required: "",
      options: "Números|Apelo emocional|Autoridade|Urgência",
      help: "Pode marcar mais de um.",
      output_order: 3,
    },
    {
      variable_key: "OBS",
      label: "Observações da codificação",
      type: "text",
      group: "Observação",
      required: "",
      options: "",
      help: "Campo livre para dúvidas e exceções.",
      output_order: 4,
    },
  ];

  const items = [
    {
      item_id: "001",
      texto: "Cole aqui a mensagem, o post ou a transcrição que será codificada.",
      data: "2026-01-15",
      fonte: "WhatsApp",
    },
    {
      item_id: "002",
      texto: "Uma linha por unidade de análise. As demais colunas viram metadados na tela.",
      data: "2026-01-16",
      fonte: "Instagram",
    },
  ];

  const settings = [
    { key: "titulo", value: "Nome da sua rodada" },
    { key: "responsavel", value: "Quem coordena" },
  ];

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(items), SHEET_ITEMS);
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(variables), SHEET_VARIABLES);
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(settings), "settings");
  return book;
}

export const ROUND_INDEX_KEY = "codlab:rounds:v1";

export function listStoredRounds() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(ROUND_INDEX_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveRound(round) {
  const entry = {
    id: round.project.id,
    title: round.project.title,
    storageKey: round.project.storageKey,
    items: round.summary.items,
    variables: round.summary.variables,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(`codlab:def:${round.project.id}`, JSON.stringify(round));
  const index = listStoredRounds().filter((r) => r.id !== entry.id);
  localStorage.setItem(ROUND_INDEX_KEY, JSON.stringify([entry, ...index].slice(0, 12)));
  return entry;
}

export function loadRound(id) {
  try {
    const raw = localStorage.getItem(`codlab:def:${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function forgetRound(id) {
  const entry = listStoredRounds().find((r) => r.id === id);
  localStorage.removeItem(`codlab:def:${id}`);
  if (entry?.storageKey) localStorage.removeItem(entry.storageKey);
  localStorage.setItem(
    ROUND_INDEX_KEY,
    JSON.stringify(listStoredRounds().filter((r) => r.id !== id)),
  );
}
