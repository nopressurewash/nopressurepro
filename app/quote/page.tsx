"use client";

import { useMemo, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { Panel } from "../../components/ui/Panel";
import { TextAreaField, TextField } from "../../components/ui/FormField";
import { AreaMeasureMap } from "../../components/map/AreaMeasureMap";
import { useLocalData } from "../../hooks/useLocalData";
import { formatCurrency } from "../../lib/format";
import type { StainLevel } from "../../lib/types";
import { Quote } from "../../lib/types";

function getStainMultiplier(stain: StainLevel) {
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

function buildServiceType(options: {
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

export default function QuickQuotePage() {
  const { rates, addQuote } = useLocalData();

  const [clientName, setClientName] = useState("");
  const [suburb, setSuburb] = useState("");
  const [phone, setPhone] = useState("");
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

  const totals = useMemo(() => {
    const areaTotal =
      drivewaySqm * rates.driveway +
      pathsSqm * rates.paths +
      patioSqm * rates.patio;

    const addonTotal =
      (houseWash ? rates.houseWash : 0) +
      (roofWash ? rates.roofWash : 0) +
      (wallsExtras ? rates.wallsExtras : 0);

    const base = (areaTotal + addonTotal) * getStainMultiplier(stainLevel);
    const recommended = Math.round(base);
    const low = Math.round(recommended * 0.9);
    const high = Math.round(recommended * 1.12);
    const revenuePerHour =
      estimatedHours > 0 ? Math.round(recommended / estimatedHours) : 0;

    return {
      low,
      recommended,
      high,
      revenuePerHour,
    };
  }, [
    drivewaySqm,
    pathsSqm,
    patioSqm,
    houseWash,
    roofWash,
    wallsExtras,
    rates,
    stainLevel,
    estimatedHours,
  ]);

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
    const num = Number(value.replace(",", "."));
    setter(Number.isFinite(num) && num >= 0 ? num : 0);
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
        drivewaySqm,
        pathsSqm,
        patioSqm,
        stainLevel,
        estimatedHours,
        includeHouseWash: houseWash,
        includeRoofWash: roofWash,
        includeWallsExtras: wallsExtras,
        notes: notes.trim(),
        serviceType: "Mixed",
        low: totals.low,
        recommended: totals.recommended,
        high: totals.high,
        revenuePerHour: totals.revenuePerHour,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      quote.serviceType = buildServiceType({
        drivewaySqm,
        pathsSqm,
        patioSqm,
        house: houseWash,
        roof: roofWash,
        walls: wallsExtras,
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
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Quick Quote
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Price a job in under a minute. Adjust live on-site.
          </p>
        </div>

        <Panel className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
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
          <TextField
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Mobile for SMS follow-up"
          />
        </Panel>

        <Panel className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              Surfaces (m²)
            </p>
            <div className="flex items-center gap-2">
              <p className="hidden text-[11px] text-zinc-500 sm:block">
                Rates are editable from any page.
              </p>
              <button
                type="button"
                onClick={() => setShowMeasureModal(true)}
                className="rounded-full border border-purple-500/60 bg-gradient-to-r from-purple-800 via-fuchsia-700 to-purple-900 px-3 py-1.5 text-[11px] font-semibold text-zinc-50 shadow-[0_0_24px_rgba(147,51,234,0.6)]"
              >
                Measure driveway
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
              <label className="text-xs text-zinc-400">Stain level</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(["light", "medium", "heavy"] as StainLevel[]).map((level) => {
                  const active = stainLevel === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setStainLevel(level)}
                      className={`rounded-xl border px-2 py-1.5 capitalize transition ${
                        active
                          ? "border-amber-400 bg-amber-400/15 text-amber-200 shadow-[0_0_24px_rgba(250,204,21,0.4)]"
                          : "border-zinc-800 bg-zinc-900/70 text-zinc-400 hover:border-zinc-600"
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
              inputMode="decimal"
              value={estimatedHours || ""}
              onChange={(e) =>
                handleNumericChange(e.target.value, setEstimatedHours)
              }
              placeholder="3"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setHouseWash((v) => !v)}
              className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                houseWash
                  ? "border-emerald-400/80 bg-emerald-500/20 text-emerald-100 shadow-[0_0_24px_rgba(16,185,129,0.45)]"
                  : "border-zinc-800 bg-zinc-900/70 text-zinc-400"
              }`}
            >
              <span>House wash</span>
              <span className="text-[11px] text-zinc-300">
                {formatCurrency(rates.houseWash)}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setRoofWash((v) => !v)}
              className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                roofWash
                  ? "border-sky-400/80 bg-sky-500/20 text-sky-100 shadow-[0_0_24px_rgba(56,189,248,0.45)]"
                  : "border-zinc-800 bg-zinc-900/70 text-zinc-400"
              }`}
            >
              <span>Roof wash</span>
              <span className="text-[11px] text-zinc-300">
                {formatCurrency(rates.roofWash)}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setWallsExtras((v) => !v)}
              className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                wallsExtras
                  ? "border-fuchsia-400/80 bg-fuchsia-500/20 text-fuchsia-100 shadow-[0_0_24px_rgba(217,70,239,0.45)]"
                  : "border-zinc-800 bg-zinc-900/70 text-zinc-400"
              }`}
            >
              <span>Walls / extras</span>
              <span className="text-[11px] text-zinc-300">
                {formatCurrency(rates.wallsExtras)}
              </span>
            </button>
          </div>
        </Panel>

        <div className="space-y-3 rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-900/70 via-fuchsia-900/60 to-black p-4 text-sm shadow-[0_0_45px_rgba(147,51,234,0.6)]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-purple-100/80">
              Quote bands
            </p>
            <p className="text-[11px] text-purple-100/80">
              Drag numbers up &amp; down with confidence.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-purple-100/70">
                Low
              </p>
              <p className="mt-1 text-lg font-semibold text-zinc-50">
                {formatCurrency(totals.low)}
              </p>
              <p className="mt-1 text-[11px] text-purple-100/70">
                For softer / repeat clients.
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200/80">
                Recommended
              </p>
              <p className="mt-1 text-lg font-semibold text-amber-100">
                {formatCurrency(totals.recommended)}
              </p>
              <p className="mt-1 text-[11px] text-amber-100/80">
                What you should normally lead with.
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-purple-100/70">
                High
              </p>
              <p className="mt-1 text-lg font-semibold text-zinc-50">
                {formatCurrency(totals.high)}
              </p>
              <p className="mt-1 text-[11px] text-purple-100/70">
                For hard access, heavy stain, rush jobs.
              </p>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-purple-200/30 bg-black/40 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-purple-100/80">
                Revenue / hour
              </p>
              <p className="mt-1 text-base font-semibold text-purple-100">
                {totals.revenuePerHour > 0
                  ? formatCurrency(totals.revenuePerHour)
                  : "-"}
              </p>
            </div>
            <div className="rounded-xl border border-purple-200/30 bg-black/40 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-purple-100/80">
                Chem mix helper
              </p>
              <p className="mt-1 text-[11px] text-purple-100/80">
                {chemicalMixHint}
              </p>
            </div>
          </div>
        </div>

        <Panel className="space-y-3">
          <TextAreaField
            label="Job notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Access, water, nearby cars, power, gutters, special requests, upsell ideas&hellip;"
          />
        </Panel>

        <div className="space-y-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-400/80 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-4 py-3 text-sm font-semibold text-zinc-950 shadow-[0_0_45px_rgba(250,204,21,0.6)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving quote..." : "Save quote to list"}
          </button>
          {savedBanner && (
            <p className="text-xs text-amber-300">{savedBanner}</p>
          )}
        </div>

        {showMeasureModal && (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/80 px-3 pb-6 pt-16 sm:items-center sm:px-4">
            <div className="w-full max-w-3xl rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 p-4 shadow-[0_0_60px_rgba(0,0,0,0.9)] sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                    Driveway measurement
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-100">
                    Draw a polygon around the driveway to estimate m².
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMeasureModal(false)}
                  className="rounded-full border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-100"
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

