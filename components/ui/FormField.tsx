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
        <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </label>
        {helpText ? (
          <p className="text-[10px] text-zinc-600">{helpText}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 transition-colors focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/25";

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
