import type { TextareaHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

interface BaseFieldProps {
  label: string;
  helpText?: string;
  children: ReactNode;
}

function FieldShell({ label, helpText, children }: BaseFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs text-zinc-400">{label}</label>
        {helpText ? (
          <p className="text-[10px] text-zinc-500">{helpText}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function TextField({ label, helpText, ...props }: BaseFieldProps & InputProps) {
  return (
    <FieldShell label={label} helpText={helpText}>
      <input
        {...props}
        className={`w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none ring-0 placeholder:text-zinc-600 focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/30 ${props.className ?? ""}`}
      />
    </FieldShell>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaField({
  label,
  helpText,
  ...props
}: BaseFieldProps & TextareaProps) {
  return (
    <FieldShell label={label} helpText={helpText}>
      <textarea
        {...props}
        className={`w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none ring-0 placeholder:text-zinc-600 focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/30 ${props.className ?? ""}`}
      />
    </FieldShell>
  );
}

