"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getAuthRedirectUrl } from "../../../lib/authSiteUrl";
import {
  clearPasswordRecoveryPending,
  markPasswordRecoveryPending,
  readAuthUrlError,
  stripAuthParamsFromUrl,
  urlIndicatesRecovery,
} from "../../../lib/passwordRecovery";
import { supabaseClient } from "../../../lib/supabaseClient";
import type { AuthChangeEvent } from "@supabase/supabase-js";

type PageStatus = "loading" | "ready" | "error" | "success";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<PageStatus>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function initializeRecoverySession() {
      const urlError = readAuthUrlError();
      if (urlError) {
        if (!cancelled) {
          setMessage(urlError);
          setStatus("error");
        }
        stripAuthParamsFromUrl();
        return;
      }

      if (urlIndicatesRecovery()) {
        markPasswordRecoveryPending();
      }

      try {
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get("code");

        let {
          data: { session },
          error: sessionError,
        } = await supabaseClient.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session && code) {
          const { error: exchangeError } =
            await supabaseClient.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          ({
            data: { session },
            error: sessionError,
          } = await supabaseClient.auth.getSession());
          if (sessionError) throw sessionError;
        }

        if (code || urlIndicatesRecovery()) {
          markPasswordRecoveryPending();
          stripAuthParamsFromUrl();
        }

        if (!session) {
          if (!cancelled) {
            setMessage(
              "This reset link is invalid, expired, or was already used. Request a new password reset from the sign-in page.",
            );
            setStatus("error");
          }
          return;
        }

        if (!cancelled) {
          setStatus("ready");
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Could not verify your reset link.",
          );
          setStatus("error");
        }
      }
    }

    void initializeRecoverySession();

    const { data: listener } = supabaseClient.auth.onAuthStateChange(
      (event: AuthChangeEvent) => {
        if (event === "PASSWORD_RECOVERY") {
          markPasswordRecoveryPending();
          setStatus("ready");
          setMessage(null);
        }
      },
    );

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (password.length < 8) {
      setMessage("Use at least 8 characters for your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabaseClient.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    clearPasswordRecoveryPending();
    setStatus("success");
    setMessage("Password updated. Taking you to the app…");
    window.setTimeout(() => {
      router.replace("/dashboard");
    }, 900);
  }

  async function handleRequestNewLink() {
    const email = window.prompt(
      "Enter your account email to receive a new reset link:",
    );
    if (!email?.trim()) return;

    setSubmitting(true);
    setMessage(null);
    const { error } = await supabaseClient.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: getAuthRedirectUrl("/login/reset-password") },
    );
    setSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      "If an account exists for that email, a new reset link has been sent. Open it on this device.",
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-[var(--brand-border)] bg-surface-raised p-6 shadow-2xl">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Reset password</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Set a new password for your No Pressure Pro account.
          </p>
        </div>

        {status === "loading" && (
          <p className="text-sm text-zinc-400">Verifying your reset link…</p>
        )}

        {status === "ready" && (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label
                htmlFor="new-password"
                className="text-[11px] font-medium uppercase tracking-wide text-zinc-500"
              >
                New password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-all duration-200 focus:border-[var(--brand-border-accent)] focus:ring-1 focus:ring-[var(--brand-gold-glow)]"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="confirm-password"
                className="text-[11px] font-medium uppercase tracking-wide text-zinc-500"
              >
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-all duration-200 focus:border-[var(--brand-border-accent)] focus:ring-1 focus:ring-[var(--brand-gold-glow)]"
                minLength={8}
                required
              />
            </div>
            {message && (
              <p className="text-xs font-medium text-warning">{message}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full rounded-2xl px-4 py-3 text-sm font-bold active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save new password"}
            </button>
          </form>
        )}

        {status === "error" && (
          <div className="space-y-4">
            {message && (
              <div className="callout-warning rounded-2xl px-4 py-3 text-xs font-medium">
                {message}
              </div>
            )}
            <button
              type="button"
              onClick={() => void handleRequestNewLink()}
              disabled={submitting}
              className="btn-secondary w-full rounded-2xl px-4 py-3 text-sm font-semibold active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Email me a new reset link
            </button>
          </div>
        )}

        {status === "success" && message && (
          <p className="text-sm font-medium text-gold-light">{message}</p>
        )}

        <p className="text-center text-xs text-zinc-500">
          <Link href="/login" className="text-gold-light hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
