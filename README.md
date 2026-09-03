# CodLAB

Ferramenta de codificação manual para análise de conteúdo. Uma unidade por vez na
tela, a pergunta do livro de códigos ao lado de cada variável e o bloco de colunas
de volta para a planilha de origem — na ordem exata em que saiu.

Desenvolvida no [coLAB/UFF](https://colab.meme). Interface em português e inglês;
o seletor fica no topo e a escolha vale para o navegador.

**No ar:** https://colab-uff.github.io/codlab/

## O que existe

| Rota | O que faz |
|---|---|
| `/` | Página inicial: o que a ferramenta resolve e como funciona. |
| `/guia/` | Como montar a planilha e o livro de códigos, como codificar e como sair daqui para o teste de confiabilidade. Traz os arquivos de exemplo para baixar. |
| `/demo/` | Rodada de exemplo — 30 unidades fictícias, 28 variáveis, já pela metade. Nenhum dado real. |
| `/codificar/` | Carrega a sua planilha e o livro de códigos, e abre a ficha. Nada sai do navegador. |

## O formato da planilha

Dois formatos são aceitos.

### 1. Planilha que você já usa (sem aba de variáveis)

Se o arquivo tiver uma coluna com o material (`texto`, `text`, `mensagem`,
`conteudo`, `prompt`…), ela parte a aba em duas: o que vem antes é metadado de
leitura, o que vem depois vira variável. O tipo de cada uma sai dos valores já
preenchidos na coluna:

| o que está na coluna | vira |
|---|---|
| só TRUE/FALSE, 0/1, sim/não | booleana |
| só números | número |
| 2 a 15 respostas curtas repetidas | seleção, com essas opções |
| o resto, ou coluna vazia, ou nome tipo `OBS` | texto livre |

Prefixo repetido em duas ou mais colunas vira grupo na ficha: `Desinfo_*` fica
sob "Desinfo". Data e hora que o Excel guardou como número (`46110`, `0,9631`)
viram `2026-03-29` e `23:07`.

Uma aba por codificador funciona: o CodLAB lista as abas codificáveis com
quantas linhas e variáveis cada uma tem, e você escolhe qual abrir.

Gere um arquivo de teste nesse formato com:

```bash
bun scripts/make_test_workbook.mjs teste.xlsx
```

### 2. Livro de códigos como documento

Junte o documento que você já distribui: `.pdf`, `.docx`, `.md` ou `.txt`. Ele
entra pelo mesmo campo da planilha, e a extensão separa os dois.

Cada trecho que **começa pelo nome exato de uma coluna** vira o critério daquela
variável, ao lado da pergunta:

```
1. Desinfo_Emocional
Recorre a apelo emocional?
Variável binária. Mobiliza medo, indignação ou comoção como via principal.

2. Tipo_URL
Que tipo de fonte a URL aponta?
Opções: Mídias Sociais | Veículo Jornalístico | Outros
```

- A linha com `?` vira a pergunta; o resto vira o critério.
- `Opções:` (ou uma lista de marcadores) define as alternativas.
- "variável binária" no texto força Não/Sim.
- O documento inteiro fica num painel que o codificador abre a qualquer momento,
  inclusive as partes que não casaram com nenhuma coluna.

Gere um exemplo nos três formatos com:

```bash
bun scripts/make_codebook_doc.mjs pasta/
```

Os mesmos arquivos ficam para download em [`/guia/`](https://colab-uff.github.io/codlab/guia/),
gerados no navegador a partir de `lib/samples.js`.

### 3. Modelo declarado (com aba de variáveis)

É o único que carrega pergunta, critério, obrigatoriedade e variável travada.
Em `/codificar/` há um botão que baixa o modelo pronto.

**`variables`** — uma linha por variável, na ordem em que as colunas saem:

| coluna | para que serve |
|---|---|
| `variable_key` | nome da coluna na sua planilha |
| `label` | a pergunta que o codificador lê |
| `help` | o critério, exibido logo abaixo da pergunta |
| `type` | `boolean`, `single_select`, `multi_select`, `text` ou `number` |
| `options` | alternativas separadas por `\|` |
| `group` | agrupa as perguntas em blocos na ficha |
| `required` | trava o "marcar revisado" enquanto estiver em branco |
| `locked` | variável descontinuada: aparece travada e mantém a coluna |
| `output_order` | ordem das colunas na exportação |

**`items`** — uma linha por unidade de análise. Precisa de uma coluna com o
material a codificar (`texto`, `text`, `mensagem`, `conteudo`, `prompt`…); as
demais colunas viram metadados de leitura na tela.

## Rodar localmente

```bash
bun install
bun run dev
```

## Testes

```bash
bun test          # lógica de colunas, serialização e leitura da planilha
bun run build
python3 -m http.server 3100 -d out
bun run test:e2e  # fluxo de quem codifica, no Chrome instalado
```

O e2e cobre navegação por teclado e por seletor, resposta e rascunho no
`localStorage`, revisado com trava de obrigatórias, copiar valores nos dois
formatos binários, CSV e backup, restaurar, importar a própria planilha (tipos,
multi-seleção, erro legível), troca de idioma e a demo em inglês.

## Estrutura

| Onde | O quê |
|---|---|
| `lib/coding.js` | Geometria das colunas, serialização, campos obrigatórios. Sem React. |
| `lib/round-import.js` | Lê a planilha do usuário e gera o modelo. |
| `lib/codebook-doc.js` | Lê o livro de códigos em .pdf, .docx, .md ou .txt e cola o critério em cada variável. |
| `lib/samples.js` | Os arquivos de exemplo, usados pela página do guia e pelos scripts de teste. |
| `lib/i18n.jsx`, `lib/strings.js` | Idioma da interface e os dois dicionários, com as mesmas chaves. |
| `app/coder-screen.jsx` | A tela de codificação, usada pela demo, pela rodada real e pela planilha carregada. |
| `src/data/*-demo*.js` | A amostra fictícia, em pt e en. |

## Publicar

O site é estático: o workflow em `.github/workflows/deploy.yml` roda `bun run build`
e publica a pasta `out/` no GitHub Pages a cada push na `main`.

Duas coisas precisam bater:

1. Em **Settings › Pages**, deixar *Source* como **GitHub Actions**.
2. `NEXT_PUBLIC_BASE_PATH` no workflow tem que ser `/<nome-do-repo>`. Está como
   `/codlab`. Ao mover para outra conta ou organização, ajuste ali — é o erro que
   faz o site subir sem CSS.

## Teste de confiabilidade

A organização "uma aba por codificador" existe para isso: mesmas unidades, mesma
ordem, mesmas colunas, respostas diferentes. Cada pessoa usa **Copiar valores** e
cola o bloco na própria aba; o cálculo vira uma coluna contra a outra.

O guia cobre o **alpha de Krippendorff** e o **coeficiente de Brennan-Prediger**,
e por que reportar os dois: em variável muito desbalanceada (quase tudo `FALSE`,
que é o normal num livro de códigos de desinformação) o alpha despenca por causa
do paradoxo do kappa, enquanto o Brennan-Prediger não depende das marginais.

## Onde os dados ficam

Não há servidor, banco nem upload. A planilha que você carrega é lida pelo
navegador e guardada no `localStorage` daquela máquina; o progresso também. Para
juntar o trabalho de vários codificadores, cada um baixa um backup `.json` ou cola
o bloco de colunas na planilha compartilhada.

Corpus de pesquisa **não entra neste repositório**. O `.gitignore` bloqueia
`src/data/texts.js`, `src/data/codebook-desinfo.js` e `app/rodada/`, que é onde
fica a rodada real em uso local.

## Painel do orientador

A versão multi-projeto (o orientador cria a rodada, distribui links privados e
acompanha as respostas) depende de banco, storage e Google Sheets — coisas que o
GitHub Pages não roda. O código está preservado em `app/_platform`, `app/_admin`,
`app/_code` e `app/_api`. Pastas com `_` não viram rota no Next: para reativar,
remova o prefixo e faça o deploy num ambiente com servidor (Vercel), seguindo
`DEPLOYMENT.md`.

## Prints

```bash
bun run build
python3 -m http.server 3100 -d out
bun run shots
```

Gera `docs-shots/pt/` e `docs-shots/en/` em 3200×2000. Usa o Chrome já instalado,
sem baixar navegador.
