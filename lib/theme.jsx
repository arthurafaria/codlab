"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Tema da interface. Três estados: sem escolha, o sistema decide; com escolha,
// o atributo data-theme no <html> manda. O script em layout.jsx aplica o
// atributo antes da primeira pintura, então não há piscada de branco.

export const THEME_KEY = "codlab:theme";

const ThemeContext = createContext({ theme: "system", resolved: "light", toggle: () => {} });

function systemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("system");
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark") setTheme(saved);
    } catch {
      /* sem storage: segue o sistema */
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolved = theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
    root.style.colorScheme = resolved;
  }, [theme, resolved]);

  function toggle() {
    const next = resolved === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignora */
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, resolved, toggle }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Sol e lua ficam os dois no DOM, um por cima do outro, e trocam por opacidade,
// escala e desfoque. Assim a saída também é animada, sem biblioteca.
export function ThemeSwitch({ label = "Tema" }) {
  const { resolved, toggle } = useTheme();
  const dark = resolved === "dark";
  return (
    <button
      type="button"
      className="theme-switch"
      onClick={toggle}
      aria-label={label}
      aria-pressed={dark}
      title={label}
    >
      <span className="theme-icons" aria-hidden="true">
        <svg className={dark ? "is-out" : "is-in"} viewBox="0 0 20 20" width="17" height="17">
          <circle cx="10" cy="10" r="3.9" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M10 1.6v2.1M10 16.3v2.1M18.4 10h-2.1M3.7 10H1.6" />
            <path d="M15.9 4.1l-1.5 1.5M5.6 14.4l-1.5 1.5M15.9 15.9l-1.5-1.5M5.6 5.6L4.1 4.1" />
          </g>
        </svg>
        <svg className={dark ? "is-in" : "is-out"} viewBox="0 0 20 20" width="17" height="17">
          <path
            d="M16.5 12.6A7.2 7.2 0 0 1 7.4 3.5a7.2 7.2 0 1 0 9.1 9.1Z"
            fill="currentColor"
          />
        </svg>
      </span>
    </button>
  );
}
