"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { Panel } from "../../components/ui/Panel";
import { RatesPanel } from "../../components/settings/RatesPanel";
import { useLocalData } from "../../hooks/useLocalData";

const BACKUP_KEY = "npp_last_backup_at";

interface BackupPayload {
  version: string;
  exportedAt: string;
  quotes: unknown;
  clients: unknown;
  rates: unknown;
}

function formatDateTime(value: string | null) {
  if (!value) return "No backup yet";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "No backup yet";
  return d.toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SettingsPage() {
  const { quotes, clients, rates, overwriteAll, updateRates, loaded } =
    useLocalData();
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(BACKUP_KEY);
    setLastBackup(stored);
  }, []);

  function handleExport() {
    if (!loaded) return;

    const payload: BackupPayload = {
      version: "npp-backup-v1",
      exportedAt: new Date().toISOString(),
      quotes,
      clients,
      rates,
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "nopressure_backup.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (typeof window !== "undefined") {
      const now = new Date().toISOString();
      window.localStorage.setItem(BACKUP_KEY, now);
      setLastBackup(now);
    }

    setMessage("Backup exported.");
    setTimeout(() => setMessage(null), 2500);
  }

  function triggerImport() {
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  }

  function handleImportChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const data = JSON.parse(text) as BackupPayload;

        if (
          !data ||
          typeof data !== "object" ||
          data.version !== "npp-backup-v1"
        ) {
          throw new Error("Invalid backup version.");
        }

        if (
          !Array.isArray(data.quotes) ||
          !Array.isArray(data.clients) ||
          typeof data.rates !== "object" ||
          data.rates === null
        ) {
          throw new Error("Backup file is missing required fields.");
        }

        overwriteAll({
          quotes: data.quotes as any,
          clients: data.clients as any,
          rates: data.rates as any,
        });

        setMessage("Backup imported successfully.");
      } catch (err) {
        setMessage(
          err instanceof Error
            ? err.message
            : "Could not import backup file.",
        );
      } finally {
        setImporting(false);
        setTimeout(() => setMessage(null), 3000);
      }
    };
    reader.onerror = () => {
      setImporting(false);
      setMessage("Failed to read backup file.");
      setTimeout(() => setMessage(null), 3000);
    };

    reader.readAsText(file, "utf-8");
  }

  return (
    <AppShell>
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Settings
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Backup, restore, and tune your pricing on this device.
          </p>
        </div>

        <Panel className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            Backup status
          </p>
          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Last backup
              </p>
              <p className="mt-1 text-xs text-zinc-200">
                {formatDateTime(lastBackup)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Total quotes
              </p>
              <p className="mt-1 text-base font-semibold text-amber-100">
                {quotes.length}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Total clients
              </p>
              <p className="mt-1 text-base font-semibold text-emerald-100">
                {clients.length}
              </p>
            </div>
          </div>
        </Panel>

        <Panel className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            Backup &amp; restore
          </p>
          <p className="text-xs text-zinc-400">
            Backups are stored as a JSON file on your device only. Restoring
            will overwrite current quotes, clients, and rates on this device.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleExport}
              disabled={!loaded}
              className="flex-1 rounded-2xl border border-amber-400/80 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-[0_0_30px_rgba(250,204,21,0.6)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Export backup
            </button>
            <button
              type="button"
              onClick={triggerImport}
              disabled={importing}
              className="flex-1 rounded-2xl border border-purple-500/60 bg-gradient-to-r from-purple-700 via-fuchsia-700 to-purple-900 px-4 py-2.5 text-sm font-semibold text-zinc-50 shadow-[0_0_35px_rgba(147,51,234,0.6)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {importing ? "Importing…" : "Import backup"}
            </button>
          </div>
          {message && (
            <p className="text-xs text-amber-200" role="status">
              {message}
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportChange}
          />
        </Panel>

        <RatesPanel rates={rates} onChange={updateRates} />
      </section>
    </AppShell>
  );
}


