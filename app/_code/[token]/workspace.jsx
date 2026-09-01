"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import EmptyState from "@/components/ui/empty-state";
import Callout from "@/components/ui/callout";

const FIXED_OUTPUT_COLUMNS = ["project_id", "coder_label", "item_id", "image_filename", "status", "submitted_at"];

function normalizeValue(variable, value) {
  if (value !== undefined && value !== null) return value;
  if (variable.type === "multi_select") return [];
  if (variable.type === "boolean") return false;
  if (variable.type === "number") return variable.defaultValue ? Number(variable.defaultValue) : "";
  return variable.defaultValue || "";
}

function serializeValue(variable, value) {
  if (variable.type === "number") return value === "" ? "" : Number(value);
  return value;
}

function tsvCell(value) {
  if (Array.isArray(value)) return value.join("|");
  return String(value ?? "").replace(/\t/g, " ").replace(/\r?\n/g, " ");
}

async function writeClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function FieldError({ message }) {
  if (!message) return null;
  return <span className="field-error" style={{ display: "block" }} role="alert">{message}</span>;
}

function FieldControl({ variable, value, onChange, showError, onMarkTouched }) {
  const handleBlur = onMarkTouched ?? (() => {});

  if (variable.type === "boolean") {
    return (
      <>
        <div className="segmented" onBlur={handleBlur}>
          <button type="button" className={value === false ? "active" : ""} onClick={() => onChange(false)}>
            Não
          </button>
          <button type="button" className={value === true ? "active" : ""} onClick={() => onChange(true)}>
            Sim
          </button>
        </div>
        <FieldError message={showError ? "Campo obrigatório." : null} />
      </>
    );
  }

  if (variable.type === "single_select") {
    return (
      <>
        <select
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          onBlur={handleBlur}
        >
          <option value="">Sem classificação</option>
          {variable.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <FieldError message={showError ? "Escolha uma opção." : null} />
      </>
    );
  }

  if (variable.type === "multi_select") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <>
        <div className="checkbox-stack" onBlur={handleBlur}>
          {variable.options.map((option) => (
            <label className="checkbox-line" key={option}>
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={(event) =>
                  onChange(
                    event.target.checked
                      ? [...selected, option]
                      : selected.filter((item) => item !== option),
                  )
                }
              />
              {option}
            </label>
          ))}
        </div>
        <FieldError message={showError ? "Escolha ao menos uma opção." : null} />
      </>
    );
  }

  if (variable.type === "number") {
    return (
      <>
        <input
          type="number"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={handleBlur}
        />
        <FieldError message={showError ? "Informe um número." : null} />
      </>
    );
  }

  return (
    <>
      <textarea
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        onBlur={handleBlur}
      />
      <FieldError message={showError ? "Campo obrigatório." : null} />
    </>
  );
}

function valueMissing(variable, value) {
  if (!variable.required) return false;
  if (variable.type === "boolean") return value !== true && value !== false;
  if (variable.type === "multi_select") return !Array.isArray(value) || value.length === 0;
  return value === "" || value === null || value === undefined;
}

