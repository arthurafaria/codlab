// Arquivos de exemplo, gerados no navegador e também pelos scripts de teste.
// Ficam aqui para a página do guia e o e2e usarem exatamente o mesmo material.

import * as XLSX from "xlsx";

// --- Planilha de exemplo: uma aba por codificador, sem aba de variáveis -------

const CANAIS = [
  "Moradores · Vila Aurora",
  "Bairro Novo Horizonte",
  "Comércio Central AV",
  "Escola Meridiano",
  "Torcida Aurora FC",
];
const OUTLETS = ["WhatsApp", "Portal Aurora", "Rede Meridiano", "Canal Bússola", "Diário do Vale", "TV Alvorada"];
const TIPO_URL = ["Mídias Sociais e Mensageria", "Veículo Jornalístico", "Outros"];
const TEMAS = [
  "Gestão Municipal",
  "Saúde e Bem-estar",
  "Segurança Urbana",
  "Economia Local",
  "Educação",
  "Meio Ambiente",
  "Outro",
];

const TEXTOS = [
  "A reforma da ponte do Córrego Fundo foi adiada de novo. Terceira vez no ano.",
  "URGENTE!! Vão cortar a merenda da tarde a partir da semana que vem. REPASSEM.",
  "Nova regra de horário da feira livre. O decreto está na íntegra no fim da página.",
  "O posto do Novo Horizonte volta a atender aos sábados, das 8h às 12h.",
  "Instalaram 14 câmeras na praça e a criminalidade caiu 60%. Ou seja: funciona.",
  "Aquele áudio sobre chá de folha curar diabetes é antigo e já foi desmentido.",
  "A verba de reforma do vestiário saiu em janeiro e ninguém sabe onde foi parar.",
  "Olha a fila do posto hoje. Enquanto isso aprovaram aumento pra eles mesmos.",
  "Prazo de rematrícula até dia 18. Quem perder entra na fila de remanejamento.",
  "Tem gente grande comprando terreno ao lado do aterro há dois anos, calados.",
  "Reunião da associação sexta às 19h. Pauta única: estacionamento rotativo.",
  "Estudo da universidade diz que a recuperação da nascente é viável em cinco anos.",
  "Golpe novo na região: ligam dizendo que são do banco e pedem o código do cartão.",
  "Troca das lâmpadas da Rua das Acácias começa segunda. São 40 pontos.",
  "Quem ainda acredita em pesquisa nessa cidade? Encomendam e recebem o número.",
  "A professora Marlene se aposenta sexta depois de 31 anos. Homenagem às 10h.",
  "Nova faixa do imposto sobre serviços entra em vigor em julho.",
  "Dizem que vão fechar a UBS e transferir tudo. Alguém consegue checar?",
  "Coleta seletiva passa a ser às terças e sextas a partir do dia 20.",
  "Se o time não subir, a culpa é toda do técnico. Podem me cobrar em dezembro.",
];

const BOOLEANAS = [
  "Conteudo_Eleitoral",
  "Conteudo_Discriminatorio",
  "Desinfo_Incorrecoes",
  "Desinfo_Estatisticas",
  "Desinfo_Negacionismo",
  "Desinfo_Emocional",
  "Desinfo_Enviesamento",
  "Desinfo_Maniqueismo",
  "Desinfo_Personalismo",
  "Desinfo_Demonizacao",
  "Desinfo_ForaContexto",
  "Desinfo_Urgencia",
  "Desinfo_Conspiracao",
  "Desinfo_Autoridade",
  "Efeito_Panico",
  "Efeito_Intolerancia",
  "Efeito_InfluenciaEleicoes",
  "Efeito_Opiniao",
  "Efeito_ConfiancaInstituicoes",
  "Efeito_Radicalismo",
];

