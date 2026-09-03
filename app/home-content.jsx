"use client";

import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/site-chrome";
import { useT } from "@/lib/i18n";

// A home apresenta e sai da frente. Quem quer entender vai para o guia; quem
// quer ver funcionando vai para a demo. Explicação longa mora no guia.
export default function HomeContent() {
  const t = useT();
  const h = t.home;

  return (
    <>
      <SiteNav />

      <main id="main-content">
        <section className="shell hero">
          <div className="hero-copy">
            <p className="script">{h.script}</p>
            <h1>{h.title}</h1>
            <p className="prose">{h.lead}</p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/demo/">
                {h.ctaDemo}
              </Link>
              <Link className="btn btn-ghost" href="/guia/">
                {h.ctaLoad}
              </Link>
            </div>
            <p className="hero-note">{h.note}</p>
          </div>

          {/* Miniatura da ficha real, com os mesmos componentes da ferramenta. */}
          <div className="hero-card" aria-hidden="true">
            <div className="hero-card-bar">
              <strong>{h.card.record}</strong>
              <div className="hero-progress">
                <i />
              </div>
              <span className="hero-card-meta">{h.card.reviewed}</span>
            </div>

            <div className="hero-unit">{h.card.unit}</div>

            <div className="hero-fields">
              <HeroField k="Marco_Numeros" q={h.card.q1} on="yes" labels={h.card} />
              <HeroField k="Marco_Parcialidade" q={h.card.q2} on="yes" labels={h.card} />
              <HeroField k="Marco_Contestacao" q={h.card.q3} on="no" labels={h.card} />
            </div>
          </div>
        </section>

        <section className="band band-tint">
          <div className="shell">
            <div className="band-head">
              <p className="overline">{h.what.overline}</p>
              <h2>{h.what.title}</h2>
            </div>
            <div className="grid-3">
              {h.what.items.map(([title, body]) => (
                <article className="card" key={title}>
                  <h3>{title}</h3>
                  <p className="prose">{body}</p>
                </article>
              ))}
            </div>
            <div className="band-cta">
              <Link className="btn btn-dark" href="/guia/">
                {h.what.cta}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function HeroField({ k, q, on, labels }) {
  return (
    <div className="hero-field">
      <div>
        <span className="hero-field-key">{k}</span>
        <p>{q}</p>
      </div>
      <div className="hero-toggle">
        <b className={on === "no" ? "on" : ""}>{labels.no}</b>
        <b className={on === "yes" ? "on" : ""}>{labels.yes}</b>
      </div>
    </div>
  );
}
