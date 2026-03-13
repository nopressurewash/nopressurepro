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
      return "border-zinc-700 bg-zinc-800/60 text-zinc-400";
    case "sent":
      return "border-brand-purple/40 bg-brand-purple/10 text-brand-purple-light";
    case "paid":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-400";
    case "overdue":
      return "border-rose-500/40 bg-rose-500/10 text-rose-400";
  }
}
