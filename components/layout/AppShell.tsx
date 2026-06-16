"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode, CSSProperties } from "react";
import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { UserMenu } from "../auth/UserMenu";

const primaryNavItems = [
  { href: "/", label: "Home" },
  { href: "/quote", label: "Quote" },
  { href: "/quotes", label: "Saved" },
  { href: "/schedule", label: "Schedule" },
  { href: "/invoices", label: "Invoices" },
] as const;

const secondaryNavItems = [
  { href: "/gallery", label: "Gallery" },
  { href: "/clients", label: "Clients" },
  { href: "/revenue", label: "Revenue" },
  { href: "/settings", label: "Settings" },
] as const;

function isNavActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function SidebarLink({
  href,
  label,
  active,
  secondary = false,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  secondary?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        secondary ? "py-2 text-[13px]" : ""
      } ${
        active
          ? secondary
            ? "nav-active-secondary"
            : "nav-active-primary"
          : secondary
            ? "text-[var(--text-muted)] hover:bg-[var(--brand-surface-overlay)] hover:text-[var(--text-secondary)]"
            : "text-[var(--text-secondary)] hover:bg-[var(--brand-surface-overlay)] hover:text-[var(--text-primary)]"
      }`}
    >
      {active && (
        <span
          className={`absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full ${
            secondary ? "bg-brand-purple-light" : "bg-gold"
          }`}
        />
      )}
      <span className="pl-1">{label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { email, signOut } = useAuth();
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  const secondaryActive = secondaryNavItems.some((item) =>
    isNavActive(pathname, item.href),
  );

  const navStyle: CSSProperties = {
    paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4px)",
  };

  return (
    <div className="flex min-h-screen bg-background text-[var(--text-primary)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-52 flex-col border-r border-[var(--brand-border)] bg-[var(--brand-surface)] md:flex">
        <Link href="/" className="flex items-center gap-2.5 border-b border-[var(--brand-border)] px-4 py-4">
          <Image
            src="/branding/icon-512.png"
            alt="No Pressure Pro"
            width={32}
            height={32}
            className="rounded-full"
            priority
          />
          <Image
            src="/branding/wordmark-primary.png"
            alt="No Pressure"
            width={120}
            height={24}
            className="h-6 w-auto"
            priority
          />
        </Link>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          <p className="mb-1 px-3 label-muted">
            Main
          </p>
          {primaryNavItems.map((item) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={isNavActive(pathname, item.href)}
            />
          ))}

          <p className="mb-1 mt-4 px-3 label-muted">
            More
          </p>
          {secondaryNavItems.map((item) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={isNavActive(pathname, item.href)}
              secondary
            />
          ))}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col md:pl-52">
        <header className="border-b border-[var(--brand-border)] bg-[var(--brand-surface)] shadow-[var(--shadow-nav)]">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2.5 sm:py-3 md:max-w-5xl md:justify-end">
            <Link href="/" className="flex items-center gap-3 md:hidden">
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
            <div className="flex items-center gap-3">
              <div className="badge-gold rounded-full px-3 py-[3px] text-[10px] font-bold uppercase tracking-[0.2em]">
                V1
              </div>
              <UserMenu email={email} onLogout={signOut} />
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-24 pt-5 md:max-w-4xl md:pb-8 lg:max-w-5xl">
          <div className="animate-fade-in-up">{children}</div>
        </main>

        {mobileMoreOpen && (
          <div className="fixed inset-0 z-20 bg-black/50 md:hidden" aria-hidden>
            <button
              type="button"
              className="absolute inset-0"
              aria-label="Close menu"
              onClick={() => setMobileMoreOpen(false)}
            />
          </div>
        )}

        {mobileMoreOpen && (
          <div
            className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+4.25rem)] left-3 right-3 z-40 animate-fade-in-up surface-overlay rounded-2xl p-2 md:hidden"
            role="menu"
          >
            <p className="px-2 py-1 label-muted">
              More
            </p>
            {secondaryNavItems.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setMobileMoreOpen(false)}
                  className={`flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "nav-active-secondary"
                      : "text-[var(--text-secondary)] active:bg-[var(--brand-surface-overlay)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}

        <nav
          className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--brand-border)] bg-[var(--brand-surface)]/95 shadow-[var(--shadow-nav)] backdrop-blur-md md:hidden"
          style={navStyle}
        >
          <div className="mx-auto flex max-w-3xl items-stretch justify-between px-1 py-1.5">
            {primaryNavItems.map((item) => {
              const active = isNavActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex flex-1 flex-col items-center justify-center rounded-xl px-1 py-2.5 text-[10px] font-semibold tracking-wide transition-all duration-200 ${
                    active
                      ? "nav-active-primary"
                      : "text-[var(--text-muted)] active:bg-[var(--brand-surface-overlay)] active:text-[var(--text-secondary)]"
                  }`}
                >
                  {active && (
                    <span className="absolute left-1/2 top-0 h-[2px] w-5 -translate-x-1/2 rounded-full bg-gold" />
                  )}
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setMobileMoreOpen((open) => !open)}
              className={`relative flex flex-1 flex-col items-center justify-center rounded-xl px-1 py-2.5 text-[10px] font-semibold tracking-wide transition-all duration-200 ${
                secondaryActive || mobileMoreOpen
                  ? "nav-active-secondary"
                  : "text-[var(--text-muted)] active:bg-[var(--brand-surface-overlay)] active:text-[var(--text-secondary)]"
              }`}
              aria-expanded={mobileMoreOpen}
              aria-haspopup="menu"
            >
              {(secondaryActive || mobileMoreOpen) && (
                <span className="absolute left-1/2 top-0 h-[2px] w-5 -translate-x-1/2 rounded-full bg-brand-purple-light" />
              )}
              <span>More</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