export default function CodingWorkspace({ token, data }) {
  const responsesByItem = useMemo(
    () => Object.fromEntries(data.responses.map((response) => [response.itemId, response])),
    [data.responses],
  );
  const firstPending = data.items.find((item) => responsesByItem[item.itemId]?.status !== "submitted") || data.items[0];
  const [currentItemId, setCurrentItemId] = useState(firstPending?.itemId || "");
  const [valuesByItem, setValuesByItem] = useState(() =>
    Object.fromEntries(
      data.items.map((item) => [
        item.itemId,
        Object.fromEntries(
          data.variables.map((variable) => [
            variable.key,
            normalizeValue(variable, responsesByItem[item.itemId]?.values?.[variable.key]),
          ]),
        ),
      ]),
    ),
  );
  const [submitted, setSubmitted] = useState(() =>
    new Set(data.responses.filter((response) => response.status === "submitted").map((response) => response.itemId)),
  );
  const [touchedSubmit, setTouchedSubmit] = useState(false);
  const [touchedKeys, setTouchedKeys] = useState(() => new Set());
  const [saveState, setSaveState] = useState({ tone: "neutral", label: "Pronto" });
  const [copyState, setCopyState] = useState("");
  const dirtyRef = useRef(false);
  const currentItem = data.items.find((item) => item.itemId === currentItemId);
  const currentIndex = data.items.findIndex((item) => item.itemId === currentItemId);
  const currentValues = valuesByItem[currentItemId] || {};
  const missing = data.variables.filter((variable) => valueMissing(variable, currentValues[variable.key]));
  const submittedCount = submitted.size;
  const completion = data.items.length ? Math.round((submittedCount / data.items.length) * 100) : 0;

  const grouped = data.variables.reduce((acc, variable) => {
    acc[variable.group] ||= [];
    acc[variable.group].push(variable);
    return acc;
  }, {});

  useEffect(() => {
    if (!dirtyRef.current) return;
    const handle = window.setTimeout(async () => {
      setSaveState({ tone: "neutral", label: "Salvando rascunho..." });
      await save("draft");
    }, 650);
    return () => window.clearTimeout(handle);
  }, [valuesByItem, currentItemId]);

  function setField(variable, value) {
    if (!currentItemId) return;
    dirtyRef.current = true;
    setTouchedKeys((prev) => new Set([...prev, variable.key]));
    setValuesByItem((current) => ({
      ...current,
      [currentItemId]: {
        ...current[currentItemId],
        [variable.key]: serializeValue(variable, value),
      },
    }));
  }

  function markTouched(key) {
    setTouchedKeys((prev) => new Set([...prev, key]));
  }

  async function save(status) {
    if (!currentItemId) {
      setSaveState({ tone: "neutral", label: "Nenhuma imagem atribuída" });
      return false;
    }
    const response = await fetch(`/api/code/${token}/responses`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        itemId: currentItemId,
        values: valuesByItem[currentItemId],
        status,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setSaveState({ tone: "danger", label: payload.error || "Falha ao salvar" });
      return false;
    }
    dirtyRef.current = false;
    setSaveState(status === "submitted"
      ? { tone: "success", label: "Imagem enviada" }
      : { tone: "success", label: "Rascunho salvo" });
    return true;
  }

  async function submitImage() {
    setTouchedSubmit(true);
    if (data.variables.length === 0) return;
    if (missing.length) return;
    const ok = await save("submitted");
    if (!ok) return;
    setSubmitted((current) => new Set([...current, currentItemId]));
    const next = data.items.find((item, index) => index > currentIndex && !submitted.has(item.itemId));
    if (next) {
      setCurrentItemId(next.itemId);
      setTouchedSubmit(false);
      setTouchedKeys(new Set());
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function missingForValues(values) {
    return data.variables.filter((variable) => valueMissing(variable, values?.[variable.key]));
  }

  async function copyCoderValuesForSheets() {
    const orderedVariables = data.variables.slice().sort((a, b) => a.outputOrder - b.outputOrder);
    const headers = [...FIXED_OUTPUT_COLUMNS, ...orderedVariables.map((variable) => variable.key)];

    const completeItems = data.items.filter((item) => missingForValues(valuesByItem[item.itemId] || {}).length === 0);
    if (!completeItems.length) {
      setCopyState("Complete ao menos uma imagem");
      window.setTimeout(() => setCopyState(""), 2800);
      return;
    }

    const rows = completeItems.map((item) => {
      const values = valuesByItem[item.itemId] || {};
      const existingResponse = responsesByItem[item.itemId];
      return headers.map((header) => {
        if (header === "project_id") return data.project.id;
        if (header === "coder_label") return data.link.coderLabel;
        if (header === "item_id") return item.itemId;
        if (header === "image_filename") return item.imageFilename;
        if (header === "status") return existingResponse?.status || "ready_to_paste";
        if (header === "submitted_at") return existingResponse?.submittedAt || "";
        return values[header];
      });
    });

    await writeClipboard([headers, ...rows].map((row) => row.map(tsvCell).join("\t")).join("\n"));
    setCopyState(`${rows.length} linha${rows.length === 1 ? "" : "s"} copiada${rows.length === 1 ? "" : "s"}`);
    window.setTimeout(() => setCopyState(""), 2800);
  }

  if (!currentItem) {
    const projectHasNoItems = data.totalItems === 0;
    return (
      <main id="main-content" className="shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Versão do codificador</p>
            <h1>{data.project.title}</h1>
            <p className="topbar-subtitle">
              {data.link.coderLabel} recebeu este link privado.{" "}
              {projectHasNoItems
                ? "Este projeto ainda não tem imagens cadastradas para codificação."
                : "Este link está ativo, mas não recebeu imagens pela distribuição atual."}
            </p>
          </div>
        </header>
        <section className="panel no-items-panel">
          <EmptyState
            title={projectHasNoItems ? "O responsável precisa reparar os itens do projeto." : "Este codificador ficou sem imagens."}
            description={
              projectHasNoItems
                ? "Abra o painel do responsável e use o reparo de imagens para gerar item_id a partir dos arquivos enviados."
                : "Peça ao responsável para revisar a cota, o modo de distribuição ou adicionar mais imagens para este link."
            }
          />
        </section>
      </main>
    );
  }

  const readinessTone = data.variables.length === 0 || missing.length ? "warning" : "success";
  const readinessLabel = data.variables.length === 0
    ? "Sem variáveis"
    : missing.length
      ? `${missing.length} pendente${missing.length > 1 ? "s" : ""}`
      : "Pronta para envio";
  const canSubmit = data.variables.length > 0 && missing.length === 0;

  return (
    <main id="main-content" className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Versão do codificador</p>
          <h1>{data.project.title}</h1>
          <p className="topbar-subtitle">
            Você está trabalhando como {data.link.coderLabel}. O orientador verá o envio final no painel de gestão.
          </p>
        </div>
        <div className="action-row">
          <Badge tone={readinessTone}>{readinessLabel}</Badge>
          <Badge tone={saveState.tone} live>{saveState.label}</Badge>
          {copyState ? <Badge tone="success" live>{copyState}</Badge> : null}
          <Button
            onClick={copyCoderValuesForSheets}
            disabled={data.variables.length === 0}
          >
            Copiar valores
          </Button>
          <Button
            variant="primary"
            onClick={submitImage}
            disabled={!canSubmit}
          >
            {canSubmit ? "Enviar esta imagem" : "Complete campos"}
          </Button>
        </div>
      </header>

      <section className="role-banner codificador" aria-label="Contexto do codificador">
        <div>
          <Badge tone="accent">Você está como codificador</Badge>
          <strong>Observe a imagem, responda os campos obrigatórios e envie.</strong>
          <p>
            Rascunhos são salvos automaticamente. Após o envio, os dados aparecem no painel do orientador,
            onde ficam os botões de copiar valores e exportar. Se o orientador usa uma planilha externa,
            use Copiar valores para colar suas respostas completas no Google Sheets.
          </p>
        </div>
        <div className="role-progress data-destination">
          <span>Destino do envio</span>
          <strong>Painel do orientador</strong>
          <p>Ou planilha externa, usando Copiar valores.</p>
        </div>
        <div className="role-progress">
          <span>Imagem atual</span>
          <strong>
            {currentIndex + 1} de {data.items.length}
          </strong>
        </div>
      </section>

      <section className="status-strip">
        <div className="metric">
          <span className="muted">Progresso</span>
          <strong>
            {submittedCount}/{data.items.length}
          </strong>
          <div className="progress-track" aria-label={`${completion}% concluído`}>
            <span style={{ width: `${completion}%` }} />
          </div>
        </div>
        <div className="metric">
          <span className="muted">Imagem atual</span>
          <strong>{currentItem.itemId}</strong>
        </div>
        <div className="metric">
          <span className="muted">Campos obrigatórios</span>
          <strong>
            {missing.length
              ? `${data.variables.filter((item) => item.required).length - missing.length}/${data.variables.filter((item) => item.required).length}`
              : "completos"}
          </strong>
        </div>
      </section>

      <div className="workspace">
        <aside className="image-pane">
          <img src={currentItem.imageUrl} alt={`Imagem ${currentItem.itemId}`} />
          <div className="pager">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentIndex === 0}
              onClick={() => {
                setCurrentItemId(data.items[currentIndex - 1].itemId);
                setTouchedSubmit(false);
                setTouchedKeys(new Set());
              }}
            >
              Anterior
            </Button>
            <strong>
              {currentItem.itemId} · {currentIndex + 1}/{data.items.length}
            </strong>
            <Button
              variant="ghost"
              size="sm"
              disabled={currentIndex === data.items.length - 1}
              onClick={() => {
                setCurrentItemId(data.items[currentIndex + 1].itemId);
                setTouchedSubmit(false);
                setTouchedKeys(new Set());
              }}
            >
              Próxima
            </Button>
          </div>
          <div className="metadata-grid">
            {Object.entries(currentItem.metadata || {})
              .filter(([key, value]) => key !== "image_filename" && value !== "")
              .slice(0, 8)
              .map(([key, value]) => (
                <div key={key}>
                  <span>{key}</span>
                  <strong>{String(value)}</strong>
                </div>
              ))}
          </div>
        </aside>

        <section className="coding-form">
          <div className="coding-top-grid">
            <section className="panel">
              <h2>Instruções do orientador</h2>
              <p className="muted">{data.project.instructions || "Codifique cada imagem seguindo o livro de códigos."}</p>
              {data.project.codebookMarkdown ? (
                <details className="codebook-details">
                  <summary>Ver livro de códigos completo</summary>
                  <pre>{data.project.codebookMarkdown}</pre>
                </details>
              ) : null}
            </section>

            <section className="panel">
              <h2>Ir para imagem</h2>
              <div className="progress-list">
                {data.items.map((item) => (
                  <button
                    key={item.itemId}
                    type="button"
                    className={item.itemId === currentItemId ? "current" : ""}
                    aria-current={item.itemId === currentItemId ? "true" : undefined}
                    onClick={() => {
                      setCurrentItemId(item.itemId);
                      setTouchedSubmit(false);
                      setTouchedKeys(new Set());
                    }}
                  >
                    <span>{item.itemId}</span>
                    <Badge tone={submitted.has(item.itemId) ? "success" : "neutral"}>
                      {submitted.has(item.itemId) ? "enviada" : "pendente"}
                    </Badge>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {data.variables.length === 0 ? (
            <Callout tone="warning" layout="stacked" title="Este projeto ainda não tem variáveis">
              <p className="muted">
                A imagem já está atribuída para você, mas o responsável precisa recriar o projeto com a aba{" "}
                <code>variables</code> preenchida antes da codificação começar.
              </p>
            </Callout>
          ) : null}

          {Object.entries(grouped).map(([group, variables]) => (
            <section className="field-section" key={group}>
              <h2>{group}</h2>
              {variables.map((variable) => (
                <article className="field-row" key={variable.key}>
                  <div className="field-copy">
                    <span>
                      {variable.key}
                      {variable.required ? " · obrigatório" : ""}
                    </span>
                    <h3>{variable.label}</h3>
                    <p>{variable.help}</p>
                  </div>
                  <div>
                    <FieldControl
                      variable={variable}
                      value={currentValues[variable.key]}
                      showError={(touchedKeys.has(variable.key) || touchedSubmit) && valueMissing(variable, currentValues[variable.key])}
                      onChange={(value) => setField(variable, value)}
                      onMarkTouched={() => markTouched(variable.key)}
                    />
                  </div>
                </article>
              ))}
            </section>
          ))}
        </section>
      </div>
    </main>
  );
}
