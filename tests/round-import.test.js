import { describe, expect, test } from "bun:test";
import * as XLSX from "xlsx";
import { parseRoundWorkbook, buildTemplateWorkbook } from "../lib/round-import.js";

function book(sheets) {
  const wb = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name);
  }
  return XLSX.write(wb, { type: "array", bookType: "xlsx" });
}

const VARS = [
  { variable_key: "Tema", label: "Tema?", type: "single_select", group: "A", required: "sim", options: "x|y" },
  { variable_key: "Marca", label: "Marca?", type: "boolean", group: "A", help: "critério" },
  { variable_key: "Rec", label: "Recursos", type: "multi_select", group: "B", options: "n|a|u" },
  { variable_key: "Qtd", label: "Quantos?", type: "number", group: "B" },
  { variable_key: "OBS", label: "Notas", type: "text", group: "C" },
];

describe("parseRoundWorkbook", () => {
  test("modelo gerado pela ferramenta reimporta sem perda", () => {
    const buf = XLSX.write(buildTemplateWorkbook(), { type: "array", bookType: "xlsx" });
    const round = parseRoundWorkbook(buf, { fileName: "modelo-codlab.xlsx" });
    expect(round.summary.items).toBe(2);
    expect(round.summary.variables).toBe(4);
    expect(round.summary.textField).toBe("texto");
    expect(round.codebook.editableFields.map((f) => f.type)).toEqual(["select", "boolean", "multi", "text"]);
    expect(round.codebook.editableFields[0].required).toBe(true);
    expect(round.codebook.editableFields[2].options).toEqual(["Números", "Apelo emocional", "Autoridade", "Urgência"]);
  });

  test("mapeia tipos do modelo para os tipos da tela", () => {
    const round = parseRoundWorkbook(book({ variables: VARS, items: [{ item_id: "1", texto: "material longo o bastante para ser detectado" }] }));
    expect(round.codebook.editableFields.map((f) => f.type)).toEqual(["select", "boolean", "multi", "number", "text"]);
    expect(round.codebook.editableFields[0].options).toEqual(["x", "y"]);
    expect(round.codebook.editableFields[1].help).toBe("critério");
  });

  test("bloco de colagem começa depois da última coluna de item", () => {
    const round = parseRoundWorkbook(book({ variables: VARS, items: [{ item_id: "1", texto: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", data: "x", fonte: "y" }] }));
    expect(round.project.codedBlockStart).toBe(4); // item_id, texto, data, fonte → E
    expect(round.codebook.metaFields.map((m) => m.key)).toEqual(["item_id", "data", "fonte"]);
  });

  test("se a planilha já tem as colunas das variáveis, o bloco começa nelas", () => {
    const round = parseRoundWorkbook(
      book({ variables: VARS, items: [{ item_id: "1", texto: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", Tema: "x", Marca: "TRUE" }] }),
    );
    expect(round.project.codedBlockStart).toBe(2);
    // colunas de variável não viram metadado
    expect(round.codebook.metaFields.map((m) => m.key)).toEqual(["item_id"]);
  });

  test("respeita output_order", () => {
    const vars = [
      { variable_key: "B", label: "b", type: "text", output_order: 2 },
      { variable_key: "A", label: "a", type: "text", output_order: 1 },
    ];
    const round = parseRoundWorkbook(book({ variables: vars, items: [{ texto: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }] }));
    expect(round.codebook.editableFields.map((f) => f.key)).toEqual(["A", "B"]);
  });

  test("detecta a coluna de texto por nome, ou pela mais longa", () => {
    const byName = parseRoundWorkbook(book({ variables: VARS, items: [{ mensagem: "curta", outra: "muito mais longa que a mensagem, com folga" }] }));
    expect(byName.summary.textField).toBe("mensagem");
    const byLength = parseRoundWorkbook(book({ variables: VARS, items: [{ id: "1", corpo_livre: "uma frase com mais de vinte e cinco caracteres aqui" }] }));
    expect(byLength.summary.textField).toBe("corpo_livre");
  });

  test("valor padrão da variável entra no registro", () => {
    const vars = [{ variable_key: "M", label: "m", type: "boolean", default_value: "sim" }, { variable_key: "T", label: "t", type: "text", default_value: "x" }];
    const round = parseRoundWorkbook(book({ variables: vars, items: [{ texto: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }] }));
    expect(round.records[0].M).toBe(true);
    expect(round.records[0].T).toBe("x");
  });

  test("linhas vazias em items são ignoradas", () => {
    const round = parseRoundWorkbook(book({ variables: VARS, items: [{ texto: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }, { texto: "" }] }));
    expect(round.summary.items).toBe(1);
  });

  describe("erros com código", () => {
    test("aba faltando", () => {
      expect(() => parseRoundWorkbook(book({ items: [{ texto: "x" }] }))).toThrow(expect.objectContaining({ code: "missingSheets" }));
    });
    test("variables sem chave", () => {
      expect(() => parseRoundWorkbook(book({ variables: [{ label: "x" }], items: [{ texto: "x" }] }))).toThrow(
        expect.objectContaining({ code: "noVariables" }),
      );
    });
    test("items vazia", () => {
      expect(() => parseRoundWorkbook(book({ variables: VARS, items: [{ texto: "" }] }))).toThrow(expect.objectContaining({ code: "noItems" }));
    });
    test("sem coluna de texto", () => {
      expect(() => parseRoundWorkbook(book({ variables: VARS, items: [{ a: "1", b: "2" }] }))).toThrow(
        expect.objectContaining({ code: "noTextColumn" }),
      );
    });
  });
});
