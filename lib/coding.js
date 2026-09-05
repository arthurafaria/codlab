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

// A planilha entrega tudo como texto: "TRUE" é string, não booleano. Sem
// normalizar pelo tipo, a tela mostra "Não" para uma resposta positiva e a
// exportação devolve FALSE, alterando o dado de quem já tinha codificado.
const TRUE_WORDS = new Set(["true", "verdadeiro", "sim", "yes", "y", "1", "x"]);
const FALSE_WORDS = new Set(["false", "falso", "nao", "não", "no", "n", "0", ""]);

export function coerceValue(value, type) {
  if (type === "boolean") {
    if (value === true || value === false) return value;
    const t = String(value ?? "").trim().toLowerCase();
    if (TRUE_WORDS.has(t)) return true;
    if (FALSE_WORDS.has(t)) return false;
    // Palavra desconhecida numa coluna booleana: não inventa resposta.
    return false;
  }
  if (value === true) return "TRUE";
  if (value === false) return "FALSE";
  return value ?? "";
}

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
// `sheetOrder` é a ordem real das colunas na aba do usuário. Quando ela existe,
// manda: a promessa de "colar de volta no lugar certo" só vale se o bloco sair
// na ordem das colunas de destino, não na ordem declarada no livro.
export function computeLayout(editableFields, codedBlockStart = 0, sheetOrder = null) {
  const defaults = Object.fromEntries(editableFields.map((field) => [field.key, emptyFor(field)]));
  const lockedResets = Object.fromEntries(
    editableFields.filter((field) => field.locked).map((field) => [field.key, emptyFor(field)]),
  );
  const firstCodeIndex = Math.max(
    0,
    editableFields.findIndex((field) => !field.locked && !field.inherited),
  );
  let pasteFields = editableFields.slice(firstCodeIndex);
  let pasteAligned = true;
  let pasteContiguous = true;

  if (Array.isArray(sheetOrder) && sheetOrder.length) {
    const posicao = new Map(sheetOrder.map((c, i) => [c, i]));
    const todasNaAba = pasteFields.every((f) => posicao.has(f.key));
    if (todasNaAba) {
      const naOrdemDaAba = [...pasteFields].sort((a, b) => posicao.get(a.key) - posicao.get(b.key));
      pasteAligned = naOrdemDaAba.every((f, i) => f.key === pasteFields[i].key);
      const indices = naOrdemDaAba.map((f) => posicao.get(f.key));
      pasteContiguous = indices.every((n, i) => i === 0 || n === indices[i - 1] + 1);
      pasteFields = naOrdemDaAba;
      codedBlockStart = indices[0];
    }
  }

  return {
    fieldTypes: Object.fromEntries(editableFields.map((f) => [f.key, f.type])),
    defaults,
    lockedResets,
    firstCodeIndex,
    pasteFields,
    pasteHeaders: pasteFields.map((field) => field.header),
    // A aba tinha as colunas noutra ordem, ou com metadado no meio: a tela
    // precisa avisar antes de alguém colar em cima do lugar errado.
    pasteAligned,
    pasteContiguous,
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
  const tipos = layout.fieldTypes || {};
  return sourceRecords.map((row, index) => {
    const record = {
      ...layout.defaults,
      ...row,
      ...(saved ? saved[index] : null),
      // Conteúdo-fonte nunca é sobrescrito pelo rascunho.
      id: row.id,
      [textField]: row[textField],
      ...Object.fromEntries(metaFields.map((meta) => [meta.key, row[meta.key]])),
      // Travadas nunca recebem valor, mesmo vindo de rascunho antigo.
      ...layout.lockedResets,
    };
    // Normaliza pelo tipo: o que veio como texto da planilha vira o valor que a
    // tela e a exportação entendem.
    for (const [key, tipo] of Object.entries(tipos)) {
      if (key in record) record[key] = coerceValue(record[key], tipo);
    }
    return record;
  });
}

// Alinha um backup pelos IDs das unidades, não pela posição. Devolve o motivo
// quando não dá para alinhar, para a tela recusar em vez de contaminar.
export function alignBackup(sourceRecords, backupRecords) {
  if (!Array.isArray(backupRecords)) return { erro: "formato" };
  if (backupRecords.length !== sourceRecords.length) return { erro: "tamanho" };

  const temId = backupRecords.every((r) => r && r.ID !== undefined && r.ID !== "");
  if (!temId) return { erro: "semId" };

  const porId = new Map();
  for (const r of backupRecords) {
    const id = String(r.ID);
    if (porId.has(id)) return { erro: "idRepetido", id };
    porId.set(id, r);
  }

  const alinhado = [];
  for (const row of sourceRecords) {
    const id = String(row.ID ?? "");
    if (!porId.has(id)) return { erro: "idDesconhecido", id };
    alinhado.push(porId.get(id));
  }
  return { registros: alinhado };
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

// O rascunho guarda só o que a pessoa respondeu. Regravar o corpus inteiro a
// cada tecla custa proporcional ao tamanho da rodada, e o texto já está na
// definição — buildRecords reimpõe o conteúdo-fonte por cima do que foi salvo.
export function draftAnswers(records, editableFields) {
  return records.map((record) => {
    const out = { ID: record.ID };
    for (const field of editableFields) out[field.key] = record[field.key];
    return out;
  });
}
