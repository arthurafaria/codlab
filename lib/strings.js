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
      how: "Como funciona",
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

    importer: {
      script: "Sua rodada, seu navegador",
      title: "Carregue o livro de códigos e comece.",
      lead: "Uma planilha .xlsx com as abas items e variables. O navegador lê o arquivo aqui mesmo; ele não passa por servidor e não sai desta máquina.",
      dropTitle: "Arraste a planilha aqui",
      dropHint: "ou escolha o arquivo: .xlsx e .xlsm",
      choose: "Escolher planilha",
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
          'Não achei a coluna com o material a codificar na aba "items". Nomeie uma coluna como texto (ou text, mensagem, conteudo, prompt).',
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
      how: "How it works",
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

    importer: {
      script: "Your round, your browser",
      title: "Load the codebook and start.",
      lead: "An .xlsx file with an items sheet and a variables sheet. The browser reads it right here; it never touches a server and never leaves this machine.",
      dropTitle: "Drop the spreadsheet here",
      dropHint: "or pick the file: .xlsx and .xlsm",
      choose: "Choose a spreadsheet",
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
          'Could not find the column with the material to code in the "items" sheet. Name a column text (or texto, message, content, prompt).',
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
      noPreview: "No embedded preview for {host}.",
      openTab: "Open in new tab",
      open: "open ↗",
    },
  },
};
