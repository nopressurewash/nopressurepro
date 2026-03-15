"use client";

import { useMemo, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { Panel } from "../../components/ui/Panel";
import { TextAreaField, TextField } from "../../components/ui/FormField";
import { AreaMeasureMap } from "../../components/map/AreaMeasureMap";
import { useLocalData } from "../../hooks/useLocalData";
import { formatCurrency } from "../../lib/format";
import { exportQuotePdf } from "../../lib/pdf/exportQuotePdf";
import {
  buildServiceType,
  calculateQuoteTotals,
  parseNumericInput,
  parseHoursInput,
} from "../../lib/quoteCalc";
import { getQuoteStatusLabel } from "../../lib/quoteStatus";
import type { StainLevel } from "../../lib/types";
import { Quote } from "../../lib/types";

const toggleBase =
  "flex items-center justify-between rounded-xl border px-3 py-3 text-xs font-medium transition-all duration-200";

export default function QuickQuotePage() {
  const { rates, addQuote } = useLocalData();

  const [clientName, setClientName] = useState("");
  const [suburb, setSuburb] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [drivewaySqm, setDrivewaySqm] = useState<number>(0);
  const [pathsSqm, setPathsSqm] = useState<number>(0);
  const [patioSqm, setPatioSqm] = useState<number>(0);
  const [stainLevel, setStainLevel] = useState<StainLevel>("medium");
  const [estimatedHours, setEstimatedHours] = useState<number>(3);
  const [houseWash, setHouseWash] = useState(false);
  const [roofWash, setRoofWash] = useState(false);
  const [wallsExtras, setWallsExtras] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);
  const [showMeasureModal, setShowMeasureModal] = useState(false);

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

  const chemicalMixHint = useMemo(() => {
    if (stainLevel === "light") return "Soft wash · ~0.8–1.0% SH on organic.";
    if (stainLevel === "medium")
      return "Standard · ~1.0–1.5% SH, dwell then rinse.";
    return "Heavy · 1.5–2.0% SH, test patch first, agitate if needed.";
  }, [stainLevel]);

  function handleNumericChange(
    value: string,
    setter: (v: number) => void,
  ): void {
    setter(parseNumericInput(value));
  }

  function buildDraftQuote(): Quote {
    return {
      id: `draft-${Date.now()}`,
      clientName: clientName.trim() || "Walk-in Quote",
      suburb: suburb.trim() || "Gold Coast",
      phone: phone.trim(),
      email: email.trim() || undefined,
      drivewaySqm, pathsSqm, patioSqm,
      stainLevel, estimatedHours,
      includeHouseWash: houseWash,
      includeRoofWash: roofWash,
      includeWallsExtras: wallsExtras,
      notes: notes.trim(),
      serviceType: buildServiceType({
        drivewaySqm, pathsSqm, patioSqm,
        house: houseWash, roof: roofWash, walls: wallsExtras,
      }),
      low: totals.low,
      recommended: totals.recommended,
      high: totals.high,
      revenuePerHour: totals.revenuePerHour,
      status: "draft",
      createdAt: new Date().toISOString(),
    };
  }

  async function handleSave() {
    if (!clientName.trim() || !suburb.trim()) {
      setSavedBanner("Add at least a client name and suburb.");
      return;
    }

    setSaving(true);
    try {
      const id = `${Date.now()}`;
      const quote: Quote = {
        id,
        clientName: clientName.trim(),
        suburb: suburb.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        drivewaySqm, pathsSqm, patioSqm,
        stainLevel, estimatedHours,
        includeHouseWash: houseWash,
        includeRoofWash: roofWash,
        includeWallsExtras: wallsExtras,
        notes: notes.trim(),
        serviceType: "Mixed",
        low: totals.low,
        recommended: totals.recommended,
        high: totals.high,
        revenuePerHour: totals.revenuePerHour,
        status: "draft",
        createdAt: new Date().toISOString(),
      };

      quote.serviceType = buildServiceType({
        drivewaySqm, pathsSqm, patioSqm,
        house: houseWash, roof: roofWash, walls: wallsExtras,
      }) as any;

      addQuote(quote);
      setSavedBanner("Quote saved to your list.");
    } finally {
      setSaving(false);
      setTimeout(() => setSavedBanner(null), 2800);
    }
  }

  return (
    <AppShell>
      <section className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
            Quick Quote
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Price a job in under a minute. Adjust live on-site.
          </p>
        </div>

        {/* Client section */}
        <Panel className="space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Client
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField
              label="Name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Sarah, Body Corp, Café"
            />
            <TextField
              label="Suburb"
              value={suburb}
              onChange={(e) => setSuburb(e.target.value)}
              placeholder="e.g. Mermaid Waters"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Mobile for SMS follow-up"
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
            />
          </div>
        </Panel>

        {/* Surfaces section */}
        <Panel className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Surfaces (m²)
            </p>
            <button
              type="button"
              onClick={() => setShowMeasureModal(true)}
              className="rounded-xl border border-brand-purple/30 bg-brand-purple/10 px-3 py-2 text-[11px] font-semibold text-brand-purple-light transition-all duration-200 hover:bg-brand-purple/15 active:scale-[0.98]"
            >
              Measure driveway
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <TextField
              label="Driveway"
              inputMode="decimal"
              value={drivewaySqm || ""}
              onChange={(e) =>
                handleNumericChange(e.target.value, setDrivewaySqm)
              }
              placeholder="0"
            />
            <TextField
              label="Paths"
              inputMode="decimal"
              value={pathsSqm || ""}
              onChange={(e) =>
                handleNumericChange(e.target.value, setPathsSqm)
              }
              placeholder="0"
            />
            <TextField
              label="Patio"
              inputMode="decimal"
              value={patioSqm || ""}
              onChange={(e) =>
                handleNumericChange(e.target.value, setPatioSqm)
              }
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
                      className={`rounded-xl border px-2 py-2.5 capitalize font-medium transition-all duration-200 ${
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
              onChange={(e) =>
                setEstimatedHours(parseHoursInput(e.target.value))
              }
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
        </Panel>

        {/* Quote bands */}
        <Panel className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
              Quote bands
            </p>
            <p className="text-[11px] text-zinc-600">
              Lead with confidence.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Low
              </p>
              <p className="mt-1.5 text-xl font-bold tabular-nums text-zinc-300">
                {formatCurrency(totals.low)}
              </p>
              <p className="mt-1 text-[11px] text-zinc-600">
                Softer / repeat.
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                Recommended
              </p>
              <p className="mt-1.5 text-xl font-bold tabular-nums text-gold-light">
                {formatCurrency(totals.recommended)}
              </p>
              <p className="mt-1 text-[11px] text-zinc-600">
                Normal lead price.
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                High
              </p>
              <p className="mt-1.5 text-xl font-bold tabular-nums text-zinc-300">
                {formatCurrency(totals.high)}
              </p>
              <p className="mt-1 text-[11px] text-zinc-600">
                Hard access / rush.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[var(--brand-border)] bg-surface px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Revenue / hour
              </p>
              <p className="mt-1.5 text-base font-bold tabular-nums text-zinc-200">
                {totals.revenuePerHour > 0
                  ? formatCurrency(totals.revenuePerHour)
                  : "-"}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--brand-border)] bg-surface px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Chem mix helper
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-400">
                {chemicalMixHint}
              </p>
            </div>
          </div>
        </Panel>

        {/* Notes */}
        <Panel className="space-y-3">
          <TextAreaField
            label="Job notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Access, water, nearby cars, power, gutters, special requests, upsell ideas&hellip;"
          />
        </Panel>

        {/* Actions */}
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">
            New quotes save as{" "}
            <span className="font-medium text-gold">
              {getQuoteStatusLabel("draft")}
            </span>
            .
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => exportQuotePdf(buildDraftQuote())}
              className="flex w-full items-center justify-center rounded-2xl border border-brand-purple/30 bg-brand-purple/10 px-4 py-3.5 text-sm font-semibold text-brand-purple-light transition-all duration-200 hover:bg-brand-purple/15 active:scale-[0.98]"
            >
              Export PDF
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex w-full items-center justify-center rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3.5 text-sm font-bold text-gold transition-all duration-200 hover:bg-gold/15 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save quote to list"}
            </button>
          </div>
          {savedBanner && (
            <p className="animate-fade-in text-xs font-medium text-gold">
              {savedBanner}
            </p>
          )}
        </div>

        {/* Measure modal */}
        {showMeasureModal && (
          <div className="animate-fade-in fixed inset-0 z-40 flex items-end justify-center bg-black/90 px-3 pb-6 pt-16 sm:items-center sm:px-4">
            <div className="animate-fade-in-up w-full max-w-3xl rounded-2xl border border-[var(--brand-border)] bg-surface-raised p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Driveway measurement
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-200">
                    Draw a polygon around the driveway to estimate m².
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMeasureModal(false)}
                  className="rounded-xl border border-zinc-700/60 bg-surface px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all duration-200 hover:border-zinc-500 hover:text-zinc-100 active:scale-[0.98]"
                >
                  Close
                </button>
              </div>
              <div className="mt-3">
                <AreaMeasureMap
                  onAreaConfirm={(area) => {
                    setDrivewaySqm(Math.round(area));
                    setShowMeasureModal(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}
