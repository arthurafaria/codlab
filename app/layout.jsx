import { Inter, Source_Serif_4, Caveat } from "next/font/google";
import { LangProvider } from "@/lib/i18n";
import "./globals.css";

// Mesma tripla tipográfica do site do coLAB/UFF: Inter carrega a interface,
// Source Serif 4 o texto corrido, Caveat os apartes manuscritos.
const inter = Inter({ subsets: ["latin"], variable: "--font-ui", display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
const script = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-script",
  display: "swap",
});

export const metadata = {
  title: "CodLAB: codificação manual para análise de conteúdo",
  description:
    "Uma unidade por vez na tela, o livro de códigos ao lado de cada variável e o bloco de colunas de volta para a planilha.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${serif.variable} ${script.variable}`}>
      <body>
        <LangProvider>
          <a href="#main-content" className="skip-link">
            Pular para conteúdo · Skip to content
          </a>
          {children}
        </LangProvider>
      </body>
    </html>
  );
}
