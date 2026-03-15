"use client";

import { useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { Panel } from "../../components/ui/Panel";
import { TextField } from "../../components/ui/FormField";
import { useLocalData } from "../../hooks/useLocalData";
import { formatCurrency } from "../../lib/format";
import type { Client } from "../../lib/types";

function EditClientModal({
  client,
  onSave,
  onClose,
}: {
  client: Client;
  onSave: (updated: Client) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone);
  const [address, setAddress] = useState(client.address ?? "");
  const [email, setEmail] = useState(client.email ?? "");
  const [clientType, setClientType] = useState(client.clientType);
  const [banner, setBanner] = useState<string | null>(null);

  const isDirty =
    name !== client.name ||
    phone !== client.phone ||
    address !== (client.address ?? "") ||
    email !== (client.email ?? "") ||
    clientType !== client.clientType;

  function handleClose() {
    if (isDirty) {
      const ok = window.confirm("Discard unsaved changes?");
      if (!ok) return;
    }
    onClose();
  }

  function handleSave() {
    if (!name.trim()) {
      setBanner("Client name is required.");
      return;
    }

    onSave({
      ...client,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim() || undefined,
      email: email.trim() || undefined,
      clientType,
    });
  }

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 pt-[12vh] pb-6 sm:px-6 sm:pt-[10vh] sm:pb-10">
      <div className="animate-fade-in-up flex max-h-[80vh] w-full max-w-xl flex-col rounded-2xl border border-[var(--brand-border)] bg-surface-raised shadow-2xl sm:max-w-2xl">
        {/* Header */}
        <div className="shrink-0 border-b border-[var(--brand-border)] px-5 pb-3.5 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Edit Client
              </p>
              <p className="mt-1 text-sm font-bold text-zinc-100">
                {client.name}
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

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Client name"
          />
          <TextField
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Mobile / landline"
          />
          <TextField
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street address or suburb"
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="client@example.com"
          />

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Client type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["Residential", "Commercial"] as const).map((type) => {
                const active = clientType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setClientType(type)}
                    className={`rounded-xl border px-3 py-2.5 text-center text-xs font-medium transition-all duration-200 ${
                      active
                        ? "border-gold/40 bg-gold/10 text-gold"
                        : "border-[var(--brand-border)] bg-surface text-zinc-400 hover:border-zinc-600 active:bg-zinc-800"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
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
    </div>
  );
}

export default function ClientsPage() {
  const { clients, updateClient } = useLocalData();
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const sorted = [...clients].sort(
    (a: Client, b: Client) => b.totalValue - a.totalValue,
  );

  function handleSaveClient(updated: Client) {
    updateClient(updated);
    setEditingClient(null);
  }

  return (
    <AppShell>
      <section className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
            Clients
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Every client from your saved quotes, with quick value at a glance.
          </p>
        </div>

        {sorted.length === 0 ? (
          <Panel className="border-dashed border-zinc-700/60">
            <p className="text-sm font-semibold text-zinc-200">
              No clients yet.
            </p>
            <p className="mt-1.5 text-xs text-zinc-500">
              When you save a quote with a new name and phone, No Pressure Pro
              will automatically create a client card here.
            </p>
          </Panel>
        ) : (
          <div className="space-y-3">
            {sorted.map((client) => (
              <Panel
                key={client.id}
                className="space-y-2.5 p-3.5 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-zinc-100">
                      {client.name}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {client.suburb} · {client.phone || "No phone"}
                    </p>
                    {(client.email || client.address) && (
                      <div className="mt-1 space-y-0.5">
                        {client.email && (
                          <p className="truncate text-[11px] text-zinc-500">
                            {client.email}
                          </p>
                        )}
                        {client.address && (
                          <p className="truncate text-[11px] text-zinc-500">
                            {client.address}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full border border-gold/25 bg-gold/[0.08] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
                      {client.clientType}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingClient(client)}
                      className="rounded-xl border border-[var(--brand-border)] bg-surface px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 transition-all duration-200 hover:border-zinc-500 hover:text-zinc-100 active:scale-[0.97]"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <p className="text-zinc-500">
                      Jobs:{" "}
                      <span className="font-semibold text-zinc-200">
                        {client.totalJobs}
                      </span>
                    </p>
                    <p className="text-zinc-500">
                      Total value:{" "}
                      <span className="font-semibold text-emerald-400">
                        {formatCurrency(client.totalValue)}
                      </span>
                    </p>
                  </div>
                  <p className="text-right text-[11px] text-zinc-500">
                    Avg job:{" "}
                    <span className="font-semibold text-zinc-200">
                      {client.totalJobs > 0
                        ? formatCurrency(
                            client.totalValue / client.totalJobs,
                          )
                        : "-"}
                    </span>
                  </p>
                </div>
              </Panel>
            ))}
          </div>
        )}
      </section>

      {editingClient && (
        <EditClientModal
          client={editingClient}
          onSave={handleSaveClient}
          onClose={() => setEditingClient(null)}
        />
      )}
    </AppShell>
  );
}
