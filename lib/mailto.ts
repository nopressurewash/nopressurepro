import { formatCurrency } from "./format";
import type { Client, Invoice, Quote } from "./types";

const COMPANY = "No Pressure Exterior Specialists";

export interface EmailDraft {
  subject: string;
  body: string;
}

function formatLongDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function findClientEmail(
  clients: Client[],
  name: string,
  phone: string,
): string | undefined {
  return clients.find((c) => c.name === name && c.phone === phone)?.email;
}

export function getQuoteEmailDraft(quote: Quote): EmailDraft {
  const bodyLines = [
    `Hello ${quote.clientName},`,
    "",
    `Thank you for contacting ${COMPANY}.`,
    "",
    "Here is your quote for:",
    quote.serviceType || "Pressure washing services",
    "",
    `Estimated price: ${formatCurrency(quote.recommended)}`,
  ];

  if (quote.estimatedHours > 0) {
    bodyLines.push(
      `Estimated time: ${quote.estimatedHours} hour${quote.estimatedHours === 1 ? "" : "s"}`,
    );
  }

  bodyLines.push(
    "",
    "If you would like to proceed or have any questions, please reply to this email.",
    "",
    "Kind regards,",
    COMPANY,
  );

  return {
    subject: `Your Quote from ${COMPANY}`,
    body: bodyLines.join("\n"),
  };
}

export function buildQuoteMailtoHref(quote: Quote, email: string): string {
  const draft = getQuoteEmailDraft(quote);
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
}

export function getInvoiceEmailDraft(invoice: Invoice): EmailDraft {
  return {
    subject: `Invoice ${invoice.invoiceNumber} from ${COMPANY}`,
    body: [
      `Hello ${invoice.clientName},`,
      "",
      `Please find below the details for invoice ${invoice.invoiceNumber}.`,
      "",
      `Service: ${invoice.serviceType || "Pressure washing services"}`,
      `Amount due: ${formatCurrency(invoice.amount)}`,
      `Due date: ${formatLongDate(invoice.dueDate)}`,
      "",
      "If you have any questions, please reply to this email.",
      "",
      "Kind regards,",
      COMPANY,
    ].join("\n"),
  };
}

export function buildInvoiceMailtoHref(
  invoice: Invoice,
  email: string,
): string {
  const draft = getInvoiceEmailDraft(invoice);
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
}
