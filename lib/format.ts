export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "-";
  return value.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });
}

