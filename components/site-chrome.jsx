import Link from "next/link";
import Wordmark from "./ui/wordmark";

export const REPO_URL = "https://github.com/arthurafaria/codlab";
export const LAB_URL = "https://colab.meme";

export function SiteNav({ active }) {
  return (
    <nav className="site-nav">
      <div className="shell site-nav-inner">
        <Link href="/" className="wordmark" aria-label="CodLAB — início">
          <span aria-hidden="true">
            <em>Cod</em>L
            <svg viewBox="0 0 14 13" width="14" height="13" focusable="false">
              <path d="M7 0 14 13H0Z" fill="currentColor" />
            </svg>
            B
          </span>
        </Link>

        <div className="site-nav-links">
          <Link href="/#como-funciona" aria-current={active === "como" ? "page" : undefined}>
            Como funciona
          </Link>
          <Link href="/demo/" aria-current={active === "demo" ? "page" : undefined}>
            Exemplo
          </Link>
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            Código
          </a>
        </div>

        <div className="site-nav-cta">
          <Link className="btn btn-primary btn-sm" href="/codificar/">
            Codificar
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer-inner">
        <div style={{ display: "grid", gap: 14, maxWidth: "44ch" }}>
          <Wordmark className="footer-mark" />
          <p className="prose">
            Ferramenta de codificação manual para análise de conteúdo. Desenvolvida no coLAB/UFF —
            Laboratório de Pesquisa em Comunicação, Culturas Políticas e Economia da Colaboração.
          </p>
        </div>

        <div className="footer-links">
          <Link href="/demo/">Rodada de exemplo</Link>
          <Link href="/codificar/">Carregar planilha</Link>
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            Repositório
          </a>
          <a href={LAB_URL} target="_blank" rel="noreferrer">
            coLAB/UFF
          </a>
        </div>
      </div>
    </footer>
  );
}
