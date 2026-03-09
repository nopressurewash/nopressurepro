import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Quote } from "../types";
import { formatCurrency } from "../format";
import { getQuoteStatusLabel } from "../quoteStatus";

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

function buildBreakdown(quote: Quote) {
  const rows: Array<{ label: string; value: string }> = [];

  if (quote.drivewaySqm > 0) {
    rows.push({ label: "Driveway", value: `${quote.drivewaySqm} m²` });
  }
  if (quote.pathsSqm > 0) {
    rows.push({ label: "Paths", value: `${quote.pathsSqm} m²` });
  }
  if (quote.patioSqm > 0) {
    rows.push({ label: "Patio", value: `${quote.patioSqm} m²` });
  }
  if (quote.includeHouseWash) {
    rows.push({ label: "House wash", value: "Included" });
  }
  if (quote.includeRoofWash) {
    rows.push({ label: "Roof wash", value: "Included" });
  }
  if (quote.includeWallsExtras) {
    rows.push({ label: "Walls / extras", value: "Included" });
  }

  if (rows.length === 0) {
    rows.push({ label: "Service", value: quote.serviceType || "Mixed" });
  }

  return rows;
}

function wrapText(text: string, maxChars: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

export async function exportQuotePdf(quote: Quote) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const colors = {
    black: rgb(0.03, 0.03, 0.06),
    gold: rgb(0.98, 0.8, 0.08),
    goldSoft: rgb(0.95, 0.9, 0.65),
    purple: rgb(0.28, 0.1, 0.42),
    white: rgb(0.98, 0.98, 0.99),
    body: rgb(0.17, 0.17, 0.21),
    muted: rgb(0.46, 0.46, 0.52),
    border: rgb(0.88, 0.86, 0.75),
    panel: rgb(0.97, 0.96, 0.93),
  };

  page.drawRectangle({
    x: 0,
    y: height - 150,
    width,
    height: 150,
    color: colors.black,
  });

  page.drawRectangle({
    x: 0,
    y: height - 150,
    width,
    height: 10,
    color: colors.gold,
  });

  page.drawText("NO PRESSURE PRO", {
    x: 42,
    y: height - 58,
    size: 22,
    font: fontBold,
    color: colors.gold,
  });

  page.drawText("Premium Exterior Cleaning Quote", {
    x: 42,
    y: height - 84,
    size: 11,
    font: fontRegular,
    color: colors.goldSoft,
  });

  page.drawText("Professional quoting for pressure washing and exterior cleaning.", {
    x: 42,
    y: height - 102,
    size: 10,
    font: fontRegular,
    color: colors.white,
  });

  page.drawText(`Quote date: ${formatDate(quote.createdAt)}`, {
    x: width - 185,
    y: height - 62,
    size: 10,
    font: fontBold,
    color: colors.white,
  });

  page.drawText(`Status: ${getQuoteStatusLabel(quote.status)}`, {
    x: width - 185,
    y: height - 80,
    size: 10,
    font: fontRegular,
    color: colors.goldSoft,
  });

  let cursorY = height - 190;

  page.drawText("Client", {
    x: 42,
    y: cursorY,
    size: 11,
    font: fontBold,
    color: colors.purple,
  });

  cursorY -= 24;

  const clientLines = [
    quote.clientName || "Walk-in quote",
    quote.suburb || "Suburb not supplied",
    quote.phone ? `Phone: ${quote.phone}` : null,
  ].filter(Boolean) as string[];

  for (const line of clientLines) {
    page.drawText(line, {
      x: 42,
      y: cursorY,
      size: 11,
      font: line === clientLines[0] ? fontBold : fontRegular,
      color: colors.body,
    });
    cursorY -= 18;
  }

  cursorY -= 8;

  page.drawText("Service breakdown", {
    x: 42,
    y: cursorY,
    size: 11,
    font: fontBold,
    color: colors.purple,
  });

  cursorY -= 22;

  const breakdown = buildBreakdown(quote);
  for (const row of breakdown) {
    page.drawText(row.label, {
      x: 42,
      y: cursorY,
      size: 10.5,
      font: fontRegular,
      color: colors.body,
    });
    page.drawText(row.value, {
      x: width - 160,
      y: cursorY,
      size: 10.5,
      font: fontBold,
      color: colors.body,
    });
    page.drawLine({
      start: { x: 42, y: cursorY - 6 },
      end: { x: width - 42, y: cursorY - 6 },
      thickness: 0.6,
      color: colors.border,
    });
    cursorY -= 22;
  }

  cursorY -= 10;

  page.drawRectangle({
    x: 42,
    y: cursorY - 96,
    width: width - 84,
    height: 96,
    color: colors.panel,
  });

  page.drawText("Quote range", {
    x: 56,
    y: cursorY - 18,
    size: 11,
    font: fontBold,
    color: colors.purple,
  });

  const quoteBlocks = [
    { label: "Low", value: formatCurrency(quote.low), x: 56 },
    { label: "Recommended", value: formatCurrency(quote.recommended), x: 210 },
    { label: "High", value: formatCurrency(quote.high), x: 400 },
  ];

  for (const block of quoteBlocks) {
    page.drawText(block.label, {
      x: block.x,
      y: cursorY - 42,
      size: 10,
      font: fontRegular,
      color: colors.muted,
    });
    page.drawText(block.value, {
      x: block.x,
      y: cursorY - 64,
      size: 15,
      font: fontBold,
      color: block.label === "Recommended" ? colors.gold : colors.body,
    });
  }

  cursorY -= 126;

  page.drawText("Estimate details", {
    x: 42,
    y: cursorY,
    size: 11,
    font: fontBold,
    color: colors.purple,
  });

  cursorY -= 20;

  const estimateDetails = [
    `Service type: ${quote.serviceType || "Mixed"}`,
    `Stain level: ${quote.stainLevel}`,
    quote.estimatedHours > 0
      ? `Estimated hours: ${quote.estimatedHours.toFixed(1)}`
      : null,
    quote.revenuePerHour > 0
      ? `Revenue per hour: ${formatCurrency(quote.revenuePerHour)}`
      : null,
  ].filter(Boolean) as string[];

  for (const detail of estimateDetails) {
    page.drawText(detail, {
      x: 42,
      y: cursorY,
      size: 10.5,
      font: fontRegular,
      color: colors.body,
    });
    cursorY -= 17;
  }

  if (quote.notes) {
    cursorY -= 8;
    page.drawText("Job notes", {
      x: 42,
      y: cursorY,
      size: 11,
      font: fontBold,
      color: colors.purple,
    });
    cursorY -= 18;

    const noteLines = wrapText(quote.notes, 88);
    for (const line of noteLines.slice(0, 8)) {
      page.drawText(line, {
        x: 42,
        y: cursorY,
        size: 10,
        font: fontRegular,
        color: colors.body,
      });
      cursorY -= 15;
    }
  }

  page.drawLine({
    start: { x: 42, y: 76 },
    end: { x: width - 42, y: 76 },
    thickness: 1,
    color: colors.gold,
  });

  page.drawText("Thank you for considering No Pressure Pro.", {
    x: 42,
    y: 56,
    size: 10.5,
    font: fontBold,
    color: colors.black,
  });

  page.drawText("Premium quoting. Clear options. Professional presentation.", {
    x: 42,
    y: 40,
    size: 9.5,
    font: fontRegular,
    color: colors.muted,
  });

  const pdfBytes = await pdfDoc.save();
  const safeBytes = new Uint8Array(pdfBytes);
  const blob = new Blob([safeBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const clientPart = sanitizeFilename(quote.clientName || "quote");
  link.href = url;
  link.download = `nopressure-quote-${clientPart || "quote"}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

