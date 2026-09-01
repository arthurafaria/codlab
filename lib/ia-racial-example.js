import workbook from "@/src/data/workbook.json";
import images from "@/src/data/images.json";
import { editableFields, inheritedFields, selectOptions } from "@/src/data/codebook";

const BOOLEAN_DEFAULT = "false";

function variableType(field) {
  if (field.type === "select") return "single_select";
  return field.type;
}

function defaultValue(field) {
  if (field.type === "boolean") return BOOLEAN_DEFAULT;
  return "";
}

export function buildIaRacialExamplePackage() {
  const present = new Set(images.presentImageNumbers);
  const rows = workbook.rows.filter((row) => present.has(row._imageNumber));

  const items = rows.map((row, index) => ({
    itemId: String(row.Casos),
    imageFilename: row._imageFile,
    imageUrl: `/images/${row._imageFile}`,
    metadata: Object.fromEntries(
      inheritedFields.map((field) => [field, row[field] ?? ""]),
    ),
    sortOrder: index + 1,
  }));

  const variables = editableFields.map((field, index) => ({
    key: field.key,
    label: field.question,
    type: variableType(field),
    group: field.group,
    required: field.key !== "OBS",
    options: selectOptions[field.key] || [],
    help: field.help,
    defaultValue: defaultValue(field),
    outputOrder: index + 1,
  }));

  return {
    title: "Codificação IA Racial - Exemplo",
    description:
      "Projeto demonstrativo com a amostra de confiabilidade IA Racial, imagens políticas geradas por IA e o livro de códigos usado no piloto.",
    instructions:
      "Codifique uma imagem por vez. Use as definições do livro de códigos, marque os campos obrigatórios e envie cada imagem ao terminar.",
    responsibleName: "Projeto exemplo",
    codebookMarkdown: editableFields
      .map((field, index) => {
        const options = selectOptions[field.key]?.length
          ? ` Opções: ${selectOptions[field.key].join(" | ")}.`
          : field.type === "boolean"
            ? " Opções: Não | Sim."
            : "";
        return `${String(index + 9).padStart(2, "0")} ${field.key}\n${field.question}\n${field.help}${options}`;
      })
      .join("\n\n"),
    spreadsheetId: "",
    sheetName: "responses",
    settings: {
      assignment_mode: "all_code_all",
      overlap_percent: "0",
      randomize_order: "FALSE",
    },
    items,
    variables,
    coders: [
      { coderLabel: "Codificador Demo 1", emailOptional: "", quotaOptional: null },
      { coderLabel: "Codificador Demo 2", emailOptional: "", quotaOptional: null },
    ],
  };
}
