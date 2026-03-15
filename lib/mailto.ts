import { formatCurrency } from "./format";
import type { Client, Invoice, Quote } from "./types";

const COMPANY = "No Pressure Exterior Specialists";

export function findClientEmail(
  clients: Client[],
  name: string,
  phone: string,
): string | undefined {
  return clients.find((c) => c.name === name && c.phone === phone)?.email;
}

export function buildQuoteMailtoHref(quote: Quote, email: string): string {
  const subject = `Your Quote from ${COMPANY}`;

  const hours =
    quote.estimatedHours > 0
      ? `\nEstimated time: ${quote.estimatedHours} hour${quote.estimatedHours === 1 ? "" : "s"}\n`
      : "";

  const body = [
    `Hello ${quote.clientName},`,
    "",
    `Thank you for contacting ${COMPANY}.`,
    "",
    "Here is your quote for:",
    quote.serviceType || "Pressure washing services",
    "",
    `Estimated price: ${formatCurrency(quote.recommended)}`,
    hours,
    "If you would like to proceed or have any questions, please reply to this email.",
    "",
    "Kind regards,",
    COMPANY,
  ].join("\n");

  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function buildInvoiceMailtoHref(
  invoice: Invoice,
  email: string,
): string {
  const subject = `Invoice ${invoice.invoiceNumber} from ${COMPANY}`;

  const body = [
    `Hello ${invoice.clientName},`,
    "",
    `Please find below the details for invoice ${invoice.invoiceNumber}.`,
    "",
    `Service: ${invoice.serviceType || "Pressure washing services"}`,
    `Amount due: ${formatCurrency(invoice.amount)}`,
    `Due date: ${new Date(invoice.dueDate).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}`,
    "",
    "If you have any questions, please reply to this email.",
    "",
    "Kind regards,",
    COMPANY,
  ].join("\n");

  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
