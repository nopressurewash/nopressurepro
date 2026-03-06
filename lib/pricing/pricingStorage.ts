import type { Rates } from "../types";
import { DEFAULT_RATES } from "./defaultRates";

export const RATES_KEY = "npp_rates_v1";

export function normalizeRates(value: Partial<Rates> | null | undefined): Rates {
  return {
    driveway:
      typeof value?.driveway === "number"
        ? value.driveway
        : DEFAULT_RATES.driveway,
    paths:
      typeof value?.paths === "number" ? value.paths : DEFAULT_RATES.paths,
    patio:
      typeof value?.patio === "number" ? value.patio : DEFAULT_RATES.patio,
    houseWash:
      typeof value?.houseWash === "number"
        ? value.houseWash
        : DEFAULT_RATES.houseWash,
    roofWash:
      typeof value?.roofWash === "number"
        ? value.roofWash
        : DEFAULT_RATES.roofWash,
    wallsExtras:
      typeof value?.wallsExtras === "number"
        ? value.wallsExtras
        : DEFAULT_RATES.wallsExtras,
  };
}

