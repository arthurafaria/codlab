// Lógica pura da codificação: geometria das colunas e serialização.
// Sem React, sem DOM, para dar para testar com `bun test`.

// Formatos de saída para variáveis binárias. FALSE/TRUE é o padrão: casa com
// os checkboxes do Google Sheets e o R lê como lógico.
export const BINARY_FORMATS = {
  "FALSE/TRUE": { no: "FALSE", yes: "TRUE" },
  "0/1": { no: "0", yes: "1" },
  "Não/Sim": { no: "Não", yes: "Sim" },
  "No/Yes": { no: "No", yes: "Yes" },
};
export const DEFAULT_BINARY_FORMAT = "FALSE/TRUE";

// Valor de uma variável ainda sem resposta.
const emptyFor = (field) => (field.type === "boolean" ? false : "");

// 0 → A, 25 → Z, 26 → AA
export function sheetColLetter(n) {
  let s = "";
  let x = n + 1;
  while (x > 0) {
    const m = (x - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}

// Onde o bloco codificável cai na planilha. A colagem pula as colunas
// automáticas/herdadas do começo e começa na primeira que o humano preenche.
// Travadas no meio continuam no bloco para não deslocar as seguintes.
export function computeLayout(editableFields, codedBlockStart = 0) {
  const defaults = Object.fromEntries(editableFields.map((field) => [field.key, emptyFor(field)]));
  const lockedResets = Object.fromEntries(
    editableFields.filter((field) => field.locked).map((field) => [field.key, emptyFor(field)]),
  );
  const firstCodeIndex = Math.max(
    0,
    editableFields.findIndex((field) => !field.locked && !field.inherited),
  );
  const pasteFields = editableFields.slice(firstCodeIndex);
  return {
    defaults,
    lockedResets,
    firstCodeIndex,
    pasteFields,
    pasteHeaders: pasteFields.map((field) => field.header),
    pasteColLetter: sheetColLetter(codedBlockStart + firstCodeIndex),
    lastColLetter: sheetColLetter(codedBlockStart + editableFields.length - 1),
    hasAutoBlock: firstCodeIndex > 0,
    autoFirstLetter: sheetColLetter(codedBlockStart),
    autoLastLetter: sheetColLetter(codedBlockStart + firstCodeIndex - 1),
  };
}

export function serializeValue(record, field, binaryFormat) {
  const value = record[field.key];
  if (field.type === "boolean") {
    return value === true ? binaryFormat.yes : binaryFormat.no;
  }
  return String(value ?? "")
    .replace(/[\t\r\n]+/g, " ")
    .trim();
}

// Linhas separadas por tab, prontas para colar na planilha.
export function buildPasteRows(records, layout, binaryFormat, includeHeader = false) {
  const body = records.map((record) =>
    layout.pasteFields.map((field) => serializeValue(record, field, binaryFormat)).join("\t"),
  );
  return includeHeader ? [layout.pasteHeaders.join("\t"), ...body].join("\n") : body.join("\n");
}

export function buildRecords(sourceRecords, layout, codebook, saved = null) {
  const { metaFields, textField } = codebook;
  return sourceRecords.map((row, index) => ({
    ...layout.defaults,
    ...row,
    ...(saved ? saved[index] : null),
    // Conteúdo-fonte nunca é sobrescrito pelo rascunho.
    id: row.id,
    [textField]: row[textField],
    ...Object.fromEntries(metaFields.map((meta) => [meta.key, row[meta.key]])),
    // Travadas nunca recebem valor, mesmo vindo de rascunho antigo.
    ...layout.lockedResets,
  }));
}

// Obrigatórias sem resposta. Booleana nunca conta: o padrão da ferramenta é
// "Não", e é isso que sai na planilha.
export function missingRequiredFields(record, editableFields) {
  if (!record) return [];
  return editableFields.filter((field) => {
    if (!field.required || field.locked || field.inherited || field.type === "boolean") return false;
    return !String(record[field.key] ?? "").trim();
  });
}
