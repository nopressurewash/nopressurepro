import type { ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export function Panel({ children, className = "" }: PanelProps) {
  return (
    <div
      className={`rounded-2xl border border-[var(--brand-border)] bg-surface-raised p-4 transition-colors duration-200 ${className}`}
    >
      {children}
    </div>
  );
}
