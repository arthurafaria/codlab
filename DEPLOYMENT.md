# Deploy e Uso Como Plataforma

Este projeto deve ser hospedado na Vercel. GitHub Pages não atende bem porque o app usa rotas de API, upload de arquivos, banco de dados, exportação e futura sincronização com Google Sheets.

## Produção Recomendada

- **Vercel**: hospedagem do app Next.js.
- **Neon Postgres**: banco oficial para projetos, itens, variáveis, codificadores e respostas.
- **Vercel Blob**: armazenamento de imagens, livros de código e arquivos enviados.
- **Google Sheets API**: opcional, para espelhar respostas em uma planilha.

## Variáveis De Ambiente

Configure na Vercel:

```text
DATABASE_URL=
BLOB_READ_WRITE_TOKEN=
APP_SECRET=
NEXT_PUBLIC_APP_URL=https://seu-app.vercel.app
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
```

As variáveis Google podem ficar vazias no primeiro deploy. Sem elas, o sistema exporta CSV/XLSX normalmente e marca a sincronização como aguardando configuração.

## Fluxo De Demonstração

1. Abra a homepage.
2. Clique em `Criar exemplo IA Racial`.
3. Abra o painel do responsável.
4. Copie um link de codificador.
5. Codifique algumas imagens.
6. Volte ao painel e exporte CSV/XLSX.

O exemplo usa as imagens em `public/images` e as variáveis do livro de códigos IA Racial já versionadas no repositório.

## Fluxo Para Outros Projetos

1. Baixar o template XLSX pela homepage.
2. Preencher abas `items`, `variables`, `settings` e `coders`.
3. Enviar zip de imagens e template.
4. Compartilhar links privados com codificadores.
5. Acompanhar progresso no painel.
6. Exportar resultados.

## Deploy Pela Vercel

1. Importar o repositório `arthurafaria/ia-racial-coder`.
2. Adicionar Neon pelo Marketplace da Vercel e conectar ao projeto.
3. Adicionar Vercel Blob pelo Marketplace.
4. Configurar `APP_SECRET` e `NEXT_PUBLIC_APP_URL`.
5. Fazer deploy da branch `main`.

Depois de cada push para `main`, a Vercel publica uma nova versão automaticamente.
