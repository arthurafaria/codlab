"use client";

import { useLang } from "@/lib/i18n";
import * as ptData from "@/src/data/texts-demo";
import * as ptBook from "@/src/data/codebook-demo";
import * as enData from "@/src/data/texts-demo.en";
import * as enBook from "@/src/data/codebook-demo.en";
import CoderScreen from "../coder-screen";

// Amostra demonstrativa: mesma tela e mesmo código de uma rodada real, com dados
// fictícios e storageKey próprio por idioma.
const rounds = {
  pt: {
    project: {
      ...ptData.project,
      exportBasename: "amostra_demonstrativa",
      backupBasename: "demo",
      sheetName: "demo",
      exampleRow: 2,
    },
    records: ptData.records,
    codebook: ptBook,
  },
  en: {
    project: {
      ...enData.project,
      exportBasename: "demo_sample",
      backupBasename: "demo",
      sheetName: "demo",
      exampleRow: 2,
    },
    records: enData.records,
    codebook: enBook,
  },
};

export default function DemoPage() {
  const { lang } = useLang();
  const round = rounds[lang] || rounds.pt;
  // A key força remontagem ao trocar de idioma: estado e storage são por rodada.
  return (
    <CoderScreen
      key={lang}
      project={round.project}
      sourceRecords={round.records}
      codebook={round.codebook}
    />
  );
}
