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
    <div className="flex min-h-screen flex-col bg-black text-zinc-100">
      <header className="border-b border-zinc-800/80 bg-black">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400/90">
              No Pressure Pro
            </p>
            <p className="mt-0.5 text-sm font-medium text-zinc-200">
              Exterior Business HQ
            </p>
          </div>
          <div className="rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-[3px] text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
            V1
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-20 pt-5">
        {children}
      </main>

      <nav className="sticky bottom-0 border-t border-zinc-800/80 bg-black/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-0.5 px-1.5 py-1.5">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center rounded-xl px-1 py-1.5 text-[10px] font-semibold tracking-wide transition-colors ${
                  active
                    ? "bg-amber-500/10 text-amber-400"
                    : "text-zinc-500 hover:text-zinc-200"
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
