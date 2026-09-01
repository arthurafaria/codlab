# CodLAB

Ferramenta de codificação manual para análise de conteúdo. Uma unidade por vez na
tela, a pergunta do livro de códigos ao lado de cada variável e o bloco de colunas
de volta para a planilha de origem — na ordem exata em que saiu.

Desenvolvida no [coLAB/UFF](https://colab.meme).

**No ar:** https://arthurafaria.github.io/codlab/

## O que existe

| Rota | O que faz |
|---|---|
| `/` | Página inicial: o que a ferramenta resolve e como funciona. |
| `/demo/` | Rodada de exemplo — 30 unidades fictícias, 28 variáveis, já pela metade. Nenhum dado real. |
| `/codificar/` | Carrega a sua planilha e abre a ficha. Nada sai do navegador. |

## O formato da planilha

Um `.xlsx` com duas abas. Em `/codificar/` há um botão que baixa o modelo pronto.

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

## Publicar

O site é estático: o workflow em `.github/workflows/deploy.yml` roda `bun run build`
e publica a pasta `out/` no GitHub Pages a cada push na `main`.

Duas coisas precisam bater:

1. Em **Settings › Pages**, deixar *Source* como **GitHub Actions**.
2. `NEXT_PUBLIC_BASE_PATH` no workflow tem que ser `/<nome-do-repo>`. Está como
   `/codlab`. Ao mover para outra conta ou organização, ajuste ali — é o erro que
   faz o site subir sem CSS.

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
bun scripts/shots.mjs
```

Gera `docs-shots/` em 3200×2000. Usa o Chrome já instalado, sem baixar navegador.
