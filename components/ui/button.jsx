"use client";

export default function Button({
  variant = "default",
  size,
  loading = false,
  loadingLabel,
  disabled,
  type = "button",
  onClick,
  href,
  className = "",
  children,
  ...props
}) {
  const variantClass = variant === "primary"
    ? "primary"
    : variant === "secondary"
    ? "secondary"
    : variant === "danger"
    ? "danger"
    : variant === "ghost"
    ? "ghost"
    : "";

  const sizeClass = size === "sm" ? "sm" : "";
  const cls = ["button", variantClass, sizeClass, className].filter(Boolean).join(" ");

  const content = loading ? (
    <>
      <span className="spinner" aria-hidden="true" />
      <span>{loadingLabel ?? children}</span>
    </>
  ) : children;

  if (href) {
    return (
      <a href={href} className={cls} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={cls}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={onClick}
      {...props}
    >
      {content}
    </button>
  );
}
