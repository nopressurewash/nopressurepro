import type { ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export function Panel({ children, className = "" }: PanelProps) {
  return (
    <div className={`surface-panel rounded-2xl p-4 transition-colors duration-200 ${className}`}>
      {children}
    </div>
  );
}
