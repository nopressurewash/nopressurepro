import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Invoice } from "../types";
import { formatCurrency } from "../format";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function sanitizeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

const WORDMARK_URL = "/branding/wordmark-primary.png";
const HEADER_BAND_HEIGHT = 100;
const WORDMARK_MAX_WIDTH = 200;
const MARGIN = 42;

export async function exportInvoicePdf(invoice: Invoice) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const colors = {
    black: rgb(0.035, 0.035, 0.043),
    gold: rgb(0.784, 0.588, 0.173),
    goldSoft: rgb(0.859, 0.706, 0.392),
    purple: rgb(0.486, 0.227, 0.929),
    white: rgb(0.98, 0.98, 0.99),
    body: rgb(0.17, 0.17, 0.21),
    muted: rgb(0.46, 0.46, 0.52),
    border: rgb(0.85, 0.82, 0.72),
    panel: rgb(0.97, 0.96, 0.93),
  };

  // Header band
  page.drawRectangle({
    x: 0,
    y: height - HEADER_BAND_HEIGHT,
    width,
    height: HEADER_BAND_HEIGHT,
    color: colors.black,
  });

  let wordmarkDrawn = false;
  try {
    const response = await fetch(WORDMARK_URL);
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      const pngImage = await pdfDoc.embedPng(new Uint8Array(arrayBuffer));
      const imgW = pngImage.width;
      const imgH = pngImage.height;
      const scale = Math.min(WORDMARK_MAX_WIDTH / imgW, 42 / imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      page.drawImage(pngImage, {
        x: MARGIN,
        y: height - HEADER_BAND_HEIGHT + (HEADER_BAND_HEIGHT - drawH) / 2,
        width: drawW,
        height: drawH,
      });
      wordmarkDrawn = true;
    }
  } catch {
    // fallback
  }

  if (!wordmarkDrawn) {
    page.drawText("NO PRESSURE PRO", {
      x: MARGIN,
      y: height - 52,
      size: 20,
      font: fontBold,
      color: colors.gold,
    });
  }

  page.drawText("INVOICE", {
    x: width - 120,
    y: height - 48,
    size: 14,
    font: fontBold,
    color: colors.gold,
  });

  page.drawText(`# ${invoice.invoiceNumber}`, {
    x: width - 120,
    y: height - 64,
    size: 10,
    font: fontRegular,
    color: colors.goldSoft,
  });

  page.drawRectangle({
    x: 0,
    y: height - HEADER_BAND_HEIGHT,
    width,
    height: 3,
    color: colors.gold,
  });

  let cursorY = height - HEADER_BAND_HEIGHT - 40;

  // Bill to
  page.drawText("Bill to", {
    x: MARGIN,
    y: cursorY,
    size: 11,
    font: fontBold,
    color: colors.purple,
  });
  cursorY -= 22;

  const clientLines = [
    invoice.clientName,
    invoice.suburb ? `${invoice.suburb}` : null,
    invoice.phone ? `Phone: ${invoice.phone}` : null,
  ].filter(Boolean) as string[];

  for (const line of clientLines) {
    page.drawText(line, {
      x: MARGIN,
      y: cursorY,
      size: 11,
      font: line === clientLines[0] ? fontBold : fontRegular,
      color: colors.body,
    });
    cursorY -= 16;
  }

  cursorY -= 6;

  // Dates
  page.drawText(`Issue date: ${formatDate(invoice.issueDate)}`, {
    x: width - 180,
    y: cursorY + 22,
    size: 10,
    font: fontRegular,
    color: colors.muted,
  });
  page.drawText(`Due date: ${formatDate(invoice.dueDate)}`, {
    x: width - 180,
    y: cursorY + 6,
    size: 10,
    font: fontRegular,
    color: colors.muted,
  });

  // Line items
  page.drawText("Description", {
    x: MARGIN,
    y: cursorY,
    size: 10,
    font: fontBold,
    color: colors.muted,
  });
  page.drawText("Amount", {
    x: width - MARGIN - 90,
    y: cursorY,
    size: 10,
    font: fontBold,
    color: colors.muted,
  });
  cursorY -= 6;

  page.drawLine({
    start: { x: MARGIN, y: cursorY },
    end: { x: width - MARGIN, y: cursorY },
    thickness: 0.5,
    color: colors.border,
  });
  cursorY -= 18;

  for (const item of invoice.lineItems) {
    const desc = item.description.length > 70 ? item.description.slice(0, 67) + "..." : item.description;
    page.drawText(desc, {
      x: MARGIN,
      y: cursorY,
      size: 10.5,
      font: fontRegular,
      color: colors.body,
    });
    page.drawText(formatCurrency(item.amount), {
      x: width - MARGIN - 90,
      y: cursorY,
      size: 10.5,
      font: fontBold,
      color: colors.body,
    });
    cursorY -= 18;
  }

  cursorY -= 8;
  page.drawLine({
    start: { x: MARGIN, y: cursorY },
    end: { x: width - MARGIN, y: cursorY },
    thickness: 0.8,
    color: colors.gold,
  });
  cursorY -= 20;

  page.drawText("Total", {
    x: MARGIN,
    y: cursorY,
    size: 12,
    font: fontBold,
    color: colors.body,
  });
  page.drawText(formatCurrency(invoice.amount), {
    x: width - MARGIN - 90,
    y: cursorY,
    size: 12,
    font: fontBold,
    color: colors.gold,
  });
  cursorY -= 28;

  if (invoice.notes) {
    page.drawText("Notes", {
      x: MARGIN,
      y: cursorY,
      size: 10,
      font: fontBold,
      color: colors.muted,
    });
    cursorY -= 14;
    page.drawText(invoice.notes.slice(0, 200), {
      x: MARGIN,
      y: cursorY,
      size: 10,
      font: fontRegular,
      color: colors.body,
    });
    cursorY -= 20;
  }

  // Footer
  const footerY = 70;
  page.drawRectangle({
    x: MARGIN,
    y: footerY - 2,
    width: width - 2 * MARGIN,
    height: 2,
    color: colors.gold,
  });
  page.drawText("Thank you for your business.", {
    x: MARGIN,
    y: footerY - 22,
    size: 11,
    font: fontBold,
    color: colors.body,
  });
  page.drawText("No Pressure Pro — Premium exterior cleaning. Please pay by the due date.", {
    x: MARGIN,
    y: footerY - 38,
    size: 9,
    font: fontRegular,
    color: colors.muted,
  });

  const pdfBytes = await pdfDoc.save();
  const safeBytes = new Uint8Array(pdfBytes);
  const blob = new Blob([safeBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const clientPart = sanitizeFilename(invoice.clientName || "invoice");
  link.href = url;
  link.download = `nopressure-invoice-${invoice.invoiceNumber}-${clientPart}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