// Gerador determinístico: rodar duas vezes dá o mesmo arquivo.
function rng(seed) {
  let x = seed;
  return () => ((x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

// Data e hora saem como número de série do Excel de propósito: é assim que a
// planilha real chega, e o importador precisa saber converter.
const serialDate = (i) => 46023 + (i % 90);
const serialTime = (r) => Math.round(r * 86400) / 86400;

export const SAMPLE_ROWS = 10;

function rowsFor(seed, { coded, rows = SAMPLE_ROWS }) {
  const rand = rng(seed);
  return Array.from({ length: rows }, (_, i) => {
    const row = {
      ID: i + 1,
      dia: serialDate(i),
      hora: serialTime(rand()),
      grupo: CANAIS[i % CANAIS.length],
      telefone: `+55 11 95550-${String(100 + (i % 50)).padStart(4, "0")}`,
      Link: i % 3 === 0 ? `https://portal.exemplo.test/nota/${1000 + i}` : "",
      Outlet: OUTLETS[i % OUTLETS.length],
      texto: TEXTOS[i % TEXTOS.length],
      Tipo_URL: TIPO_URL[i % TIPO_URL.length],
      Tema_Principal: coded ? TEMAS[Math.floor(rand() * TEMAS.length)] : "",
      Tema_Secundario: coded && rand() > 0.6 ? TEMAS[Math.floor(rand() * TEMAS.length)] : "",
    };
    for (const key of BOOLEANAS) row[key] = coded ? (rand() > 0.78 ? "TRUE" : "FALSE") : "FALSE";
    row.OBS = coded && rand() > 0.9 ? "conferir com o orientador" : "";
    return row;
  });
}

export const SAMPLE_SHEETS = [
  ["Amostra", 11, false],
  ["Amostra_Ana", 23, true],
  ["Amostra_Bruno", 37, true],
  ["Amostra_Carla", 53, true],
];

export function buildSampleWorkbook({ rows = SAMPLE_ROWS } = {}) {
  const book = XLSX.utils.book_new();
  for (const [name, seed, coded] of SAMPLE_SHEETS) {
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rowsFor(seed, { coded, rows })), name);
  }
  return book;
}

// --- Livro de códigos de exemplo ---------------------------------------------

export const CODEBOOK_VARIABLES = [
  [
    "Tipo_URL",
    "Que tipo de fonte a URL aponta?",
    "Classifique pelo domínio, não pelo conteúdo. Encurtador vale como a plataforma de destino quando ela for evidente.",
    "Opções: Mídias Sociais e Mensageria | Veículo Jornalístico | Outros",
  ],
  [
    "Tema_Principal",
    "Qual assunto organiza a unidade?",
    "Escolha o tema que sustenta a conclusão. Se dois disputarem, vale o que a mensagem usa para fechar o argumento.",
    "Opções: Gestão Municipal | Saúde e Bem-estar | Segurança Urbana | Economia Local | Educação | Meio Ambiente | Outro",
  ],
  [
    "Conteudo_Eleitoral",
    "A unidade trata de eleição, candidatura ou voto?",
    "Variável binária. Marque também menção indireta a pleito em curso. Não marque crítica genérica a governo.",
    null,
  ],
  [
    "Desinfo_Emocional",
    "Recorre a apelo emocional?",
    "Variável binária. Mobiliza medo, indignação, comoção ou esperança como via principal de persuasão, acima do argumento.",
    null,
  ],
  [
    "Desinfo_Urgencia",
    "Cria senso de urgência para agir ou repassar?",
    "Variável binária. Pede compartilhamento imediato, sugere janela curta de tempo ou alerta que o conteúdo será apagado.",
    null,
  ],
  [
    "Efeito_Panico",
    "Tende a provocar alarme no leitor?",
    "Variável binária. O desfecho previsível da leitura é apreensão sobre risco iminente a si ou aos próximos.",
    null,
  ],
  [
    "OBS",
    "Observações da codificação",
    "Campo livre. Use para dúvida, exceção ou recado à coordenação.",
    null,
  ],
];

export function buildCodebookText() {
  const linhas = [
    "LIVRO DE CÓDIGOS — RODADA PILOTO",
    "",
    "Documento distribuído aos codificadores. Cada seção começa pelo nome exato da coluna na planilha.",
    "",
  ];
  CODEBOOK_VARIABLES.forEach(([chave, pergunta, criterio, opcoes], i) => {
    linhas.push(`${i + 1}. ${chave}`, pergunta, criterio);
    if (opcoes) linhas.push(opcoes);
    linhas.push("");
  });
  linhas.push("Dúvidas: procure a coordenação antes de codificar por conta própria.");
  return linhas.join("\n");
}

// Um .docx é um zip com o XML do documento. Três arquivos bastam para o
// mammoth ler o texto, que é tudo que o CodLAB precisa.
export async function buildCodebookDocx(text = buildCodebookText()) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
  );
  zip.folder("_rels").file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
  );
  zip.folder("word").file(
    "document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${text
      .split("\n")
      .map((p) => `<w:p><w:r><w:t xml:space="preserve">${esc(p)}</w:t></w:r></w:p>`)
      .join("")}</w:body></w:document>`,
  );
  return zip;
}
