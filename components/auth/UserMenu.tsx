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
        className="btn-ghost flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold hover:border-[var(--brand-border-accent)] hover:text-[var(--brand-gold-light)]"
      >
        {email}
      </button>
      {open && (
        <div className="surface-overlay absolute right-0 top-full mt-2 w-44 rounded-xl py-2 text-sm text-[var(--text-primary)]">
          <button
            type="button"
            onClick={async () => {
              setOpen(false);
              await onLogout();
            }}
            className="w-full px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.2em] text-[var(--semantic-error)] transition-colors hover:bg-[var(--brand-surface-overlay)]"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
