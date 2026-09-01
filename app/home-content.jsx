"use client";

import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/site-chrome";
import { useT } from "@/lib/i18n";

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
              <Link className="btn btn-dark" href="/codificar/">
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
              <p className="overline">{h.problem.overline}</p>
              <h2>{h.problem.title}</h2>
            </div>
            <div className="grid-3">
              <article className="card">
                <h3>{h.problem.c1t}</h3>
                <p className="prose">{h.problem.c1}</p>
              </article>
              <article className="card">
                <h3>{h.problem.c2t}</h3>
                <p className="prose">{h.problem.c2}</p>
              </article>
              <article className="card">
                <h3>{h.problem.c3t}</h3>
                <p className="prose">{h.problem.c3}</p>
              </article>
            </div>
          </div>
        </section>

        <section className="band" id="como-funciona">
          <div className="shell">
            <div className="band-head">
              <p className="overline">{h.how.overline}</p>
              <h2>{h.how.title}</h2>
              <p className="prose">{h.how.lead}</p>
            </div>
            <div className="grid-3">
              <article className="card">
                <span className="step-n">1</span>
                <h3>{h.how.s1t}</h3>
                <p className="prose">{h.how.s1}</p>
              </article>
              <article className="card">
                <span className="step-n">2</span>
                <h3>{h.how.s2t}</h3>
                <p className="prose">{h.how.s2}</p>
              </article>
              <article className="card">
                <span className="step-n">3</span>
                <h3>{h.how.s3t}</h3>
                <p className="prose">
                  <strong>{h.how.s3a}</strong>
                  {h.how.s3b}
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="band band-orange">
          <div className="shell split-note">
            <div className="band-head band-head-tight">
              <p className="overline overline-on-orange">{h.reliability.overline}</p>
              <h2>{h.reliability.title}</h2>
              <p className="prose">{h.reliability.body}</p>
            </div>
            <div className="card">
              <span className="tag tag-on">{h.reliability.tag}</span>
              <h3>{h.reliability.key}</h3>
              <p className="prose">{h.reliability.note}</p>
            </div>
          </div>
        </section>

        <section className="band band-dark">
          <div className="shell">
            <div className="band-head">
              <p className="overline overline-on-dark">{h.data.overline}</p>
              <h2>{h.data.title}</h2>
            </div>
            <div className="grid-2">
              <article className="card">
                <h3>{h.data.c1t}</h3>
                <p className="prose">{h.data.c1}</p>
              </article>
              <article className="card">
                <h3>{h.data.c2t}</h3>
                <p className="prose">{h.data.c2}</p>
              </article>
            </div>
            <div className="band-cta">
              <Link className="btn btn-primary" href="/demo/">
                {h.data.cta}
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
