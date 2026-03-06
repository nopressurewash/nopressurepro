import type { Rates } from "../types";
import { DEFAULT_RATES } from "./defaultRates";

export const RATES_KEY = "npp_rates_v1";

export function normalizeRates(
  value: Partial<Rates> | null | undefined,
): Rates {
  const safeNumber = (candidate: unknown, fallback: number): number => {
    return typeof candidate === "number" && Number.isFinite(candidate) && candidate >= 0
      ? candidate
      : fallback;
  };

  return {
    driveway: safeNumber(value?.driveway, DEFAULT_RATES.driveway),
    paths: safeNumber(value?.paths, DEFAULT_RATES.paths),
    patio: safeNumber(value?.patio, DEFAULT_RATES.patio),
    houseWash: safeNumber(value?.houseWash, DEFAULT_RATES.houseWash),
    roofWash: safeNumber(value?.roofWash, DEFAULT_RATES.roofWash),
    wallsExtras: safeNumber(value?.wallsExtras, DEFAULT_RATES.wallsExtras),
  };
}

