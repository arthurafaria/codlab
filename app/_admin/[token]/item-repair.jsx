"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";

export default function ItemRepair({ token }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function repairItems() {
    setBusy(true);
    setMessage("");
    setError("");
    const response = await fetch(`/api/admin/${token}/items/repair`, { method: "POST" });
    const payload = await response.json();
    setBusy(false);

    if (!response.ok) {
      setError(payload.error || "Não foi possível reparar as imagens.");
      return;
    }

    setMessage(`${payload.items.length} imagem${payload.items.length === 1 ? "" : "s"} atribuída${payload.items.length === 1 ? "" : "s"}.`);
    router.refresh();
  }

  return (
    <div className="repair-actions">
      <Button variant="primary" loading={busy} loadingLabel="Reparando..." onClick={repairItems}>
        Reparar usando imagens enviadas
      </Button>
      {message ? <Badge tone="success" live>{message}</Badge> : null}
      {error ? <Badge tone="warning" live>{error}</Badge> : null}
    </div>
  );
}
