export function ResultBox({ children, className = "" }) {
  return (
    <div className={["result-box", className].filter(Boolean).join(" ")} aria-live="polite">
      {children}
    </div>
  );
}

export function ErrorBox({ error, message, className = "" }) {
  const title = error?.error ?? message ?? "Ocorreu um erro.";
  const items = error?.errors;

  return (
    <div className={["error-box", className].filter(Boolean).join(" ")} role="alert" aria-live="assertive">
      <strong>{title}</strong>
      {items?.length ? (
        <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
