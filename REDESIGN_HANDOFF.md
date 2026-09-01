# Redesign Frontend — Handoff para Codex

Projeto: **Coder Universitário** (`ia-racial-coder-from-github`)
Stack: Next.js 16 · React 19 · CSS vanilla (OKLCH tokens) · Bun

---

## O Que Foi Feito

### 1. Paleta de cores (inspirada no colab-uff.github.io)

`app/globals.css` — bloco `:root` foi completamente reescrito.

**Antes:** azul profundo como primária, fundos cinza-frio.  
**Depois:** laranja cálido `#ffb351` como primária, branco + creme `#fef9da` como fundo, coral `#f88379` como accent, texto escuro `#2f2f41`.

Tokens novos/alterados:
```
--primary          oklch(0.815 0.135 67)   ← laranja
--primary-hover    oklch(0.86 0.115 73)    ← laranja claro
--primary-strong   oklch(0.62 0.165 55)    ← âmbar escuro (pra texto/links)
--primary-soft     oklch(0.965 0.05 90)    ← creme (fundo do body gradient)
--accent           oklch(0.72 0.155 27)    ← coral (botão .secondary)
--accent-hover     oklch(0.65 0.155 27)
--on-primary       oklch(0.22 0.04 50)     ← texto escuro sobre botão laranja
--ink              oklch(0.275 0.04 286)   ← #2f2f41
--ink-soft         oklch(0.38 0.012 30)    ← escurecido vs. antes (fix WCAG AA)
--focus            oklch(0.72 0.16 60)     ← focus ring laranja
--radius           5px                     ← era 8px
--radius-sm        4px
--radius-pill      999px
```

Tokens de conveniência para eliminar literais fora do `:root`:
```
--success-border, --warning-border, --warning-ink
--danger-border, --danger-strong
--focus-ring, --primary-strong-faded
--on-success
```

Escalas formalizadas (definidas, disponíveis pra uso futuro):
```
--space-1 a --space-10   (4px → 40px)
--text-xs a --text-3xl   (0.78rem → 2.25rem)
```

Outros ajustes em `globals.css`:
- Body: `background: linear-gradient(180deg, var(--primary-soft), var(--bg) 40%)` — zona cálida no topo
- `.eyebrow`: cor virou `--primary-strong` (era verde), ganhou `letter-spacing: 0.04em`
- `.primary` button: texto usa `--on-primary` (escuro sobre laranja claro)
- `.secondary` button: virou coral (`--accent` + `--on-success`)
- `.ghost` button: novo variant adicionado
- `button.sm` / `.button.sm`: novo size
- `@keyframes spinner-rotate` + `.spinner`: spinner CSS-only
- `min-height` dos botões: 42px → 44px
- `.badge.danger`, `.badge.accent`, `.badge.primary`: novos variants de badge
- Todos os literais `oklch()` fora do `:root` substituídos por tokens nomeados

---

### 2. Componentes UI criados

Pasta nova: `components/ui/`  
Alias já configurado em `jsconfig.json`: `@/components/ui/*`

#### `components/ui/button.jsx`
Props: `variant` (`primary | secondary | danger | ghost | default`), `size` (`md | sm`), `loading` (bool), `loadingLabel` (string), `disabled`, `type`, `onClick`, `href`, `className`.

Quando `loading=true`: desabilita, adiciona `aria-busy`, exibe `<span class="spinner">` + `loadingLabel`.  
Quando `href` presente: renderiza `<a>` em vez de `<button>`.

#### `components/ui/badge.jsx`
Props: `tone` (`neutral | success | warning | danger | accent | primary`), `live` (bool → `role="status" aria-live="polite"`), `className`.

#### `components/ui/field.jsx`
Props: `label`, `hint`, `error`, `required`, `htmlFor`, `children` (função `(id) => <input id={id} ...>` ou node), `className`.

Usa `useId` para gerar `id` automático. `className` vai para o `<label>` (funciona como grid child em `.form-grid`). Hint como `<span class="hint">`, erro como `<span class="field-error" role="alert">`.

#### `components/ui/empty-state.jsx`
Props: `title`, `description`, `compact` (bool), `action` (ReactNode), `className`.

#### `components/ui/callout.jsx`
Props: `tone` (`success | warning | danger | info`), `title`, `children`, `action` (ReactNode), `layout` (`inline | stacked`), `className`.

