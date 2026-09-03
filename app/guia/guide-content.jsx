"use client";

import Link from "next/link";
import * as XLSX from "xlsx";
import { SiteNav, SiteFooter } from "@/components/site-chrome";
import { useT } from "@/lib/i18n";
import { buildSampleWorkbook, buildCodebookText, buildCodebookDocx } from "@/lib/samples";
import { buildTemplateWorkbook } from "@/lib/round-import";

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function GuideContent() {
  const t = useT();
  const g = t.guide;

  const downloadSample = () =>
    XLSX.writeFile(buildSampleWorkbook(), "exemplo-uma-aba-por-codificador.xlsx");
  const downloadTemplate = () => XLSX.writeFile(buildTemplateWorkbook(), "modelo-codlab.xlsx");
  const downloadMd = () =>
    download(new Blob([buildCodebookText()], { type: "text/markdown" }), "livro-de-codigos.md");
  const downloadDocx = async () => {
    const zip = await buildCodebookDocx();
    const blob = await zip.generateAsync({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    download(blob, "livro-de-codigos.docx");
  };

  return (
    <>
      <SiteNav active="how" />

      <main id="main-content">
        <section className="shell guide-head">
          <p className="script">{g.script}</p>
          <h1>{g.title}</h1>
          <p className="prose guide-lead">{g.lead}</p>
          <ol className="quick-steps">
            {g.quick.map(([title, body], i) => (
              <li key={title}>
                <span className="step-n">{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p className="prose">{body}</p>
                </div>
              </li>
            ))}
          </ol>

          <nav className="guide-toc" aria-label={g.tocTitle}>
            <p className="overline">{g.tocTitle}</p>
            <ol>
              {Object.entries(g.toc).map(([key, label]) => (
                <li key={key}>
                  <a href={`#${key}`}>{label}</a>
                </li>
              ))}
            </ol>
          </nav>
        </section>

        {/* 1. Os dois arquivos */}
        <section className="band band-tint" id="files">
          <div className="shell">
            <div className="band-head">
              <p className="overline">01</p>
              <h2>{g.filesTitle}</h2>
              <p className="prose">{g.filesLead}</p>
            </div>
            <div className="grid-2">
              <article className="card">
                <span className="tag tag-on">.xlsx .xlsm .csv</span>
                <h3>{g.file1t}</h3>
                <p className="prose">{g.file1}</p>
              </article>
              <article className="card">
                <span className="tag tag-on">.pdf .docx .md .txt</span>
                <h3>{g.file2t}</h3>
                <p className="prose">{g.file2}</p>
              </article>
            </div>
            <p className="notice guide-notice">{g.filesNote}</p>
          </div>
        </section>

        {/* 2. A planilha */}
        <section className="band" id="sheet">
          <div className="shell">
            <div className="band-head">
              <p className="overline">02</p>
              <h2>{g.sheetTitle}</h2>
              <p className="prose">{g.sheetLead}</p>
            </div>

            {/* Onde a planilha se parte, desenhado com as próprias colunas. */}
            <div className="split-diagram" aria-hidden="true">
              <div className="split-side">
                <span className="overline">metadado</span>
                <div className="split-cols">
                  {["ID", "dia", "hora", "grupo", "Link"].map((c) => (
                    <code key={c}>{c}</code>
                  ))}
                </div>
              </div>
              <div className="split-pivot">
                <code>texto</code>
              </div>
              <div className="split-side">
                <span className="overline">variáveis</span>
                <div className="split-cols">
                  {["Tipo_URL", "Tema_Principal", "Desinfo_Emocional", "…", "OBS"].map((c) => (
                    <code key={c}>{c}</code>
                  ))}
                </div>
              </div>
            </div>

            <div className="guide-blocks">
              <article className="rule-note">
                <h3>{g.sheetMaterialT}</h3>
                <p className="prose">{g.sheetMaterial}</p>
              </article>

              <article className="rule-note">
                <h3>{g.sheetTypesT}</h3>
                <p className="prose">{g.sheetTypesLead}</p>
                <table className="guide-table">
                  <tbody>
                    {g.sheetTypesRows.map(([left, right]) => (
                      <tr key={left}>
                        <td>{left}</td>
                        <td>{right}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>

              <article className="rule-note">
                <h3>{g.sheetGroupsT}</h3>
                <p className="prose">{g.sheetGroups}</p>
              </article>

              <article className="rule-note">
                <h3>{g.sheetDatesT}</h3>
                <p className="prose">{g.sheetDates}</p>
              </article>

              <article className="rule-note">
                <h3>{g.sheetCodersT}</h3>
                <p className="prose">{g.sheetCoders}</p>
              </article>
            </div>
          </div>
        </section>

        {/* 3. O livro de códigos */}
        <section className="band band-tint" id="doc">
          <div className="shell">
            <div className="band-head">
              <p className="overline">03</p>
              <h2>{g.docTitle}</h2>
              <p className="prose">{g.docLead}</p>
            </div>

            <h3 className="guide-subhead">{g.docRulesT}</h3>
            <ol className="guide-steps">
              {g.docRules.map(([title, body], i) => (
                <li key={title}>
                  <span className="step-n">{i + 1}</span>
                  <div>
                    <h4>{title}</h4>
                    <p className="prose">{body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="grid-2 guide-example">
              <article>
                <h3 className="guide-subhead">{g.docExampleT}</h3>
                <pre className="guide-code">{g.docExample}</pre>
              </article>
              <article className="guide-example-copy">
                <h3 className="guide-subhead">{g.docResultT}</h3>
                <p className="prose">{g.docResult}</p>
                <h3 className="guide-subhead">{g.docPanelT}</h3>
                <p className="prose">{g.docPanel}</p>
              </article>
            </div>

            <div className="rule-note guide-map-note">
              <h3>{g.mapT}</h3>
              <p className="prose">{g.map1}</p>
              <p className="prose">{g.map2}</p>
              <p className="prose">{g.map2b}</p>
              <p className="prose">{g.map3}</p>
            </div>
          </div>
        </section>

        {/* 4. Como codificar */}
        <section className="band" id="coding">
          <div className="shell">
            <div className="band-head">
              <p className="overline">04</p>
              <h2>{g.codingTitle}</h2>
              <p className="prose">{g.codingLead}</p>
            </div>
            <ol className="guide-steps">
              {g.codingRules.map(([title, body], i) => (
                <li key={title}>
                  <span className="step-n">{i + 1}</span>
                  <div>
                    <h4>{title}</h4>
                    <p className="prose">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="notice guide-notice">
              <strong>{g.codingSaveT}.</strong> {g.codingSave}
            </p>
          </div>
        </section>

        {/* 5. Confiabilidade */}
        <section className="band band-dark" id="reliability">
          <div className="shell">
            <div className="band-head">
              <p className="overline overline-on-dark">05</p>
              <h2>{g.relTitle}</h2>
              <p className="prose">{g.relLead}</p>
            </div>
            <div className="grid-2">
              <article className="card">
                <h3>{g.relAlphaT}</h3>
                <p className="prose">{g.relAlpha}</p>
              </article>
              <article className="card">
                <h3>{g.relBpT}</h3>
                <p className="prose">{g.relBp}</p>
              </article>
            </div>
            <div className="grid-2 guide-rel-why">
              <article className="card">
                <h3>{g.relWhyT}</h3>
                <p className="prose">{g.relWhy}</p>
              </article>
              <article className="card">
                <h3>{g.relHowT}</h3>
                <p className="prose">{g.relHow}</p>
                <pre className="guide-code guide-code-dark">{g.relCode}</pre>
              </article>
            </div>
            <p className="prose guide-warn">
              <strong>{g.relWarnT}.</strong> {g.relWarn}
            </p>
          </div>
        </section>

        {/* 6. Downloads */}
        <section className="band" id="downloads">
          <div className="shell">
            <div className="band-head">
              <p className="overline">06</p>
              <h2>{g.dlTitle}</h2>
              <p className="prose">{g.dlLead}</p>
            </div>
            <div className="grid-3">
              <article className="card">
                <h3>{g.dlSheetT}</h3>
                <p className="prose">{g.dlSheet}</p>
                <div>
                  <button type="button" className="btn btn-primary btn-sm" onClick={downloadSample}>
                    {g.dlSheetCta}
                  </button>
                </div>
              </article>
              <article className="card">
                <h3>{g.dlDocT}</h3>
                <p className="prose">{g.dlDoc}</p>
                <div className="importer-actions">
                  <button type="button" className="btn btn-primary btn-sm" onClick={downloadMd}>
                    {g.dlDocMd}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={downloadDocx}>
                    {g.dlDocDocx}
                  </button>
                </div>
              </article>
              <article className="card">
                <h3>{g.dlTemplateT}</h3>
                <p className="prose">{g.dlTemplate}</p>
                <div>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={downloadTemplate}>
                    {g.dlTemplateCta}
                  </button>
                </div>
              </article>
            </div>
            <div className="band-cta">
              <Link className="btn btn-dark" href="/codificar/">
                {g.tryCta}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
