"use client";

import { supabaseClient } from "../supabaseClient";
import { DEFAULT_RATES } from "../pricing/defaultRates";
import { RATES_KEY, normalizeRates } from "../pricing/pricingStorage";
import type { Rates } from "../types";

export const RATES_COLUMNS = `
  driveway,
  paths,
  patio,
  house_wash,
  roof_wash,
  walls_extras
`;

function mapRowToRates(row: Record<string, unknown>): Rates {
  return {
    driveway: Number(row.driveway ?? DEFAULT_RATES.driveway),
    paths: Number(row.paths ?? DEFAULT_RATES.paths),
    patio: Number(row.patio ?? DEFAULT_RATES.patio),
    houseWash: Number(row.house_wash ?? DEFAULT_RATES.houseWash),
    roofWash: Number(row.roof_wash ?? DEFAULT_RATES.roofWash),
    wallsExtras: Number(row.walls_extras ?? DEFAULT_RATES.wallsExtras),
  };
}

export async function getRates(businessId: string): Promise<Rates | null> {
  if (!businessId) return null;
  const { data, error } = await supabaseClient
    .from("rates")
    .select(RATES_COLUMNS)
    .eq("business_id", businessId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Supabase rates fetch failed", error);
    return null;
  }

  if (!data) return null;
  return mapRowToRates(data);
}

export async function saveRates(businessId: string, rates: Rates): Promise<void> {
  if (!businessId) {
    throw new Error("Missing business_id when saving rates.");
  }

  const payload = {
    business_id: businessId,
    driveway: rates.driveway,
    paths: rates.paths,
    patio: rates.patio,
    house_wash: rates.houseWash,
    roof_wash: rates.roofWash,
    walls_extras: rates.wallsExtras,
  };

  const { error } = await supabaseClient
    .from("rates")
    .upsert(payload, { onConflict: "business_id" });

  if (error) {
    console.error(
      "[rates] Supabase rates save failed",
      error.message,
      error.details,
      error.hint,
      error.code,
    );
    throw error;
  }
}

export async function importLocalRatesIfMissing(businessId: string): Promise<void> {
  if (!businessId) return;

  const remote = await getRates(businessId);
  if (remote) return;

  if (typeof window === "undefined") return;

  const stored = window.localStorage.getItem(RATES_KEY);
  if (!stored) return;

  try {
    const local = normalizeRates(JSON.parse(stored) as Partial<Rates>);
    await saveRates(businessId, local);
  } catch (error) {
    console.error("Failed to import local rates", error);
  }
}
