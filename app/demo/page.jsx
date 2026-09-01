"use client";

import { project, records } from "@/src/data/texts-demo";
import * as codebook from "@/src/data/codebook-demo";
import CoderScreen from "../coder-screen";

// Amostra demonstrativa: mesma tela e mesmo código da rodada real, com dados
// fictícios e storageKey próprio — nunca toca no rascunho da rodada real.
const rodada = {
  ...project,
  exportBasename: "amostra_demonstrativa",
  backupBasename: "demo",
  sheetName: "demo",
  exampleRow: 2,
};

export default function DemoPage() {
  return <CoderScreen project={rodada} sourceRecords={records} codebook={codebook} />;
}
