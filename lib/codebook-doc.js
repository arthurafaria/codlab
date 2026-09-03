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

// Versão da linha canonizada junto com o índice de cada caractere no original.
// Sem esse mapa não dá para saber onde o nome da variável termina no texto de
// verdade: acento e underline mudam o tamanho da string.
function canonWithMap(line) {
  const out = [];
  const map = [];
  let lastWasSpace = true; // corta espaço inicial
  for (let i = 0; i < line.length; i += 1) {
    const raw = line[i];
    const norm = strip(raw);
    if (norm === "") continue; // acento isolado some
    const isSep = /[_\-\s]/.test(raw);
    if (isSep) {
      if (lastWasSpace) continue;
      out.push(" ");
      map.push(i);
      lastWasSpace = true;
      continue;
    }
    out.push(norm);
    map.push(i);
    lastWasSpace = false;
  }
  while (out.length && out[out.length - 1] === " ") {
    out.pop();
    map.pop();
  }
  map.push(line.length); // fim, para fatiar depois da última letra
  return { canon: out.join(""), map };
}

// Tira do começo da linha: marcador, negrito de Markdown e a numeração da
// linha da tabela, que em PDF vem como "07 " colado no nome da variável.
const undecorate = (line) =>
  String(line)
    .replace(/^\s*[#>]+\s*/, "")
    .replace(/^\s*(?:[-*•‣–]|\d{1,3}[.)]|[a-z][.)])\s+/i, "")
    .replace(/^\s*\d{1,3}\s+(?=\S)/, "")
    .replace(/\*\*/g, "")
    .replace(/^\s*`+|`+\s*$/g, "")
    .trim();

const OPTION_LABELS = ["opcoes", "opções", "opcao", "categorias", "valores", "options", "values"];
// Sobras de extração de PDF: "(0.000)" e parênteses que ficaram vazios.
const PDF_NOISE = /\(\s*\d+[.,]\d+\s*\)|\(\s*\)/g;
// "(1) Esquerda (2) Direita", a convenção de livro de códigos em tabela.
const NUMBERED_OPTION = /\((\d{1,2})\)\s*([^()\n]{1,60})/g;
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
// Toda linha que parece abrir uma seção de variável, tenha ou não coluna
// correspondente na planilha. Serve para a tela oferecer o de-para quando o
// livro e a planilha usam nomes diferentes (Funcao_Panico vs Efeito_Panico).
const SECTION_TOKEN = /^([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9]*(?:_[A-Za-zÀ-ÿ0-9]+)+|[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9_]{2,})/;

// Em PDF de tabela o nome da variável cola na primeira palavra da descrição:
// "Funcao_PanicoRefere". Corta na virada minúscula/maiúscula do último trecho,
// e devolve o pedaço cortado para ele voltar ao texto da descrição.
function splitRunOn(label) {
  const partes = label.split("_");
  const ultima = partes[partes.length - 1];
  const m = ultima.match(/^(.*[a-zà-ÿ])([A-ZÀ-Þ][a-zà-ÿ]{2,})$/);
  if (!m) return { label, tail: "" };
  partes[partes.length - 1] = m[1];
  return { label: partes.join("_"), tail: m[2] };
}

export function findSections(text) {
  const lines = String(text).replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  lines.forEach((raw, index) => {
    const numbered = /^\s*\d{1,3}[\s.)]+\S/.test(raw);
    const line = undecorate(raw);
    if (!line) return;
    const m = line.match(SECTION_TOKEN);
    if (!m) return;
    const label = m[1];
    // Ou a linha vinha numerada como item de tabela, ou o nome tem underline.
    if (!numbered && !label.includes("_")) return;
    if (label.length < 3) return;
    const corte = splitRunOn(label);
    const resto = line.slice(label.length).replace(/^[\s:.\-–—]+/, "").trim();
    out.push({
      label: corte.label,
      index,
      rest: [corte.tail, resto].filter(Boolean).join(" ").trim(),
    });
  });
  return out;
}

