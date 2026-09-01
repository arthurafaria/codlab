"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { SiteNav, SiteFooter } from "@/components/site-chrome";
import { useT, fmt } from "@/lib/i18n";
import CoderScreen from "../coder-screen";
import {
  parseRoundWorkbook,
  buildTemplateWorkbook,
  listStoredRounds,
  saveRound,
  loadRound,
  forgetRound,
} from "@/lib/round-import";

function errorMessage(err, t) {
  if (err?.code && t.importer.errors[err.code]) return fmt(t.importer.errors[err.code], err.params || {});
  return err?.message || t.importer.readFail;
}

export default function CodificarPage() {
  const t = useT();
  const s = t.importer;
  const [round, setRound] = useState(null);
  const [stored, setStored] = useState([]);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setStored(listStoredRounds());
    setReady(true);
  }, []);

  function refresh() {
    setStored(listStoredRounds());
  }

  function ingest(file) {
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseRoundWorkbook(reader.result, { fileName: file.name });
        parsed.project.eyebrow = s.loadedEyebrow;
        if (!parsed.project.title) parsed.project.title = s.untitled;
        saveRound(parsed);
        refresh();
        setRound(parsed);
      } catch (err) {
        setError(errorMessage(err, t));
      }
    };
    reader.onerror = () => setError(s.openFail);
    reader.readAsArrayBuffer(file);
  }

  function onDrop(event) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) ingest(file);
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
        extraAction={
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRound(null)}>
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
            <p className="script">{s.script}</p>
            <h1 className="importer-title">{s.title}</h1>
            <p className="prose">{s.lead}</p>
          </div>

          <div className="split-note">
            <div className="importer-main">
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
                  accept=".xlsx,.xlsm"
                  className="visually-hidden-input"
                  aria-label={s.choose}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) ingest(file);
                  }}
                />
                <button type="button" className="btn btn-dark" onClick={() => inputRef.current?.click()}>
                  {s.choose}
                </button>
              </div>

              {error ? (
                <div className="notice notice-bad" role="alert">
                  {error}
                </div>
              ) : null}

              {ready && stored.length > 0 ? (
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
