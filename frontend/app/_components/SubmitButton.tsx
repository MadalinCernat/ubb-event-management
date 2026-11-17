"use client";

import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger";
}

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`btn btn-${variant}`} disabled={pending} aria-busy={pending}>
      {pending ? (pendingLabel ?? "Working…") : children}
    </button>
  );
}
