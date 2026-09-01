import "@/app/_legacy-platform.css";
// Plataforma generalista original (orientador + codificadores, banco, uploads).
// Movida da home para /platform: a home agora é o coder de tela única.
import ProjectCreator from "./project-creator";
import Badge from "@/components/ui/badge";
import Wordmark from "@/components/ui/wordmark";

export default function PlatformPage() {
  return (
    <main id="main-content" className="shell">
      <div className="brand-row">
        <Wordmark />
      </div>
      <header className="topbar">
        <div>
          <p className="eyebrow">Painel do orientador</p>
          <h1>Um painel para orientadores. Uma tela simples para codificadores.</h1>
          <p className="topbar-subtitle">
            O orientador prepara imagens, variáveis e links privados. Cada codificador recebe
            uma tela limpa para responder uma imagem por vez, sem ver o painel de gestão.
          </p>
        </div>
        <a className="button" href="/api/templates/project-template">
          Baixar template XLSX
        </a>
      </header>

      <div className="split">
        <section className="main-column">
          <ProjectCreator />
        </section>

        <aside className="side-column">
          <section className="panel">
            <div className="section-title">
              <h2>Comece como orientador</h2>
              <Badge tone="primary">Gestão</Badge>
            </div>
            <p className="muted">
              Para publicar uma rodada, você precisa de imagens e de um template com as abas
              <code>items</code> e <code>variables</code>. O livro de códigos pode entrar como{" "}
              <code>.md</code> ou <code>.docx</code>.
            </p>
          </section>
          <section className="panel">
            <div className="section-title">
              <h2>O codificador recebe</h2>
              <Badge tone="accent">Coleta</Badge>
            </div>
            <p className="muted">
              Um link <code>/code/...</code> com a imagem, instruções, campos obrigatórios e botão
              de envio.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
