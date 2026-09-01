"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Field from "@/components/ui/field";
import { ErrorBox } from "@/components/ui/status-message";

export default function CoderManager({ token, coders, expectedByCoder, submitted, drafts, baseUrl }) {
  const router = useRouter();
  const [savingId, setSavingId] = useState("");
  const [newCoder, setNewCoder] = useState("");
  const [error, setError] = useState("");

  async function updateCoder(event, coderId) {
    event.preventDefault();
    setSavingId(coderId);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/${token}/coders`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: coderId,
        coderLabel: form.get("coderLabel"),
        emailOptional: form.get("emailOptional"),
        quotaOptional: form.get("quotaOptional"),
        status: form.get("status"),
      }),
    });
    const payload = await response.json();
    setSavingId("");
    if (!response.ok) {
      setError(payload.error || "Falha ao atualizar codificador.");
      return;
    }
    router.refresh();
  }

  async function createCoder(event) {
    event.preventDefault();
    const label = newCoder.trim();
    if (!label) return;
    setSavingId("new");
    setError("");
    const response = await fetch(`/api/admin/${token}/coders`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ coderLabel: label }),
    });
    const payload = await response.json();
    setSavingId("");
    if (!response.ok) {
      setError(payload.error || "Falha ao criar codificador.");
      return;
    }
    setNewCoder("");
    router.refresh();
  }

  return (
    <section className="panel" id="codificadores">
      <div className="section-title">
        <div>
          <h2>Codificadores e links privados</h2>
          <p className="hint">
            Cada link abre a versão do codificador: uma tela de coleta, sem acesso ao painel do orientador.
          </p>
        </div>
        <Badge tone="accent">{coders.length} links</Badge>
      </div>

      {error ? <ErrorBox message={error} /> : null}

      <div className="coder-list">
        {coders.map((link) => {
          const linkSubmitted = submitted.filter((response) => response.coderLinkId === link.id).length;
          const linkDrafts = drafts.filter((response) => response.coderLinkId === link.id).length;
          const assigned = expectedByCoder[link.id] || [];
          const expected = assigned.length;
          const url = `${baseUrl}/code/${link.token}`;
          return (
            <form className="coder-row" key={link.id} onSubmit={(event) => updateCoder(event, link.id)}>
              <Field label="Nome">
                {(id) => <input id={id} name="coderLabel" defaultValue={link.coderLabel} required />}
              </Field>
              <Field label="E-mail opcional">
                {(id) => <input id={id} name="emailOptional" defaultValue={link.emailOptional || ""} />}
              </Field>
              <Field label="Cota">
                {(id) => (
                  <input id={id} name="quotaOptional" type="number" min="1" defaultValue={link.quotaOptional || ""} />
                )}
              </Field>
              <Field label="Status">
                {(id) => (
                  <select id={id} name="status" defaultValue={link.status}>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                )}
              </Field>
              <div className="coder-link-cell">
                <div className="coder-badges">
                  <Badge tone={expected ? "success" : "warning"}>
                    {expected} imagem{expected === 1 ? "" : "s"}
                  </Badge>
                  <Badge tone="success">
                    {linkSubmitted}/{expected} enviadas
                  </Badge>
                  <Badge>{linkDrafts} rascunhos</Badge>
                </div>
                <span className="field-label">Link da versão do codificador</span>
                <a className="mono" href={`/code/${link.token}`}>
                  {url || `/code/${link.token}`}
                </a>
                {assigned.length ? (
                  <details className="assigned-preview">
                    <summary>Ver imagens atribuídas</summary>
                    <div>
                      {assigned.slice(0, 10).map((item) => (
                        <span key={item.itemId}>
                          {item.itemId} · {item.imageFilename}
                        </span>
                      ))}
                      {assigned.length > 10 ? <span>+{assigned.length - 10} outras</span> : null}
                    </div>
                  </details>
                ) : (
                  <p className="field-error">Sem imagens atribuídas.</p>
                )}
              </div>
              <Button
                type="submit"
                loading={savingId === link.id}
                loadingLabel="Salvando..."
              >
                Salvar
              </Button>
            </form>
          );
        })}
      </div>

      <form className="new-coder-form" onSubmit={createCoder}>
        <Field label="Adicionar codificador">
          {(id) => (
            <input
              id={id}
              value={newCoder}
              onChange={(event) => setNewCoder(event.target.value)}
              placeholder="Ex.: Ana, turma 2"
            />
          )}
        </Field>
        <Button
          variant="secondary"
          type="submit"
          loading={savingId === "new"}
          loadingLabel="Criando..."
          disabled={!newCoder.trim()}
        >
          Adicionar
        </Button>
      </form>
    </section>
  );
}
