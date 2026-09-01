import { Inter, Source_Serif_4, Caveat } from "next/font/google";
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
  title: "CodLAB — codificação colaborativa",
  description:
    "Ferramenta de codificação manual para análise de conteúdo: uma unidade por vez, o livro de códigos na tela e exportação direta para planilha.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${serif.variable} ${script.variable}`}>
      <body>
        <a href="#main-content" className="skip-link">
          Pular para conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
