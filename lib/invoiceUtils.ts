import type { Invoice, Quote } from "./types";

const INV_PREFIX = "INV";
const DEFAULT_DUE_DAYS = 14;

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Generates the next invoice number as INV-YYYY-NNN (e.g. INV-2025-001).
 * Uses existing invoices to pick the next sequence for the current year.
 */
export function getNextInvoiceNumber(invoices: Invoice[]): string {
  const year = new Date().getFullYear();
  const prefix = `${INV_PREFIX}-${year}-`;
  const sameYear = invoices.filter((inv) => inv.invoiceNumber.startsWith(prefix));
  const maxNum = sameYear.reduce((max, inv) => {
    const num = parseInt(inv.invoiceNumber.slice(prefix.length), 10);
    return Number.isNaN(num) ? max : Math.max(max, num);
  }, 0);
  const next = String(maxNum + 1).padStart(3, "0");
  return `${prefix}${next}`;
}

/**
 * Builds a new invoice from a quote. Amount defaults to quote.recommended.
 * issueDate = today, dueDate = today + DEFAULT_DUE_DAYS.
 */
export function buildInvoiceFromQuote(
  quote: Quote,
  existingInvoices: Invoice[],
): Invoice {
  const now = new Date().toISOString();
  const issueDate = toISODate(new Date());
  const due = new Date();
  due.setDate(due.getDate() + DEFAULT_DUE_DAYS);
  const dueDate = toISODate(due);

  const description =
    quote.serviceType && quote.serviceType !== "Mixed"
      ? quote.serviceType
      : "Exterior cleaning services";

  const invoice: Invoice = {
    id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    invoiceNumber: getNextInvoiceNumber(existingInvoices),
    quoteId: quote.id,
    clientName: quote.clientName || "Unknown",
    suburb: quote.suburb || "",
    phone: quote.phone || "",
    serviceType: quote.serviceType || "Mixed",
    lineItems: [{ description, amount: quote.recommended }],
    amount: quote.recommended,
    status: "draft",
    issueDate,
    dueDate,
    notes: quote.notes || "",
    createdAt: now,
    updatedAt: now,
  };

  return invoice;
}
