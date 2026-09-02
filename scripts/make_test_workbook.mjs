// Gera uma planilha de teste no formato "uma aba por codificador", sem aba
// variables: é o caso que o importador deduz. Conteúdo 100% fictício.
//
//   bun scripts/make_test_workbook.mjs [destino.xlsx]

import * as XLSX from "xlsx";

const CANAIS = ["Moradores · Vila Aurora", "Bairro Novo Horizonte", "Comércio Central AV", "Escola Meridiano", "Torcida Aurora FC"];
const OUTLETS = ["WhatsApp", "Portal Aurora", "Rede Meridiano", "Canal Bússola", "Diário do Vale", "TV Alvorada"];
const TIPO_URL = ["Mídias Sociais e Mensageria", "Veículo Jornalístico", "Outros"];
const TEMAS = ["Gestão Municipal", "Saúde e Bem-estar", "Segurança Urbana", "Economia Local", "Educação", "Meio Ambiente", "Outro"];

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
  "Conteudo_Eleitoral", "Conteudo_Discriminatorio",
  "Desinfo_Incorrecoes", "Desinfo_Estatisticas", "Desinfo_Negacionismo", "Desinfo_Emocional",
  "Desinfo_Enviesamento", "Desinfo_Maniqueismo", "Desinfo_Personalismo", "Desinfo_Demonizacao",
  "Desinfo_ForaContexto", "Desinfo_Urgencia", "Desinfo_Conspiracao", "Desinfo_Autoridade",
  "Efeito_Panico", "Efeito_Intolerancia", "Efeito_InfluenciaEleicoes", "Efeito_Opiniao",
  "Efeito_ConfiancaInstituicoes", "Efeito_Radicalismo",
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

function sheetFor(coder, seed, { coded }) {
  const rand = rng(seed);
  return Array.from({ length: 60 }, (_, i) => {
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
    for (const key of BOOLEANAS) {
      row[key] = coded ? (rand() > 0.78 ? "TRUE" : "FALSE") : "FALSE";
    }
    row.OBS = coded && rand() > 0.9 ? "conferir com o orientador" : "";
    return row;
  });
}

const abas = [
  ["Amostra", 11, false],
  ["Amostra_Ana", 23, true],
  ["Amostra_Bruno", 37, true],
  ["Amostra_Carla", 53, true],
];

const book = XLSX.utils.book_new();
for (const [name, seed, coded] of abas) {
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(sheetFor(name, seed, { coded })), name);
}

const out = process.argv[2] || "teste-uma-aba-por-codificador.xlsx";
XLSX.writeFile(book, out);
console.log(`${out}: ${abas.length} abas, 60 linhas cada, 23 variáveis depois da coluna texto`);
