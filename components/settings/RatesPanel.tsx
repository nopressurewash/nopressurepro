"use client";

import { useEffect, useRef, useState } from "react";
import { Panel } from "../ui/Panel";
import { TextField } from "../ui/FormField";
import type { Rates } from "../../lib/types";
import { DEFAULT_RATES } from "../../lib/pricing/defaultRates";

interface RatesPanelProps {
  rates: Rates;
  onChange: (next: Rates) => Promise<boolean> | boolean;
  canSave?: boolean;
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

export function RatesPanel({ rates, onChange, canSave = true }: RatesPanelProps) {
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

  async function handleSave() {
    if (!canSave) return;
    const nextRates: Rates = {
      driveway: parseDraftValue("driveway"),
      paths: parseDraftValue("paths"),
      patio: parseDraftValue("patio"),
      houseWash: parseDraftValue("houseWash"),
      roofWash: parseDraftValue("roofWash"),
      wallsExtras: parseDraftValue("wallsExtras"),
    };
    console.info("[rates] Save clicked", nextRates);
    setLastSaved(nextRates);
    setDraft(ratesToDraft(nextRates));
    const ok = await onChange(nextRates);
    showMessage(ok ? "Rates updated." : "Rates save failed.");
  }

  async function handleReset() {
    if (!canSave) return;
    setLastSaved(DEFAULT_RATES);
    setDraft(ratesToDraft(DEFAULT_RATES));
    console.info("[rates] Reset clicked", DEFAULT_RATES);
    const ok = await onChange(DEFAULT_RATES);
    showMessage(ok ? "Rates reset to defaults." : "Rates save failed.");
  }

  return (
    <Panel className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
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
          disabled={!canSave}
          className="flex-1 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-sm font-bold text-gold transition-colors hover:bg-gold/15 active:scale-[0.99]"
        >
          Save rates
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={!canSave}
          className="flex-1 rounded-2xl border border-[var(--brand-border)] bg-surface px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
        >
          Reset to defaults
        </button>
      </div>

      {message && (
        <p className="text-xs text-gold" role="status">
          {message}
        </p>
      )}
      {!canSave && (
        <p className="text-xs text-zinc-500" role="status">
          Waiting for workspace to load...
        </p>
      )}
    </Panel>
  );
}
