import type { QuoteStatus } from "./types";

export const QUOTE_STATUS_OPTIONS: QuoteStatus[] = [
  "draft",
  "sent",
  "approved",
  "booked",
  "completed",
  "paid",
  "lost",
];

export function normalizeQuoteStatus(value: string | undefined | null): QuoteStatus {
  switch (value) {
    case "draft":
    case "sent":
    case "approved":
    case "booked":
    case "completed":
    case "paid":
    case "lost":
      return value;
    case "pending":
      return "draft";
    case "scheduled":
      return "booked";
    case "won":
      return "completed";
    case "lost":
      return "lost";
    default:
      return "draft";
  }
}

export function getQuoteStatusLabel(status: QuoteStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "sent":
      return "Sent";
    case "approved":
      return "Approved";
    case "booked":
      return "Booked";
    case "completed":
      return "Completed";
    case "paid":
      return "Paid";
    case "lost":
      return "Lost";
  }
}

export function getQuoteStatusClasses(status: QuoteStatus): string {
  switch (status) {
    case "draft":
      return "border-zinc-700 bg-zinc-900/80 text-zinc-300";
    case "sent":
      return "border-sky-500/50 bg-sky-500/10 text-sky-200";
    case "approved":
      return "border-purple-500/50 bg-purple-500/10 text-purple-200";
    case "booked":
      return "border-amber-500/60 bg-amber-500/10 text-amber-200";
    case "completed":
      return "border-emerald-500/60 bg-emerald-500/10 text-emerald-200";
    case "paid":
      return "border-yellow-400/70 bg-yellow-400/15 text-yellow-200";
    case "lost":
      return "border-rose-500/60 bg-rose-500/10 text-rose-200";
  }
}

export function isClosedRevenueStatus(status: QuoteStatus): boolean {
  return status === "completed" || status === "paid";
}

export function isPipelineRevenueStatus(status: QuoteStatus): boolean {
  return status === "sent" || status === "approved" || status === "booked";
}

