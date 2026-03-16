"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { supabaseClient } from "../../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    supabaseClient.auth.getSession().then(({ data }) => {
      if (isMounted && data.session) {
        router.replace("/dashboard");
      }
    });

    const { data: listener } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
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
          localization={{
            variables: {
              sign_in: {
                button_label: "Sign in / Sign up with email",
              },
            },
          }}
        />
      </div>
    </div>
  );
}
