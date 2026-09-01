export default function Callout({ tone = "info", title, children, action, layout = "inline", className = "" }) {
  const toneClass = tone === "success"
    ? "demo-callout"
    : tone === "warning"
    ? "panel critical-panel"
    : tone === "danger"
    ? "panel error-box"
    : "panel";

  const isInline = layout === "inline";
  const cls = [toneClass, className].filter(Boolean).join(" ");

  if (isInline) {
    return (
      <div className={cls}>
        <div>
          {title && <strong>{title}</strong>}
          {children}
        </div>
        {action && <div>{action}</div>}
      </div>
    );
  }

  return (
    <div className={cls}>
      {title && <strong style={{ display: "block", marginBottom: 8 }}>{title}</strong>}
      {children}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}
