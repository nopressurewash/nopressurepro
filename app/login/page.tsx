"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { getAuthRedirectUrl } from "../../lib/authSiteUrl";
import {
  markPasswordRecoveryPending,
  urlIndicatesRecovery,
} from "../../lib/passwordRecovery";
import { supabaseClient } from "../../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const resetPasswordRedirect = useMemo(
    () => getAuthRedirectUrl("/login/reset-password"),
    [],
  );

  useEffect(() => {
    let isMounted = true;

    if (typeof window !== "undefined") {
      if (urlIndicatesRecovery()) {
        const suffix = `${window.location.search}${window.location.hash}`;
        router.replace(`/login/reset-password${suffix}`);
        return;
      }
    }

    supabaseClient.auth.getSession().then(({ data }) => {
      if (isMounted && data.session) {
        router.replace("/dashboard");
      }
    });

    const { data: listener } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          markPasswordRecoveryPending();
          router.replace("/login/reset-password");
          return;
        }

        if (session?.user) {
          router.replace("/dashboard");
        }
      },
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-[var(--brand-border)] bg-surface-raised p-6 shadow-2xl">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">No Pressure Pro</h1>
          <p className="text-sm text-zinc-500">
            Sign in or create your account to continue.
          </p>
        </div>
        <Auth
          supabaseClient={supabaseClient}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          view="sign_in"
          redirectTo={resetPasswordRedirect}
          localization={{
            variables: {
              sign_in: {
                button_label: "Sign in / Sign up with email",
              },
              forgotten_password: {
                link_text: "Forgot your password?",
                button_label: "Send reset link",
                loading_button_label: "Sending reset link…",
                confirmation_text:
                  "Check your email for a password reset link. Open it on the same phone or device you use for No Pressure Pro.",
              },
            },
          }}
        />
        <p className="text-center text-xs text-zinc-500">
          Reset link not working?{" "}
          <Link
            href="/login/reset-password"
            className="text-gold-light hover:underline"
          >
            Open reset page
          </Link>
        </p>
      </div>
    </div>
  );
}
