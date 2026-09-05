// ARQUIVADO junto com o painel do orientador (app/_platform, app/_api).
// Nada em produção importa este arquivo, e ele não compila num clone limpo:
// src/data/codebook.js está no .gitignore com o resto do corpus de pesquisa.
// Ver a seção "Painel do orientador" do README antes de tentar religar.

import * as XLSX from "xlsx";
import { editableFields, selectOptions } from "../../src/data/codebook.js";
import { TEMPLATE_SHEETS, VARIABLE_TYPES } from "../constants";
import { parseCsv, rowsToObjects } from "../csv";

function clean(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function truthy(value) {
  const text = clean(value).toLowerCase();
  return ["1", "true", "sim", "yes", "y", "obrigatorio", "obrigatório"].includes(text);
}

function sheetObjects(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
}

function normalizeOptions(value) {
  const text = clean(value);
  if (!text) return [];
  return text
    .split("|")
    .map((option) => option.trim())
    .filter(Boolean);
}

function stripMarkdown(value) {
  return clean(value)
    .replaceAll("\\_", "_")
    .replaceAll("\\!", "!")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumberedOptions(text) {
  const value = stripMarkdown(text);
  const matches = [...value.matchAll(/\(\d+\)\s*([^()]+?)(?=\s*\(\d+\)|$)/g)]
    .map((match) => match[1].trim())
    .filter(Boolean);
  if (matches.length <= 1) return matches;

  const expanded = [];
  matches.forEach((option) => {
    if (option.includes("Indistinguível")) {
      const cleanOption = option.replace("Indistinguível", "").trim();
      if (cleanOption) expanded.push(cleanOption);
      expanded.push("Indistinguível");
    } else if (option.includes("Grande grupo") && !option.startsWith("Grande grupo")) {
      const cleanOption = option.replace("Grande grupo", "").trim();
      if (cleanOption) expanded.push(cleanOption);
      expanded.push("Grande grupo");
    } else {
      expanded.push(option);
    }
  });

  return expanded;
}

function inferType(options) {
  const normalized = options.map((option) => option.toLowerCase());
  if (normalized.length === 2 && normalized.includes("não") && normalized.includes("sim")) {
    return "boolean";
  }
  if (options.length > 0) return "single_select";
  return "text";
}

function knownIaRacialVariables(text) {
  const normalized = clean(text).toLowerCase();
  const hasIaRacialSignal =
    normalized.includes("ia racial") ||
    normalized.includes("figura_genero") ||
    normalized.includes("figura_etnicoracial") ||
    normalized.includes("contexto_etnicoracial");

  if (!hasIaRacialSignal) return [];

  return editableFields.map((field, index) => {
    const type = field.type === "select" ? "single_select" : field.type;
    return {
      key: field.key,
      label: field.question,
      type,
      group: field.group || "Codificação",
      required: field.key !== "OBS",
      options: type === "single_select" ? selectOptions[field.key] || [] : [],
      help: field.help || field.question,
      defaultValue: field.type === "boolean" ? "false" : "",
      outputOrder: index + 1,
    };
  });
}

export function parseVariablesFromCodebook(markdown) {
  const variables = [];
  let group = "Codificação";

  clean(markdown)
    .split(/\r?\n/)
    .forEach((line) => {
      const cells = line.split("|").slice(1, -1).map(stripMarkdown);
      if (cells.length < 2) return;

      const groupCell = cells.find((cell) => /^Variáveis\b/i.test(cell));
      if (groupCell) {
        group = groupCell.replace(/^Variáveis\s*(de\s*)?/i, "").trim() || groupCell;
        return;
      }

      const index = Number(cells[0]);
      if (!Number.isFinite(index) || index < 9) return;
      const key = cells[1]?.replace(/[^\w]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
      if (!key || variables.some((variable) => variable.key === key)) return;

      const label = cells[3] || key;
      const options = parseNumberedOptions(cells[4] || "");
      const type = inferType(options);
      variables.push({
        key,
        label,
        type,
        group,
        required: true,
        options: type === "boolean" ? [] : options,
        help: label,
        defaultValue: "",
        outputOrder: variables.length + 1,
      });
    });

  return variables.length ? variables : knownIaRacialVariables(markdown);
}

export function normalizeVariable(row, index) {
  const type = clean(row.variable_key ? row.type : row.Tipo || row.type).toLowerCase();
  return {
    key: clean(row.variable_key || row.key || row.variavel || row.Variavel),
    label: clean(row.label || row.pergunta || row.question || row.variable_key),
    type,
    group: clean(row.group || row.grupo || "Codificação"),
    required: truthy(row.required || row.obrigatorio),
    options: normalizeOptions(row.options || row.opcoes),
    help: clean(row.help || row.ajuda || row.description),
    defaultValue: clean(row.default_value),
    outputOrder: Number(row.output_order || index + 1),
  };
}

export function validateVariables(variables) {
  const errors = [];
  const seen = new Set();

  variables.forEach((variable, index) => {
    const label = variable.key || `linha ${index + 2}`;
    if (!variable.key) errors.push(`Variável sem variable_key na linha ${index + 2}.`);
    if (variable.key && seen.has(variable.key)) errors.push(`Variável duplicada: ${variable.key}.`);
    seen.add(variable.key);
    if (!VARIABLE_TYPES.includes(variable.type)) {
      errors.push(`${label}: type deve ser ${VARIABLE_TYPES.join(", ")}.`);
    }
    if (["single_select", "multi_select"].includes(variable.type) && variable.options.length === 0) {
      errors.push(`${label}: campos select precisam de options separadas por |.`);
    }
  });

  return errors;
}

export function normalizeItem(row, index) {
  const metadata = { ...row };
  delete metadata.item_id;
  delete metadata.image_filename;

  return {
    itemId: clean(row.item_id || row.Casos || row.id || index + 1),
    imageFilename: clean(row.image_filename || row.image || row.filename),
    metadata,
    sortOrder: index + 1,
  };
}

function generatedImageName(index) {
  return `image_${String(index + 1).padStart(3, "0")}.png`;
}

function originalSampleSheetName(workbook) {
  if (workbook.Sheets.Sample_IA_Racial_Arthur) return "Sample_IA_Racial_Arthur";
  return workbook.SheetNames.find((name) => /^Sample_IA_Racial_/i.test(name)) || "";
}

function sampleItemsFromWorkbook(workbook, imageFilenames = []) {
  const sheetName = originalSampleSheetName(workbook);
  if (!sheetName) return [];

  const availableImages = new Set(imageFilenames.map((name) => name.toLowerCase()));
  return sheetObjects(workbook, sheetName)
    .map((row, index) => {
      const imageFilename = generatedImageName(index);
      if (availableImages.size && !availableImages.has(imageFilename.toLowerCase())) return null;

      return {
        itemId: clean(row.Casos || row.item_id || index + 1),
        imageFilename,
        metadata: { ...row, image_filename: imageFilename },
        sortOrder: index + 1,
      };
    })
    .filter(Boolean);
}

function parseItemsFromWorkbook(workbook, imageFilenames = []) {
  const templateItems = sheetObjects(workbook, TEMPLATE_SHEETS.items).map(normalizeItem);
  if (templateItems.length) return templateItems;

  return sampleItemsFromWorkbook(workbook, imageFilenames);
}

export function validateItems(items, imageFilenames) {
  const errors = [];
  const seen = new Set();
  const available = new Set(imageFilenames.map((name) => name.toLowerCase()));

  items.forEach((item, index) => {
    if (!item.itemId) errors.push(`Item sem item_id na linha ${index + 2}.`);
    if (!item.imageFilename) errors.push(`${item.itemId || `linha ${index + 2}`}: image_filename é obrigatório.`);
    if (item.itemId && seen.has(item.itemId)) errors.push(`item_id duplicado: ${item.itemId}.`);
    seen.add(item.itemId);
    if (item.imageFilename && !available.has(item.imageFilename.toLowerCase())) {
      errors.push(`${item.itemId}: imagem não encontrada no upload (${item.imageFilename}).`);
    }
  });

  return errors;
}

export function parseTemplateWorkbook(buffer, options = {}) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const items = parseItemsFromWorkbook(workbook, options.imageFilenames || []);
  const templateVariables = sheetObjects(workbook, TEMPLATE_SHEETS.variables).map(normalizeVariable);
  const variables = templateVariables.length
    ? templateVariables
    : originalSampleSheetName(workbook)
      ? knownIaRacialVariables("IA Racial Figura_Genero")
      : [];
  const settingsRows = sheetObjects(workbook, TEMPLATE_SHEETS.settings);
  const coders = sheetObjects(workbook, TEMPLATE_SHEETS.coders).map((row, index) => ({
    coderLabel: clean(row.coder_label || `Codificador ${index + 1}`),
    emailOptional: clean(row.email_optional),
    quotaOptional: row.quota_optional ? Number(row.quota_optional) : null,
  }));

  const settings = Object.fromEntries(
    settingsRows
      .map((row) => [clean(row.key || row.setting || row.name), clean(row.value)])
      .filter(([key]) => key),
  );

  return {
    items,
    variables,
    coders: coders.length ? coders : [{ coderLabel: "Codificador 1", emailOptional: "", quotaOptional: null }],
    settings,
  };
}

export function parseTemplateCsv({ itemsText, variablesText, settingsText, codersText }) {
  const items = rowsToObjects(parseCsv(itemsText)).map(normalizeItem);
  const variables = rowsToObjects(parseCsv(variablesText)).map(normalizeVariable);
  const settings = settingsText
    ? Object.fromEntries(rowsToObjects(parseCsv(settingsText)).map((row) => [clean(row.key), clean(row.value)]))
    : {};
  const coders = codersText
    ? rowsToObjects(parseCsv(codersText)).map((row, index) => ({
        coderLabel: clean(row.coder_label || `Codificador ${index + 1}`),
        emailOptional: clean(row.email_optional),
        quotaOptional: row.quota_optional ? Number(row.quota_optional) : null,
      }))
    : [];

  return {
    items,
    variables,
    coders: coders.length ? coders : [{ coderLabel: "Codificador 1", emailOptional: "", quotaOptional: null }],
    settings,
  };
}

export function createTemplateWorkbook() {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([
      ["item_id", "image_filename", "prompt", "source", "batch", "notes"],
      ["001", "image_001.png", "Descreva o prompt ou contexto", "dataset piloto", "A", ""],
      ["002", "image_002.png", "Outra imagem", "dataset piloto", "A", ""],
    ]),
    TEMPLATE_SHEETS.items,
  );
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([
      ["variable_key", "label", "type", "group", "required", "options", "help", "default_value", "output_order"],
      ["Figura_Genero", "A figura central é uma mulher?", "boolean", "Caracterização", "TRUE", "", "Marque sim quando a figura central representada for mulher.", "", 1],
      ["Ambiente", "Qual é o ambiente representado?", "single_select", "Caracterização", "TRUE", "Ambiente Aberto|Ambiente Fechado|Indistinguível", "Classifique o cenário predominante.", "", 2],
      ["Tags", "Marcadores adicionais", "multi_select", "Observação", "FALSE", "Dúvida|Revisar|Exemplo forte", "Escolha quantas opções forem necessárias.", "", 3],
      ["OBS", "Observações", "text", "Observação", "FALSE", "", "Campo livre para anotações.", "", 4],
    ]),
    TEMPLATE_SHEETS.variables,
  );
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([
      ["key", "value"],
      ["project_title", "Meu Projeto de Codificação"],
      ["assignment_mode", "all_code_all"],
      ["coders_per_item", "1"],
      ["overlap_percent", "0"],
      ["randomize_order", "FALSE"],
    ]),
    TEMPLATE_SHEETS.settings,
  );
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([
      ["coder_label", "email_optional", "quota_optional"],
      ["Codificador 1", "", ""],
      ["Codificador 2", "", ""],
    ]),
    TEMPLATE_SHEETS.coders,
  );
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" });
}
