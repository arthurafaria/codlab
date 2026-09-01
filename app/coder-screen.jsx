"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { LinkPreviews, extractLinks } from "./link-preview";
import { SiteNav } from "@/components/site-chrome";
import styles from "./coder.module.css";

// Tela de codificação de registro único. Recebe a rodada por props para que a
// amostra real e a amostra demonstrativa rodem exatamente o mesmo código.

function sheetColLetter(n) {
  let s = "";
  let x = n + 1;
  while (x > 0) {
    const m = (x - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}

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

function BooleanControl({ value, onChange }) {
  return (
    <div className={styles.segmented} role="radiogroup">
      <button type="button" className={value === true ? "" : styles.active} onClick={() => onChange(false)}>
        Não
      </button>
      <button type="button" className={value === true ? styles.active : ""} onClick={() => onChange(true)}>
        Sim
      </button>
    </div>
  );
}

function FieldControl({ field, value, onChange }) {
  if (field.type === "boolean") {
    return <BooleanControl value={value} onChange={onChange} />;
  }
  if (field.type === "select") {
    const options = field.options || [];
    const extra = value && !options.includes(value) ? [value] : [];
    return (
      <select
        className={styles.select}
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
    // Guardado como string separada por "|" — é assim que volta para a planilha.
    const picked = String(value || "").split("|").filter(Boolean);
    const toggle = (option) => {
      const next = picked.includes(option)
        ? picked.filter((p) => p !== option)
        : [...picked, option];
      // Preserva a ordem declarada no livro de códigos, não a ordem do clique.
      onChange((field.options || []).filter((o) => next.includes(o)).join("|"));
    };
    return (
      <div className={styles.checkGroup}>
        {(field.options || []).map((option) => (
          <label key={option} className={styles.checkOption}>
            <input
              type="checkbox"
              checked={picked.includes(option)}
              onChange={() => toggle(option)}
            />
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
        type="number"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }
  return (
    <textarea
      className={styles.textarea}
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
      rows={3}
    />
  );
}

export default function CoderScreen({ project, sourceRecords, codebook, extraAction = null }) {
  const { editableFields, metaFields, binaryFormats, defaultBinaryFormat, textField } = codebook;

  // Geometria do bloco de colunas codificáveis, derivada do livro de códigos.
  const layout = useMemo(() => {
    const defaults = Object.fromEntries(
      editableFields.map((field) => [field.key, field.type === "boolean" ? false : ""]),
    );
    // Variáveis canceladas: sempre travadas no valor padrão (booleano = false/Não).
    const lockedResets = Object.fromEntries(
      editableFields
        .filter((field) => field.locked)
        .map((field) => [field.key, field.type === "boolean" ? false : ""]),
    );
    // A colagem pula as colunas automáticas/herdadas do começo e começa na primeira
    // coluna que o humano realmente codifica. Colunas travadas no meio continuam no
    // bloco para manter o alinhamento.
    const codedBlockStart = project.codedBlockStart ?? 10; // coluna K (0-indexed)
    const firstCodeIndex = editableFields.findIndex((field) => !field.locked && !field.inherited);
    const pasteFields = editableFields.slice(firstCodeIndex);
    return {
      defaults,
      lockedResets,
      pasteFields,
      pasteHeaders: pasteFields.map((field) => field.header),
      pasteColLetter: sheetColLetter(codedBlockStart + firstCodeIndex),
      lastColLetter: sheetColLetter(codedBlockStart + editableFields.length - 1),
      // Só existe bloco automático quando há colunas travadas/herdadas antes da
      // primeira codificável. Sem elas, a frase não se aplica.
      hasAutoBlock: firstCodeIndex > 0,
      autoFirstLetter: sheetColLetter(codedBlockStart),
      autoLastLetter: sheetColLetter(codedBlockStart + firstCodeIndex - 1),
    };
  }, [editableFields, project.codedBlockStart]);

  const buildRecords = useMemo(
    () => (saved) =>
      sourceRecords.map((row, index) => ({
        ...layout.defaults,
        ...row,
        ...(saved ? saved[index] : null),
        // Conteúdo-fonte nunca é sobrescrito pelo rascunho.
        id: row.id,
        [textField]: row[textField],
        ...Object.fromEntries(metaFields.map((meta) => [meta.key, row[meta.key]])),
        // Categorias canceladas nunca recebem valor, mesmo vindo de rascunho antigo.
        ...layout.lockedResets,
      })),
    [sourceRecords, layout, metaFields, textField],
  );

  const [ready, setReady] = useState(false);
  const [records, setRecords] = useState(() => buildRecords(null));
  const [reviewed, setReviewed] = useState({});
  const [index, setIndex] = useState(0);
  const [binaryFormat, setBinaryFormat] = useState(defaultBinaryFormat);
  const [copyStatus, setCopyStatus] = useState("");
  const [lastSaved, setLastSaved] = useState("");
  const copyTimer = useRef(null);
  const fileInputRef = useRef(null);

  function loadSaved() {
    if (typeof window === "undefined") return null;
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

  useEffect(() => {
    const saved = loadSaved();
    if (saved) {
      setRecords(buildRecords(saved.records));
      setReviewed(saved.reviewed || {});
      setIndex(Math.min(saved.index ?? 0, sourceRecords.length - 1));
      if (saved.binaryFormat && binaryFormats[saved.binaryFormat]) setBinaryFormat(saved.binaryFormat);
    } else if (project.demoSeed) {
      // Amostra demonstrativa: abre já em andamento, para mostrar a ferramenta em uso.
      const seeded = {};
      for (let i = 0; i < project.demoSeed.reviewed; i += 1) seeded[i] = true;
      setReviewed(seeded);
      setIndex(Math.min(project.demoSeed.index ?? 0, sourceRecords.length - 1));
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(
      project.storageKey,
      JSON.stringify({ records, reviewed, index, binaryFormat, updatedAt: new Date().toISOString() }),
    );
    setLastSaved(new Date().toLocaleTimeString("pt-BR"));
  }, [ready, records, reviewed, index, binaryFormat]);

  const total = records.length;
  const current = records[index];
  const reviewedCount = Object.values(reviewed).filter(Boolean).length;
  const percent = total ? Math.round((reviewedCount / total) * 100) : 0;
  const links = useMemo(() => extractLinks(current?.[textField]), [current, textField]);

  const inheritedFields = useMemo(() => editableFields.filter((f) => f.inherited), [editableFields]);
  const fieldsByGroup = useMemo(() => {
    return editableFields
      .filter((f) => !f.inherited)
      .reduce((acc, field) => {
        (acc[field.group] ||= []).push(field);
        return acc;
      }, {});
  }, [editableFields]);

  // Obrigatórias em branco travam o "marcar revisado": é mais barato barrar aqui
  // do que descobrir o buraco na conferência.
  const missingRequired = useMemo(() => {
    if (!current) return [];
    return editableFields.filter((field) => {
      if (!field.required || field.locked || field.inherited) return false;
      const value = current[field.key];
      if (field.type === "boolean") return value !== true && value !== false;
      return !String(value ?? "").trim();
    });
  }, [current, editableFields]);

  function renderInherited(value, field) {
    if (field.type === "boolean") return value === true ? "Sim" : "Não";
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

  function markReviewedAndAdvance() {
    if (missingRequired.length) {
      flash(`Faltam ${missingRequired.length} obrigatórias: ${missingRequired[0].header}`);
      return;
    }
    setReviewed((r) => ({ ...r, [index]: true }));
    if (index < total - 1) goTo(index + 1);
  }

  function serialize(record, field) {
    const value = record[field.key];
    if (field.type === "boolean") {
      const fmt = binaryFormats[binaryFormat];
      return value === true ? fmt.yes : fmt.no;
    }
    return String(value ?? "").replace(/[\t\r\n]+/g, " ").trim();
  }

  function buildRows(includeHeader) {
    const body = records.map((record) =>
      layout.pasteFields.map((field) => serialize(record, field)).join("\t"),
    );
    return includeHeader ? [layout.pasteHeaders.join("\t"), ...body].join("\n") : body.join("\n");
  }

  function flash(message) {
    setCopyStatus(message);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyStatus(""), 2600);
  }

  async function copyValues(includeHeader) {
    await copyText(buildRows(includeHeader));
    flash(
      includeHeader
        ? `${total} linhas + cabeçalho — cole na coluna ${layout.pasteColLetter}`
        : `${total} linhas × ${layout.pasteFields.length} colunas — cole na coluna ${layout.pasteColLetter}`,
    );
  }

  function makeAoa() {
    return [
      layout.pasteHeaders,
      ...records.map((record) => layout.pasteFields.map((field) => serialize(record, field))),
    ];
  }

  function exportXlsx() {
    const sheet = XLSX.utils.aoa_to_sheet(makeAoa());
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, project.sheetName || "codificacao");
    XLSX.writeFile(book, `${project.exportBasename || "codificacao"}.xlsx`);
  }

  function exportCsv() {
    const sheet = XLSX.utils.aoa_to_sheet(makeAoa());
    const csv = XLSX.utils.sheet_to_csv(sheet);
    downloadText(`${project.exportBasename || "codificacao"}.csv`, `﻿${csv}`, "text/csv;charset=utf-8");
  }

  function resetProgress() {
    if (!window.confirm("Restaurar os dados originais neste navegador? Isso apaga o rascunho.")) return;
    localStorage.removeItem(project.storageKey);
    setRecords(buildRecords(null));
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
    flash("Backup baixado");
  }

  function importBackup(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!Array.isArray(data.records) || data.records.length !== sourceRecords.length) {
          window.alert("Backup inválido: número de registros diferente.");
          return;
        }
        setRecords(buildRecords(data.records));
        setReviewed(data.reviewed || {});
        setIndex(Math.min(data.index ?? 0, sourceRecords.length - 1));
        flash("Backup carregado");
      } catch {
        window.alert("Não consegui ler esse arquivo de backup.");
      }
    };
    reader.readAsText(file);
  }

  useEffect(() => {
    function onKey(event) {
      const tag = event.target.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;
      if (event.key === "ArrowLeft") goTo(index - 1);
      else if (event.key === "ArrowRight") goTo(index + 1);
      else if (event.key === "Enter") markReviewedAndAdvance();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, total]);

  // Evita erro de hidratação: servidor e primeira renderização do cliente mostram
  // o mesmo shell estático; a UI interativa só entra depois de montar no cliente.
  if (!ready || !current) {
    return (
      <>
      <SiteNav />
      <main id="main-content" className={styles.root}>
        <div className={styles.shell}>
          <p className={styles.eyebrow}>{project.eyebrow}</p>
          <h1 className={styles.title}>{project.title}</h1>
          <p style={{ color: "var(--muted)", marginTop: 16 }}>Carregando…</p>
        </div>
      </main>
      </>
    );
  }

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
            <label
              className={styles.formatPicker}
              title="FALSE/TRUE casa com os checkboxes do Google Sheets. Use 0/1 só se a coluna não for checkbox."
            >
              Binário
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
              Copiar valores
            </button>
            <button type="button" className={styles.btn} onClick={exportCsv}>
              CSV
            </button>
            <button type="button" className={styles.btn} onClick={exportXlsx}>
              XLSX
            </button>
          </div>
        </header>

        <section className={styles.statusRow}>
          <div className={styles.statusText}>
            <strong>
              Registro {String(index + 1).padStart(3, "0")}/{total} · ID {current.ID}
            </strong>
            <span>
              {reviewedCount}/{total} revisados · {percent}%
              {lastSaved ? ` · salvo ${lastSaved} ✓` : ""}
              {copyStatus ? ` · ${copyStatus}` : ""}
            </span>
          </div>
          <progress className={styles.progress} value={reviewedCount} max={total} />
        </section>

        <p className={styles.pasteHint}>
          <strong>Copiar valores</strong> gera as colunas{" "}
          <strong>
            {layout.pasteColLetter}→{layout.lastColLetter}
          </strong>
          {layout.hasAutoBlock ? (
            <>
              {" "}
              (só as que você codifica; {layout.autoFirstLetter}–{layout.autoLastLetter} são
              automáticas)
            </>
          ) : null}
          . Cole na célula <strong>{layout.pasteColLetter}</strong> da primeira linha de dados — ex.:{" "}
          <strong>
            {layout.pasteColLetter}
            {project.exampleRow ?? 132}
          </strong>
          .
        </p>

        <div className={styles.workspace}>
          <aside className={styles.leftPane}>
            <div className={styles.textBox}>{current[textField] || "— sem texto —"}</div>
            <LinkPreviews links={links} />
            <div className={styles.navigator}>
              <button type="button" className={styles.btn} disabled={index === 0} onClick={() => goTo(index - 1)}>
                Anterior
              </button>
              <select
                className={styles.select}
                value={index}
                onChange={(event) => goTo(Number(event.target.value))}
                aria-label="Selecionar registro"
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
                Próxima
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

            <p className={styles.inheritedTitle}>Não preencher (coluna herdada)</p>
            <section className={styles.inheritedStrip}>
              {inheritedFields.map((field) => (
                <div className={styles.inheritedChip} key={field.key}>
                  <span>{field.header}</span>
                  <strong>{renderInherited(current[field.key], field)}</strong>
                </div>
              ))}
            </section>

            {Object.entries(fieldsByGroup).map(([group, fields]) => (
              <section className={styles.fieldGroup} key={group}>
                <h2>{group}</h2>
                {fields.map((field) => (
                  <article
                    className={field.locked ? `${styles.fieldRow} ${styles.fieldRowLocked}` : styles.fieldRow}
                    key={field.key}
                  >
                    <div className={styles.fieldCopy}>
                      <span className={styles.fieldKey}>
                        {field.header}
                        {field.required && !field.locked ? (
                          <b className={styles.reqMark} title="obrigatória">
                            obrigatória
                          </b>
                        ) : null}
                      </span>
                      <h3 className={styles.fieldQuestion}>{field.question}</h3>
                      <p className={styles.fieldHelp}>{field.help}</p>
                    </div>
                    <div className={styles.fieldInput}>
                      {field.locked ? (
                        <div className={styles.lockedBadge}>
                          ⛔ NÃO PREENCHER
                          <span>{field.lockedNote || "não preencher"}</span>
                        </div>
                      ) : (
                        <FieldControl
                          field={field}
                          value={current[field.key]}
                          onChange={(value) => updateField(field.key, value)}
                        />
                      )}
                    </div>
                  </article>
                ))}
              </section>
            ))}

            <footer className={styles.footerActions}>
              <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={resetProgress}>
                Restaurar
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                style={{ display: "none" }}
                onChange={importBackup}
              />
              <button type="button" className={styles.btn} onClick={() => fileInputRef.current?.click()}>
                Carregar backup
              </button>
              <button type="button" className={styles.btn} onClick={downloadBackup}>
                Baixar backup
              </button>
              <button type="button" className={styles.btn} onClick={() => copyValues(true)}>
                Copiar com cabeçalho
              </button>
              <button
                type="button"
                className={reviewed[index] ? `${styles.btn} ${styles.btnDone}` : styles.btnPrimary}
                onClick={markReviewedAndAdvance}
                disabled={missingRequired.length > 0}
                title={
                  missingRequired.length
                    ? `Obrigatórias em branco: ${missingRequired.map((f) => f.header).join(", ")}`
                    : undefined
                }
              >
                {missingRequired.length
                  ? `${missingRequired.length} obrigatória${missingRequired.length > 1 ? "s" : ""} em branco`
                  : reviewed[index]
                    ? "Revisado · avançar"
                    : "Marcar revisado (Enter)"}
              </button>
            </footer>
          </section>
        </div>
      </div>
    </main>
    </>
  );
}
