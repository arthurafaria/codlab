import { describe, expect, test } from "bun:test";
import {
  sheetColLetter,
  computeLayout,
  serializeValue,
  buildPasteRows,
  buildRecords,
  missingRequiredFields,
} from "../lib/coding.js";

const B = (key, extra = {}) => ({ key, header: key, type: "boolean", group: "g", ...extra });
const S = (key, options, extra = {}) => ({ key, header: key, type: "select", group: "g", options, ...extra });
const T = (key, extra = {}) => ({ key, header: key, type: "text", group: "g", ...extra });

describe("sheetColLetter", () => {
  test("mapeia índice 0-based para letra de coluna", () => {
    expect(sheetColLetter(0)).toBe("A");
    expect(sheetColLetter(25)).toBe("Z");
    expect(sheetColLetter(26)).toBe("AA");
    expect(sheetColLetter(37)).toBe("AL");
    expect(sheetColLetter(701)).toBe("ZZ");
    expect(sheetColLetter(702)).toBe("AAA");
  });
});

describe("computeLayout", () => {
  const fields = [
    B("Auto1", { locked: true }),
    S("Auto2", ["a", "b"], { locked: true }),
    T("Herdada", { inherited: true }),
    S("Tema", ["x", "y"]),
    B("Marca"),
    B("Recorte", { locked: true }),
    B("Efeito"),
    T("OBS"),
  ];

  test("pula automáticas e herdadas do começo, mantém travadas do meio", () => {
    const layout = computeLayout(fields, 10);
    expect(layout.firstCodeIndex).toBe(3);
    expect(layout.pasteHeaders).toEqual(["Tema", "Marca", "Recorte", "Efeito", "OBS"]);
    expect(layout.pasteColLetter).toBe("N");
    expect(layout.lastColLetter).toBe("R");
    expect(layout.hasAutoBlock).toBe(true);
    expect(layout.autoFirstLetter).toBe("K");
    expect(layout.autoLastLetter).toBe("M");
  });

  test("sem bloco automático quando a primeira variável já é codificável", () => {
    const layout = computeLayout([S("Tema", ["x"]), B("Marca")], 4);
    expect(layout.firstCodeIndex).toBe(0);
    expect(layout.pasteColLetter).toBe("E");
    expect(layout.lastColLetter).toBe("F");
    expect(layout.hasAutoBlock).toBe(false);
  });

  test("defaults: booleana = false, resto = string vazia; travadas resetam", () => {
    const layout = computeLayout(fields, 0);
    expect(layout.defaults.Marca).toBe(false);
    expect(layout.defaults.Tema).toBe("");
    expect(layout.lockedResets).toEqual({ Auto1: false, Auto2: "", Recorte: false });
  });

  test("livro só de travadas não quebra", () => {
    const layout = computeLayout([B("A", { locked: true })], 0);
    expect(layout.firstCodeIndex).toBe(0);
    expect(layout.pasteFields).toHaveLength(1);
  });
});

describe("serializeValue", () => {
  const fmt = { no: "FALSE", yes: "TRUE" };
  test("booleana usa o formato binário escolhido", () => {
    expect(serializeValue({ M: true }, B("M"), fmt)).toBe("TRUE");
    expect(serializeValue({ M: false }, B("M"), fmt)).toBe("FALSE");
    expect(serializeValue({}, B("M"), fmt)).toBe("FALSE");
    expect(serializeValue({ M: true }, B("M"), { no: "0", yes: "1" })).toBe("1");
  });
  test("texto perde tab e quebra de linha, para não estourar a célula", () => {
    expect(serializeValue({ OBS: "a\tb\nc\r\nd" }, T("OBS"), fmt)).toBe("a b c d");
    expect(serializeValue({ OBS: "  x  " }, T("OBS"), fmt)).toBe("x");
    expect(serializeValue({}, T("OBS"), fmt)).toBe("");
  });
});

describe("buildPasteRows", () => {
  const fields = [B("Auto", { locked: true }), S("Tema", ["x"]), B("Marca"), T("OBS")];
  const layout = computeLayout(fields, 0);
  const rows = [
    { Tema: "x", Marca: true, OBS: "ok" },
    { Tema: "", Marca: false, OBS: "" },
  ];
  const fmt = { no: "FALSE", yes: "TRUE" };

  test("gera TSV só das colunas codificáveis, uma linha por registro", () => {
    expect(buildPasteRows(rows, layout, fmt)).toBe("x\tTRUE\tok\n\tFALSE\t");
  });
  test("com cabeçalho na primeira linha", () => {
    expect(buildPasteRows(rows, layout, fmt, true).split("\n")[0]).toBe("Tema\tMarca\tOBS");
  });
});

describe("buildRecords", () => {
  const fields = [B("Auto", { locked: true }), B("Marca"), T("OBS")];
  const codebook = { metaFields: [{ key: "ID" }], textField: "texto" };
  const layout = computeLayout(fields, 0);
  const source = [{ id: 1, ID: "A1", texto: "original", Marca: true }];

  test("aplica defaults, fonte e depois rascunho", () => {
    const [r] = buildRecords(source, layout, codebook, [{ Marca: false, OBS: "nota" }]);
    expect(r.Marca).toBe(false);
    expect(r.OBS).toBe("nota");
  });
  test("rascunho nunca sobrescreve texto, id nem metadados", () => {
    const [r] = buildRecords(source, layout, codebook, [{ texto: "x", ID: "Z", id: 9 }]);
    expect(r.texto).toBe("original");
    expect(r.ID).toBe("A1");
    expect(r.id).toBe(1);
  });
  test("travada volta ao padrão mesmo com rascunho antigo", () => {
    const [r] = buildRecords(source, layout, codebook, [{ Auto: true }]);
    expect(r.Auto).toBe(false);
  });
});

describe("missingRequiredFields", () => {
  const fields = [
    S("Tema", ["x"], { required: true }),
    B("Marca", { required: true }),
    T("OBS", { required: true }),
    T("Travada", { required: true, locked: true }),
    T("Herdada", { required: true, inherited: true }),
  ];
  test("select e texto vazios contam; booleana em qualquer estado não", () => {
    const missing = missingRequiredFields({ Tema: "", Marca: false, OBS: "  " }, fields);
    expect(missing.map((f) => f.key)).toEqual(["Tema", "OBS"]);
  });
  test("travadas e herdadas nunca contam", () => {
    const missing = missingRequiredFields({ Tema: "x", Marca: true, OBS: "n" }, fields);
    expect(missing).toHaveLength(0);
  });
  test("sem registro, sem faltas", () => {
    expect(missingRequiredFields(null, fields)).toEqual([]);
  });
});
