"use client";

import { useState } from "react";

interface UserMenuProps {
  email: string | null;
  onLogout: () => Promise<void>;
}

export function UserMenu({ email, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);

  if (!email) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-[var(--brand-border)] bg-surface px-3 py-1 text-xs font-semibold text-zinc-200 transition-all duration-200 hover:border-gold/40 hover:text-gold"
      >
        {email}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-[var(--brand-border)] bg-surface-raised py-2 text-sm text-zinc-100 shadow-lg">
          <button
            type="button"
            onClick={async () => {
              setOpen(false);
              await onLogout();
            }}
            className="w-full px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.2em] text-rose-400 transition-colors hover:bg-zinc-800"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
