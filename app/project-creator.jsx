"use client";

import { useState } from "react";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Field from "@/components/ui/field";
import Callout from "@/components/ui/callout";
import { ResultBox, ErrorBox } from "@/components/ui/status-message";

export default function ProjectCreator() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [templateMode, setTemplateMode] = useState("xlsx");
  const [demoBusy, setDemoBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    setError(null);

    const response = await fetch("/api/projects", {
      method: "POST",
      body: new FormData(event.currentTarget),
    });
    const payload = await response.json();
    setBusy(false);

    if (!response.ok) {
      setError(payload);
      return;
    }
    setResult(payload);
  }

  async function createDemo() {
    setDemoBusy(true);
    setResult(null);
    setError(null);

    const response = await fetch("/api/examples/ia-racial", { method: "POST" });
    const payload = await response.json();
    setDemoBusy(false);

    if (!response.ok) {
      setError(payload);
      return;
    }
    setResult(payload);
  }

  return (
    <form className="panel" onSubmit={submit}>
      <div className="section-title">
        <div>
          <h2>Preparar rodada do orientador</h2>
          <p className="hint">
            Esta etapa cria o painel de gestão e os links privados que serão enviados aos codificadores.
          </p>
        </div>
        <Badge tone="primary">Orientador</Badge>
      </div>

      <Callout
        tone="success"
        title="Quer ver o fluxo orientador e codificador agora?"
        action={
          <Button
            variant="secondary"
            loading={demoBusy}
            loadingLabel="Criando demo..."
            disabled={busy}
            onClick={createDemo}
          >
            Criar rodada de exemplo
          </Button>
        }
      >
        <p>
          Crie uma demo com painel do orientador, 58 imagens, variáveis do livro de códigos e dois links
          de codificador prontos para abrir.
        </p>
      </Callout>

      <div className="form-grid">
        <Field label="Título da rodada">
          {(id) => <input id={id} name="title" required placeholder="Ex.: Análise de enquadramento — rodada 1" />}
        </Field>
        <Field label="Orientador responsável">
          {(id) => <input id={id} name="responsibleName" placeholder="Nome do pesquisador ou grupo" />}
        </Field>
        <Field label="Descrição" className="wide">
          {(id) => (
            <textarea id={id} name="description" placeholder="Objetivo, corpus, rodada, contexto de pesquisa..." />
          )}
        </Field>
        <Field label="Instruções que aparecerão para os codificadores" className="wide">
          {(id) => (
            <textarea id={id} name="instructions" placeholder="Explique o fluxo de avaliação e critérios gerais." />
          )}
        </Field>
        <Field label="Google Sheets">
          {(id) => <input id={id} name="spreadsheetId" placeholder="Opcional no desenvolvimento local" />}
        </Field>
        <Field label="Aba de saída">
          {(id) => <input id={id} name="sheetName" defaultValue="responses" />}
        </Field>
        <Field label="Nomes dos codificadores" className="wide">
          {(id) => (
            <textarea
              id={id}
              name="coderLabels"
              rows={4}
              placeholder={"Um nome por linha. Ex.:\nAna Silva\nBruno Lima\nTurma 2 - dupla A"}
            />
          )}
        </Field>
      </div>

      <div className="divider" />

      <div className="section-title">
        <div>
          <h2>Arquivos que alimentam a rodada</h2>
          <p className="hint">
            O template liga cada <code>item_id</code> a um arquivo de imagem. Se a aba <code>items</code> vier vazia,
            criaremos a lista automaticamente usando os nomes das imagens enviadas.
          </p>
        </div>
        <div className="segmented compact" role="radiogroup" aria-label="Formato do template">
          <button
            type="button"
            className={templateMode === "xlsx" ? "active" : ""}
            onClick={() => setTemplateMode("xlsx")}
          >
            XLSX
          </button>
          <button
            type="button"
            className={templateMode === "csv" ? "active" : ""}
            onClick={() => setTemplateMode("csv")}
          >
            CSV
          </button>
        </div>
      </div>

      <div className="upload-choice">
        <Field label="Imagens em zip" hint="Melhor caminho para preservar nomes de arquivo sem depender do navegador.">
          {(id, { describedBy }) => (
            <input id={id} name="imageZip" type="file" accept=".zip" aria-describedby={describedBy} />
          )}
        </Field>
        <Field
          label="Imagens soltas ou pasta"
          hint="Funciona melhor no Chrome. Use quando o material já estiver organizado em pasta."
        >
          {(id, { describedBy }) => (
            <input
              id={id}
              name="imageFiles"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              webkitdirectory=""
              aria-describedby={describedBy}
            />
          )}
        </Field>
      </div>

      <div className="form-grid" style={{ marginTop: 16 }}>
        <Field label="Livro de códigos">
          {(id) => <input id={id} name="codebookFile" type="file" accept=".md,.txt,.docx" />}
        </Field>
        {templateMode === "xlsx" ? (
          <Field label="Template XLSX">
            {(id) => <input id={id} name="spreadsheetFile" type="file" accept=".xlsx,.xls" />}
          </Field>
        ) : (
          <>
            <Field label="items.csv">
              {(id) => <input id={id} name="itemsCsv" type="file" accept=".csv" />}
            </Field>
            <Field label="variables.csv">
              {(id) => <input id={id} name="variablesCsv" type="file" accept=".csv" />}
            </Field>
          </>
        )}
      </div>

      <p className="hint">
        Ao criar a rodada, você receberá primeiro o link do painel do orientador. Dentro dele ficam os links
        privados dos codificadores.
      </p>

      <div className="action-row" style={{ marginTop: 16 }}>
        <Button variant="primary" type="submit" loading={busy} loadingLabel="Criando projeto...">
          Criar rodada e abrir links
        </Button>
      </div>

      {error ? <ErrorBox error={error} /> : null}

      {result ? (
        <ResultBox>
          <h2>Rodada criada</h2>
          <p>
            <a href={result.adminUrl}>Abrir versão do orientador</a>
          </p>
          <div className="link-list">
            {result.coderUrls.map((link) => (
              <a key={link.url} href={link.url}>
                Versão do codificador - {link.coderLabel}: <span className="mono">{link.url}</span>
              </a>
            ))}
          </div>
        </ResultBox>
      ) : null}
    </form>
  );
}
