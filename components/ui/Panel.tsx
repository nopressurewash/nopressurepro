import type { ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export function Panel({ children, className = "" }: PanelProps) {
  return (
    <div
      className={`rounded-2xl border border-zinc-800/90 bg-zinc-950 p-4 ${className}`}
    >
      {children}
    </div>
  );
}
