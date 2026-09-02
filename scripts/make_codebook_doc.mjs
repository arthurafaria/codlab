// Gera um livro de códigos de exemplo em .md, .docx e .pdf, casando com as
// colunas de scripts/make_test_workbook.mjs. Serve para testar o caminho de
// documento sem depender de arquivo de pesquisa real.
//
//   bun scripts/make_codebook_doc.mjs pasta/

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const VARIAVEIS = [
  ["Tipo_URL", "Que tipo de fonte a URL aponta?", "Classifique pelo domínio, não pelo conteúdo. Encurtador vale como a plataforma de destino quando ela for evidente.", "Opções: Mídias Sociais e Mensageria | Veículo Jornalístico | Outros"],
  ["Tema_Principal", "Qual assunto organiza a unidade?", "Escolha o tema que sustenta a conclusão. Se dois disputarem, vale o que a mensagem usa para fechar o argumento.", "Opções: Gestão Municipal | Saúde e Bem-estar | Segurança Urbana | Economia Local | Educação | Meio Ambiente | Outro"],
  ["Conteudo_Eleitoral", "A unidade trata de eleição, candidatura ou voto?", "Variável binária. Marque também menção indireta a pleito em curso. Não marque crítica genérica a governo.", null],
  ["Desinfo_Emocional", "Recorre a apelo emocional?", "Variável binária. Mobiliza medo, indignação, comoção ou esperança como via principal de persuasão, acima do argumento.", null],
  ["Desinfo_Urgencia", "Cria senso de urgência para agir ou repassar?", "Variável binária. Pede compartilhamento imediato, sugere janela curta de tempo ou alerta que o conteúdo será apagado.", null],
  ["Efeito_Panico", "Tende a provocar alarme no leitor?", "Variável binária. O desfecho previsível da leitura é apreensão sobre risco iminente a si ou aos próximos.", null],
  ["OBS", "Observações da codificação", "Campo livre. Use para dúvida, exceção ou recado à coordenação.", null],
];

const linhas = [];
linhas.push("LIVRO DE CÓDIGOS — RODADA PILOTO");
linhas.push("");
linhas.push("Documento distribuído aos codificadores. Cada seção começa pelo nome exato da coluna na planilha.");
linhas.push("");
VARIAVEIS.forEach(([chave, pergunta, criterio, opcoes], i) => {
  linhas.push(`${i + 1}. ${chave}`);
  linhas.push(pergunta);
  linhas.push(criterio);
  if (opcoes) linhas.push(opcoes);
  linhas.push("");
});
linhas.push("Dúvidas: procure a coordenação antes de codificar por conta própria.");
const texto = linhas.join("\n");

const dir = process.argv[2] || ".";
await mkdir(dir, { recursive: true });

await writeFile(path.join(dir, "livro-de-codigos.md"), texto, "utf8");

// DOCX mínimo, escrito à mão: um .docx é um zip com o XML do documento.
async function docx(destino, paragrafos) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  zip.file("[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
  zip.folder("_rels").file(".rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  zip.folder("word").file("document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragrafos
      .map((p) => `<w:p><w:r><w:t xml:space="preserve">${esc(p)}</w:t></w:r></w:p>`)
      .join("")}</w:body></w:document>`);
  await writeFile(destino, await zip.generateAsync({ type: "nodebuffer" }));
}
await docx(path.join(dir, "livro-de-codigos.docx"), texto.split("\n"));

// PDF mínimo, uma página por bloco de linhas, em WinAnsi.
function pdf(destino, linhasTexto) {
  const porPagina = 46;
  const paginas = [];
  for (let i = 0; i < linhasTexto.length; i += porPagina) paginas.push(linhasTexto.slice(i, i + porPagina));

  const objetos = [];
  const add = (corpo) => objetos.push(corpo) && objetos.length;
  const catalogo = add("");
  const paginasObj = add("");
  const fonte = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  const ids = [];
  for (const linhasDaPagina of paginas) {
    const conteudo = [
      "BT /F1 10 Tf 12 TL 40 780 Td",
      ...linhasDaPagina.map((l) => `(${l.replace(/([()\\])/g, "\\$1")}) Tj T*`),
      "ET",
    ].join("\n");
    const fluxo = add(`<< /Length ${Buffer.byteLength(conteudo, "latin1")} >>\nstream\n${conteudo}\nendstream`);
    const pagina = add(`<< /Type /Page /Parent ${paginasObj} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fonte} 0 R >> >> /Contents ${fluxo} 0 R >>`);
    ids.push(pagina);
  }
  objetos[catalogo - 1] = `<< /Type /Catalog /Pages ${paginasObj} 0 R >>`;
  objetos[paginasObj - 1] = `<< /Type /Pages /Kids [${ids.map((i) => `${i} 0 R`).join(" ")}] /Count ${ids.length} >>`;

  let out = "%PDF-1.4\n";
  const offsets = [0];
  objetos.forEach((corpo, i) => {
    offsets.push(Buffer.byteLength(out, "latin1"));
    out += `${i + 1} 0 obj\n${corpo}\nendobj\n`;
  });
  const xref = Buffer.byteLength(out, "latin1");
  out += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objetos.length; i += 1) out += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${objetos.length + 1} /Root ${catalogo} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return writeFile(destino, Buffer.from(out, "latin1"));
}
// WinAnsi cobre a acentuação do português, então o PDF sai igual aos outros.
await pdf(path.join(dir, "livro-de-codigos.pdf"), texto.split("\n"));

console.log(`${dir}: livro-de-codigos.md, .docx e .pdf (${VARIAVEIS.length} variáveis)`);
