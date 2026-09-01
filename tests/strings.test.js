import { describe, expect, test } from "bun:test";
import { strings, fmt } from "../lib/strings.js";
import { BINARY_FORMATS } from "../lib/coding.js";

const flat = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) => (v && typeof v === "object" ? flat(v, `${prefix}${k}.`) : [`${prefix}${k}`]));

describe("dicionários", () => {
  test("pt e en têm exatamente as mesmas chaves", () => {
    const pt = flat(strings.pt).sort();
    const en = flat(strings.en).sort();
    expect(en).toEqual(pt);
    expect(pt.length).toBeGreaterThan(100);
  });

  // O traço curto (–) fica permitido para intervalo de colunas, como "K–N".
  test("nenhum texto de interface usa travessão", () => {
    const offenders = ["pt", "en"].flatMap((lang) =>
      flat(strings[lang]).filter((key) => {
        const value = key.split(".").reduce((o, k) => o[k], strings[lang]);
        return /—/.test(value);
      }).map((k) => `${lang}.${k}`),
    );
    expect(offenders).toEqual([]);
  });

  test("placeholders batem entre pt e en", () => {
    const holes = (s) => (String(s).match(/\{\w+\}/g) || []).sort();
    for (const key of flat(strings.pt)) {
      const pt = key.split(".").reduce((o, k) => o[k], strings.pt);
      const en = key.split(".").reduce((o, k) => o[k], strings.en);
      expect({ key, holes: holes(en) }).toEqual({ key, holes: holes(pt) });
    }
  });
});

describe("fmt", () => {
  test("substitui chaves e deixa as desconhecidas visíveis", () => {
    expect(fmt("Registro {i}/{n}", { i: 1, n: 30 })).toBe("Registro 1/30");
    expect(fmt("{a} e {b}", { a: 0 })).toBe("0 e {b}");
  });
});

describe("formatos binários", () => {
  test("todo formato tem no e yes distintos", () => {
    for (const [name, f] of Object.entries(BINARY_FORMATS)) {
      expect({ name, ok: f.no !== f.yes && !!f.no && !!f.yes }).toEqual({ name, ok: true });
    }
  });
});