export function parseCodebookDoc(text, keys = [], aliases = {}) {
  const lines = String(text).replace(/\r\n?/g, "\n").split("\n");

  // Chave mais longa primeiro: senão "Tipo_URL" rouba a seção de "Tipo_URL_1".
  const needles = keys
    .map((key) => ({ key, needle: canon(key) }))
    .filter((n) => n.needle.length >= 3)
    .sort((a, b) => b.needle.length - a.needle.length);

  const marks = [];
  const usados = new Set();

  // De-para manual primeiro: o que o pesquisador ligou na tela vence o palpite.
  const sections = findSections(text);
  for (const [key, index] of Object.entries(aliases)) {
    const sec = sections.find((s) => s.index === Number(index));
    if (!sec || !keys.includes(key)) continue;
    marks.push({ index: sec.index, key, rest: sec.rest });
    usados.add(key);
  }

  lines.forEach((raw, index) => {
    if (marks.some((m) => m.index === index)) return;
    const line = undecorate(raw);
    if (!line) return;
    const { canon: c, map } = canonWithMap(line);
    if (!c) return;
    for (const { needle, key } of needles) {
      if (usados.has(key)) continue;
      // Em PDF de tabela o nome cola na pergunta ("Tema_1Qual o tema..."), então
      // basta a linha começar pelo nome; não exigimos separador depois dele.
      if (!c.startsWith(needle)) continue;
      const rest = line.slice(map[needle.length] ?? line.length).replace(/^[\s:.\-–—]+/, "").trim();
      marks.push({ index, key, rest });
      usados.add(key);
      return;
    }
  });

  // Todas as marcas, na ordem do documento, para o bloco de cada uma terminar
  // onde a próxima começa, mesmo com o de-para entrando fora de ordem.
  marks.sort((a, b) => a.index - b.index);
  const limites = [...new Set([...marks.map((m) => m.index), ...sections.map((s) => s.index)])].sort(
    (a, b) => a - b,
  );

  const entries = {};
  marks.forEach((mark) => {
    const end = limites.find((i) => i > mark.index) ?? lines.length;
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

    // Convenção de tabela: "(1) Esquerda (2) Direita" espalhado pelo bloco,
    // muitas vezes colado no texto da pergunta por causa das colunas do PDF.
    let numbered = null;
    if (!options) {
      const encontradas = [];
      const limpas = keptLines.map((l) =>
        l.replace(NUMBERED_OPTION, (_, n, label) => {
          const t = label.trim().replace(/\s+/g, " ");
          if (t) encontradas.push({ n: Number(n), t });
          return " ";
        }),
      );
      if (encontradas.length >= 2) {
        // Rótulo quebrado entre linhas volta a ser um só, pela ordem do número.
        const porNumero = new Map();
        for (const { n, t } of encontradas) porNumero.set(n, ((porNumero.get(n) || "") + " " + t).trim());
        numbered = [...porNumero.entries()].sort((a, b) => a[0] - b[0]).map(([, t]) => t);
        options = numbered;
        keptLines.length = 0;
        keptLines.push(...limpas);
      }
    }

    // Com colunas de PDF, a pergunta pode ter sido partida entre linhas: junta
    // tudo até o primeiro "?" e usa isso como pergunta.
    const juntas = keptLines.join(" ").replace(PDF_NOISE, " ").replace(/\s+/g, " ").trim();
    const corte = juntas.indexOf("?");
    const perguntaJunta = corte > 0 && corte <= 200 ? juntas.slice(0, corte + 1).trim() : "";

    const first = mark.rest || keptLines[0] || "";
    const isQuestion = /\?\s*$/.test(first) && first.length <= 160;
    // A linha promovida a pergunta sai do critério: senão o codificador lê a
    // mesma frase duas vezes, uma como pergunta e outra no começo do critério.
    const proseLines = isQuestion && !mark.rest ? keptLines.slice(1) : keptLines;
    let question = isQuestion ? first : "";
    let prose = proseLines.join(" ").replace(PDF_NOISE, " ").replace(/\s+/g, " ").trim();

    // Nada terminou em "?" numa linha só, mas o bloco tem uma pergunta inteira.
    if (!question && perguntaJunta) {
      question = perguntaJunta;
      prose = juntas.slice(corte + 1).trim();
    }

    const opcoes = options && options.length >= 2 ? options : null;
    // "(0) Não (1) Sim" é variável binária, mesmo sem a palavra escrita.
    const parNaoSim =
      opcoes &&
      opcoes.length === 2 &&
      opcoes.every((o) => ["nao", "sim", "no", "yes", "false", "true"].includes(strip(o).trim()));

    entries[mark.key] = {
      question,
      help: prose,
      options: parNaoSim ? null : opcoes,
      binary: parNaoSim || BINARY_WORDS.some((w) => strip(prose).includes(w)),
    };
  });

  const matched = Object.keys(entries);
  const usadas = new Set(marks.map((m) => m.index));
  return {
    entries,
    matched,
    unmatched: keys.filter((k) => !entries[k]),
    // Seções do documento que sobraram, para oferecer no de-para.
    freeSections: sections.filter((s) => !usadas.has(s.index)),
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
