import type { QuoteStatus } from "./types";

export const QUOTE_STATUS_OPTIONS: QuoteStatus[] = [
  "draft",
  "sent",
  "approved",
  "follow_up",
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
    case "follow_up":
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
    case "followup":
      return "follow_up";
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
    case "follow_up":
      return "Follow Up";
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

/** Active pipeline: not yet won or lost */
export function isActivePipelineStatus(status: QuoteStatus): boolean {
  return ["draft", "sent", "approved", "follow_up", "booked"].includes(status);
}

/** Won / closed revenue */
export function getQuoteStatusClasses(status: QuoteStatus): string {
  switch (status) {
    case "draft":
      return "border-zinc-700 bg-zinc-800/60 text-zinc-400";
    case "sent":
      return "border-sky-500/40 bg-sky-500/10 text-sky-400";
    case "approved":
      return "border-[var(--brand-purple)]/40 bg-[var(--brand-purple)]/10 text-[var(--brand-purple-light)]";
    case "follow_up":
      return "border-amber-400/40 bg-amber-400/10 text-amber-300";
    case "booked":
      return "border-[var(--brand-gold)]/40 bg-[var(--brand-gold)]/10 text-[var(--brand-gold)]";
    case "completed":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-400";
    case "paid":
      return "border-[var(--brand-gold-light)]/40 bg-[var(--brand-gold-light)]/10 text-[var(--brand-gold-light)]";
    case "lost":
      return "border-rose-500/40 bg-rose-500/10 text-rose-400";
  }
}

export function isClosedRevenueStatus(status: QuoteStatus): boolean {
  return status === "completed" || status === "paid";
}

export function isPipelineRevenueStatus(status: QuoteStatus): boolean {
  return status === "sent" || status === "approved" || status === "follow_up" || status === "booked";
}

