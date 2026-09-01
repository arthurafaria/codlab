"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";

export default function VariableRepair({ token }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function repairVariables() {
    setBusy(true);
    setMessage("");
    setError("");
    const response = await fetch(`/api/admin/${token}/variables/repair`, { method: "POST" });
    const payload = await response.json();
    setBusy(false);

    if (!response.ok) {
      setError(payload.error || "Não foi possível reparar as variáveis.");
      return;
    }

    setMessage(`${payload.variables.length} variável${payload.variables.length === 1 ? "" : "es"} criada${payload.variables.length === 1 ? "" : "s"}.`);
    router.refresh();
  }

  return (
    <div className="repair-actions">
      <Button variant="primary" loading={busy} loadingLabel="Lendo livro de códigos..." onClick={repairVariables}>
        Criar variáveis pelo livro de códigos
      </Button>
      {message ? <Badge tone="success" live>{message}</Badge> : null}
      {error ? <Badge tone="warning" live>{error}</Badge> : null}
    </div>
  );
}
