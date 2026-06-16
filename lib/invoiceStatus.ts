import type { InvoiceStatus } from "./types";

export const INVOICE_STATUS_OPTIONS: InvoiceStatus[] = [
  "draft",
  "sent",
  "paid",
  "overdue",
];

export function getInvoiceStatusLabel(status: InvoiceStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "sent":
      return "Sent";
    case "paid":
      return "Paid";
    case "overdue":
      return "Overdue";
  }
}

export function getInvoiceStatusClasses(status: InvoiceStatus): string {
  switch (status) {
    case "draft":
      return "border-[var(--brand-border)] bg-[var(--brand-surface)] text-[var(--text-muted)]";
    case "sent":
      return "badge-purple";
    case "paid":
      return "border border-[color-mix(in_srgb,var(--semantic-success)_40%,transparent)] bg-[var(--semantic-success-muted)] text-[var(--semantic-success)]";
    case "overdue":
      return "border border-[color-mix(in_srgb,var(--semantic-error)_40%,transparent)] bg-[var(--semantic-error-muted)] text-[var(--semantic-error)]";
  }
}
