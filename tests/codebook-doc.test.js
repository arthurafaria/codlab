import { describe, expect, test } from "bun:test";
import { parseCodebookDoc, applyCodebookDoc } from "../lib/codebook-doc.js";

const KEYS = ["Desinfo_Incorrecoes", "Posicao_Politica", "Tema Principal", "Efeito_Panico", "OBS"];

const DOC = `LIVRO DE CÓDIGOS — DESINFORMAÇÃO
Documento distribuído aos codificadores da rodada de 2026.

1. Desinfo_Incorrecoes
A mensagem apresenta informação verificável e incorreta?
Marque quando houver afirmação checável que omite condição essencial ou
confunde causa com correlação. Não marque opinião.

2. Posicao_Politica
Posição política declarada do grupo de origem.
Opções: Esquerda | Direita | Indefinida

3. Tema Principal
Assunto que organiza a mensagem.
- Economia
- Saúde
- Segurança
- Outro

4. Efeito_Panico
A mensagem tende a provocar pânico?
Variável binária: marque sim quando o desfecho previsível for apreensão.

Anexo: dúvidas com a coordenação.`;

describe("parseCodebookDoc", () => {
  const doc = parseCodebookDoc(DOC, KEYS);

  test("acha cada variável mesmo com numeração antes", () => {
    expect(doc.matched.sort()).toEqual(
      ["Desinfo_Incorrecoes", "Efeito_Panico", "Posicao_Politica", "Tema Principal"].sort(),
    );
    expect(doc.unmatched).toEqual(["OBS"]);
  });

  test("a pergunta sai da linha com interrogação; o critério, do resto", () => {
    const e = doc.entries.Desinfo_Incorrecoes;
    expect(e.question).toBe("A mensagem apresenta informação verificável e incorreta?");
    expect(e.help).toContain("omite condição essencial");
    expect(e.help).not.toContain("A mensagem apresenta informação verificável");
  });

  test('linha "Opções:" vira lista de alternativas', () => {
    expect(doc.entries.Posicao_Politica.options).toEqual(["Esquerda", "Direita", "Indefinida"]);
  });

  test("lista de marcadores também vira alternativa", () => {
    expect(doc.entries["Tema Principal"].options).toEqual(["Economia", "Saúde", "Segurança", "Outro"]);
  });

  test('"variável binária" no texto marca a variável como booleana', () => {
    expect(doc.entries.Efeito_Panico.binary).toBe(true);
  });

  test("o texto inteiro fica guardado, inclusive o que não casou", () => {
    expect(doc.text).toContain("Anexo: dúvidas com a coordenação.");
  });

  test("acentuação e underline não impedem o casamento", () => {
    const alt = parseCodebookDoc("Tema principal\nAssunto que organiza.", ["Tema_Principal"]);
    expect(alt.matched).toEqual(["Tema_Principal"]);
  });
});

describe("applyCodebookDoc", () => {
  const campos = [
    { key: "Desinfo_Incorrecoes", type: "boolean", options: [], question: "Desinfo Incorrecoes", help: "" },
    { key: "Posicao_Politica", type: "boolean", options: [], question: "Posicao Politica", help: "" },
    { key: "Efeito_Panico", type: "select", options: ["a", "b"], question: "Efeito Panico", help: "" },
    { key: "Solta", type: "boolean", options: [], question: "Solta", help: "critério antigo" },
  ];
  const out = applyCodebookDoc(campos, parseCodebookDoc(DOC, campos.map((c) => c.key)));

  test("pergunta e critério do documento entram na ficha", () => {
    expect(out[0].question).toBe("A mensagem apresenta informação verificável e incorreta?");
    expect(out[0].help).toContain("omite condição essencial");
  });

  test("opções do documento transformam booleana em seleção", () => {
    expect(out[1]).toMatchObject({ type: "select", options: ["Esquerda", "Direita", "Indefinida"] });
  });

  test('"binária" no documento vence a seleção deduzida da planilha', () => {
    expect(out[2]).toMatchObject({ type: "boolean", options: [] });
  });

  test("variável ausente do documento fica como estava", () => {
    expect(out[3]).toEqual(campos[3]);
  });

  test("sem documento, nada muda", () => {
    expect(applyCodebookDoc(campos, null)).toBe(campos);
  });
});

// Regressões: casamento que parecia certo e entregava critério de outra variável.
describe("seções falsas e colisão de nome", () => {
  test("instrução numerada não vira seção e não corta a variável", () => {
    const doc = [
      "LIVRO",
      "1. Leia o material inteiro antes de marcar.",
      "2. Não combine respostas com o outro codificador.",
      "",
      "Desinfo_Emocional",
      "Recorre a apelo emocional?",
      "Critério verdadeiro da variável, que não pode ser cortado.",
    ].join("\n");
    const d = parseCodebookDoc(doc, ["Desinfo_Emocional"]);
    expect(d.entries.Desinfo_Emocional.help).toContain("não pode ser cortado");
    expect(d.freeSections.map((s) => s.label)).toEqual([]);
  });

  test("Tipo_URL não abocanha a seção de Tipo_URL_2", () => {
    const doc = "Tipo_URL_2\nSegunda classificação da URL?\nOpções: X | Y";
    const d = parseCodebookDoc(doc, ["Tipo_URL"]);
    expect(d.matched).toEqual([]);
    expect(d.freeSections.map((s) => s.label)).toEqual(["Tipo_URL_2"]);
  });

  test("mas a variável certa continua casando com a própria seção", () => {
    const doc = "Tipo_URL_2\nSegunda classificação?\nOpções: X | Y\n\nTipo_URL\nPrimeira?\nOpções: A | B";
    const d = parseCodebookDoc(doc, ["Tipo_URL", "Tipo_URL_2"]);
    expect(d.entries.Tipo_URL.options).toEqual(["A", "B"]);
    expect(d.entries.Tipo_URL_2.options).toEqual(["X", "Y"]);
  });

  test("nome colado na pergunta, como em PDF de tabela, continua casando", () => {
    const d = parseCodebookDoc("13 Tema_1Qual o tema predominante?", ["Tema_1"]);
    expect(d.entries.Tema_1.question).toBe("Qual o tema predominante?");
  });
});
