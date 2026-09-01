"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { SiteNav, SiteFooter } from "@/components/site-chrome";
import CoderScreen from "../coder-screen";
import {
  parseRoundWorkbook,
  buildTemplateWorkbook,
  listStoredRounds,
  saveRound,
  loadRound,
  forgetRound,
} from "@/lib/round-import";

export default function CodificarPage() {
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
        saveRound(parsed);
        refresh();
        setRound(parsed);
      } catch (err) {
        setError(err.message || "Não consegui ler essa planilha.");
      }
    };
    reader.onerror = () => setError("Não consegui abrir o arquivo.");
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
    if (loaded) setRound(loaded);
    else {
      setError("Essa rodada não está mais guardada neste navegador.");
      refresh();
    }
  }

  function drop(entry) {
    if (!window.confirm(`Remover "${entry.title}" deste navegador? O progresso vai junto.`)) return;
    forgetRound(entry.id);
    refresh();
  }

  if (round) {
    return (
      <CoderScreen
        project={round.project}
        sourceRecords={round.records}
        codebook={round.codebook}
        extraAction={
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRound(null)}>
            Trocar rodada
          </button>
        }
      />
    );
  }

  return (
    <>
      <SiteNav />
      <main id="main-content">
        <section className="shell" style={{ padding: "56px 0 24px" }}>
          <div className="band-head" style={{ marginBottom: 32 }}>
            <p className="script">Sua rodada, seu navegador</p>
            <h1 style={{ fontSize: "clamp(1.9rem, 4vw, 2.6rem)" }}>
              Carregue o livro de códigos e comece.
            </h1>
            <p className="prose">
              Uma planilha <code>.xlsx</code> com as abas <code>items</code> e{" "}
              <code>variables</code>. O arquivo é lido aqui mesmo, no navegador — não passa por
              servidor nenhum e não sai desta máquina.
            </p>
          </div>

          <div className="split-note">
            <div style={{ display: "grid", gap: 18 }}>
              <div
                className={dragging ? "dropzone is-over" : "dropzone"}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
              >
                <p style={{ fontWeight: 650 }}>Arraste a planilha aqui</p>
                <p className="prose" style={{ fontSize: "0.92rem", margin: 0 }}>
                  ou escolha o arquivo — <code>.xlsx</code> e <code>.xlsm</code>
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xlsm"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) ingest(file);
                  }}
                />
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={() => inputRef.current?.click()}
                >
                  Escolher planilha
                </button>
              </div>

              {error ? (
                <div className="notice notice-bad" role="alert">
                  {error}
                </div>
              ) : null}

              {ready && stored.length > 0 ? (
                <section style={{ display: "grid", gap: 12 }}>
                  <p className="overline">Rodadas neste navegador</p>
                  {stored.map((entry) => (
                    <div
                      key={entry.id}
                      className="card"
                      style={{
                        gridTemplateColumns: "minmax(0,1fr) auto",
                        display: "grid",
                        alignItems: "center",
                        gap: 16,
                        padding: "18px 20px",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{ fontSize: "0.98rem" }}>{entry.title}</h3>
                        <p className="prose" style={{ fontSize: "0.88rem" }}>
                          {entry.items} unidades · {entry.variables} variáveis
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => drop(entry)}
                        >
                          Remover
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => resume(entry)}
                        >
                          Continuar
                        </button>
                      </div>
                    </div>
                  ))}
                </section>
              ) : null}
            </div>

            <aside style={{ display: "grid", gap: 22 }}>
              <div className="rule-note">
                <h3>Não tem a planilha ainda?</h3>
                <p className="prose" style={{ fontSize: "0.94rem" }}>
                  Baixe o modelo em branco com as duas abas já montadas e um exemplo de cada tipo de
                  variável.
                </p>
                <div>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={downloadTemplate}>
                    Baixar modelo .xlsx
                  </button>
                </div>
              </div>

              <div className="rule-note">
                <h3>Como a aba variables funciona</h3>
                <p className="prose" style={{ fontSize: "0.94rem" }}>
                  Cada linha vira uma pergunta na ficha. As colunas que importam:
                </p>
                <ul
                  className="prose"
                  style={{ fontSize: "0.92rem", margin: 0, paddingLeft: "1.1rem", display: "grid", gap: 4 }}
                >
                  <li>
                    <code>variable_key</code> — nome da coluna na sua planilha
                  </li>
                  <li>
                    <code>label</code> — a pergunta que o codificador lê
                  </li>
                  <li>
                    <code>help</code> — o critério, logo abaixo da pergunta
                  </li>
                  <li>
                    <code>type</code> — <code>boolean</code>, <code>single_select</code>,{" "}
                    <code>multi_select</code>, <code>text</code> ou <code>number</code>
                  </li>
                  <li>
                    <code>options</code> — separadas por <code>|</code>
                  </li>
                  <li>
                    <code>required</code> — trava o &ldquo;revisado&rdquo; enquanto estiver em branco
                  </li>
                  <li>
                    <code>locked</code> — variável descontinuada: aparece travada e mantém a coluna
                  </li>
                </ul>
              </div>

              <div className="rule-note">
                <h3>Prefere ver funcionando antes?</h3>
                <p className="prose" style={{ fontSize: "0.94rem" }}>
                  A rodada de exemplo tem 30 unidades fictícias e 28 variáveis, já pela metade.
                </p>
                <div>
                  <Link className="btn btn-ghost btn-sm" href="/demo/">
                    Abrir exemplo
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
