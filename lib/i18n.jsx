"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { strings, fmt } from "./strings";

export { fmt };

// Idioma da interface. Site estático: a escolha vive no localStorage e o
// primeiro render sai em português; o navegador em outra língua troca ao montar.

export const LANG_KEY = "codlab:lang";
export const LANGS = ["pt", "en"];

const LangContext = createContext({ lang: "pt", setLang: () => {} });

export function LangProvider({ children }) {
  const [lang, setLangState] = useState("pt");

  useEffect(() => {
    let next = "pt";
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (LANGS.includes(saved)) next = saved;
      else if (!(navigator.language || "").toLowerCase().startsWith("pt")) next = "en";
    } catch {
      /* sem storage: fica em pt */
    }
    setLangState(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "en" ? "en" : "pt-BR";
  }, [lang]);

  function setLang(next) {
    if (!LANGS.includes(next)) return;
    setLangState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* ignora */
    }
  }

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

// Dicionário do idioma ativo. Uso: const t = useT(); t.nav.how
export function useT() {
  const { lang } = useLang();
  return strings[lang] || strings.pt;
}

export function LangSwitch({ className = "" }) {
  const { lang, setLang } = useLang();
  const t = useT();
  return (
    <div className={["lang-switch", className].filter(Boolean).join(" ")} role="group" aria-label={t.nav.language}>
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          className={code === lang ? "is-active" : ""}
          aria-pressed={code === lang}
          onClick={() => setLang(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
