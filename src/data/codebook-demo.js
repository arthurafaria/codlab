// Livro de Códigos — AMOSTRA DEMONSTRATIVA (fictícia).
//
// Espelha exatamente a estrutura do livro de códigos real: mesmos grupos, mesmos
// tipos de variável, mesma mecânica de colunas automatizadas (locked) e herdadas
// (inherited). Só os nomes e o conteúdo são fantasia — nada aqui é dado de pesquisa.
//
// Existe para apresentação institucional: mostra a plataforma funcionando sem
// expor telefone, grupo ou material codificado de participante real.

export const idField = "ID";
export const textField = "texto";

export const metaFields = [
  { key: "ID", label: "ID" },
  { key: "dia", label: "Data" },
  { key: "hora", label: "Hora" },
  { key: "grupo", label: "Canal" },
  { key: "telefone", label: "Remetente" },
  { key: "Outlet", label: "Plataforma" },
  { key: "Link", label: "Link" },
];

const ASSUNTOS = [
  "Gestão Municipal",
  "Saúde e Bem-estar",
  "Segurança Urbana",
  "Direitos e Cidadania",
  "Cultura e Tradição",
  "Meio Ambiente",
  "Economia Local",
  "Educação",
  "Ciência e Tecnologia",
  "Esporte e Celebridades",
  "Outro",
];

