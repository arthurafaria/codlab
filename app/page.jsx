import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/site-chrome";

export const metadata = {
  title: "CodLAB — codificação colaborativa",
};

export default function Home() {
  return (
    <>
      <SiteNav />

      <main id="main-content">
        <section className="shell hero">
          <div className="hero-copy">
            <p className="script">Feito no coLAB/UFF</p>
            <h1>Codificação manual sem a planilha aberta do lado.</h1>
            <p className="prose">
              O CodLAB põe uma unidade por vez na tela, com a pergunta do livro de códigos ao lado
              de cada variável. No fim, você devolve o bloco de colunas para a sua planilha — na
              ordem exata em que ele saiu.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/demo/">
                Ver uma rodada pronta
              </Link>
              <Link className="btn btn-dark" href="/codificar/">
                Carregar minha planilha
              </Link>
            </div>
            <p className="hero-note">
              Roda inteiro no navegador. Sem conta, sem upload, sem servidor.
            </p>
          </div>

          {/* Miniatura da ficha real, com os mesmos componentes da ferramenta. */}
          <div className="hero-card" aria-hidden="true">
            <div className="hero-card-bar">
              <strong>Registro 005/30</strong>
              <div className="hero-progress">
                <i />
              </div>
              <span style={{ fontSize: "0.78rem", color: "var(--ink-3)" }}>17 revisados</span>
            </div>

            <div className="hero-unit">
              Instalaram 14 câmeras na Praça Matriz e a criminalidade caiu 60% em dois meses. Ou
              seja: funciona. Quem era contra agora vai dizer o quê?
            </div>

            <div className="hero-fields">
              <div className="hero-field">
                <div>
                  <span className="hero-field-key">Marco_Numeros</span>
                  <p>Usa números ou estatísticas como argumento?</p>
                </div>
                <div className="hero-toggle">
                  <b>Não</b>
                  <b className="on">Sim</b>
                </div>
              </div>
              <div className="hero-field">
                <div>
                  <span className="hero-field-key">Marco_Parcialidade</span>
                  <p>Apresenta apenas um lado da questão?</p>
                </div>
                <div className="hero-toggle">
                  <b>Não</b>
                  <b className="on">Sim</b>
                </div>
              </div>
              <div className="hero-field">
                <div>
                  <span className="hero-field-key">Marco_Contestacao</span>
                  <p>Contesta consenso técnico estabelecido?</p>
                </div>
                <div className="hero-toggle">
                  <b className="on">Não</b>
                  <b>Sim</b>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="band band-tint">
          <div className="shell">
            <div className="band-head">
              <p className="overline">O que trava uma rodada</p>
              <h2>Codificar dentro da planilha cobra caro.</h2>
            </div>
            <div className="grid-3">
              <article className="card">
                <h3>Quarenta colunas por linha</h3>
                <p className="prose">
                  Você rola na horizontal para achar a variável, perde a linha e preenche a de
                  baixo. O erro só aparece na conferência, quando já contaminou o lote.
                </p>
              </article>
              <article className="card">
                <h3>O livro de códigos em outra janela</h3>
                <p className="prose">
                  O critério mora num PDF que ninguém reabre no meio da rodada. Depois da vigésima
                  unidade, cada codificador está decidindo de memória — e a memória diverge.
                </p>
              </article>
              <article className="card">
                <h3>Divergência sem rastro</h3>
                <p className="prose">
                  Quando duas pessoas discordam, não dá para saber se foi critério diferente ou
                  célula trocada. O teste de confiabilidade mede as duas coisas juntas.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="band" id="como-funciona">
          <div className="shell">
            <div className="band-head">
              <p className="overline">Como funciona</p>
              <h2>Três passos, e a planilha continua sendo a sua.</h2>
              <p className="prose">
                O CodLAB não substitui a sua planilha nem pede que você migre de formato. Ele
                assume só o trecho em que o humano decide.
              </p>
            </div>
            <div className="grid-3">
              <article className="card">
                <span className="step-n">1</span>
                <h3>Suba o livro de códigos</h3>
                <p className="prose">
                  Uma planilha com as abas <code>items</code> e <code>variables</code>. Cada
                  variável vira uma pergunta com o critério logo abaixo — booleana, seleção ou
                  texto livre.
                </p>
              </article>
              <article className="card">
                <span className="step-n">2</span>
                <h3>Codifique unidade a unidade</h3>
                <p className="prose">
                  Material-fonte à esquerda, ficha à direita, progresso no topo. O rascunho salva
                  sozinho a cada resposta e as setas navegam sem tirar a mão do teclado.
                </p>
              </article>
              <article className="card">
                <span className="step-n">3</span>
                <h3>Devolva para a planilha</h3>
                <p className="prose">
                  <strong>Copiar valores</strong> gera exatamente o bloco de colunas de onde os
                  dados saíram — cole numa célula só. Ou exporte CSV e XLSX.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="band band-orange">
          <div className="shell split-note">
            <div className="band-head" style={{ marginBottom: 0 }}>
              <p className="overline" style={{ color: "var(--on-orange)", opacity: 0.7 }}>
                Confiabilidade
              </p>
              <h2>Livro de códigos muda no meio da rodada. O alinhamento não.</h2>
              <p className="prose">
                Quando uma variável é descontinuada ou passa a ser preenchida por processo
                automático, ela não some da ficha: fica travada, marcada e visível, ocupando a
                mesma coluna de sempre. Ninguém codifica por engano e nenhuma coluna se desloca —
                o que já foi codificado continua válido.
              </p>
            </div>
            <div className="card">
              <span className="tag tag-on">travada</span>
              <h3>Marco_Recorte</h3>
              <p className="prose">
                Descontinuada nesta rodada — não codificar. Permanece no bloco para não deslocar as
                colunas seguintes.
              </p>
            </div>
          </div>
        </section>

        <section className="band band-dark">
          <div className="shell">
            <div className="band-head">
              <p className="overline" style={{ color: "#8b8d9e" }}>
                Onde os dados ficam
              </p>
              <h2>O corpus não sai da máquina de quem codifica.</h2>
            </div>
            <div className="grid-2">
              <article className="card">
                <h3>Sem servidor no caminho</h3>
                <p className="prose">
                  O site é um conjunto de arquivos estáticos no GitHub Pages. A planilha que você
                  carrega é lida pelo navegador e guardada no <code>localStorage</code> daquela
                  máquina. Não há banco, não há upload, não há conta para criar.
                </p>
              </article>
              <article className="card">
                <h3>Importa para revisão a qualquer momento</h3>
                <p className="prose">
                  Cada codificador baixa um backup <code>.json</code> com o que preencheu e devolve
                  para quem coordena. A conferência entre codificadores acontece na planilha de
                  sempre, com as colunas no lugar certo.
                </p>
              </article>
            </div>
            <div style={{ marginTop: 28 }}>
              <Link className="btn btn-primary" href="/demo/">
                Abrir a rodada de exemplo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
