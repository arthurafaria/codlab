// Livro de códigos como documento: PDF, DOCX, Markdown ou texto.
//
// A planilha diz QUAIS variáveis existem. O documento diz POR QUE cada uma se
// marca. Aqui o documento é lido no navegador, quebrado por variável e colado
// em cada campo da ficha; o texto inteiro fica guardado para o codificador
// abrir a qualquer momento.
//
// A leitura é heurística de propósito: livro de códigos não tem formato padrão.
// O que não casar com nenhuma variável continua acessível no painel completo.

const strip = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

// "Desinfo_Incorrecoes" e "Desinfo Incorreções" viram a mesma chave de busca.
const canon = (s) => strip(s).replace(/[_\-\s]+/g, " ").trim();

// Tira numeração, marcador e negrito de Markdown do começo da linha.
const undecorate = (line) =>
  String(line)
    .replace(/^\s*[#>]+\s*/, "")
    .replace(/^\s*(?:[-*•‣–]|\d+[.)]|[a-z][.)])\s+/i, "")
    .replace(/\*\*/g, "")
    .replace(/^\s*`+|`+\s*$/g, "")
    .trim();

const OPTION_LABELS = ["opcoes", "opções", "opcao", "categorias", "valores", "options", "values"];
const BINARY_WORDS = ["binaria", "binária", "booleana", "sim/nao", "sim/não", "yes/no", "dicotomica", "dicotômica"];

// "Opções: A | B | C" ou "Valores: A, B, C"
function readOptionLine(line) {
  const m = line.match(/^\s*([^:]{2,20}):\s*(.+)$/);
  if (!m) return null;
  if (!OPTION_LABELS.includes(strip(m[1]).trim())) return null;
  const parts = m[2]
    .split(/[|;,/]/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && p.length <= 60);
  return parts.length >= 2 ? parts : null;
}

export function extractTextFromMarkdown(text) {
  return String(text).replace(/\r\n?/g, "\n");
}

// Lê o arquivo no navegador. Só o PDF puxa dependência, e sob demanda.
export async function extractDocText(file, { workerSrc } = {}) {
  const name = (file.name || "").toLowerCase();

  if (name.endsWith(".md") || name.endsWith(".markdown") || name.endsWith(".txt")) {
    return extractTextFromMarkdown(await file.text());
  }

  if (name.endsWith(".docx")) {
    const mammoth = (await import("mammoth/mammoth.browser")).default;
    const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return extractTextFromMarkdown(value);
  }

  if (name.endsWith(".pdf")) {
    // Build legacy: o principal do pdf.js v6 não sobrevive ao empacotamento
    // estático do Next. O worker é copiado para public/ no build.
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    if (workerSrc) pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    // Quem sabe se destruir é a tarefa de carregamento, não o documento.
    const task = pdfjs.getDocument({
      data: await file.arrayBuffer(),
      isEvalSupported: false,
      useSystemFonts: false,
    });
    const doc = await task.promise;
    const pages = [];
    for (let i = 1; i <= doc.numPages; i += 1) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      // Reconstrói linhas pelo Y de cada trecho: o PDF não guarda parágrafos.
      const linhas = new Map();
      for (const item of content.items) {
        if (!item.str) continue;
        const y = Math.round(item.transform[5]);
        linhas.set(y, (linhas.get(y) || "") + item.str);
      }
      pages.push(
        [...linhas.entries()]
          .sort((a, b) => b[0] - a[0])
          .map(([, t]) => t.trim())
          .filter(Boolean)
          .join("\n"),
      );
    }
    await task.destroy();
    return pages.join("\n\n");
  }

  throw Object.assign(new Error("formato não suportado"), { code: "docFormat" });
}

// Corta o documento por variável: cada chave encontrada abre um trecho que vai
// até a próxima. O que sobra antes da primeira é preâmbulo.
export function parseCodebookDoc(text, keys = []) {
  const lines = String(text).replace(/\r\n?/g, "\n").split("\n");
  const byCanon = new Map();
  for (const key of keys) byCanon.set(canon(key), key);

  const marks = [];
  lines.forEach((raw, index) => {
    const line = undecorate(raw);
    if (!line) return;
    const c = canon(line);
    if (!c) return;
    // A linha nomeia a variável se começa por ela e o que sobra é pontuação
    // ou um rótulo curto (o título da variável, no mesmo parágrafo).
    for (const [needle, key] of byCanon) {
      if (needle.length < 3) continue;
      if (c === needle || c.startsWith(`${needle} `) || c.startsWith(`${needle}:`)) {
        marks.push({ index, key, rest: line.slice(needle.length).replace(/^[\s:.\-–—]+/, "").trim() });
        return;
      }
    }
  });

  const entries = {};
  marks.forEach((mark, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].index : lines.length;
    const body = lines
      .slice(mark.index + 1, end)
      .map((l) => l.replace(/\s+$/, ""))
      .join("\n")
      .trim();

    const all = [mark.rest, body].filter(Boolean).join("\n");
    const bodyLines = all.split("\n").map((l) => l.trim()).filter(Boolean);

    let options = null;
    const keptLines = [];
    for (const line of bodyLines) {
      const found = readOptionLine(line);
      if (found && !options) options = found;
      else keptLines.push(undecorate(line));
    }

    // Sem linha "Opções:", uma lista de marcadores curtos também serve.
    if (!options) {
      const bullets = bodyLines
        .filter((l) => /^\s*[-*•‣–]\s+/.test(l))
        .map((l) => undecorate(l))
        .filter((l) => l.length > 0 && l.length <= 60);
      if (bullets.length >= 2) options = bullets;
    }

    const first = mark.rest || keptLines[0] || "";
    const isQuestion = /\?\s*$/.test(first) && first.length <= 160;
    // A linha promovida a pergunta sai do critério: senão o codificador lê a
    // mesma frase duas vezes, uma como pergunta e outra no começo do critério.
    const proseLines = isQuestion && !mark.rest ? keptLines.slice(1) : keptLines;
    const prose = proseLines.join(" ").replace(/\s+/g, " ").trim();

    entries[mark.key] = {
      question: isQuestion ? first : "",
      help: prose,
      options: options && options.length >= 2 ? options : null,
      binary: BINARY_WORDS.some((w) => strip(prose).includes(w)),
    };
  });

  return {
    entries,
    matched: Object.keys(entries),
    unmatched: keys.filter((k) => !entries[k]),
    text: String(text).trim(),
  };
}

// Aplica o documento sobre as variáveis. O documento manda no critério e nas
// opções; a planilha continua mandando na ordem e no nome da coluna.
export function applyCodebookDoc(editableFields, parsed) {
  if (!parsed) return editableFields;
  return editableFields.map((field) => {
    const entry = parsed.entries[field.key];
    if (!entry) return field;

    let type = field.type;
    let options = field.options;
    if (entry.options) {
      options = entry.options;
      if (type !== "multi") type = "select";
    } else if (entry.binary) {
      type = "boolean";
      options = [];
    }

    return {
      ...field,
      type,
      options,
      question: entry.question || field.question,
      help: entry.help || field.help,
      fromDoc: true,
    };
  });
}