// A ORDEM deste array é a ordem das colunas na planilha — não reordene.
export const editableFields = [
  // --- Conjunto 1: Herdadas (pré-preenchidas) ---
  {
    key: "Midia_Bin",
    header: "Midia",
    group: "Origem da mensagem",
    type: "boolean",
    locked: true,
    lockedNote: "será automatizada · não preencher",
    question: "A mensagem contém mídia anexada?",
    help: "AUTOMATIZADA — não codificar. Preenchida por processo automático; fica no bloco só para o alinhamento das colunas.",
  },
  {
    key: "Perfil_Emissor",
    header: "Perfil_Emissor",
    group: "Origem da mensagem",
    type: "select",
    locked: true,
    lockedNote: "será automatizada · não preencher",
    question: "Perfil declarado do canal de origem",
    help: "AUTOMATIZADA — não codificar. Derivada dos metadados do canal.",
    options: ["Aberto", "Restrito"],
  },
  {
    key: "Categoria_Fonte",
    header: "Categoria_Fonte",
    group: "Origem da mensagem",
    type: "select",
    locked: true,
    lockedNote: "será automatizada · não preencher",
    question: "Categoria da fonte informacional do link",
    help: "AUTOMATIZADA — não codificar. Classificada por processo automático a partir do domínio.",
    options: ["Veículo Jornalístico", "Plataformas e Mensageria", "Institucional", "Não identificada"],
  },
  {
    key: "Categoria_Fonte_2",
    header: "Categoria_Fonte_2",
    group: "Não preencher",
    inherited: true,
    type: "text",
    question: "Categoria da fonte (coluna herdada)",
    help: "Herdada da etapa anterior. Aparece só como leitura, para conferência.",
  },

  // --- Conjunto 2: Caracterização ---
  {
    key: "Assunto_1",
    header: "Assunto_1",
    group: "Caracterização",
    type: "select",
    question: "Assunto predominante da mensagem",
    help: "Escolha o tema que organiza a mensagem como um todo. Se dois disputarem, o predominante é o que sustenta a conclusão.",
    options: ASSUNTOS,
  },
  {
    key: "Assunto_2",
    header: "Assunto_2",
    group: "Caracterização",
    type: "select",
    question: "Assunto secundário (se houver)",
    help: "Preencha apenas quando um segundo tema for claramente mobilizado. Caso contrário, deixe em branco.",
    options: ASSUNTOS,
  },
  {
    key: "Conteudo_Institucional",
    header: "Conteudo_Institucional",
    group: "Caracterização",
    type: "boolean",
    question: "A mensagem menciona órgão ou serviço público?",
    help: "Vale citação nominal (prefeitura, posto de saúde, escola, conselho) ou referência inequívoca a um serviço público.",
  },
  {
    key: "Conteudo_Sensivel",
    header: "Conteudo_Sensivel",
    group: "Caracterização",
    type: "boolean",
    question: "A mensagem trata de grupo social específico?",
    help: "Marque quando um grupo é o sujeito da mensagem — não quando aparece apenas de passagem.",
  },

  // --- Conjunto 3: Enquadramento ---
  {
    key: "Marco_Imprecisao",
    header: "Marco_Imprecisao",
    group: "Enquadramento",
    type: "boolean",
    question: "Apresenta informação imprecisa ou incompleta?",
    help: "Afirmações verificáveis que omitem condição essencial, confundem causa com correlação ou generalizam a partir de caso único.",
  },
  {
    key: "Marco_Numeros",
    header: "Marco_Numeros",
    group: "Enquadramento",
    type: "boolean",
    question: "Usa números ou estatísticas como argumento?",
    help: "Percentuais, contagens, rankings ou comparações numéricas mobilizados para sustentar a tese — com ou sem fonte.",
  },
  {
    key: "Marco_Contestacao",
    header: "Marco_Contestacao",
    group: "Enquadramento",
    type: "boolean",
    question: "Contesta consenso técnico estabelecido?",
    help: "Rejeita explicitamente posição consolidada de área técnica, científica ou normativa.",
  },
  {
    key: "Marco_Apelo",
    header: "Marco_Apelo",
    group: "Enquadramento",
    type: "boolean",
    question: "Recorre a apelo emocional?",
    help: "Mobiliza medo, indignação, comoção ou esperança como principal via de persuasão, acima do argumento.",
  },
  {
    key: "Marco_Parcialidade",
    header: "Marco_Parcialidade",
    group: "Enquadramento",
    type: "boolean",
    question: "Apresenta apenas um lado da questão?",
    help: "Havendo controvérsia reconhecida, a mensagem trata só uma posição como existente ou legítima.",
  },
  {
    key: "Marco_Recorte",
    header: "Marco_Recorte",
    group: "Enquadramento",
    type: "boolean",
    locked: true,
    lockedNote: "variável descontinuada · não preencher",
    question: "Seleciona evidências convenientes?",
    help: "DESCONTINUADA nesta rodada — não codificar. Permanece no bloco para não deslocar as colunas seguintes.",
  },
  {
    key: "Marco_Polarizacao",
    header: "Marco_Polarizacao",
    group: "Enquadramento",
    type: "boolean",
    question: "Divide o cenário em dois campos opostos?",
    help: "Organiza a narrativa como 'nós contra eles', sem posição intermediária possível.",
  },
  {
    key: "Marco_Figura",
    header: "Marco_Figura",
    group: "Enquadramento",
    type: "boolean",
    question: "Concentra a explicação em uma figura individual?",
    help: "Atribui a uma pessoa a causa ou a solução de um processo que é coletivo ou estrutural.",
  },
  {
    key: "Marco_Descredito",
    header: "Marco_Descredito",
    group: "Enquadramento",
    type: "boolean",
    question: "Desqualifica quem discorda?",
    help: "Ataca a pessoa, o grupo ou a intenção do oponente em vez do argumento apresentado.",
  },
  {
    key: "Marco_Descontexto",
    header: "Marco_Descontexto",
    group: "Enquadramento",
    type: "boolean",
    question: "Usa material fora do contexto original?",
    help: "Fala, imagem ou dado real reapresentado em situação, data ou finalidade diferente da de origem.",
  },
  {
    key: "Marco_Pressa",
    header: "Marco_Pressa",
    group: "Enquadramento",
    type: "boolean",
    question: "Cria senso de urgência para agir ou repassar?",
    help: "Pede compartilhamento imediato, sugere janela curta de tempo ou alerta que 'vão apagar'.",
  },
  {
    key: "Marco_Trama",
    header: "Marco_Trama",
    group: "Enquadramento",
    type: "boolean",
    question: "Sugere plano oculto ou articulação secreta?",
    help: "Propõe que um grupo age coordenadamente e em segredo para produzir o resultado narrado.",
  },
  {
    key: "Marco_Autoridade",
    header: "Marco_Autoridade",
    group: "Enquadramento",
    type: "boolean",
    question: "Invoca autoridade para validar a mensagem?",
    help: "Apoia-se em especialista, cargo, instituição ou 'fonte interna' como garantia do que afirma.",
  },

  // --- Conjunto 4: Efeitos ---
  {
    key: "Reacao_Alarme",
    header: "Reacao_Alarme",
    group: "Efeitos esperados",
    type: "boolean",
    question: "Tende a provocar alarme no leitor?",
    help: "O desfecho previsível da leitura é apreensão sobre risco iminente a si ou aos próximos.",
  },
  {
    key: "Reacao_Rejeicao",
    header: "Reacao_Rejeicao",
    group: "Efeitos esperados",
    type: "boolean",
    question: "Tende a alimentar rejeição a um grupo?",
    help: "Constrói um coletivo como ameaça, fardo ou adversário — ainda que sem termo ofensivo explícito.",
  },
  {
    key: "Reacao_Mobilizacao",
    header: "Reacao_Mobilizacao",
    group: "Efeitos esperados",
    type: "boolean",
    question: "Convoca a alguma ação concreta?",
    help: "Pede assinatura, comparecimento, boicote, denúncia, voto ou repasse organizado.",
  },
  {
    key: "Reacao_Opiniao",
    header: "Reacao_Opiniao",
    group: "Efeitos esperados",
    type: "boolean",
    question: "Busca deslocar a opinião sobre um tema?",
    help: "O objetivo aparente é mudar a avaliação do leitor, não apenas informá-lo.",
  },
  {
    key: "Reacao_Confianca",
    header: "Reacao_Confianca",
    group: "Efeitos esperados",
    type: "boolean",
    question: "Busca reduzir a confiança em instituições?",
    help: "Apresenta órgãos públicos, técnicos ou de imprensa como incapazes, capturados ou mal-intencionados.",
  },
  {
    key: "Reacao_Extremos",
    header: "Reacao_Extremos",
    group: "Efeitos esperados",
    type: "boolean",
    question: "Reforça posições intransigentes?",
    help: "Trata negociação e meio-termo como fraqueza ou traição.",
  },

  // --- Observação ---
  {
    key: "OBS",
    header: "OBS",
    group: "Observação",
    type: "text",
    question: "Observações da codificação",
    help: "Campo livre para dúvidas, exceções ou comentários dirigidos ao orientador.",
  },
];

export const exportColumns = editableFields.map((field) => field.key);
export const exportHeaders = editableFields.map((field) => field.header);

export const binaryFormats = {
  "FALSE/TRUE": { no: "FALSE", yes: "TRUE" },
  "0/1": { no: "0", yes: "1" },
  "Não/Sim": { no: "Não", yes: "Sim" },
};

export const defaultBinaryFormat = "FALSE/TRUE";
