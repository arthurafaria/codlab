export const BRAND = "CodLAB";

// A marca é um registro com a linha ativa em âmbar: é literalmente o que a
// ferramenta faz, uma unidade por vez dentro de um conjunto.
export function BrandMark() {
  return (
    <svg
      className="wordmark-mark"
      viewBox="0 0 20 18"
      width="20"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="0.8"
        y="0.8"
        width="18.4"
        height="16.4"
        rx="3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.85"
      />
      <rect x="4.2" y="4.3" width="7.6" height="1.7" rx="0.85" fill="currentColor" opacity="0.4" />
      <rect x="4.2" y="8.15" width="11.6" height="1.9" rx="0.95" fill="var(--accent)" />
      <rect x="4.2" y="12" width="6" height="1.7" rx="0.85" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

export default function Wordmark({ className = "" }) {
  return (
    <span
      role="img"
      aria-label={BRAND}
      className={["wordmark", className].filter(Boolean).join(" ")}
    >
      <BrandMark />
      <span aria-hidden="true">CodLAB</span>
    </span>
  );
}
