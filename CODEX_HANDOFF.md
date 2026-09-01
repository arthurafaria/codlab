# Contexto Para Continuar No Codex

Este projeto foi criado para codificar imagens de IA racial a partir dos arquivos locais:

- `Codificação IA Racial.xlsx`
- `Livro de Códigos IA Racial.pdf`
- `sample_reliability-20260513T015710Z-3-001.zip`

## Objetivo

Webapp local em React para revisar/categorizar o trecho `Sample_IA_Racial_Arthur` da planilha.

## Estado Atual

- App em React + Vite.
- Comandos configurados para Bun.
- Imagens extraídas para `public/images`.
- Dados da aba Arthur convertidos para `src/data/workbook.json`.
- Livro de códigos convertido manualmente em perguntas/explicações em `src/data/codebook.js`.
- Navegação mostra apenas as 58 imagens existentes.
- `image_018.png` e `image_027.png` não existem no zip e são puladas no app.
- A exportação preserva 60 linhas, casos `301` a `360`, para manter compatibilidade com Google Sheets/R.
- A exportação preserva os 39 cabeçalhos originais, inclusive `Figura_Oculas`.

## Como Rodar

No PowerShell, dentro da pasta do projeto:

```powershell
.\start-app.cmd
```

Depois abrir:

```text
http://127.0.0.1:5173
```

## Como Regerar Dados

Se a planilha ou o zip forem substituídos:

```powershell
.\generate-data.cmd
.\build-app.cmd
.\start-app.cmd
```

## Fluxo De Uso

1. Revisar as imagens no app.
2. Marcar cada imagem como revisada.
3. Exportar pelo botão `XLSX`.
4. Abrir `codificacao_ia_racial_arthur.xlsx`.
5. Copiar `A1:AM61`.
6. Colar no trecho/aba Arthur no Google Sheets original.

Fluxo preferencial para manter controles do Google Sheets:

1. No app, clicar `Copiar valores`.
2. No Google Sheets original, selecionar `A2`.
3. Colar como valores no intervalo `A2:AM61`.
4. Como a colagem é só de valores, os checkboxes, dropdowns e cores da planilha-modelo permanecem.

## Observações

- O botão `CSV` existe como alternativa para importação/cola simples.
- O app salva progresso automaticamente no `localStorage` do navegador.
- O app é local, sem login e sem backend.
- O repositório pretendido no GitHub é privado, com nome sugerido `ia-racial-coder`, na conta `arthurafaria`.
