"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/quote", label: "Quick Quote" },
  { href: "/quotes", label: "Saved" },
  { href: "/clients", label: "Clients" },
  { href: "/revenue", label: "Revenue" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-black via-[#05010d] to-black text-zinc-100">
      <header className="border-b border-zinc-800/60 bg-black/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              No Pressure Pro
            </p>
            <p className="text-sm font-medium text-zinc-100">
              Exterior Business HQ
            </p>
          </div>
          <div className="rounded-full bg-gradient-to-br from-yellow-400/90 via-amber-500 to-fuchsia-700 px-3 py-[2px] text-[11px] font-semibold uppercase tracking-[0.18em] text-black shadow-[0_0_35px_rgba(250,204,21,0.45)]">
            V1 · MVP
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-20 pt-4">
        {children}
      </main>

      <nav className="sticky bottom-0 border-t border-zinc-800/60 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-1 px-2 py-2">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center rounded-2xl px-2 py-1.5 text-[11px] font-medium transition ${
                  active
                    ? "bg-gradient-to-br from-yellow-400/20 via-amber-500/15 to-fuchsia-700/20 text-yellow-300 shadow-[0_0_25px_rgba(250,204,21,0.45)]"
                    : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-100"
                }`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

