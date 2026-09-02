// Gera o livro de códigos de exemplo em .md, .docx e .pdf, casando com as
// colunas de scripts/make_test_workbook.mjs. O texto e o .docx vêm de
// lib/samples.js, os mesmos que a página do guia oferece para download; só o
// PDF é feito aqui, porque só o teste precisa dele.
//
//   bun scripts/make_codebook_doc.mjs pasta/

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildCodebookText, buildCodebookDocx, CODEBOOK_VARIABLES } from "../lib/samples.js";

const texto = buildCodebookText();

const dir = process.argv[2] || ".";
await mkdir(dir, { recursive: true });

await writeFile(path.join(dir, "livro-de-codigos.md"), texto, "utf8");

const zip = await buildCodebookDocx(texto);
await writeFile(path.join(dir, "livro-de-codigos.docx"), await zip.generateAsync({ type: "nodebuffer" }));

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

console.log(`${dir}: livro-de-codigos.md, .docx e .pdf (${CODEBOOK_VARIABLES.length} variáveis)`);
