export const BRAND = "CodLAB";

// Ecoa a marca do coLAB: prefixo em laranja, LAB em tinta escura e o A vazado
// como triângulo. Aqui o prefixo é "Cod" — codificação.
export default function Wordmark({ className = "" }) {
  return (
    <span
      role="img"
      aria-label={BRAND}
      className={["wordmark", className].filter(Boolean).join(" ")}
    >
      <span aria-hidden="true">
        <em>Cod</em>L
        <svg viewBox="0 0 14 13" width="14" height="13" focusable="false">
          <path d="M7 0 14 13H0Z" fill="currentColor" />
        </svg>
        B
      </span>
    </span>
  );
}
