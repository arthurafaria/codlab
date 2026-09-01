// Leitura de rodada no navegador. Nenhum byte sai da máquina: o arquivo é lido
// com FileReader, convertido aqui e guardado no localStorage.
//
// Formato esperado (o mesmo do modelo que a ferramenta gera):
//   aba `variables` — variable_key, label, type, group, required, options, help
//   aba `items`     — item_id + a coluna do material + quantas colunas quiser
//
// Tipos: boolean, single_select, multi_select, text, number.
// Opções de seleção separadas por "|".

import * as XLSX from "xlsx";
import { strings, fmt } from "./strings";
import { BINARY_FORMATS, DEFAULT_BINARY_FORMAT } from "./coding";

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

export function parseRoundWorkbook(buffer, { fileName = "rodada" } = {}) {
  const workbook = XLSX.read(buffer, { type: "array" });

  const variableRows = sheetToObjects(workbook, SHEET_VARIABLES);
  const itemRows = sheetToObjects(workbook, SHEET_ITEMS);

  const missing = [];
  if (!variableRows) missing.push(SHEET_VARIABLES);
  if (!itemRows) missing.push(SHEET_ITEMS);
  if (missing.length) {
    throw importError("missingSheets", {
      missing: missing.map((m) => `"${m}"`).join(", "),
      found: workbook.SheetNames.map((s) => `"${s}"`).join(", "),
    });
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

  const roundId = `${Date.now().toString(36)}`;
  const title = fileName.replace(/\.(xlsx|xlsm|csv)$/i, "").replace(/[_-]+/g, " ");

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
      editableFields,
      metaFields,
      textField,
      binaryFormats: BINARY_FORMATS,
      defaultBinaryFormat: DEFAULT_BINARY_FORMAT,
    },
    summary: {
      fileName,
      items: records.length,
      variables: editableFields.length,
      codable: editableFields.filter((f) => !f.locked && !f.inherited).length,
      textField,
      groups: [...new Set(editableFields.map((f) => f.group))],
    },
  };
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
