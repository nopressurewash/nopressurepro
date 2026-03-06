"use client";

import { AppShell } from "../../components/layout/AppShell";
import { Panel } from "../../components/ui/Panel";
import { useLocalData } from "../../hooks/useLocalData";
import { formatCurrency } from "../../lib/format";
import { Client } from "../../lib/types";

export default function ClientsPage() {
  const { clients } = useLocalData();

  const sorted = [...clients].sort(
    (a: Client, b: Client) => b.totalValue - a.totalValue,
  );

  return (
    <AppShell>
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Clients
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Every client created from your saved quotes, with quick value at a
            glance.
          </p>
        </div>

        {sorted.length === 0 ? (
          <Panel className="border-dashed">
            <p className="text-sm font-medium text-zinc-100">
              No clients yet.
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              When you save a quote with a new name and phone, No Pressure Pro
              will automatically create a client card here.
            </p>
          </Panel>
        ) : (
          <div className="space-y-3">
            {sorted.map((client) => (
              <Panel
                key={client.id}
                className="space-y-2 p-3.5 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-semibold text-zinc-50">
                      {client.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {client.suburb} · {client.phone || "No phone"}
                    </p>
                  </div>
                  <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                    {client.clientType}
                  </span>
                </div>

                <div className="flex items-end justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <p className="text-zinc-400">
                      Jobs:{" "}
                      <span className="font-medium text-zinc-100">
                        {client.totalJobs}
                      </span>
                    </p>
                    <p className="text-zinc-400">
                      Total value:{" "}
                      <span className="font-medium text-emerald-300">
                        {formatCurrency(client.totalValue)}
                      </span>
                    </p>
                  </div>
                  <p className="text-right text-[11px] text-zinc-500">
                    Avg job:{" "}
                    <span className="font-medium text-zinc-100">
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
    </AppShell>
  );
}

