import "@/app/_legacy-platform.css";
import { notFound } from "next/navigation";
import { assignedItemsForLink, getProjectByAdminToken } from "@/lib/db";
import CoderManager from "./coder-manager";
import CopyValuesButton from "./copy-values-button";
import ItemRepair from "./item-repair";
import VariableRepair from "./variable-repair";
import Badge from "@/components/ui/badge";
import EmptyState from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

function responseKey(response) {
  return `${response.itemId}:${response.coderLinkId}`;
}

function conflicts(data) {
  const submitted = data.responses.filter((response) => response.status === "submitted");
  const byItem = new Map();
  submitted.forEach((response) => {
    byItem.set(response.itemId, [...(byItem.get(response.itemId) || []), response]);
  });

  const rows = [];
  for (const [itemId, responses] of byItem) {
    if (responses.length < 2) continue;
    data.variables.forEach((variable) => {
      const values = new Set(responses.map((response) => JSON.stringify(response.values?.[variable.key] ?? "")));
      if (values.size > 1) {
        rows.push({ itemId, variable: variable.key, coders: responses.length });
      }
    });
  }
  return rows;
}

const syncLabels = {
  synced: "Sincronizadas",
  pending: "Na fila",
  waiting_config: "Aguardando configuração",
  failed: "Com erro",
};

function formatValue(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value === true) return "Sim";
  if (value === false) return "Não";
  if (value === null || value === undefined || value === "") return "Sem resposta";
  return String(value);
}

