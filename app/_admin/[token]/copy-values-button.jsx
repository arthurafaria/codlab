"use client";

import { useState } from "react";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";

async function writeClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export default function CopyValuesButton({ token }) {
  const [status, setStatus] = useState("");

  async function copyValues() {
    setStatus("Copiando...");
    const response = await fetch(`/api/admin/${token}/export?format=tsv`, {
      cache: "no-store",
    });

    if (!response.ok) {
      setStatus("Falha ao copiar");
      window.setTimeout(() => setStatus(""), 2200);
      return;
    }

    const text = await response.text();
    await writeClipboard(text);
    const rows = text.trim() ? text.trim().split(/\r?\n/).length : 0;
    setStatus(rows ? `${rows} linha${rows === 1 ? "" : "s"} copiadas` : "Nenhuma resposta");
    window.setTimeout(() => setStatus(""), 2600);
  }

  return (
    <span className="copy-values-control">
      <Button onClick={copyValues} loading={status === "Copiando..."} loadingLabel="Copiando...">
        Copiar valores TSV
      </Button>
      {status && status !== "Copiando..." ? <Badge live>{status}</Badge> : null}
    </span>
  );
}
