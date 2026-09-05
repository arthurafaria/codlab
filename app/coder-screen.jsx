"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LinkPreviews, extractLinks } from "./link-preview";
import { SiteNav } from "@/components/site-chrome";
import { useT, useLang, fmt } from "@/lib/i18n";
import {
  computeLayout,
  buildRecords,
  buildPasteRows,
  serializeValue,
  missingRequiredFields,
  alignBackup,
  draftAnswers,
} from "@/lib/coding";
import styles from "./coder.module.css";

// Tela de codificação de unidade única. Recebe a rodada por props: a rodada
// real, a demo e a planilha carregada pelo usuário rodam o mesmo código.

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  document.body.removeChild(area);
}

function downloadText(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Painel de leitura do livro de códigos, por cima da ficha.
function CodebookPanel({ text, onClose, labels }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="codebook-overlay" role="dialog" aria-modal="true" aria-label={labels.openCodebook}>
      <div className="codebook-panel">
        <header className="codebook-panel-head">
          <h2>{labels.openCodebook}</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} autoFocus>
            {labels.closeCodebook}
          </button>
        </header>
        <div className="codebook-panel-body">
          {text ? <pre>{text}</pre> : <p className="prose">{labels.codebookEmpty}</p>}
        </div>
      </div>
      <button type="button" className="codebook-scrim" onClick={onClose} tabIndex={-1} aria-hidden="true" />
    </div>
  );
}

function BooleanControl({ value, onChange, labelledBy }) {
  const labels = useT().coder;
  return (
    <div className={styles.segmented} role="radiogroup" aria-labelledby={labelledBy}>
      <button
        type="button"
        role="radio"
        aria-checked={value !== true}
        className={value === true ? "" : styles.active}
        onClick={() => onChange(false)}
      >
        {labels.no}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === true}
        className={value === true ? styles.active : ""}
        onClick={() => onChange(true)}
      >
        {labels.yes}
      </button>
    </div>
  );
}

