import type { Rates, StainLevel } from "./types";

export function getStainMultiplier(stain: StainLevel): number {
  switch (stain) {
    case "light":
      return 0.95;
    case "medium":
      return 1;
    case "heavy":
      return 1.18;
    default:
      return 1;
  }
}

export function buildServiceType(options: {
  drivewaySqm: number;
  pathsSqm: number;
  patioSqm: number;
  house: boolean;
  roof: boolean;
  walls: boolean;
}): string {
  const tags: string[] = [];
  if (options.drivewaySqm > 0) tags.push("Driveway");
  if (options.pathsSqm > 0) tags.push("Paths");
  if (options.patioSqm > 0) tags.push("Patio");
  if (options.house) tags.push("House Wash");
  if (options.roof) tags.push("Roof Wash");
  if (options.walls) tags.push("Walls / Extras");
  if (!tags.length) return "Mixed";
  if (tags.length === 1) return tags[0]!;
  if (tags.length === 2) return `${tags[0]} + ${tags[1]}`;
  return `${tags[0]}, ${tags[1]} +`;
}

export interface QuoteTotals {
  low: number;
  recommended: number;
  high: number;
  revenuePerHour: number;
}

export function calculateQuoteTotals(input: {
  drivewaySqm: number;
  pathsSqm: number;
  patioSqm: number;
  houseWash: boolean;
  roofWash: boolean;
  wallsExtras: boolean;
  stainLevel: StainLevel;
  estimatedHours: number;
  rates: Rates;
}): QuoteTotals {
  const areaTotal =
    input.drivewaySqm * input.rates.driveway +
    input.pathsSqm * input.rates.paths +
    input.patioSqm * input.rates.patio;

  const addonTotal =
    (input.houseWash ? input.rates.houseWash : 0) +
    (input.roofWash ? input.rates.roofWash : 0) +
    (input.wallsExtras ? input.rates.wallsExtras : 0);

  const base = (areaTotal + addonTotal) * getStainMultiplier(input.stainLevel);
  const recommended = Math.round(base);
  const low = Math.round(recommended * 0.9);
  const high = Math.round(recommended * 1.12);
  const revenuePerHour =
    input.estimatedHours > 0 ? Math.round(recommended / input.estimatedHours) : 0;

  return { low, recommended, high, revenuePerHour };
}

export function parseNumericInput(value: string): number {
  const num = Number(value.replace(",", "."));
  return Number.isFinite(num) && num >= 0 ? num : 0;
}
