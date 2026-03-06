"use client";

import { useEffect, useState } from "react";
import { Panel } from "../ui/Panel";
import { TextField } from "../ui/FormField";
import type { Rates } from "../../lib/types";
import { DEFAULT_RATES } from "../../lib/pricing/defaultRates";

interface RatesPanelProps {
  rates: Rates;
  onChange: (next: Rates) => void;
}

function toDisplay(value: number) {
  return Number.isFinite(value) ? String(value) : "";
}

function parseRate(value: string, fallback: number) {
  const cleaned = value.replace(",", ".").trim();
  if (!cleaned) return fallback;
  const num = Number(cleaned);
  return Number.isFinite(num) && num >= 0 ? num : fallback;
}

export function RatesPanel({ rates, onChange }: RatesPanelProps) {
  const [localRates, setLocalRates] = useState<Rates>(rates);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setLocalRates(rates);
  }, [rates]);

  function handleFieldChange(key: keyof Rates, value: string) {
    setLocalRates((prev) => ({
      ...prev,
      [key]: parseRate(value, prev[key]),
    }));
  }

  function handleSave() {
    onChange(localRates);
    setMessage("Rates updated.");
    setTimeout(() => setMessage(null), 2500);
  }

  function handleReset() {
    setLocalRates(DEFAULT_RATES);
    onChange(DEFAULT_RATES);
    setMessage("Rates reset to defaults.");
    setTimeout(() => setMessage(null), 2500);
  }

  return (
    <Panel className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
          Rates
        </p>
        <p className="text-[11px] text-zinc-500">
          Pricing used across your quick quotes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TextField
          label="Driveway rate (per m²)"
          inputMode="decimal"
          value={toDisplay(localRates.driveway)}
          onChange={(e) => handleFieldChange("driveway", e.target.value)}
        />
        <TextField
          label="Paths rate (per m²)"
          inputMode="decimal"
          value={toDisplay(localRates.paths)}
          onChange={(e) => handleFieldChange("paths", e.target.value)}
        />
        <TextField
          label="Patio rate (per m²)"
          inputMode="decimal"
          value={toDisplay(localRates.patio)}
          onChange={(e) => handleFieldChange("patio", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TextField
          label="House wash price"
          inputMode="decimal"
          value={toDisplay(localRates.houseWash)}
          onChange={(e) => handleFieldChange("houseWash", e.target.value)}
        />
        <TextField
          label="Roof wash price"
          inputMode="decimal"
          value={toDisplay(localRates.roofWash)}
          onChange={(e) => handleFieldChange("roofWash", e.target.value)}
        />
        <TextField
          label="Walls / extras price"
          inputMode="decimal"
          value={toDisplay(localRates.wallsExtras)}
          onChange={(e) => handleFieldChange("wallsExtras", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2 text-sm sm:flex-row">
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 rounded-2xl border border-amber-400/80 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-[0_0_30px_rgba(250,204,21,0.6)] transition active:scale-[0.99]"
        >
          Save rates
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="flex-1 rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
        >
          Reset to defaults
        </button>
      </div>

      {message && (
        <p className="text-xs text-amber-200" role="status">
          {message}
        </p>
      )}
    </Panel>
  );
}

