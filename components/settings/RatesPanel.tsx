"use client";

import { useEffect, useRef, useState } from "react";
import { Panel } from "../ui/Panel";
import { TextField } from "../ui/FormField";
import type { Rates } from "../../lib/types";
import { DEFAULT_RATES } from "../../lib/pricing/defaultRates";

interface RatesPanelProps {
  rates: Rates;
  onChange: (next: Rates) => void;
}

type RateKey = keyof Rates;

const RATE_KEYS: RateKey[] = [
  "driveway",
  "paths",
  "patio",
  "houseWash",
  "roofWash",
  "wallsExtras",
];

function formatRate(value: number): string {
  if (!Number.isFinite(value)) return "";
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return `${rounded}`;
}

function ratesToDraft(rates: Rates): Record<RateKey, string> {
  return {
    driveway: formatRate(rates.driveway),
    paths: formatRate(rates.paths),
    patio: formatRate(rates.patio),
    houseWash: formatRate(rates.houseWash),
    roofWash: formatRate(rates.roofWash),
    wallsExtras: formatRate(rates.wallsExtras),
  };
}

export function RatesPanel({ rates, onChange }: RatesPanelProps) {
  const [draft, setDraft] = useState<Record<RateKey, string>>(
    () => ratesToDraft(rates),
  );
  const [lastSaved, setLastSaved] = useState<Rates>(rates);
  const [message, setMessage] = useState<string | null>(null);
  const messageTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setLastSaved(rates);
    setDraft(ratesToDraft(rates));
  }, [rates]);

  function showMessage(text: string) {
    setMessage(text);
    if (messageTimeoutRef.current) {
      window.clearTimeout(messageTimeoutRef.current);
    }
    messageTimeoutRef.current = window.setTimeout(() => {
      setMessage(null);
      messageTimeoutRef.current = null;
    }, 2500);
  }

  function handleFieldChange(key: RateKey, value: string) {
    // Prevent obvious negative values while still allowing decimals.
    if (value.trim().startsWith("-")) return;
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function parseDraftValue(key: RateKey): number {
    const raw = draft[key]?.trim().replace(",", ".") ?? "";
    const previous = lastSaved[key] ?? DEFAULT_RATES[key];
    if (!raw) return previous;
    const num = Number(raw);
    if (!Number.isFinite(num) || num < 0) return previous;
    return num;
  }

  function handleSave() {
    const nextRates: Rates = {
      driveway: parseDraftValue("driveway"),
      paths: parseDraftValue("paths"),
      patio: parseDraftValue("patio"),
      houseWash: parseDraftValue("houseWash"),
      roofWash: parseDraftValue("roofWash"),
      wallsExtras: parseDraftValue("wallsExtras"),
    };
    setLastSaved(nextRates);
    setDraft(ratesToDraft(nextRates));
    onChange(nextRates);
    showMessage("Rates updated.");
  }

  function handleReset() {
    setLastSaved(DEFAULT_RATES);
    setDraft(ratesToDraft(DEFAULT_RATES));
    onChange(DEFAULT_RATES);
    showMessage("Rates reset to defaults.");
  }

  return (
    <Panel className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
          Rates
        </p>
        <p className="text-[11px] text-zinc-500">
          Pricing used across your quick quotes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <TextField
          label="Driveway rate (per m²)"
          inputMode="decimal"
          value={draft.driveway}
          onChange={(e) => handleFieldChange("driveway", e.target.value)}
        />
        <TextField
          label="Paths rate (per m²)"
          inputMode="decimal"
          value={draft.paths}
          onChange={(e) => handleFieldChange("paths", e.target.value)}
        />
        <TextField
          label="Patio rate (per m²)"
          inputMode="decimal"
          value={draft.patio}
          onChange={(e) => handleFieldChange("patio", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <TextField
          label="House wash price"
          inputMode="decimal"
          value={draft.houseWash}
          onChange={(e) => handleFieldChange("houseWash", e.target.value)}
        />
        <TextField
          label="Roof wash price"
          inputMode="decimal"
          value={draft.roofWash}
          onChange={(e) => handleFieldChange("roofWash", e.target.value)}
        />
        <TextField
          label="Walls / extras price"
          inputMode="decimal"
          value={draft.wallsExtras}
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

