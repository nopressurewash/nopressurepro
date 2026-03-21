"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { TextField, TextAreaField } from "../ui/FormField";
import { useSpeechToText } from "../../hooks/useSpeechToText";
import { formatCurrency } from "../../lib/format";
import {
  buildServiceType,
  calculateQuoteTotals,
  parseNumericInput,
  parseHoursInput,
} from "../../lib/quoteCalc";
import {
  getQuoteStatusLabel,
  QUOTE_STATUS_OPTIONS,
} from "../../lib/quoteStatus";
import type { Quote, QuoteStatus, Rates, StainLevel } from "../../lib/types";

interface EditQuoteModalProps {
  quote: Quote;
  rates: Rates;
  onSave: (updated: Quote) => void;
  onClose: () => void;
}

const toggleBase =
  "flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs font-medium transition-all duration-200";

export function EditQuoteModal({
  quote,
  rates,
  onSave,
  onClose,
}: EditQuoteModalProps) {
  const [isClient, setIsClient] = useState(false);
  const [clientName, setClientName] = useState(quote.clientName);
  const [suburb, setSuburb] = useState(quote.suburb);
  const [phone, setPhone] = useState(quote.phone);
  const [drivewaySqm, setDrivewaySqm] = useState(quote.drivewaySqm);
  const [pathsSqm, setPathsSqm] = useState(quote.pathsSqm);
  const [patioSqm, setPatioSqm] = useState(quote.patioSqm);
  const [stainLevel, setStainLevel] = useState<StainLevel>(quote.stainLevel);
  const [estimatedHours, setEstimatedHours] = useState(quote.estimatedHours);
  const [houseWash, setHouseWash] = useState(quote.includeHouseWash);
  const [roofWash, setRoofWash] = useState(quote.includeRoofWash);
  const [wallsExtras, setWallsExtras] = useState(quote.includeWallsExtras);
  const [notes, setNotes] = useState(quote.notes);
  const { speechStatus, speechMessage, handleVoiceInput } =
    useSpeechToText(setNotes);
  const [status, setStatus] = useState<QuoteStatus>(quote.status);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const totals = useMemo(
    () =>
      calculateQuoteTotals({
        drivewaySqm,
        pathsSqm,
        patioSqm,
        houseWash,
        roofWash,
        wallsExtras,
        stainLevel,
        estimatedHours,
        rates,
      }),
    [drivewaySqm, pathsSqm, patioSqm, houseWash, roofWash, wallsExtras, rates, stainLevel, estimatedHours],
  );

  const isDirty =
    clientName !== quote.clientName ||
    suburb !== quote.suburb ||
    phone !== quote.phone ||
    drivewaySqm !== quote.drivewaySqm ||
    pathsSqm !== quote.pathsSqm ||
    patioSqm !== quote.patioSqm ||
    stainLevel !== quote.stainLevel ||
    estimatedHours !== quote.estimatedHours ||
    houseWash !== quote.includeHouseWash ||
    roofWash !== quote.includeRoofWash ||
    wallsExtras !== quote.includeWallsExtras ||
    notes !== quote.notes ||
    status !== quote.status;

  function handleNumericChange(value: string, setter: (v: number) => void) {
    setter(parseNumericInput(value));
  }

  function handleClose() {
    if (isDirty) {
      const ok = window.confirm("Discard unsaved changes?");
      if (!ok) return;
    }
    onClose();
  }

  function handleSave() {
    if (!clientName.trim() || !suburb.trim()) {
      setBanner("Client name and suburb are required.");
      return;
    }

    const updated: Quote = {
      ...quote,
      clientName: clientName.trim(),
      suburb: suburb.trim(),
      phone: phone.trim(),
      drivewaySqm,
      pathsSqm,
      patioSqm,
      stainLevel,
      estimatedHours,
      includeHouseWash: houseWash,
      includeRoofWash: roofWash,
      includeWallsExtras: wallsExtras,
      notes: notes.trim(),
      status,
      serviceType: buildServiceType({
        drivewaySqm,
        pathsSqm,
        patioSqm,
        house: houseWash,
        roof: roofWash,
        walls: wallsExtras,
      }),
      low: totals.low,
      recommended: totals.recommended,
      high: totals.high,
      revenuePerHour: totals.revenuePerHour,
    };

    onSave(updated);
  }

  if (!isClient) return null;

  return createPortal(
    <div className="animate-fade-in fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-3 pb-6 pt-[8vh] sm:px-4 sm:pb-10 sm:pt-[10vh]">
      <div className="animate-fade-in-up flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-[var(--brand-border)] bg-surface-raised shadow-2xl sm:max-h-[86vh]">
        {/* Header — fixed */}
        <div className="shrink-0 border-b border-[var(--brand-border)] px-5 pb-3.5 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Edit Quote
              </p>
              <p className="mt-1 text-sm font-bold text-zinc-100">
                {quote.clientName}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-zinc-700/60 bg-surface px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all duration-200 hover:border-zinc-500 hover:text-zinc-100 active:scale-[0.97]"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {/* Client */}
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Client
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField
                label="Name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Client name"
              />
              <TextField
                label="Suburb"
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                placeholder="Suburb"
              />
            </div>
            <TextField
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
            />
          </div>

          {/* Surfaces */}
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Surfaces (m²)
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              <TextField
                label="Driveway"
                inputMode="decimal"
                value={drivewaySqm || ""}
                onChange={(e) => handleNumericChange(e.target.value, setDrivewaySqm)}
                placeholder="0"
              />
              <TextField
                label="Paths"
                inputMode="decimal"
                value={pathsSqm || ""}
                onChange={(e) => handleNumericChange(e.target.value, setPathsSqm)}
                placeholder="0"
              />
              <TextField
                label="Patio"
                inputMode="decimal"
                value={patioSqm || ""}
                onChange={(e) => handleNumericChange(e.target.value, setPatioSqm)}
                placeholder="0"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                  Stain level
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {(["light", "medium", "heavy"] as StainLevel[]).map((level) => {
                    const active = stainLevel === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setStainLevel(level)}
                        className={`rounded-xl border px-2 py-2 capitalize font-medium transition-all duration-200 ${
                          active
                            ? "border-gold/40 bg-gold/10 text-gold"
                            : "border-[var(--brand-border)] bg-surface text-zinc-400 hover:border-zinc-600 active:bg-zinc-800"
                        }`}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>
              <TextField
                label="Estimated hours"
                type="number"
                step="0.25"
                min="0.25"
                max="99"
                inputMode="decimal"
                value={estimatedHours || ""}
                onChange={(e) => setEstimatedHours(parseHoursInput(e.target.value))}
                placeholder="3"
              />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setHouseWash((v) => !v)}
                className={`${toggleBase} ${
                  houseWash
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-[var(--brand-border)] bg-surface text-zinc-400 active:bg-zinc-800"
                }`}
              >
                <span>House wash</span>
                <span className="text-[11px] tabular-nums text-zinc-500">
                  {formatCurrency(rates.houseWash)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRoofWash((v) => !v)}
                className={`${toggleBase} ${
                  roofWash
                    ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
                    : "border-[var(--brand-border)] bg-surface text-zinc-400 active:bg-zinc-800"
                }`}
              >
                <span>Roof wash</span>
                <span className="text-[11px] tabular-nums text-zinc-500">
                  {formatCurrency(rates.roofWash)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setWallsExtras((v) => !v)}
                className={`${toggleBase} ${
                  wallsExtras
                    ? "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300"
                    : "border-[var(--brand-border)] bg-surface text-zinc-400 active:bg-zinc-800"
                }`}
              >
                <span>Walls / extras</span>
                <span className="text-[11px] tabular-nums text-zinc-500">
                  {formatCurrency(rates.wallsExtras)}
                </span>
              </button>
            </div>
          </div>

          {/* Live quote preview */}
          <div className="space-y-3 rounded-2xl border border-[var(--brand-border)] bg-surface p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
              Quote bands
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Low
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-zinc-300">
                  {formatCurrency(totals.low)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                  Recommended
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-gold-light">
                  {formatCurrency(totals.recommended)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  High
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-zinc-300">
                  {formatCurrency(totals.high)}
                </p>
              </div>
            </div>
            <p className="text-xs tabular-nums text-zinc-500">
              {totals.revenuePerHour > 0
                ? `${formatCurrency(totals.revenuePerHour)}/hr`
                : "—"}
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Voice input
                </p>
                <p
                  className={`mt-1 text-[11px] ${
                    speechStatus === "listening"
                      ? "text-gold"
                      : speechMessage
                        ? "text-amber-300"
                        : "text-zinc-500"
                  }`}
                >
                  {speechStatus === "listening"
                    ? "Listening..."
                    : speechMessage ?? (speechStatus === "stopped" ? "Stopped" : "Idle")}
                </p>
              </div>
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200 active:scale-[0.98] ${
                  speechStatus === "listening"
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                    : "border-gold/40 bg-gold/10 text-gold hover:bg-gold/15"
                }`}
              >
                {speechStatus === "listening" ? "Stop Mic" : "Use Mic"}
              </button>
            </div>
            <TextAreaField
              label="Job notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Access, special requests, upsell ideas…"
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as QuoteStatus)}
              className="w-full rounded-xl border border-[var(--brand-border)] bg-surface px-3 py-2.5 text-sm text-zinc-100 outline-none transition-all duration-200 focus:border-gold/40 focus:ring-1 focus:ring-gold/15"
            >
              {QUOTE_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {getQuoteStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer — fixed */}
        <div className="shrink-0 border-t border-[var(--brand-border)] px-5 pb-5 pt-4">
          {banner && (
            <p className="mb-3 animate-fade-in text-xs font-medium text-gold">
              {banner}
            </p>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty}
            className="w-full rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm font-bold text-gold transition-all duration-200 hover:bg-gold/15 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
