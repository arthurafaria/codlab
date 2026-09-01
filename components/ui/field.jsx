"use client";

import { useId } from "react";

export default function Field({ label, hint, error, required, htmlFor, children, className = "" }) {
  const generatedId = useId();
  const id = htmlFor ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <label htmlFor={id} className={className || undefined}>
      <span>
        {label}
        {required && <span aria-hidden="true" style={{ color: "var(--danger)", marginLeft: 2 }}>*</span>}
      </span>
      {typeof children === "function" ? children(id, { describedBy, hintId, errorId }) : children}
      {hint && <span id={hintId} className="hint" style={{ display: "block" }}>{hint}</span>}
      {error && <span id={errorId} className="field-error" style={{ display: "block" }} role="alert">{error}</span>}
    </label>
  );
}
