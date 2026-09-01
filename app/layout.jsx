import { Archivo, Newsreader, IBM_Plex_Mono } from "next/font/google";
import { LangProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import "./globals.css";

// Archivo carrega a interface: grotesca técnica, sem o ar de painel genérico.
// Newsreader é o material a codificar, que se lê por horas.
// IBM Plex Mono marca o que é identificador: chave de variável, coluna, ID.
const ui = Archivo({ subsets: ["latin"], variable: "--font-ui", display: "swap" });
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

// Aplica o tema salvo antes da primeira pintura. Sem isso, quem escolheu escuro
// vê um lampejo de branco a cada carregamento.
const themeInit = `(function(){try{var t=localStorage.getItem("codlab:theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t);document.documentElement.style.colorScheme=t}}catch(e){}})()`;

export const metadata = {
  title: "CodLAB: codificação manual para análise de conteúdo",
  description:
    "Uma unidade por vez na tela, o livro de códigos ao lado de cada variável e o bloco de colunas de volta para a planilha.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${ui.variable} ${serif.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <ThemeProvider>
          <LangProvider>
            <a href="#main-content" className="skip-link">
              Pular para conteúdo · Skip to content
            </a>
            {children}
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
