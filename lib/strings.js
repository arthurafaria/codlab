// Textos da interface nos dois idiomas. pt e en têm exatamente as mesmas
// chaves; tests/strings.test.js falha se uma sobrar de um lado.
//
// Regra de escrita: frases curtas, coisa concreta, sem travessão.

// Substitui {chave} por valores. fmt("Registro {i}/{n}", {i: 1, n: 30})
// Fica aqui, e não no i18n.jsx, para módulos sem React usarem também.
export function fmt(template, values = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) =>
    values[key] === undefined ? `{${key}}` : String(values[key]),
  );
}

export const strings = {
  pt: {
    meta: {
      title: "CodLAB: codificação manual para análise de conteúdo",
      description:
        "Uma unidade por vez na tela, o livro de códigos ao lado de cada variável e o bloco de colunas de volta para a planilha.",
    },

    nav: {
      how: "Guia",
      demo: "Exemplo",
      code: "Código",
      cta: "Codificar",
      home: "CodLAB, início",
      language: "Idioma",
      theme: "Alternar tema claro e escuro",
    },

    footer: {
      about:
        "Ferramenta de codificação manual para análise de conteúdo. Desenvolvida no coLAB/UFF, Laboratório de Pesquisa em Comunicação, Culturas Políticas e Economia da Colaboração.",
      demo: "Rodada de exemplo",
      load: "Carregar planilha",
      repo: "Repositório",
      lab: "coLAB/UFF",
    },

    home: {
      script: "Feito no coLAB/UFF",
      title: "Codificação manual sem a planilha aberta do lado.",
      lead:
        "O CodLAB mostra uma unidade por vez, com a pergunta do livro de códigos ao lado de cada variável. Quando termina, você cola o bloco de colunas de volta na sua planilha, na mesma ordem em que ele saiu.",
      ctaDemo: "Ver uma rodada pronta",
      ctaLoad: "Carregar minha planilha",
      note: "Tudo roda no navegador. Não existe conta nem servidor.",

      card: {
        record: "Registro 005/30",
        reviewed: "17 revisados",
        unit:
          "Instalaram 14 câmeras na Praça Matriz e a criminalidade caiu 60% em dois meses. Ou seja: funciona. Quem era contra agora vai dizer o quê?",
        q1: "Usa números ou estatísticas como argumento?",
        q2: "Apresenta apenas um lado da questão?",
        q3: "Contesta consenso técnico estabelecido?",
        yes: "Sim",
        no: "Não",
      },

      problem: {
        overline: "O que trava uma rodada",
        title: "Codificar dentro da planilha cobra caro.",
        c1t: "Quarenta colunas por linha",
        c1: "Você rola para o lado até achar a variável, perde a linha e preenche a de baixo. O erro só aparece na conferência, depois de contaminar o lote.",
        c2t: "O livro de códigos em outra janela",
        c2: "O critério fica num PDF que ninguém reabre no meio da rodada. Da vigésima unidade em diante, cada codificador decide de memória, e as memórias divergem.",
        c3t: "Divergência sem rastro",
        c3: "Quando duas pessoas discordam, não dá para saber se foi critério diferente ou célula trocada. O teste de confiabilidade mede as duas coisas juntas.",
      },

      how: {
        overline: "Como funciona",
        title: "Três passos. A planilha continua sendo a sua.",
        lead: "O CodLAB não substitui a planilha. Ele cuida só do trecho em que o humano decide.",
        s1t: "Suba o livro de códigos",
        s1: "Uma planilha com as abas items e variables. Cada variável vira uma pergunta com o critério logo abaixo: booleana, seleção ou texto livre.",
        s2t: "Codifique unidade a unidade",
        s2: "O material fica à esquerda e a ficha à direita. O rascunho salva a cada resposta, e as setas do teclado trocam de unidade.",
        s3t: "Devolva para a planilha",
        s3a: "Copiar valores",
        s3b: " gera o bloco de colunas de onde os dados saíram. Cole numa célula só, ou exporte CSV e XLSX.",
      },

      reliability: {
        overline: "Confiabilidade",
        title: "O livro de códigos muda no meio da rodada. O alinhamento não.",
        body: "Quando uma variável é descontinuada ou passa a ser preenchida por processo automático, ela não some da ficha. Fica travada, marcada e visível, na mesma coluna de sempre. Ninguém codifica por engano e nenhuma coluna se desloca, então o que já foi codificado continua válido.",
        tag: "travada",
        key: "Marco_Recorte",
        note: "Descontinuada nesta rodada. Permanece no bloco para não deslocar as colunas seguintes.",
      },

      data: {
        overline: "Onde os dados ficam",
        title: "O corpus não sai da máquina de quem codifica.",
        c1t: "Sem servidor no caminho",
        c1: "O site é um conjunto de arquivos estáticos no GitHub Pages. O navegador lê a planilha que você carrega e guarda tudo no localStorage daquela máquina. Não há banco nem upload.",
        c2t: "Cada codificador devolve o que fez",
        c2: "Quem codifica baixa um backup .json ou cola o bloco de colunas na planilha compartilhada. A conferência entre codificadores acontece na planilha de sempre, com as colunas no lugar certo.",
        cta: "Abrir a rodada de exemplo",
      },
    },

    guide: {
      script: "Antes de distribuir a rodada",
      title: "Como preparar os arquivos, e como codificar.",
      lead:
        "O CodLAB lê dois arquivos. A planilha diz quais unidades existem e quais variáveis serão preenchidas. O livro de códigos diz por que cada variável se marca. Esta página mostra como montar os dois para a plataforma aproveitar tudo que eles têm.",

      tocTitle: "Nesta página",
      toc: {
        files: "Os dois arquivos",
        sheet: "A planilha",
        doc: "O livro de códigos",
        coding: "Como codificar",
        reliability: "Teste de confiabilidade",
        downloads: "Exemplos para baixar",
      },

      filesTitle: "Os dois arquivos",
      filesLead:
        "Você solta os dois juntos no mesmo campo. A extensão separa um do outro, então a ordem não importa.",
      file1t: "Planilha",
      file1: ".xlsx, .xlsm ou .csv. Uma linha por unidade de análise. As colunas de resposta ficam depois da coluna do material.",
      file2t: "Livro de códigos",
      file2: ".pdf, .docx, .md ou .txt. O documento que você já distribui. Cada seção que começa pelo nome de uma coluna vira o critério daquela variável.",
      filesNote:
        "Só a planilha é obrigatória. Sem o livro de códigos, a ficha mostra o nome da coluna no lugar da pergunta, e o codificador decide sem o critério na tela. É o que você quer evitar.",

      sheetTitle: "A planilha",
      sheetLead:
        "A coluna do material parte a aba em duas. O que vem antes dela é metadado de leitura: ID, data, canal, link. O que vem depois é variável a preencher.",
      sheetMaterialT: "Como nomear a coluna do material",
      sheetMaterial:
        "Chame de texto, text, mensagem, conteudo, prompt, transcricao, corpo, post ou legenda. Sem um desses nomes, o CodLAB escolhe a coluna com o texto mais longo, o que costuma acertar mas não é garantia.",
      sheetTypesT: "De onde sai o tipo de cada variável",
      sheetTypesLead:
        "Se a planilha já tem respostas, o tipo vem delas. Se está em branco, vira booleana, porque variável de livro de códigos existe para ser marcada.",
      sheetTypesRows: [
        ["só TRUE/FALSE, 0/1, sim/não", "botão Não · Sim"],
        ["até 20 respostas curtas e repetidas", "lista com essas opções"],
        ["só números", "campo numérico"],
        ["coluna em branco", "botão Não · Sim"],
        ["nome tipo OBS, nota ou comentário", "campo de texto livre"],
      ],
      sheetGroupsT: "Grupos na ficha",
      sheetGroups:
        "Prefixo repetido em duas ou mais colunas vira um bloco. Desinfo_Emocional e Desinfo_Urgencia aparecem juntas sob Desinfo. Coluna com prefixo único fica em Outras variáveis.",
      sheetDatesT: "Data e hora",
      sheetDates:
        "O Excel guarda data como 46110 e hora como 0,9631. Colunas chamadas dia, data, date ou timestamp viram 2026-03-29; hora, horario ou time viram 23:07.",
      sheetCodersT: "Uma aba por codificador",
      sheetCoders:
        "Duplique a aba com o mesmo conteúdo, uma por pessoa: Sample_Ana, Sample_Bruno. As mesmas unidades, na mesma ordem, com as mesmas colunas. O CodLAB lista as abas e cada um abre a sua. Essa é a organização que torna o teste de confiabilidade possível.",

      docTitle: "O livro de códigos",
      docLead:
        "Não precisa mudar de formato nem seguir modelo. O que a plataforma procura é uma coisa só: cada seção começando pelo nome exato da coluna.",
      docRulesT: "As quatro regras",
      docRules: [
        ["Comece a seção pelo nome da coluna", "Desinfo_Emocional numa linha só. Acento e underline não atrapalham: Desinfo Emocional também casa."],
        ["Termine a próxima linha com ?", "Ela vira a pergunta que o codificador lê. Sem ela, a pergunta é o nome da coluna."],
        ["Escreva o critério nas linhas seguintes", "Aparece logo abaixo da pergunta, na ficha, enquanto a pessoa decide."],
        ["Declare as opções", 'Uma linha começando com "Opções:" e alternativas separadas por barra, ou uma lista de marcadores. Escreva "variável binária" no critério para forçar Não · Sim.'],
      ],
      docExampleT: "Como fica na prática",
      docExample: `2. Tipo_URL
Que tipo de fonte a URL aponta?
Classifique pelo domínio, não pelo conteúdo. Encurtador vale
como a plataforma de destino quando ela for evidente.
Opções: Mídias Sociais | Veículo Jornalístico | Outros

3. Desinfo_Emocional
Recorre a apelo emocional?
Variável binária. Mobiliza medo, indignação ou comoção como
via principal de persuasão, acima do argumento.`,
      docResultT: "O que a plataforma faz com isso",
      docResult:
        "Tipo_URL vira uma lista com as três alternativas do documento, mesmo que a planilha estivesse em branco. Desinfo_Emocional vira botão Não · Sim. As duas ganham a pergunta e o critério na tela. O documento manda: se ele declara opções, elas vencem o que foi deduzido da planilha.",
      docPanelT: "O documento inteiro fica disponível",
      docPanel:
        "Um botão Livro de códigos abre o texto completo por cima da ficha, incluindo o que não casou com coluna nenhuma. É onde ficam a instrução geral da rodada, os exemplos-limite e o contato da coordenação.",

      codingTitle: "Como codificar",
      codingLead:
        "A ferramenta mostra uma unidade por vez porque a comparação entre codificadores só vale se as duas pessoas passaram pelo mesmo material na mesma sequência.",
      codingRules: [
        ["Não pule unidade", "Use Anterior e Próxima ou as setas do teclado. Enter marca revisado e avança. A ordem é a mesma para todo mundo."],
        ["Decida pelo critério da tela", "Ele está ali para não depender de memória. Se o critério não resolve, o problema é do livro de códigos, não seu."],
        ["Na dúvida, escreva na OBS", "Anotar a dúvida vale mais que chutar. A coordenação lê depois e ajusta o livro de códigos para a próxima rodada."],
        ["Não combine com o outro codificador", "Concordância combinada durante a rodada não mede nada. A conversa vem depois do cálculo, sobre as divergências."],
        ["Devolva o bloco de colunas", "Copiar valores gera exatamente as colunas de onde os dados saíram. Cole numa célula só, na sua aba. Ou baixe o backup .json e mande para quem coordena."],
      ],
      codingSaveT: "O rascunho é do navegador",
      codingSave:
        "Cada resposta salva sozinha, na máquina de quem codifica. Fechar a aba não perde nada, mas trocar de computador perde. Baixe o backup ao terminar.",

      relTitle: "Teste de confiabilidade",
      relLead:
        "Duas ou mais pessoas codificam a mesma amostra e você mede o quanto elas concordam. O número só significa alguma coisa se todas viram as mesmas unidades, na mesma ordem, com as mesmas variáveis. É por isso que a planilha tem uma aba por codificador.",
      relAlphaT: "Alpha de Krippendorff",
      relAlpha:
        "α = 1 − Do/De, a discordância observada dividida pela que apareceria por acaso. Estima o acaso a partir da distribuição das respostas. Aceita qualquer número de codificadores, célula vazia, e variável nominal, ordinal ou de intervalo. Krippendorff sugere α ≥ 0,800 para concluir e 0,667 como piso para conclusão provisória.",
      relBpT: "Coeficiente de Brennan-Prediger",
      relBp:
        "κ = (po − 1/q) / (1 − 1/q), onde po é a concordância observada e q o número de categorias. Corrige o acaso assumindo que ele se reparte igualmente entre as categorias, em vez de estimá-lo pelas marginais. Em variável binária, q = 2 e a conta vira κ = 2·po − 1.",
      relWhyT: "Por que reportar os dois",
      relWhy:
        "Numa variável em que quase toda resposta é não, o acaso estimado pelas marginais fica altíssimo e o alpha despenca mesmo com os codificadores concordando em quase tudo. É o paradoxo do kappa. O Brennan-Prediger não sofre disso, porque o acaso dele não depende de quão desbalanceada a variável é. Livro de códigos de desinformação tem exatamente esse perfil: quase tudo FALSE e um punhado de TRUE. Reporte os dois e explique a diferença quando ela aparecer.",
      relHowT: "Do CodLAB para o cálculo",
      relHow:
        "Cada codificador abre a própria aba, preenche e usa Copiar valores. O bloco cola na mesma coluna de onde saiu. Com as abas preenchidas, o cálculo é uma coluna contra a outra, variável por variável.",
      relCode: `# R, uma variável por vez
irr::kripp.alpha(rbind(ana$Desinfo_Emocional,
                       bruno$Desinfo_Emocional), method = "nominal")

irrCAC::bp.coeff.raw(cbind(ana$Desinfo_Emocional,
                           bruno$Desinfo_Emocional))`,
      relWarnT: "Um aviso sobre as faixas",
      relWarn:
        "0,800 e 0,667 são convenções de Krippendorff, não leis. O Brennan-Prediger não tem faixa canônica; costuma-se ler pelas mesmas bandas do kappa. Diga no relatório qual convenção você adotou.",

      dlTitle: "Exemplos para baixar",
      dlLead:
        "Os quatro arquivos abaixo funcionam juntos. Baixe a planilha e um dos livros de códigos e solte os dois em Codificar para ver o resultado.",
      dlSheetT: "Planilha, uma aba por codificador",
      dlSheet: "4 abas, 60 unidades cada, 23 variáveis depois da coluna texto. É o formato deduzido, sem aba de variáveis.",
      dlSheetCta: "Baixar .xlsx",
      dlTemplateT: "Modelo declarado",
      dlTemplate: "Abas items e variables. É o único formato que carrega obrigatoriedade e variável descontinuada.",
      dlTemplateCta: "Baixar modelo .xlsx",
      dlDocT: "Livro de códigos de exemplo",
      dlDoc: "As sete variáveis da planilha acima, com pergunta, critério e opções, no formato que a plataforma lê.",
      dlDocMd: "Baixar .md",
      dlDocDocx: "Baixar .docx",
      tryCta: "Abrir Codificar",
    },

    importer: {
      script: "Sua rodada, seu navegador",
      title: "Carregue o livro de códigos e comece.",
      lead: "Uma planilha .xlsx com as abas items e variables. O navegador lê o arquivo aqui mesmo; ele não passa por servidor e não sai desta máquina.",
      dropTitle: "Arraste os arquivos aqui",
      dropHint: "planilha .xlsx, .xlsm ou .csv, e o livro de códigos em .pdf, .docx ou .md",
      choose: "Escolher arquivos",
      gotData: "Planilha: {name}",
      gotDoc: "Livro de códigos: {name}",
      gotVars: "Variáveis: {name}",
      docMatched: "{n} de {total} variáveis com critério vindo do livro de códigos.",
      docMatchedNone:
        "Nenhuma variável casou com o livro de códigos. O texto continua disponível no painel; confira se os títulos usam o mesmo nome das colunas.",
      needData: "Falta a planilha com as unidades a codificar.",
      docFail: "Não consegui ler {name}. Aceito .pdf, .docx, .md e .txt.",
      start: "Abrir a ficha",
      clearFiles: "Limpar",
      storedTitle: "Rodadas neste navegador",
      storedMeta: "{items} unidades · {variables} variáveis",
      remove: "Remover",
      resume: "Continuar",
      confirmRemove: 'Remover "{title}" deste navegador? O progresso vai junto.',
      gone: "Essa rodada não está mais guardada neste navegador.",
      openFail: "Não consegui abrir o arquivo.",
      readFail: "Não consegui ler essa planilha.",
      a1t: "Não tem a planilha ainda?",
      a1: "Baixe o modelo em branco com as duas abas já montadas e um exemplo de cada tipo de variável.",
      a1cta: "Baixar modelo .xlsx",
      a2t: "Como a aba variables funciona",
      a2: "Cada linha vira uma pergunta na ficha. As colunas que importam:",
      a2rows: {
        variable_key: "nome da coluna na sua planilha",
        label: "a pergunta que o codificador lê",
        help: "o critério, logo abaixo da pergunta",
        type: "boolean, single_select, multi_select, text ou number",
        options: "alternativas separadas por |",
        required: 'trava o "revisado" enquanto estiver em branco',
        locked: "variável descontinuada: aparece travada e mantém a coluna",
      },
      a5t: "E o livro de códigos?",
      a5: "Junte o documento que você já distribui: .pdf, .docx, .md ou .txt. Cada trecho que começar com o nome de uma coluna vira o critério daquela variável, ao lado da pergunta. O documento inteiro fica num painel que o codificador abre quando quiser.",
      a4t: "Já tem uma planilha de codificação?",
      a4: "Não precisa de aba variables. Se o arquivo tiver a coluna do material (texto, mensagem, prompt), tudo que vier depois dela vira variável, e o tipo sai dos valores já preenchidos. Uma aba por codificador funciona: você escolhe qual abrir.",
      sheetTitle: "Qual aba você vai codificar?",
      sheetLead:
        "Este arquivo não tem aba variables, então deduzi o livro de códigos das próprias colunas: o que vem depois da coluna do material vira variável, e o tipo sai dos valores já preenchidos.",
      sheetMeta: "{rows} linhas · {variables} variáveis · material em {text}",
      sheetPick: "Codificar",
      sheetSkip: "não dá para usar: {reason}",
      inferredNotice:
        "Livro de códigos deduzido das colunas de {sheet}. As perguntas são os nomes das colunas. Para ter pergunta, critério e obrigatoriedade, acrescente uma aba variables ao arquivo.",
      a3t: "Prefere ver funcionando antes?",
      a3: "A rodada de exemplo tem 30 unidades fictícias e 23 variáveis, já pela metade.",
      a3cta: "Abrir exemplo",
      loadedEyebrow: "Rodada carregada neste navegador",
      untitled: "Rodada sem título",
      errors: {
        missingSheets: "A planilha precisa das abas {missing}. Encontrei: {found}.",
        noVariables: 'A aba "variables" não tem nenhuma linha com variable_key preenchido.',
        noItems: 'A aba "items" está vazia.',
        noTextColumn:
          'Não achei a coluna com o material a codificar. Nomeie uma coluna como texto (ou text, mensagem, conteudo, prompt).',
        noVariablesAfterText:
          'A coluna "{text}" é a última da aba, então não sobrou nenhuma coluna de variável depois dela.',
      },
    },

    coder: {
      binary: "Binário",
      binaryTitle:
        "FALSE/TRUE casa com os checkboxes do Google Sheets. Use 0/1 só se a coluna não for checkbox.",
      copyValues: "Copiar valores",
      csv: "CSV",
      xlsx: "XLSX",
      record: "Registro {i}/{n} · ID {id}",
      reviewed: "{r}/{n} revisados · {p}%",
      saved: "salvo {t} ✓",
      hint: "{copy} gera as colunas {from}→{to}{auto}. Cole na célula {from} da primeira linha de dados, ex.: {from}{row}.",
      hintAuto: " (só as que você codifica; {a}–{b} são automáticas)",
      noText: "(sem texto)",
      prev: "Anterior",
      next: "Próxima",
      selectRecord: "Selecionar registro",
      inheritedTitle: "Não preencher (coluna herdada)",
      lockedBadge: "Não preencher",
      lockedDefault: "não preencher",
      required: "obrigatória",
      yes: "Sim",
      no: "Não",
      restore: "Restaurar",
      confirmRestore: "Restaurar os dados originais neste navegador? Isso apaga o rascunho.",
      loadBackup: "Carregar backup",
      downloadBackup: "Baixar backup",
      copyHeader: "Copiar com cabeçalho",
      markReviewed: "Marcar revisado (Enter)",
      reviewedNext: "Revisado · avançar",
      missingOne: "1 obrigatória em branco",
      missingMany: "{n} obrigatórias em branco",
      missingTitle: "Obrigatórias em branco: {list}",
      missingFlash: "Faltam {n} obrigatórias: {first}",
      copiedFlash: "{n} linhas × {c} colunas. Cole na coluna {col}",
      copiedHeaderFlash: "{n} linhas + cabeçalho. Cole na coluna {col}",
      backupSaved: "Backup baixado",
      backupLoaded: "Backup carregado",
      backupBadCount: "Backup inválido: número de registros diferente.",
      backupUnreadable: "Não consegui ler esse arquivo de backup.",
      loading: "Carregando…",
      switchRound: "Trocar rodada",
      openCodebook: "Livro de códigos",
      closeCodebook: "Fechar",
      codebookEmpty: "Nenhum livro de códigos carregado nesta rodada.",
      noPreview: "Sem preview embutido para {host}.",
      openTab: "Abrir em nova aba",
      open: "abrir ↗",
    },
  },

  en: {
    meta: {
      title: "CodLAB: manual coding for content analysis",
      description:
        "One unit on screen at a time, the codebook beside every variable, and the column block pasted straight back into your spreadsheet.",
    },

    nav: {
      how: "Guide",
      demo: "Example",
      code: "Source",
      cta: "Start coding",
      home: "CodLAB, home",
      language: "Language",
      theme: "Toggle light and dark theme",
    },

    footer: {
      about:
        "A manual coding tool for content analysis. Built at coLAB/UFF, the Research Lab on Communication, Political Cultures and the Economy of Collaboration.",
      demo: "Example round",
      load: "Load a spreadsheet",
      repo: "Repository",
      lab: "coLAB/UFF",
    },

    home: {
      script: "Made at coLAB/UFF",
      title: "Manual coding, without the spreadsheet open beside you.",
      lead:
        "CodLAB shows one unit at a time, with the codebook question next to each variable. When you finish, you paste the block of columns back into your spreadsheet in the same order it came out.",
      ctaDemo: "See a finished round",
      ctaLoad: "Load my spreadsheet",
      note: "Everything runs in the browser. There is no account and no server.",

      card: {
        record: "Record 005/30",
        reviewed: "17 reviewed",
        unit:
          "They installed 14 cameras in the main square and crime fell 60% in two months. So it works. What are the people who opposed it going to say now?",
        q1: "Uses numbers or statistics as an argument?",
        q2: "Presents only one side of the issue?",
        q3: "Disputes established technical consensus?",
        yes: "Yes",
        no: "No",
      },

      problem: {
        overline: "What stalls a round",
        title: "Coding inside the spreadsheet is expensive.",
        c1t: "Forty columns per row",
        c1: "You scroll sideways to find the variable, lose the row, and fill in the one below. The mistake only shows up during review, after it has spread through the batch.",
        c2t: "The codebook lives in another window",
        c2: "The criterion sits in a PDF nobody reopens mid-round. From the twentieth unit on, each coder decides from memory, and memories drift apart.",
        c3t: "Disagreement with no trail",
        c3: "When two people disagree, there is no way to tell whether they applied different criteria or typed into the wrong cell. The reliability test measures both at once.",
      },

      how: {
        overline: "How it works",
        title: "Three steps. The spreadsheet stays yours.",
        lead: "CodLAB does not replace your spreadsheet. It only handles the part where a human decides.",
        s1t: "Upload the codebook",
        s1: "A spreadsheet with an items sheet and a variables sheet. Each variable becomes a question with its criterion right below: yes/no, a pick list, or free text.",
        s2t: "Code one unit at a time",
        s2: "The source material sits on the left and the form on the right. Drafts save after every answer, and the arrow keys move between units.",
        s3t: "Send it back to the spreadsheet",
        s3a: "Copy values",
        s3b: " produces the exact block of columns the data came from. Paste it into a single cell, or export CSV and XLSX.",
      },

      reliability: {
        overline: "Reliability",
        title: "The codebook changes mid-round. The alignment does not.",
        body: "When a variable is dropped, or starts being filled in automatically, it does not vanish from the form. It stays locked, flagged and visible, in the same column it always had. Nobody codes it by accident and no column shifts, so everything already coded stays valid.",
        tag: "locked",
        key: "Frame_Cherrypick",
        note: "Dropped this round. Kept in the block so the following columns do not shift.",
      },

      data: {
        overline: "Where the data lives",
        title: "The corpus never leaves the coder's machine.",
        c1t: "No server in the path",
        c1: "The site is a set of static files on GitHub Pages. The browser reads the spreadsheet you load and keeps everything in that machine's localStorage. There is no database and no upload.",
        c2t: "Each coder hands back their work",
        c2: "Coders download a .json backup or paste the column block into the shared spreadsheet. Intercoder checks happen in the same spreadsheet as always, with the columns where they belong.",
        cta: "Open the example round",
      },
    },

    guide: {
      script: "Before you hand out the round",
      title: "How to prepare the files, and how to code.",
      lead:
        "CodLAB reads two files. The spreadsheet says which units exist and which variables get filled in. The codebook says why each variable is marked. This page shows how to build both so the platform uses everything they carry.",

      tocTitle: "On this page",
      toc: {
        files: "The two files",
        sheet: "The spreadsheet",
        doc: "The codebook",
        coding: "How to code",
        reliability: "Reliability testing",
        downloads: "Examples to download",
      },

      filesTitle: "The two files",
      filesLead: "You drop both into the same field. The extension tells them apart, so order does not matter.",
      file1t: "Spreadsheet",
      file1: ".xlsx, .xlsm or .csv. One row per unit of analysis. The answer columns sit after the material column.",
      file2t: "Codebook",
      file2: ".pdf, .docx, .md or .txt. The document you already hand out. Every section starting with a column name becomes that variable's criterion.",
      filesNote:
        "Only the spreadsheet is required. Without the codebook, the form shows the column name instead of a question, and the coder decides with no criterion on screen. That is what you want to avoid.",

      sheetTitle: "The spreadsheet",
      sheetLead:
        "The material column splits the sheet in two. What comes before it is read-only metadata: ID, date, channel, link. What comes after is a variable to fill in.",
      sheetMaterialT: "Naming the material column",
      sheetMaterial:
        "Call it text, texto, message, content, prompt, transcript, body, post or caption. Without one of those names, CodLAB picks the column with the longest text, which usually lands right but is not a guarantee.",
      sheetTypesT: "Where each variable type comes from",
      sheetTypesLead:
        "If the spreadsheet already holds answers, the type comes from them. If it is blank, it becomes a yes/no, because a codebook variable exists to be marked.",
      sheetTypesRows: [
        ["only TRUE/FALSE, 0/1, yes/no", "No · Yes buttons"],
        ["up to 20 short repeated answers", "a list with those options"],
        ["only numbers", "number field"],
        ["blank column", "No · Yes buttons"],
        ["named OBS, note or comment", "free text field"],
      ],
      sheetGroupsT: "Groups on the form",
      sheetGroups:
        "A prefix shared by two or more columns becomes a block. Desinfo_Emocional and Desinfo_Urgencia show up together under Desinfo. A column with a unique prefix goes to Other variables.",
      sheetDatesT: "Dates and times",
      sheetDates:
        "Excel stores a date as 46110 and a time as 0.9631. Columns named dia, data, date or timestamp become 2026-03-29; hora, horario or time become 23:07.",
      sheetCodersT: "One sheet per coder",
      sheetCoders:
        "Duplicate the sheet with the same content, one per person: Sample_Ana, Sample_Bruno. Same units, same order, same columns. CodLAB lists the sheets and each person opens their own. That layout is what makes reliability testing possible.",

      docTitle: "The codebook",
      docLead:
        "No format change, no template to follow. The platform looks for one thing: each section starting with the exact column name.",
      docRulesT: "The four rules",
      docRules: [
        ["Start the section with the column name", "Desinfo_Emocional on a line of its own. Accents and underscores do not matter: Desinfo Emocional matches too."],
        ["End the next line with ?", "It becomes the question the coder reads. Without it, the question is the column name."],
        ["Write the criterion on the lines that follow", "It shows right under the question, on the form, while the person decides."],
        ["Declare the options", 'A line starting with "Opções:" or "Options:" and alternatives split by a bar, or a bulleted list. Write "binary variable" in the criterion to force No · Yes.'],
      ],
      docExampleT: "What it looks like",
      docExample: `2. Tipo_URL
What kind of source does the URL point to?
Classify by the domain, not the content. A shortener counts as
its destination platform when that is obvious.
Options: Social and messaging | News outlet | Other

3. Desinfo_Emocional
Does it rely on emotional appeal?
Binary variable. Uses fear, outrage or pity as the main route
to persuasion, above argument.`,
      docResultT: "What the platform does with it",
      docResult:
        "Tipo_URL becomes a list with the three alternatives from the document, even if the spreadsheet column was blank. Desinfo_Emocional becomes No · Yes buttons. Both gain the question and criterion on screen. The document wins: if it declares options, they beat whatever was inferred from the spreadsheet.",
      docPanelT: "The whole document stays available",
      docPanel:
        "A Codebook button opens the full text over the form, including whatever matched no column. That is where the round's general instructions, the edge cases and the coordinator's contact live.",

      codingTitle: "How to code",
      codingLead:
        "The tool shows one unit at a time because comparing coders only works if both went through the same material in the same sequence.",
      codingRules: [
        ["Do not skip units", "Use Previous and Next or the arrow keys. Enter marks reviewed and moves on. The order is the same for everyone."],
        ["Decide by the criterion on screen", "It is there so you do not rely on memory. If the criterion does not settle it, the problem is the codebook, not you."],
        ["When in doubt, write in OBS", "Recording the doubt beats guessing. The coordinator reads it later and fixes the codebook for the next round."],
        ["Do not agree things with the other coder", "Agreement arranged during the round measures nothing. The conversation comes after the calculation, about the disagreements."],
        ["Hand back the column block", "Copy values produces exactly the columns the data came from. Paste into a single cell, in your own sheet. Or download the .json backup and send it to the coordinator."],
      ],
      codingSaveT: "The draft belongs to the browser",
      codingSave:
        "Every answer saves on its own, on the coder's machine. Closing the tab loses nothing, but switching computers does. Download the backup when you finish.",

      relTitle: "Reliability testing",
      relLead:
        "Two or more people code the same sample and you measure how much they agree. The number only means something if they all saw the same units, in the same order, with the same variables. That is why the spreadsheet has one sheet per coder.",
      relAlphaT: "Krippendorff's alpha",
      relAlpha:
        "α = 1 − Do/De, observed disagreement over the disagreement chance would produce. It estimates chance from the distribution of the answers. It takes any number of coders, missing cells, and nominal, ordinal or interval variables. Krippendorff suggests α ≥ 0.800 to draw conclusions and 0.667 as the floor for tentative ones.",
      relBpT: "Brennan-Prediger coefficient",
      relBp:
        "κ = (po − 1/q) / (1 − 1/q), where po is observed agreement and q the number of categories. It corrects for chance by assuming chance spreads evenly across categories, instead of estimating it from the marginals. For a binary variable q = 2 and it reduces to κ = 2·po − 1.",
      relWhyT: "Why report both",
      relWhy:
        "In a variable where nearly every answer is no, chance estimated from the marginals gets very high and alpha collapses even though the coders agreed on almost everything. That is the kappa paradox. Brennan-Prediger does not suffer from it, because its chance term does not depend on how skewed the variable is. Disinformation codebooks have exactly that profile: almost all FALSE and a handful of TRUE. Report both and explain the gap when it shows up.",
      relHowT: "From CodLAB to the calculation",
      relHow:
        "Each coder opens their own sheet, fills it in and uses Copy values. The block pastes into the same column it came from. With the sheets filled, the calculation is one column against the other, variable by variable.",
      relCode: `# R, one variable at a time
irr::kripp.alpha(rbind(ana$Desinfo_Emocional,
                       bruno$Desinfo_Emocional), method = "nominal")

irrCAC::bp.coeff.raw(cbind(ana$Desinfo_Emocional,
                           bruno$Desinfo_Emocional))`,
      relWarnT: "A note on the thresholds",
      relWarn:
        "0.800 and 0.667 are Krippendorff's conventions, not laws. Brennan-Prediger has no canonical band; people usually read it with the same bands as kappa. State which convention you used in the report.",

      dlTitle: "Examples to download",
      dlLead:
        "The four files below work together. Download the spreadsheet and one of the codebooks, then drop both into Start coding to see the result.",
      dlSheetT: "Spreadsheet, one sheet per coder",
      dlSheet: "4 sheets, 60 units each, 23 variables after the text column. This is the inferred format, with no variables sheet.",
      dlSheetCta: "Download .xlsx",
      dlTemplateT: "Declared template",
      dlTemplate: "items and variables sheets. The only format that carries required fields and dropped variables.",
      dlTemplateCta: "Download .xlsx template",
      dlDocT: "Example codebook",
      dlDoc: "The seven variables from the spreadsheet above, with question, criterion and options, in the format the platform reads.",
      dlDocMd: "Download .md",
      dlDocDocx: "Download .docx",
      tryCta: "Open Start coding",
    },

    importer: {
      script: "Your round, your browser",
      title: "Load the codebook and start.",
      lead: "An .xlsx file with an items sheet and a variables sheet. The browser reads it right here; it never touches a server and never leaves this machine.",
      dropTitle: "Drop the files here",
      dropHint: "spreadsheet .xlsx, .xlsm or .csv, and the codebook as .pdf, .docx or .md",
      choose: "Choose files",
      gotData: "Spreadsheet: {name}",
      gotDoc: "Codebook: {name}",
      gotVars: "Variables: {name}",
      docMatched: "{n} of {total} variables got their criterion from the codebook.",
      docMatchedNone:
        "No variable matched the codebook. The text is still available in the panel; check whether its headings use the same names as the columns.",
      needData: "The spreadsheet with the units to code is missing.",
      docFail: "Could not read {name}. Accepted: .pdf, .docx, .md and .txt.",
      start: "Open the form",
      clearFiles: "Clear",
      storedTitle: "Rounds in this browser",
      storedMeta: "{items} units · {variables} variables",
      remove: "Remove",
      resume: "Continue",
      confirmRemove: 'Remove "{title}" from this browser? Its progress goes with it.',
      gone: "That round is no longer stored in this browser.",
      openFail: "Could not open the file.",
      readFail: "Could not read that spreadsheet.",
      a1t: "No spreadsheet yet?",
      a1: "Download the blank template with both sheets set up and one example of each variable type.",
      a1cta: "Download .xlsx template",
      a2t: "How the variables sheet works",
      a2: "Each row becomes a question on the form. The columns that matter:",
      a2rows: {
        variable_key: "the column name in your spreadsheet",
        label: "the question the coder reads",
        help: "the criterion, shown right under the question",
        type: "boolean, single_select, multi_select, text or number",
        options: "choices separated by |",
        required: 'blocks "reviewed" while it is empty',
        locked: "a dropped variable: shown locked, keeps its column",
      },
      a5t: "What about the codebook?",
      a5: "Bring the document you already hand out: .pdf, .docx, .md or .txt. Any passage that starts with a column name becomes that variable's criterion, next to the question. The whole document sits in a panel the coder can open at any time.",
      a4t: "Already have a coding spreadsheet?",
      a4: "No variables sheet needed. If the file has the material column (text, message, prompt), everything after it becomes a variable, and each type comes from the values already there. One sheet per coder works: you pick which one to open.",
      sheetTitle: "Which sheet do you want to code?",
      sheetLead:
        "This file has no variables sheet, so the codebook was inferred from the columns: whatever follows the material column becomes a variable, and each type comes from the values already there.",
      sheetMeta: "{rows} rows · {variables} variables · material in {text}",
      sheetPick: "Code this",
      sheetSkip: "unusable: {reason}",
      inferredNotice:
        "Codebook inferred from the columns of {sheet}. The questions are the column names. For real questions, criteria and required fields, add a variables sheet to the file.",
      a3t: "Want to see it running first?",
      a3: "The example round has 30 fictional units and 23 variables, already half done.",
      a3cta: "Open the example",
      loadedEyebrow: "Round loaded in this browser",
      untitled: "Untitled round",
      errors: {
        missingSheets: "The spreadsheet needs the {missing} sheet(s). Found: {found}.",
        noVariables: 'The "variables" sheet has no row with a variable_key.',
        noItems: 'The "items" sheet is empty.',
        noTextColumn:
          'Could not find the column with the material to code. Name a column text (or texto, message, content, prompt).',
        noVariablesAfterText:
          'Column "{text}" is the last one in the sheet, so no variable columns follow it.',
      },
    },

    coder: {
      binary: "Binary",
      binaryTitle:
        "FALSE/TRUE matches Google Sheets checkboxes. Use 0/1 only if the column is not a checkbox.",
      copyValues: "Copy values",
      csv: "CSV",
      xlsx: "XLSX",
      record: "Record {i}/{n} · ID {id}",
      reviewed: "{r}/{n} reviewed · {p}%",
      saved: "saved {t} ✓",
      hint: "{copy} produces columns {from}→{to}{auto}. Paste into cell {from} of the first data row, e.g. {from}{row}.",
      hintAuto: " (only the ones you code; {a}–{b} are automatic)",
      noText: "(no text)",
      prev: "Previous",
      next: "Next",
      selectRecord: "Select record",
      inheritedTitle: "Do not fill in (inherited column)",
      lockedBadge: "Do not fill in",
      lockedDefault: "do not fill in",
      required: "required",
      yes: "Yes",
      no: "No",
      restore: "Reset",
      confirmRestore: "Reset to the original data in this browser? This deletes the draft.",
      loadBackup: "Load backup",
      downloadBackup: "Download backup",
      copyHeader: "Copy with header",
      markReviewed: "Mark reviewed (Enter)",
      reviewedNext: "Reviewed · next",
      missingOne: "1 required field empty",
      missingMany: "{n} required fields empty",
      missingTitle: "Required fields empty: {list}",
      missingFlash: "{n} required fields missing: {first}",
      copiedFlash: "{n} rows × {c} columns. Paste into column {col}",
      copiedHeaderFlash: "{n} rows + header. Paste into column {col}",
      backupSaved: "Backup downloaded",
      backupLoaded: "Backup loaded",
      backupBadCount: "Invalid backup: different number of records.",
      backupUnreadable: "Could not read that backup file.",
      loading: "Loading…",
      switchRound: "Switch round",
      openCodebook: "Codebook",
      closeCodebook: "Close",
      codebookEmpty: "No codebook loaded for this round.",
      noPreview: "No embedded preview for {host}.",
      openTab: "Open in new tab",
      open: "open ↗",
    },
  },
};