export default async function AdminPage({ params }) {
  const { token } = await params;
  const data = await getProjectByAdminToken(token);
  if (!data) notFound();

  const submitted = data.responses.filter((response) => response.status === "submitted");
  const drafts = data.responses.filter((response) => response.status === "draft");
  const submittedKeys = new Set(submitted.map(responseKey));
  const expectedByCoder = new Map(
    data.coderLinks.map((link) => [
      link.id,
      assignedItemsForLink(data.items, data.coderLinks, link, data.project.settings),
    ]),
  );
  const totalExpected = [...expectedByCoder.values()].reduce((sum, items) => sum + items.length, 0);
  const expectedByCoderObject = Object.fromEntries(expectedByCoder);
  const conflictRows = conflicts(data);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const completion = totalExpected ? Math.round((submitted.length / totalExpected) * 100) : 0;

  return (
    <main id="main-content" className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Versão do orientador</p>
          <h1>{data.project.title}</h1>
          <p className="topbar-subtitle">
            Você está no painel de gestão. Codificadores recebem links separados e não acessam esta visão.
          </p>
        </div>
        <div className="action-row">
          <CopyValuesButton token={token} />
          <a className="button" href={`/api/admin/${token}/export?format=csv`}>
            Exportar CSV
          </a>
          <a className="button" href={`/api/admin/${token}/export?format=xlsx`}>
            Exportar XLSX
          </a>
        </div>
      </header>

      <section className="role-banner orientador" aria-label="Contexto do orientador">
        <div>
          <Badge tone="primary">Você está como orientador</Badge>
          <strong>Distribua links, acompanhe envios e revise divergências.</strong>
          <p>
            O botão <strong>Copiar valores TSV</strong> fica nesta versão, junto dos exportadores CSV/XLSX.
            Os codificadores só veem a tela de coleta. No MVP atual, o controle é por link privado:
            guarde este endereço de orientador e compartilhe apenas os links de codificador.
          </p>
        </div>
        <div className="role-actions">
          <a className="button primary" href="#codificadores">
            Ver links dos codificadores
          </a>
          <a className="button" href="#respostas">
            Revisar respostas
          </a>
        </div>
      </section>

      <section className="status-strip">
        <div className="metric">
          <span className="muted">Imagens</span>
          <strong>{data.items.length}</strong>
        </div>
        <div className="metric">
          <span className="muted">Codificadores</span>
          <strong>{data.coderLinks.length}</strong>
        </div>
        <div className="metric">
          <span className="muted">Submissões recebidas</span>
          <strong>
            {submitted.length}/{totalExpected}
          </strong>
          <div className="progress-track" aria-label={`${completion}% concluído`}>
            <span style={{ width: `${completion}%` }} />
          </div>
        </div>
        <div className="metric">
          <span className="muted">Conflitos</span>
          <strong>{conflictRows.length}</strong>
        </div>
      </section>

      <div className="split">
        <section className="main-column">
          {data.items.length === 0 ? (
            <section className="panel critical-panel">
              <div className="section-title">
                <div>
                  <h2>Projeto sem imagens atribuídas</h2>
                  <p className="hint">
                    As imagens existem no upload, mas a tabela de itens ficou vazia. Repare agora para gerar{" "}
                    <code>item_id</code> automaticamente a partir dos arquivos enviados.
                  </p>
                </div>
                <Badge tone="warning">Ação necessária</Badge>
              </div>
              <ItemRepair token={token} />
            </section>
          ) : null}

          {data.variables.length === 0 ? (
            <section className="panel critical-panel">
              <div className="section-title">
                <div>
                  <h2>Projeto sem variáveis</h2>
                  <p className="hint">
                    Nenhum campo de codificação foi criado. Como este projeto já tem livro de códigos, você pode
                    gerar os campos automaticamente pelas linhas numeradas dele.
                  </p>
                </div>
                <Badge tone="warning">Publicação incompleta</Badge>
              </div>
              <VariableRepair token={token} />
            </section>
          ) : null}

          <CoderManager
            token={token}
            coders={data.coderLinks}
            expectedByCoder={expectedByCoderObject}
            submitted={submitted}
            drafts={drafts}
            baseUrl={baseUrl}
          />

          <section className="panel" id="respostas">
            <div className="section-title">
              <div>
                <h2>Imagens atribuídas</h2>
                <p className="hint">Confira exatamente quais itens cada codificador recebeu antes de enviar os links.</p>
              </div>
              <Badge>{totalExpected} atribuições</Badge>
            </div>
            <div className="assignment-grid">
              {data.coderLinks.map((link) => {
                const assigned = expectedByCoder.get(link.id) || [];
                const linkSubmitted = submitted.filter((response) => response.coderLinkId === link.id).length;
                return (
                  <details className="assignment-group" key={link.id} open={assigned.length > 0 && assigned.length <= 8}>
                    <summary>
                      <span>
                        <strong>{link.coderLabel}</strong>
                        <small>{assigned.length} imagem{assigned.length === 1 ? "" : "s"} · {linkSubmitted} enviada{linkSubmitted === 1 ? "" : "s"}</small>
                      </span>
                      <Badge tone={assigned.length ? "success" : "warning"}>
                        {assigned.length ? "Com imagens" : "Sem imagens"}
                      </Badge>
                    </summary>
                    {assigned.length ? (
                      <div className="assignment-items">
                        {assigned.map((item) => (
                          <div className="assignment-item" key={`${link.id}:${item.itemId}`}>
                            <span className="mono">{item.itemId}</span>
                            <strong>{item.imageFilename}</strong>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        compact
                        description="Nenhuma imagem foi distribuída para este codificador. Revise a cota, o modo de distribuição ou repare os itens do projeto se a lista geral estiver vazia."
                      />
                    )}
                  </details>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <div className="section-title">
              <h2>Progresso por imagem</h2>
              <Badge>Itens do pacote</Badge>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Arquivo</th>
                  <th>Submissões</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => {
                  const count = data.coderLinks.filter((link) => submittedKeys.has(`${item.itemId}:${link.id}`)).length;
                  return (
                    <tr key={item.itemId}>
                      <td>{item.itemId}</td>
                      <td>{item.imageFilename}</td>
                      <td>
                        {count}/{data.coderLinks.length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section className="panel">
            <div className="section-title">
              <h2>Divergências para revisar</h2>
              <Badge tone={conflictRows.length ? "warning" : "success"}>
                {conflictRows.length ? "Revisar" : "Limpo"}
              </Badge>
            </div>
            {conflictRows.length ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Variável</th>
                    <th>Codificadores</th>
                  </tr>
                </thead>
                <tbody>
                  {conflictRows.map((row) => (
                    <tr key={`${row.itemId}:${row.variable}`}>
                      <td>{row.itemId}</td>
                      <td>{row.variable}</td>
                      <td>{row.coders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState description="Nenhuma divergência detectada entre respostas submetidas." />
            )}
          </section>

          <section className="panel">
            <div className="section-title">
              <div>
                <h2>Respostas por codificador</h2>
                <p className="hint">Abra um codificador para revisar item por item, com valores personalizados.</p>
              </div>
              <Badge>{submitted.length} submetidas</Badge>
            </div>

            {data.coderLinks.map((link) => {
              const coderResponses = data.responses
                .filter((response) => response.coderLinkId === link.id)
                .sort((a, b) => a.itemId.localeCompare(b.itemId));
              return (
                <details className="response-group" key={link.id}>
                  <summary>
                    <strong>{link.coderLabel}</strong>
                    <Badge>
                      {coderResponses.filter((response) => response.status === "submitted").length} enviadas
                    </Badge>
                  </summary>
                  {coderResponses.length ? (
                    <div className="response-list">
                      {coderResponses.map((response) => (
                        <article className="response-card" key={response.id}>
                          <div className="section-title">
                            <div>
                              <strong>Item {response.itemId}</strong>
                              <p className="hint">
                                {response.status === "submitted" ? "Enviada" : "Rascunho"} · {response.submittedAt || response.updatedAt}
                              </p>
                            </div>
                            <Badge tone={response.status === "submitted" ? "success" : "warning"}>
                              {response.status === "submitted" ? "Submetida" : "Rascunho"}
                            </Badge>
                          </div>
                          <dl className="response-values">
                            {data.variables.map((variable) => (
                              <div key={variable.key}>
                                <dt>{variable.key}</dt>
                                <dd>{formatValue(response.values?.[variable.key])}</dd>
                              </div>
                            ))}
                          </dl>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <EmptyState compact description="Este codificador ainda não salvou respostas." />
                  )}
                </details>
              );
            })}
          </section>
        </section>

        <aside className="side-column">
          <section className="panel data-destination-panel">
            <div className="section-title">
              <h2>Destino dos dados</h2>
              <Badge tone="primary">Banco oficial</Badge>
            </div>
            <div className="data-flow">
              <div>
                <strong>1. Codificador envia</strong>
                <p>As respostas entram no banco do app e atualizam este painel.</p>
              </div>
              <div>
                <strong>2. Orientador exporta</strong>
                <p>Use Copiar valores TSV, CSV ou XLSX para levar os dados para análise.</p>
              </div>
              <div>
                <strong>3. Sheets é opcional</strong>
                <p>Com credenciais Google, cada envio também é espelhado na aba configurada.</p>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="section-title">
              <h2>Google Sheets</h2>
              <Badge tone={data.project.spreadsheetId ? "success" : "warning"}>
                {data.project.spreadsheetId ? "Configurado" : "Pendente"}
              </Badge>
            </div>
            <p className="muted">
              Planilha: {data.project.spreadsheetId || "não configurada"} · Aba: {data.project.sheetName}
            </p>
            <table className="table">
              <tbody>
                {["synced", "pending", "waiting_config", "failed"].map((status) => (
                  <tr key={status}>
                    <td>{syncLabels[status]}</td>
                    <td>{data.syncJobs.filter((job) => job.status === status).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="panel">
            <div className="section-title">
              <h2>Variáveis</h2>
              <Badge>{data.variables.length}</Badge>
            </div>
            <div className="link-list">
              {data.variables.map((variable) => (
                <div key={variable.key}>
                  <strong>{variable.key}</strong>
                  <p className="hint">
                    {variable.type} · {variable.group}
                    {variable.required ? " · obrigatória" : ""}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
