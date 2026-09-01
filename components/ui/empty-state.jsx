export default function EmptyState({ title, description, compact = false, action, className = "" }) {
  const cls = ["empty-state", compact ? "compact" : "", className].filter(Boolean).join(" ");
  return (
    <div className={cls}>
      {title && <strong>{title}</strong>}
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
