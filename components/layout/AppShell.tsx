"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/quote", label: "Quote" },
  { href: "/quotes", label: "Saved" },
  { href: "/schedule", label: "Schedule" },
  { href: "/clients", label: "Clients" },
  { href: "/revenue", label: "Revenue" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-background text-zinc-100">
      <header className="border-b border-[var(--brand-border)] bg-[var(--brand-surface)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/branding/icon-512.png"
              alt="No Pressure Pro"
              width={36}
              height={36}
              className="rounded-full"
              priority
            />
            <div className="hidden sm:block">
              <Image
                src="/branding/wordmark-primary.png"
                alt="No Pressure"
                width={160}
                height={32}
                className="h-7 w-auto"
                priority
              />
            </div>
            <div className="sm:hidden">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
                No Pressure Pro
              </p>
              <p className="mt-0.5 text-[10px] font-medium text-zinc-500">
                Exterior Business HQ
              </p>
            </div>
          </Link>
          <div className="rounded-full border border-gold/30 bg-gold/[0.08] px-3 py-[3px] text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
            V1
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-24 pt-5">
        <div className="animate-fade-in-up">
          {children}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--brand-border)] bg-[var(--brand-surface)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-stretch justify-between px-1 py-1">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-1 flex-col items-center justify-center rounded-xl px-1 py-2.5 text-[10px] font-semibold tracking-wide transition-all duration-200 ${
                  active
                    ? "bg-gold/10 text-gold"
                    : "text-zinc-500 active:bg-zinc-800/50 active:text-zinc-300"
                }`}
              >
                {active && (
                  <span className="absolute left-1/2 top-0 h-[2px] w-5 -translate-x-1/2 rounded-full bg-gold" />
                )}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
