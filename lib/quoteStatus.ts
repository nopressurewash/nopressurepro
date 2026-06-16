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
      return "border-[var(--brand-border)] bg-[var(--brand-surface)] text-[var(--text-muted)]";
    case "sent":
      return "badge-purple";
    case "approved":
      return "badge-purple shadow-[0_0_12px_-3px_var(--brand-purple-glow)]";
    case "follow_up":
      return "badge-gold";
    case "booked":
      return "badge-gold shadow-[0_0_12px_-3px_var(--brand-gold-glow)]";
    case "completed":
      return "border border-[color-mix(in_srgb,var(--semantic-success)_40%,transparent)] bg-[var(--semantic-success-muted)] text-[var(--semantic-success)]";
    case "paid":
      return "badge-gold shadow-[0_0_12px_-3px_var(--brand-gold-glow)]";
    case "lost":
      return "border border-[color-mix(in_srgb,var(--semantic-error)_40%,transparent)] bg-[var(--semantic-error-muted)] text-[var(--semantic-error)]";
  }
}

export function isClosedRevenueStatus(status: QuoteStatus): boolean {
  return status === "completed" || status === "paid";
}

export function isPipelineRevenueStatus(status: QuoteStatus): boolean {
  return status === "sent" || status === "approved" || status === "follow_up" || status === "booked";
}