function FieldControl({ field, value, onChange, labelledBy }) {
  if (field.type === "boolean") {
    return <BooleanControl value={value} onChange={onChange} labelledBy={labelledBy} />;
  }
  if (field.type === "select") {
    const options = field.options || [];
    const extra = value && !options.includes(value) ? [value] : [];
    return (
      <select
        className={styles.select}
        aria-labelledby={labelledBy}
        value={value || ""}
        onChange={(event) => onChange(event.target.value || "")}
      >
        <option value="">—</option>
        {[...extra, ...options].map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === "multi") {
    // Guardado como string separada por "|": é assim que volta para a planilha.
    const picked = String(value || "").split("|").filter(Boolean);
    const toggle = (option) => {
      const next = picked.includes(option) ? picked.filter((p) => p !== option) : [...picked, option];
      // Ordem do livro de códigos, não do clique.
      onChange((field.options || []).filter((o) => next.includes(o)).join("|"));
    };
    return (
      <div className={styles.checkGroup} role="group" aria-labelledby={labelledBy}>
        {(field.options || []).map((option) => (
          <label key={option} className={styles.checkOption}>
            <input type="checkbox" checked={picked.includes(option)} onChange={() => toggle(option)} />
            {option}
          </label>
        ))}
      </div>
    );
  }
  if (field.type === "number") {
    return (
      <input
        className={styles.select}
        aria-labelledby={labelledBy}
        type="number"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }
  return (
    <textarea
      className={styles.textarea}
      aria-labelledby={labelledBy}
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
      rows={3}
    />
  );
}

export default function CoderScreen({
  project,
  sourceRecords,
  codebook,
  extraAction = null,
  notice = null,
  codebookText = "",
}) {
  const t = useT();
  const { lang } = useLang();
  const c = t.coder;
  const { editableFields, metaFields, binaryFormats, defaultBinaryFormat, textField } = codebook;

  const layout = useMemo(
    () => computeLayout(editableFields, project.codedBlockStart ?? 10, project.sheetOrder),
    [editableFields, project.codedBlockStart, project.sheetOrder],
  );

  const [ready, setReady] = useState(false);
  const [records, setRecords] = useState(() => buildRecords(sourceRecords, layout, codebook));
  const [reviewed, setReviewed] = useState({});
  const [index, setIndex] = useState(0);
  const [binaryFormat, setBinaryFormat] = useState(defaultBinaryFormat);
  const [copyStatus, setCopyStatus] = useState("");
  const [lastSaved, setLastSaved] = useState("");
  const [saveFailed, setSaveFailed] = useState(false);
  const copyTimer = useRef(null);
  const fileInputRef = useRef(null);
  const [showCodebook, setShowCodebook] = useState(false);

  function loadSaved() {
    try {
      const saved = JSON.parse(localStorage.getItem(project.storageKey) || "null");
      if (!saved || !Array.isArray(saved.records) || saved.records.length !== sourceRecords.length) {
        return null;
      }
      return saved;
    } catch {
      return null;
    }
  }

  // Monta uma vez por rodada (o pai troca a `key` quando a rodada muda).
  useEffect(() => {
    const saved = loadSaved();
    if (saved) {
      setRecords(buildRecords(sourceRecords, layout, codebook, saved.records));
      setReviewed(saved.reviewed || {});
      setIndex(Math.min(saved.index ?? 0, sourceRecords.length - 1));
      if (saved.binaryFormat && binaryFormats[saved.binaryFormat]) setBinaryFormat(saved.binaryFormat);
    } else if (project.demoSeed) {
      // Demo abre já em andamento, para mostrar a ferramenta em uso.
      const seeded = {};
      for (let i = 0; i < project.demoSeed.reviewed; i += 1) seeded[i] = true;
      setReviewed(seeded);
      setIndex(Math.min(project.demoSeed.index ?? 0, sourceRecords.length - 1));
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escrita adiada: digitar uma observação não pode custar uma gravação por
  // tecla. O pendente é gravado no fim da pausa, ao sair da tela e ao fechar a
  // aba, para nenhuma resposta ficar só na memória.
  const rascunhoPendente = useRef(null);
  const gravarRascunho = useRef(() => {});
  gravarRascunho.current = () => {
    const payload = rascunhoPendente.current;
    if (payload === null) return;
    rascunhoPendente.current = null;
    try {
      localStorage.setItem(project.storageKey, payload);
      setSaveFailed(false);
      setLastSaved(new Date().toLocaleTimeString(lang === "en" ? "en-US" : "pt-BR"));
    } catch {
      // Cota estourada ou storage bloqueado. Antes isso passava calado e a
      // tela seguia dizendo "salvo", que é a pior forma de perder trabalho.
      setSaveFailed(true);
    }
  };

  useEffect(() => {
    if (!ready) return undefined;
    rascunhoPendente.current = JSON.stringify({
      records: draftAnswers(records, editableFields),
      reviewed,
      index,
      binaryFormat,
      updatedAt: new Date().toISOString(),
    });
    const timer = setTimeout(() => gravarRascunho.current(), 250);
    // Só cancela o disparo. Gravar aqui devolveria o payload anterior e o
    // rascunho ficaria sempre um passo atrás do que está na tela.
    return () => clearTimeout(timer);
  }, [ready, records, reviewed, index, binaryFormat, editableFields, project.storageKey]);

  // Sair da tela ou fechar a aba grava o que ainda estava na pausa.
  useEffect(() => {
    const flush = () => gravarRascunho.current();
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  const total = records.length;
  const current = records[index];
  const reviewedCount = Object.values(reviewed).filter(Boolean).length;
  const percent = total ? Math.round((reviewedCount / total) * 100) : 0;
  const links = useMemo(() => extractLinks(current?.[textField]), [current, textField]);
  const inheritedFields = useMemo(() => editableFields.filter((f) => f.inherited), [editableFields]);
  const fieldsByGroup = useMemo(
    () =>
      editableFields
        .filter((f) => !f.inherited)
        .reduce((acc, field) => {
          (acc[field.group] ||= []).push(field);
          return acc;
        }, {}),
    [editableFields],
  );
  const missingRequired = useMemo(
    () => missingRequiredFields(current, editableFields),
    [current, editableFields],
  );

  function renderInherited(value, field) {
    if (field.type === "boolean") return value === true ? c.yes : c.no;
    return String(value ?? "") || "—";
  }

  function updateField(key, value) {
    setRecords((rows) => rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  }

  function goTo(next) {
    if (next < 0 || next >= total) return;
    setIndex(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function flash(message) {
    setCopyStatus(message);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyStatus(""), 2600);
  }

  function markReviewedAndAdvance() {
    if (missingRequired.length) {
      flash(fmt(c.missingFlash, { n: missingRequired.length, first: missingRequired[0].header }));
      return;
    }
    setReviewed((r) => ({ ...r, [index]: true }));
    if (index < total - 1) goTo(index + 1);
  }

  async function copyValues(includeHeader) {
    await copyText(buildPasteRows(records, layout, binaryFormats[binaryFormat], includeHeader));
    flash(
      fmt(includeHeader ? c.copiedHeaderFlash : c.copiedFlash, {
        n: total,
        c: layout.pasteFields.length,
        col: layout.pasteColLetter,
      }),
    );
  }

  // A colagem tem que casar coluna a coluna com a planilha, então não leva
  // nada a mais. O arquivo exportado é entrega: leva o ID e se a unidade foi
  // mesmo revisada, senão "não avaliado" e "respondeu Não" saem iguais.
  function makeAoa() {
    const fmtBin = binaryFormats[binaryFormat];
    return [
      ["ID", c.reviewedColumn, ...layout.pasteHeaders],
      ...records.map((record, i) => [
        record.ID,
        reviewed[i] ? c.yes : c.no,
        ...layout.pasteFields.map((field) => serializeValue(record, field, fmtBin)),
      ]),
    ];
  }

  // A biblioteca de planilha entra só na hora de exportar: quem abre a demo
  // para ler não precisa baixar os ~139 KB dela.
  async function exportXlsx() {
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.aoa_to_sheet(makeAoa());
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, project.sheetName || "codificacao");
    XLSX.writeFile(book, `${project.exportBasename || "codificacao"}.xlsx`);
  }

  async function exportCsv() {
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.aoa_to_sheet(makeAoa());
    const csv = XLSX.utils.sheet_to_csv(sheet);
    downloadText(`${project.exportBasename || "codificacao"}.csv`, `﻿${csv}`, "text/csv;charset=utf-8");
  }

  function resetProgress() {
    if (!window.confirm(c.confirmRestore)) return;
    localStorage.removeItem(project.storageKey);
    setRecords(buildRecords(sourceRecords, layout, codebook));
    setReviewed({});
    setIndex(0);
  }

  // Backup em arquivo: só os campos codificados (leve) + progresso.
  function downloadBackup() {
    const coded = records.map((record) => {
      const out = { id: record.id, ID: record.ID };
      editableFields.forEach((field) => {
        out[field.key] = record[field.key];
      });
      return out;
    });
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    downloadText(
      `backup_${project.backupBasename || project.exportBasename || "codificacao"}_${stamp}.json`,
      JSON.stringify({ version: 1, storageKey: project.storageKey, index, reviewed, records: coded }, null, 2),
      "application/json",
    );
    flash(c.backupSaved);
  }

  function importBackup(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        // Alinhamento por ID: aceitar pela posição já contaminou rodada inteira
        // quando a planilha foi reordenada ou o backup era de outra pessoa.
        const { registros, erro, id } = alignBackup(sourceRecords, data.records);
        if (erro) {
          window.alert(fmt(c.backupErro[erro] || c.backupUnreadable, { id: id ?? "" }));
          return;
        }
        setRecords(buildRecords(sourceRecords, layout, codebook, registros));
        setReviewed(data.reviewed || {});
        setIndex(Math.min(data.index ?? 0, sourceRecords.length - 1));
        flash(c.backupLoaded);
      } catch {
        window.alert(c.backupUnreadable);
      }
    };
    reader.readAsText(file);
  }

  useEffect(() => {
    function onKey(event) {
      const tag = event.target.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;
      // Num botão, Enter já é o clique dele. Disparar o atalho global aqui
      // marcaria revisado sem querer para quem navega por teclado.
      if (event.key === "Enter" && (tag === "BUTTON" || tag === "A")) return;
      if (event.key === "ArrowLeft") goTo(index - 1);
      else if (event.key === "ArrowRight") goTo(index + 1);
      else if (event.key === "Enter") markReviewedAndAdvance();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, total, missingRequired]);

  // Servidor e primeira renderização do cliente mostram o mesmo shell estático;
  // a UI interativa entra depois de montar, evitando erro de hidratação.
  if (!ready || !current) {
    return (
      <>
        <SiteNav />
        <main id="main-content" className={styles.root}>
          <div className={styles.shell}>
            <p className={styles.eyebrow}>{project.eyebrow}</p>
            <h1 className={styles.title}>{project.title}</h1>
            <p className={styles.loading}>{c.loading}</p>
          </div>
        </main>
      </>
    );
  }

  const reviewLabel = missingRequired.length
    ? missingRequired.length === 1
      ? c.missingOne
      : fmt(c.missingMany, { n: missingRequired.length })
    : reviewed[index]
      ? c.reviewedNext
      : c.markReviewed;

  return (
    <>
      <SiteNav />
      <main id="main-content" className={styles.root}>
        <div className={styles.shell}>
          <header className={styles.topbar}>
            <div>
              <p className={styles.eyebrow}>{project.eyebrow}</p>
              <h1 className={styles.title}>{project.title}</h1>
            </div>
            <div className={styles.topActions}>
              {extraAction}
              {codebookText ? (
                <button
                  type="button"
                  className={styles.btn}
                  onClick={() => setShowCodebook(true)}
                  aria-haspopup="dialog"
                >
                  {c.openCodebook}
                </button>
              ) : null}
              <label className={styles.formatPicker} title={c.binaryTitle}>
                {c.binary}
                <select
                  className={styles.select}
                  value={binaryFormat}
                  onChange={(event) => setBinaryFormat(event.target.value)}
                >
                  {Object.keys(binaryFormats).map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className={styles.btnPrimary} onClick={() => copyValues(false)}>
                {c.copyValues}
              </button>
              <button type="button" className={styles.btn} onClick={exportCsv}>
                {c.csv}
              </button>
              <button type="button" className={styles.btn} onClick={exportXlsx}>
                {c.xlsx}
              </button>
            </div>
          </header>

          <section className={styles.statusRow} aria-live="polite">
            <div className={styles.statusText}>
              <strong>{fmt(c.record, { i: String(index + 1).padStart(3, "0"), n: total, id: current.ID })}</strong>
              <span>
                {fmt(c.reviewed, { r: reviewedCount, n: total, p: percent })}
                {saveFailed ? ` · ${c.saveFailed}` : lastSaved ? ` · ${fmt(c.saved, { t: lastSaved })}` : ""}
                {copyStatus ? ` · ${copyStatus}` : ""}
              </span>
            </div>
            <progress className={styles.progress} value={reviewedCount} max={total} />
          </section>

          <p className={styles.pasteHint}>
            {fmt(c.hint, {
              copy: c.copyValues,
              from: layout.pasteColLetter,
              to: layout.lastColLetter,
              row: project.exampleRow ?? 2,
              auto: layout.hasAutoBlock
                ? fmt(c.hintAuto, { a: layout.autoFirstLetter, b: layout.autoLastLetter })
                : "",
            })}
          </p>

          {!layout.pasteAligned || !layout.pasteContiguous ? (
            <p className="notice notice-bad" role="alert">
              {!layout.pasteContiguous ? c.pasteGap : c.pasteReordered}
            </p>
          ) : null}

          {notice ? <p className="inferred-notice">{notice}</p> : null}

          {showCodebook ? (
            <CodebookPanel text={codebookText} onClose={() => setShowCodebook(false)} labels={c} />
          ) : null}

          <div className={styles.workspace}>
            <aside className={styles.leftPane}>
              <div className={styles.textBox}>{current[textField] || c.noText}</div>
              <LinkPreviews links={links} />
              <div className={styles.navigator}>
                <button type="button" className={styles.btn} disabled={index === 0} onClick={() => goTo(index - 1)}>
                  {c.prev}
                </button>
                <select
                  className={styles.select}
                  value={index}
                  onChange={(event) => goTo(Number(event.target.value))}
                  aria-label={c.selectRecord}
                >
                  {records.map((row, i) => (
                    <option key={row.id} value={i}>
                      {String(i + 1).padStart(3, "0")} · {row.Outlet || "—"}
                      {reviewed[i] ? " ✓" : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.btn}
                  disabled={index === total - 1}
                  onClick={() => goTo(index + 1)}
                >
                  {c.next}
                </button>
              </div>
            </aside>

            <section className={styles.formPane}>
              <section className={styles.metadata}>
                {metaFields.map((meta) => (
                  <div key={meta.key}>
                    <span>{meta.label}</span>
                    <strong>{String(current[meta.key] ?? "") || "—"}</strong>
                  </div>
                ))}
              </section>

              {inheritedFields.length > 0 ? (
                <>
                  <p className={styles.inheritedTitle}>{c.inheritedTitle}</p>
                  <section className={styles.inheritedStrip}>
                    {inheritedFields.map((field) => (
                      <div className={styles.inheritedChip} key={field.key}>
                        <span>{field.header}</span>
                        <strong>{renderInherited(current[field.key], field)}</strong>
                      </div>
                    ))}
                  </section>
                </>
              ) : null}

              {Object.entries(fieldsByGroup).map(([group, fields]) => (
                <section className={styles.fieldGroup} key={group}>
                  <h2>{group}</h2>
                  {fields.map((field) => (
                    <article
                      className={field.locked ? `${styles.fieldRow} ${styles.fieldRowLocked}` : styles.fieldRow}
                      key={field.key}
                    >
                      <div className={styles.fieldCopy} id={`campo-${field.key}`}>
                        <span className={styles.fieldKey}>
                          {field.header}
                          {field.required && !field.locked ? (
                            <b className={styles.reqMark}>{c.required}</b>
                          ) : null}
                        </span>
                        <h3 className={styles.fieldQuestion}>{field.question}</h3>
                        <p className={styles.fieldHelp}>{field.help}</p>
                      </div>
                      <div className={styles.fieldInput}>
                        {field.locked ? (
                          <div className={styles.lockedBadge}>
                            <span className={styles.lockedIcon} aria-hidden="true" />
                            {c.lockedBadge}
                            <span>{field.lockedNote || c.lockedDefault}</span>
                          </div>
                        ) : (
                          <FieldControl
                            field={field}
                            value={current[field.key]}
                            onChange={(value) => updateField(field.key, value)}
                            labelledBy={`campo-${field.key}`}
                          />
                        )}
                      </div>
                    </article>
                  ))}
                </section>
              ))}

              <footer className={styles.footerActions}>
                <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={resetProgress}>
                  {c.restore}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="visually-hidden-input"
                  aria-label={c.loadBackup}
                  onChange={importBackup}
                />
                <button type="button" className={styles.btn} onClick={() => fileInputRef.current?.click()}>
                  {c.loadBackup}
                </button>
                <button type="button" className={styles.btn} onClick={downloadBackup}>
                  {c.downloadBackup}
                </button>
                <button type="button" className={styles.btn} onClick={() => copyValues(true)}>
                  {c.copyHeader}
                </button>
                <button
                  type="button"
                  className={reviewed[index] ? `${styles.btn} ${styles.btnDone}` : styles.btnPrimary}
                  onClick={markReviewedAndAdvance}
                  disabled={missingRequired.length > 0}
                  title={
                    missingRequired.length
                      ? fmt(c.missingTitle, { list: missingRequired.map((f) => f.header).join(", ") })
                      : undefined
                  }
                >
                  {reviewLabel}
                </button>
              </footer>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
