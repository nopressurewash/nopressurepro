"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "../../components/layout/AppShell";
import { Panel } from "../../components/ui/Panel";
import { useLocalData } from "../../hooks/useLocalData";
import { formatCurrency } from "../../lib/format";
import { findClientEmail, buildInvoiceMailtoHref } from "../../lib/mailto";
import { exportInvoicePdf } from "../../lib/pdf/exportInvoicePdf";
import {
  getInvoiceStatusClasses,
  getInvoiceStatusLabel,
  INVOICE_STATUS_OPTIONS,
} from "../../lib/invoiceStatus";
import type { Invoice, InvoiceStatus } from "../../lib/types";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const actionClass =
  "rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all duration-200 active:scale-[0.97]";

export default function InvoicesPage() {
  const { invoices, clients, updateInvoiceStatus, deleteInvoice } = useLocalData();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [emailWarning, setEmailWarning] = useState<string | null>(null);

  function handleDelete(inv: Invoice) {
    if (deletingId === inv.id) {
      deleteInvoice(inv.id);
      setDeletingId(null);
      return;
    }
    setDeletingId(inv.id);
    setTimeout(() => setDeletingId(null), 2000);
  }

  const sorted = [...invoices].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <AppShell>
      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
            Invoices
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Invoices created from saved quotes. Export or update status.
          </p>
        </div>

        {sorted.length === 0 ? (
          <Panel className="border-dashed border-zinc-700/60 py-8 text-center">
            <p className="text-base font-bold text-zinc-200">
              No invoices yet.
            </p>
            <p className="mx-auto mt-2 max-w-xs text-sm text-zinc-500">
              Convert a saved quote to an invoice from the Saved Quotes screen.
            </p>
            <Link
              href="/quotes"
              className="mt-4 inline-flex rounded-xl border border-gold/40 bg-gold/10 px-5 py-2.5 text-sm font-bold text-gold transition-all duration-200 hover:bg-gold/15 active:scale-[0.98]"
            >
              Go to Saved Quotes
            </Link>
          </Panel>
        ) : (
          <div className="space-y-3">
            {sorted.map((inv) => (
              <Panel key={inv.id} className="space-y-3 p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-zinc-100">
                      {inv.clientName}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {inv.invoiceNumber}
                      {inv.suburb ? ` · ${inv.suburb}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-base font-bold tabular-nums text-gold">
                      {formatCurrency(inv.amount)}
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ${getInvoiceStatusClasses(inv.status)}`}
                    >
                      {getInvoiceStatusLabel(inv.status)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                  <p>
                    Issue: {formatDate(inv.issueDate)} · Due:{" "}
                    {formatDate(inv.dueDate)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--brand-border)] pt-3">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-medium text-zinc-500">
                      Status
                    </label>
                    <select
                      value={inv.status}
                      onChange={(e) =>
                        updateInvoiceStatus(inv.id, e.target.value as InvoiceStatus)
                      }
                      className="rounded-lg border border-[var(--brand-border)] bg-surface px-2.5 py-1.5 text-[11px] text-zinc-200 outline-none transition-all duration-200 focus:border-gold/40 focus:ring-1 focus:ring-gold/15"
                    >
                      {INVOICE_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {getInvoiceStatusLabel(s)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => exportInvoicePdf(inv)}
                      className={`${actionClass} text-brand-purple-light hover:bg-brand-purple/10`}
                    >
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const email = findClientEmail(clients, inv.clientName, inv.phone);
                        if (!email) {
                          setEmailWarning("No email on file for this client. Add one in the Clients tab.");
                          setTimeout(() => setEmailWarning(null), 3000);
                          return;
                        }
                        window.location.href = buildInvoiceMailtoHref(inv, email);
                      }}
                      className={`${actionClass} text-gold hover:bg-gold/10`}
                    >
                      Email
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(inv)}
                      className={`${actionClass} text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400`}
                    >
                      {deletingId === inv.id ? "Confirm delete?" : "Delete"}
                    </button>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        )}
      </section>

      {emailWarning && (
        <div className="fixed left-1/2 top-16 z-50 -translate-x-1/2 animate-fade-in rounded-2xl border border-amber-500/30 bg-surface-raised px-5 py-3 text-xs font-semibold text-amber-300 shadow-lg">
          {emailWarning}
        </div>
      )}
    </AppShell>
  );
}