Mapeamento de tom para classe CSS:
- `success` → `.demo-callout` (verde claro, borda verde)
- `warning` → `.panel.critical-panel` (âmbar, borda laranja)
- `danger` → `.panel.error-box`
- `info` → `.panel`

#### `components/ui/status-message.jsx`
Dois exports: `ResultBox` (sucesso, `aria-live="polite"`) e `ErrorBox` (erro, `role="alert" aria-live="assertive"`).  
`ErrorBox` aceita `{ error: { error, errors? } }` ou `{ message }`.

---

### 3. Arquivos JSX migrados

| Arquivo | Mudanças |
|---|---|
| `app/page.jsx` | `<span class="badge success">` → `<Badge tone="success">` |
| `app/project-creator.jsx` | Migração completa: Callout, Button (loading), Field, Badge, ErrorBox, ResultBox |
| `app/code/[token]/workspace.jsx` | Button, Badge (com `live`), EmptyState, Callout; `saveState` virou `{ tone, label }`; validação inline com `touchedKeys` Set |
| `app/admin/[token]/page.jsx` | Badge (15+ instâncias), EmptyState (4 instâncias), servidor sem "use client" mantido |
| `app/admin/[token]/coder-manager.jsx` | Button (loading), Badge, Field, ErrorBox |
| `app/admin/[token]/copy-values-button.jsx` | Button (loading), Badge (live) |
| `app/admin/[token]/item-repair.jsx` | Button (loading), Badge (live, tone) |
| `app/admin/[token]/variable-repair.jsx` | Button (loading), Badge (live, tone) |

### 4. Validação inline no workspace

Substituiu flag `touchedSubmit` (só disparava no submit final) por `Set<touchedKeys>`:
- `setField(variable, value)` → adiciona chave ao Set
- `FieldControl` recebe `onMarkTouched` → dispara no `onBlur`
- `showError = (touchedKeys.has(key) || touchedSubmit) && valueMissing(...)`
- Ao navegar para a próxima imagem: `setTouchedKeys(new Set())`

---

## O Que Ainda Falta Fazer

### Alta prioridade

- [ ] **Verificar contraste visual** do botão `.primary` (laranja sobre escuro). Se ficar ruim no browser, troque `--primary` do botão por `--primary-strong` (âmbar escuro): em `globals.css`, linha `.primary { background: var(--primary-strong); color: var(--on-success); }`.

- [ ] **Testar smoke end-to-end**:
  1. Abrir `http://localhost:3000`
  2. Clicar "Criar exemplo IA Racial" (verifica demo callout, button loading, result box)
  3. Abrir o `adminUrl` gerado (verifica badges, métricas, export)
  4. Abrir um `coderUrl` (verifica workspace: imagem, campos, pager, submit)
  5. Submeter 1 imagem → voltar ao admin → conferir contagem

- [ ] **Verificar responsivo** em 3 breakpoints: ≥1280px, 980px (tablet), 680px (mobile)
  - Em 980px: `.workspace`, `.split`, `.status-strip` devem empilhar vertical
  - Em 680px: `.coder-row`, `.form-grid`, `.workflow-strip` devem virar 1 coluna

- [ ] **Conferir paleta em navegadores**: Chrome e Firefox — OKLCH tem suporte amplo desde 2023 mas vale confirmar.

### Média prioridade

- [ ] **Tipografia fluida com `clamp()`** para o H1 da homepage:
  ```css
  h1 { font-size: clamp(1.6rem, 4vw, 2.25rem); }
  ```

- [ ] **Escala de spacing no CSS**: substituir os magic numbers de padding/margin pelos tokens `--space-*` nas regras mais usadas (`.shell`, `.panel`, `.topbar`, `.metric`). É cosmético — não muda layout.

- [ ] **Dark mode** (`prefers-color-scheme: dark`): os tokens OKLCH já facilitam. Criar bloco `@media (prefers-color-scheme: dark) { :root { ... } }` com versões invertidas dos tokens principais.

- [ ] **`aria-describedby`** nos inputs de arquivo (`imageZip`, `imageFiles`) apontando para o `.hint` adjacente — melhora screen readers no `project-creator.jsx`.

- [ ] **Skip-to-content link** para navegação por teclado. Adicionar antes do `<body>` no `layout.jsx`:
  ```html
  <a href="#main-content" class="skip-link">Pular para conteúdo</a>
  ```
  Com CSS para mostrar só no focus.

### Baixa prioridade / nice to have

