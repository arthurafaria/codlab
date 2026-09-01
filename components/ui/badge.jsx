export default function Badge({ tone = "neutral", live = false, children, className = "" }) {
  const toneClass = tone !== "neutral" ? tone : "";
  const cls = ["badge", toneClass, className].filter(Boolean).join(" ");

  return (
    <span
      className={cls}
      role={live ? "status" : undefined}
      aria-live={live ? "polite" : undefined}
    >
      {children}
    </span>
  );
}
