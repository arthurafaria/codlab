"use client";

import Link from "next/link";
import Wordmark, { BrandMark } from "./ui/wordmark";
import { useT, LangSwitch } from "@/lib/i18n";
import { ThemeSwitch } from "@/lib/theme";

export const REPO_URL = "https://github.com/arthurafaria/codlab";
export const LAB_URL = "https://colab.meme";

export function SiteNav({ active }) {
  const t = useT();
  return (
    <nav className="site-nav">
      <div className="shell site-nav-inner">
        <Link href="/" className="wordmark" aria-label={t.nav.home}>
          <BrandMark />
          <span aria-hidden="true">CodLAB</span>
        </Link>

        <div className="site-nav-links">
          <Link href="/guia/" aria-current={active === "how" ? "page" : undefined}>
            {t.nav.how}
          </Link>
          <Link href="/demo/" aria-current={active === "demo" ? "page" : undefined}>
            {t.nav.demo}
          </Link>
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            {t.nav.code}
          </a>
        </div>

        <div className="site-nav-cta">
          <ThemeSwitch label={t.nav.theme} />
          <LangSwitch />
          <Link className="btn btn-primary btn-sm" href="/codificar/">
            {t.nav.cta}
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  const t = useT();
  return (
    <footer className="site-footer">
      <div className="shell site-footer-inner">
        <div className="site-footer-about">
          <Wordmark />
          <p className="prose">{t.footer.about}</p>
        </div>

        <div className="footer-links">
          <Link href="/demo/">{t.footer.demo}</Link>
          <Link href="/codificar/">{t.footer.load}</Link>
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            {t.footer.repo}
          </a>
          <a href={LAB_URL} target="_blank" rel="noreferrer">
            {t.footer.lab}
          </a>
        </div>
      </div>
    </footer>
  );
}