- [ ] **Toast notification system** para substituir os badges de status inline por um sistema centralizado de notificações
- [ ] **Tabela com ordenação** no admin (`Progresso por imagem`, `Divergências`)
- [ ] **Animação de transição** entre imagens no workspace (fade ou slide)
- [ ] **Exportar `FieldControl`** do `workspace.jsx` para `components/ui/field-control.jsx` — hoje está inline (391 linhas no arquivo). Não há bug, só é difícil de reusar.

---

## Como Rodar

```powershell
cd "c:\Users\arthu\Downloads\COdificação IA\ia-racial-coder-from-github"
.\start-app.cmd
```

Abre em `http://localhost:3000` (ou a porta que o Next.js indicar).

Para build de produção:
```powershell
.\build-app.cmd
```

---

## Estrutura Relevante

```
ia-racial-coder-from-github/
├── app/
│   ├── globals.css                     ← design tokens + todos os estilos
│   ├── layout.jsx                      ← root layout (title, lang="pt-BR")
│   ├── page.jsx                        ← homepage
│   ├── project-creator.jsx             ← formulário de criação de projeto
│   ├── code/[token]/
│   │   ├── page.jsx                    ← server component (busca dados)
│   │   └── workspace.jsx               ← UI do codificador (391 linhas)
│   └── admin/[token]/
│       ├── page.jsx                    ← painel admin (362 linhas, server)
│       ├── coder-manager.jsx           ← gerenciar codificadores (client)
│       ├── copy-values-button.jsx      ← copiar TSV para clipboard
│       ├── item-repair.jsx             ← reparar item_ids
│       └── variable-repair.jsx         ← gerar variáveis do codebook
├── components/
│   └── ui/
│       ├── button.jsx
│       ├── badge.jsx
│       ├── field.jsx
│       ├── empty-state.jsx
│       ├── callout.jsx
│       └── status-message.jsx
├── lib/
│   ├── db.js                           ← banco (Neon prod / JSON local dev)
│   ├── template.js                     ← parsing de XLSX/CSV
│   ├── files.js                        ← upload/storage Vercel Blob
│   ├── sheets.js                       ← sync Google Sheets
│   └── csv.js                          ← geração de CSV/TSV/XLSX
├── jsconfig.json                       ← alias @/* → ./*
├── next.config.mjs                     ← vazio
└── package.json                        ← next@16, react@19, bun
```

---

## Decisões Registradas

| Decisão | Escolha feita | Alternativa rejeitada |
|---|---|---|
| Tipografia | System sans-serif (sem Google Fonts) | Playfair Display para títulos |
| Botão `.secondary` | Coral (`--accent`) | Verde `--success` (ficou reservado para confirmações) |
| Border-radius | 5px padrão, 4px micro | 4px estrito em tudo |
| `--ink-soft` | Escurecido para WCAG AA | Manter claro e trocar por `--ink-muted` em contextos críticos |
| Validação inline | `touchedKeys` Set (por campo) | Flag `touchedSubmit` única (por página) — era o original |
| Dark mode | Não implementado | Tokens OKLCH prontos para isso |

---

## Referência Visual

O site de referência é **https://colab-uff.github.io/** — laboratório de comunicação da UFF.

Paleta original extraída do CSS dele:
- Primary: `#ffb351` (laranja) · Hover: `#ffc984`
- Accent: `#f88379` (coral)
- Background: `#ffffff` + `#fef9da` (creme)
- Texto: `#2f2f41` (escuro) · `#5c5a5a` (médio)
- Tipografia: Helvetica/Arial body, Playfair Display (serif) títulos — nós optamos por não usar a serifa

---

## Notas Para Debug

**Se o botão primary laranja parecer muito claro no browser:**
Em `globals.css`, procure `.primary {` e mude para:
```css
.primary {
  border-color: var(--primary-strong);
  background: var(--primary-strong);
  color: var(--on-success);
}
```

**Se algum componente não resolver o import `@/components/ui/...`:**
Verificar `jsconfig.json` — deve ter `"@/*": ["./*"]`. Se o servidor de dev estiver rodando, reiniciar com `.\start-app.cmd`.

**Se o build falhar com erro de módulo:**
Rodar `bun install` antes do build.

**Sobre o banco de dados local (dev sem Neon):**
O projeto usa `.local-data/db.json` como SQLite-like quando `DATABASE_URL` não está definida. Os dados ficam em `lib/db.js`. Para começar do zero: deletar `.local-data/`.
