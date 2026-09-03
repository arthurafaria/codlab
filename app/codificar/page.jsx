"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { SiteNav, SiteFooter } from "@/components/site-chrome";
import { useT, fmt } from "@/lib/i18n";
import CoderScreen from "../coder-screen";
import {
  inspectWorkbook,
  parseRoundWorkbook,
  buildTemplateWorkbook,
  listStoredRounds,
  saveRound,
  loadRound,
  forgetRound,
} from "@/lib/round-import";
import { extractDocText } from "@/lib/codebook-doc";

const DOC_EXT = /\.(pdf|docx|md|markdown|txt)$/i;
const SHEET_EXT = /\.(xlsx|xlsm|csv)$/i;

// Livro de códigos grande não cabe no localStorage junto com a rodada.
const MAX_DOC_CHARS = 400000;

function errorMessage(err, t) {
  if (err?.code && t.importer.errors[err.code]) return fmt(t.importer.errors[err.code], err.params || {});
  return err?.message || t.importer.readFail;
}

export default function CodificarPage() {
  const t = useT();
  const s = t.importer;
  const [round, setRound] = useState(null);
  const [pending, setPending] = useState(null); // { buffer, fileName, sheets }
  const [mapping, setMapping] = useState(null); // { round, aliases }
  const [dataFile, setDataFile] = useState(null); // { buffer, name }
  const [doc, setDoc] = useState(null); // { text, name }
  const [busy, setBusy] = useState(false);
  const [stored, setStored] = useState([]);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setStored(listStoredRounds());
    setReady(true);
  }, []);

  const refresh = () => setStored(listStoredRounds());
  // basePath do Pages: o worker do pdf.js mora ao lado do site.
  const basePath = typeof window === "undefined" ? "" : window.location.pathname.split("/codificar")[0];

  function finish(parsed) {
    parsed.project.eyebrow = s.loadedEyebrow;
    if (!parsed.project.title) parsed.project.title = s.untitled;
    saveRound(parsed);
    refresh();
    setPending(null);
    setMapping(null);
    setRound(parsed);
  }

  function open(buffer, fileName, sheetName, codebookDoc, aliases = {}) {
    const parsed = parseRoundWorkbook(buffer, { fileName, sheetName, codebookDoc, aliases });
    const cb = parsed.codebookDoc;
    // Sobrou coluna sem seção e seção sem coluna: costuma ser renomeação entre
    // as duas versões. Quem decide o de-para é o pesquisador, não o palpite.
    const podeLigar =
      cb && !Object.keys(aliases).length && cb.unmatched.length > 0 && cb.freeSections.length > 0;
    if (podeLigar) {
      setMapping({
        buffer,
        fileName,
        sheetName,
        codebookDoc,
        unmatched: cb.unmatched,
        sections: cb.freeSections,
        matched: cb.matched.length,
        total: parsed.codebook.editableFields.length,
        chosen: {},
      });
      setPending(null);
      return;
    }
    finish(parsed);
  }

  function applyMapping(aliases) {
    try {
      const parsed = parseRoundWorkbook(mapping.buffer, {
        fileName: mapping.fileName,
        sheetName: mapping.sheetName,
        codebookDoc: mapping.codebookDoc,
        aliases,
      });
      finish(parsed);
    } catch (err) {
      setError(errorMessage(err, t));
    }
  }

  // A planilha diz quais variáveis existem; o documento diz por que se marcam.
  // Os dois entram pelo mesmo campo e são separados pela extensão.
  async function accept(files) {
    setError("");
    setBusy(true);
    let nextData = dataFile;
    let nextDoc = doc;
    try {
      for (const file of files) {
        if (DOC_EXT.test(file.name)) {
          try {
            const text = await extractDocText(file, { workerSrc: `${basePath}/pdf.worker.mjs` });
            nextDoc = { text: text.slice(0, MAX_DOC_CHARS), name: file.name };
          } catch (err) {
            console.error("livro de códigos:", err);
            setError(fmt(s.docFail, { name: file.name }));
          }
        } else if (SHEET_EXT.test(file.name)) {
          nextData = { buffer: await file.arrayBuffer(), name: file.name };
        }
      }
      setDataFile(nextData);
      setDoc(nextDoc);
      if (nextData) start(nextData, nextDoc);
    } finally {
      setBusy(false);
    }
  }

  function start(data, codebook) {
    try {
      const found = inspectWorkbook(data.buffer);
      const usable = found.sheets.filter((sheet) => sheet.usable);
      // Mais de uma aba codificável: quem escolhe é o pesquisador, não o palpite.
      if (found.mode === "infer" && usable.length > 1) {
        setPending({ buffer: data.buffer, fileName: data.name, sheets: found.sheets });
        return;
      }
      open(data.buffer, data.name, "", codebook?.text || null);
    } catch (err) {
      setError(errorMessage(err, t));
    }
  }

  function pickSheet(name) {
    try {
      open(pending.buffer, pending.fileName, name, doc?.text || null);
    } catch (err) {
      setError(errorMessage(err, t));
    }
  }

  function onDrop(event) {
    event.preventDefault();
    setDragging(false);
    const files = [...(event.dataTransfer.files || [])];
    if (files.length) accept(files);
  }

  function clearFiles() {
    setDataFile(null);
    setDoc(null);
    setPending(null);
    setMapping(null);
    setError("");
  }

  function downloadTemplate() {
    XLSX.writeFile(buildTemplateWorkbook(), "modelo-codlab.xlsx");
  }

  function resume(entry) {
    const loaded = loadRound(entry.id);
    if (loaded) {
      loaded.project.eyebrow = s.loadedEyebrow;
      setRound(loaded);
    } else {
      setError(s.gone);
      refresh();
    }
  }

  function drop(entry) {
    if (!window.confirm(fmt(s.confirmRemove, { title: entry.title }))) return;
    forgetRound(entry.id);
    refresh();
  }

  if (round) {
    return (
      <CoderScreen
        key={round.project.id}
        project={round.project}
        sourceRecords={round.records}
        codebook={round.codebook}
        codebookText={round.codebookDoc?.text || ""}
        notice={
          // Com livro de códigos carregado o aviso vira relatório: dizer que a
          // pergunta é o nome da coluna seria mentira, o documento deu as
          // perguntas.
          round.codebookDoc
            ? fmt(s.mapReport, {
                matched: round.codebookDoc.matched.length,
                total: round.codebook.editableFields.length,
              })
            : round.summary?.inferred
              ? fmt(s.inferredNotice, { sheet: round.summary.sheet })
              : null
        }
        extraAction={
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setRound(null);
              setPending(null);
              setMapping(null);
            }}
          >
            {t.coder.switchRound}
          </button>
        }
      />
    );
  }

  return (
    <>
      <SiteNav />
      <main id="main-content">
        <section className="shell importer">
          <div className="band-head importer-head">
            <p className="script">{mapping ? mapping.fileName : pending ? pending.fileName : s.script}</p>
            <h1 className="importer-title">
              {mapping ? s.mapTitle : pending ? s.sheetTitle : s.title}
            </h1>
            <p className="prose">{mapping ? s.mapLead : pending ? s.sheetLead : s.lead}</p>
            {mapping ? (
              <p className="overline">
                {fmt(s.mapReport, { matched: mapping.matched, total: mapping.total })}
              </p>
            ) : null}
          </div>

          <div className="split-note">
            <div className="importer-main">
              {mapping ? (
                <div className="map-list">
                  <div className="map-row map-head" aria-hidden="true">
                    <span>{s.mapColumn}</span>
                    <span>{s.mapSection}</span>
                  </div>
                  {mapping.unmatched.map((key) => (
                    <label className="map-row" key={key}>
                      <code className="map-key">{key}</code>
                      <select
                        value={mapping.chosen[key] ?? ""}
                        onChange={(e) =>
                          setMapping((m) => ({
                            ...m,
                            chosen: { ...m.chosen, [key]: e.target.value },
                          }))
                        }
                      >
                        <option value="">{s.mapNone}</option>
                        {mapping.sections.map((sec) => (
                          <option key={sec.index} value={sec.index}>
                            {sec.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <div className="importer-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() =>
                        applyMapping(
                          Object.fromEntries(
                            Object.entries(mapping.chosen).filter(([, v]) => v !== ""),
                          ),
                        )
                      }
                    >
                      {s.mapApply}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => applyMapping({})}>
                      {s.mapSkip}
                    </button>
                  </div>
                </div>
              ) : pending ? (
                <div className="sheet-list">
                  {pending.sheets.map((sheet) => (
                    <div
                      key={sheet.name}
                      className={sheet.usable ? "sheet-row" : "sheet-row sheet-row-off"}
                    >
                      <div>
                        <div className="sheet-row-name">{sheet.name}</div>
                        <div className="sheet-row-meta">
                          {sheet.usable
                            ? fmt(s.sheetMeta, {
                                rows: sheet.rows,
                                variables: sheet.variables,
                                text: sheet.textField,
                              })
                            : fmt(s.sheetSkip, { reason: sheet.reason })}
                        </div>
                      </div>
                      {sheet.usable ? (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => pickSheet(sheet.name)}
                        >
                          {s.sheetPick}
                        </button>
                      ) : null}
                    </div>
                  ))}
                  <div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setPending(null)}
                    >
                      {t.coder.switchRound}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={dragging ? "dropzone is-over" : "dropzone"}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                >
                  <p className="dropzone-title">{s.dropTitle}</p>
                  <p className="prose dropzone-hint">{s.dropHint}</p>
                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept=".xlsx,.xlsm,.csv,.pdf,.docx,.md,.markdown,.txt"
                    className="visually-hidden-input"
                    aria-label={s.choose}
                    onChange={(e) => {
                      const files = [...(e.target.files || [])];
                      e.target.value = "";
                      if (files.length) accept(files);
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-dark"
                    onClick={() => inputRef.current?.click()}
                    disabled={busy}
                  >
                    {s.choose}
                  </button>
                </div>
              )}

              {dataFile || doc ? (
                <div className="file-chips">
                  {dataFile ? (
                    <div className="file-chip">{fmt(s.gotData, { name: dataFile.name })}</div>
                  ) : null}
                  {doc ? <div className="file-chip">{fmt(s.gotDoc, { name: doc.name })}</div> : null}
                  <div className="importer-actions">
                    {dataFile && pending ? null : null}
                    <button type="button" className="btn btn-ghost btn-sm" onClick={clearFiles}>
                      {s.clearFiles}
                    </button>
                    {!dataFile ? <span className="sheet-row-meta">{s.needData}</span> : null}
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="notice notice-bad" role="alert">
                  {error}
                </div>
              ) : null}

              {ready && !pending && !mapping && stored.length > 0 ? (
                <section className="stored-rounds">
                  <p className="overline">{s.storedTitle}</p>
                  {stored.map((entry) => (
                    <div key={entry.id} className="card stored-round">
                      <div className="stored-round-copy">
                        <h3>{entry.title}</h3>
                        <p className="prose">
                          {fmt(s.storedMeta, { items: entry.items, variables: entry.variables })}
                        </p>
                      </div>
                      <div className="stored-round-actions">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => drop(entry)}>
                          {s.remove}
                        </button>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => resume(entry)}>
                          {s.resume}
                        </button>
                      </div>
                    </div>
                  ))}
                </section>
              ) : null}
            </div>

            <aside className="importer-aside">
              <div className="rule-note">
                <h3>{s.a1t}</h3>
                <p className="prose">{s.a1}</p>
                <div>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={downloadTemplate}>
                    {s.a1cta}
                  </button>
                </div>
              </div>

              <div className="rule-note">
                <h3>{s.a2t}</h3>
                <p className="prose">{s.a2}</p>
                <ul className="prose spec-list">
                  {Object.entries(s.a2rows).map(([key, desc]) => (
                    <li key={key}>
                      <code>{key}</code> {desc}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rule-note">
                <h3>{s.a5t}</h3>
                <p className="prose">{s.a5}</p>
              </div>

              <div className="rule-note">
                <h3>{s.a4t}</h3>
                <p className="prose">{s.a4}</p>
              </div>

              <div className="rule-note">
                <h3>{s.a3t}</h3>
                <p className="prose">{s.a3}</p>
                <div>
                  <Link className="btn btn-ghost btn-sm" href="/demo/">
                    {s.a3cta}
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
