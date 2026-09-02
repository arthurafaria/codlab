import { describe, expect, test } from "bun:test";
import * as XLSX from "xlsx";
import { parseRoundWorkbook, buildTemplateWorkbook, inspectWorkbook } from "../lib/round-import.js";

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

describe("dedução sem aba variables", () => {
  // Uma aba de codificação comum: metadados, a coluna do material, e depois
  // as variáveis. É o formato "uma aba por codificador".
  const linha = (i, extra = {}) => ({
    ID: i,
    dia: 46023 + i,
    hora: 0.5 + i / 1000,
    grupo: "Canal X",
    texto: `Mensagem número ${i} com tamanho suficiente para ser detectada como material`,
    Tipo_URL: ["A", "B"][i % 2],
    Conteudo_Eleitoral: i % 2 ? "TRUE" : "FALSE",
    Desinfo_Emocional: "FALSE",
    Desinfo_Urgencia: "TRUE",
    Efeito_Panico: "FALSE",
    Alcance: String(i * 10),
    OBS: i === 1 ? "só uma anotação" : "",
    ...extra,
  });
  const aba = (n = 4) => Array.from({ length: n }, (_, i) => linha(i + 1));

  test("a coluna do material parte metadados de variáveis", () => {
    const r = parseRoundWorkbook(book({ Amostra_Ana: aba() }), { fileName: "rodada.xlsx" });
    expect(r.codebook.metaFields.map((m) => m.key)).toEqual(["ID", "dia", "hora", "grupo"]);
    expect(r.codebook.editableFields.map((f) => f.key)).toEqual([
      "Tipo_URL", "Conteudo_Eleitoral", "Desinfo_Emocional", "Desinfo_Urgencia", "Efeito_Panico", "Alcance", "OBS",
    ]);
    expect(r.project.codedBlockStart).toBe(5); // texto na E, variáveis a partir da F
    expect(r.summary.inferred).toBe(true);
  });

  test("tipo sai dos valores da coluna", () => {
    const r = parseRoundWorkbook(book({ Amostra: aba() }), { fileName: "r.xlsx" });
    const tipo = Object.fromEntries(r.codebook.editableFields.map((f) => [f.key, f.type]));
    expect(tipo).toEqual({
      Tipo_URL: "select",
      Conteudo_Eleitoral: "boolean",
      Desinfo_Emocional: "boolean",
      Desinfo_Urgencia: "boolean",
      Efeito_Panico: "boolean",
      Alcance: "number",
      OBS: "text",
    });
    expect(r.codebook.editableFields.find((f) => f.key === "Tipo_URL").options).toEqual(["A", "B"]);
  });

  test("uma resposta observada não vira lista fechada", () => {
    const rows = aba().map((r) => ({ ...r, Tipo_URL: "sempre igual" }));
    const r = parseRoundWorkbook(book({ Amostra: rows }), { fileName: "r.xlsx" });
    expect(r.codebook.editableFields.find((f) => f.key === "Tipo_URL").type).toBe("text");
  });

  test("prefixo repetido vira grupo; coluna solta não", () => {
    const r = parseRoundWorkbook(book({ Amostra: aba() }), { fileName: "r.xlsx" });
    const grupo = Object.fromEntries(r.codebook.editableFields.map((f) => [f.key, f.group]));
    expect(grupo.Desinfo_Emocional).toBe("Desinfo");
    expect(grupo.Desinfo_Urgencia).toBe("Desinfo");
    expect(grupo.Efeito_Panico).toBe("Outras variáveis"); // só uma Efeito_
    expect(grupo.Alcance).toBe("Outras variáveis");
  });

  test("data e hora em número de série do Excel viram legíveis", () => {
    const r = parseRoundWorkbook(book({ Amostra: aba() }), { fileName: "r.xlsx" });
    expect(r.records[0].dia).toBe("2026-01-02");
    expect(r.records[0].hora).toMatch(/^\d{2}:\d{2}$/);
    // Só converte o que tem nome e faixa de data/hora; ID continua ID.
    expect(String(r.records[0].ID)).toBe("1");
  });

  test("inspectWorkbook lista as abas codificáveis e o motivo das outras", () => {
    const wb = book({
      Amostra_Ana: aba(),
      Amostra_Bruno: aba(2),
      "Só metadados": [{ ID: 1, nome: "x" }],
    });
    const found = inspectWorkbook(wb);
    expect(found.mode).toBe("infer");
    const usaveis = found.sheets.filter((s) => s.usable).map((s) => [s.name, s.rows, s.variables]);
    expect(usaveis).toEqual([["Amostra_Ana", 4, 7], ["Amostra_Bruno", 2, 7]]);
    expect(found.sheets.find((s) => s.name === "Só metadados").usable).toBe(false);
  });

  test("a aba escolhida manda; sem escolha, a primeira codificável", () => {
    const wb = book({ Amostra_Ana: aba(4), Amostra_Bruno: aba(2) });
    expect(parseRoundWorkbook(wb, { fileName: "r.xlsx" }).summary.sheet).toBe("Amostra_Ana");
    const bruno = parseRoundWorkbook(wb, { fileName: "r.xlsx", sheetName: "Amostra_Bruno" });
    expect([bruno.summary.sheet, bruno.summary.items]).toEqual(["Amostra_Bruno", 2]);
    expect(bruno.project.title).toBe("r · Amostra_Bruno");
  });

  test("o modelo declarado continua tendo prioridade sobre a dedução", () => {
    const wb = book({ Amostra_Ana: aba(), variables: VARS, items: [{ item_id: "1", texto: "material longo o suficiente aqui" }] });
    const r = parseRoundWorkbook(wb, { fileName: "r.xlsx" });
    expect(r.summary.inferred).toBe(false);
    expect(inspectWorkbook(wb).mode).toBe("template");
  });

  test("material na última coluna: erro claro, não rodada vazia", () => {
    expect(() => parseRoundWorkbook(book({ A: [{ ID: 1, texto: "material longo o suficiente para detectar" }] }), { fileName: "r.xlsx" })).toThrow(
      expect.objectContaining({ code: "missingSheets" }),
    );
  });
});
