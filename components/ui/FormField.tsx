import type { TextareaHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

interface FieldShellProps {
  label: string;
  helpText?: string;
  children?: ReactNode;
}

type FieldProps = Omit<FieldShellProps, "children">;

function FieldShell({ label, helpText, children }: FieldShellProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-secondary)]">
          {label}
        </label>
        {helpText ? (
          <p className="text-[10px] text-[var(--text-muted)]">{helpText}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] transition-all duration-200 focus:border-[var(--brand-border-accent)] focus:bg-[var(--brand-surface-raised)] focus:ring-1 focus:ring-[var(--brand-gold-glow)]";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function TextField({ label, helpText, ...props }: FieldProps & InputProps) {
  return (
    <FieldShell label={label} helpText={helpText}>
      <input
        {...props}
        className={`${inputBase} ${props.className ?? ""}`}
      />
    </FieldShell>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaField({
  label,
  helpText,
  ...props
}: FieldProps & TextareaProps) {
  return (
    <FieldShell label={label} helpText={helpText}>
      <textarea
        {...props}
        className={`${inputBase} ${props.className ?? ""}`}
      />
    </FieldShell>
  );
}
