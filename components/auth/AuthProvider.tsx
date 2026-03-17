"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { supabaseClient } from "../../lib/supabaseClient";
import { bootstrapWorkspace } from "../../lib/bootstrapWorkspace";

interface AuthContextValue {
  isLoading: boolean;
  userId: string | null;
  email: string | null;
  businessId: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const protectedPaths = ["/", "/dashboard", "/quotes", "/clients", "/settings"];

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("AuthProvider missing");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { data } = await supabaseClient.auth.getSession();
      if (isMounted) {
        setSession(data.session);
        setIsLoading(false);
      }
      if (data.session?.user) {
        const { businessId } = await bootstrapWorkspace(
          data.session.user.id,
          data.session.user.email ?? null,
        );
        setBusinessId(businessId);
      }
    })();

    const { data: listener } =
      supabaseClient.auth.onAuthStateChange(async (_event, sess) => {
        if (_event === "SIGNED_OUT") {
          setSession(null);
          setBusinessId(null);
          router.replace("/login");
          return;
        }

        setSession(sess);
        if (sess?.user) {
          try {
            const { businessId } = await bootstrapWorkspace(
              sess.user.id,
              sess.user.email ?? null,
            );
            setBusinessId(businessId);
          } catch (error) {
            console.error("Workspace bootstrap failed", error);
          }
        }
      });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (pathname?.startsWith("/login")) return;
    if (!session?.user) {
      router.replace("/login");
    }
  }, [isLoading, pathname, router, session]);

  const signOut = useCallback(async () => {
    await supabaseClient.auth.signOut();
    setSession(null);
    setBusinessId(null);
    router.replace("/login");
  }, [router]);

  const value = useMemo(
    () => ({
      isLoading,
      userId: session?.user?.id ?? null,
      email: session?.user?.email ?? null,
      businessId,
      signOut,
    }),
    [isLoading, session, businessId, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
