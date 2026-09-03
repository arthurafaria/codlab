// Planilha de teste no formato "uma aba por codificador", sem aba variables.
// O conteúdo vem de lib/samples.js, o mesmo que a página do guia oferece.
//
//   bun scripts/make_test_workbook.mjs [destino.xlsx]

import * as XLSX from "xlsx";
import { buildSampleWorkbook, SAMPLE_SHEETS, SAMPLE_ROWS, CODEBOOK_VARIABLES } from "../lib/samples.js";

const out = process.argv[2] || "teste-uma-aba-por-codificador.xlsx";
XLSX.writeFile(buildSampleWorkbook(), out);
console.log(
  `${out}: ${SAMPLE_SHEETS.length} abas, ${SAMPLE_ROWS} linhas cada, ${CODEBOOK_VARIABLES.length} variáveis depois da coluna texto`,
);
