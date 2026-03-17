"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  const bootstrapInFlightRef = useRef<Promise<void> | null>(null);
  const bootstrapUserIdRef = useRef<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const ensureWorkspace = useCallback(
    async (user: { id: string; email?: string | null }) => {
      if (
        bootstrapInFlightRef.current &&
        bootstrapUserIdRef.current === user.id
      ) {
        return bootstrapInFlightRef.current;
      }

      bootstrapUserIdRef.current = user.id;
      const task = (async () => {
        try {
          const { businessId } = await bootstrapWorkspace(
            user.id,
            user.email ?? null,
          );
          setBusinessId(businessId);
        } catch (error) {
          console.error("Workspace bootstrap failed", error);
        }
      })();

      bootstrapInFlightRef.current = task;
      await task;
      if (bootstrapInFlightRef.current === task) {
        bootstrapInFlightRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { data } = await supabaseClient.auth.getSession();
      if (!isMounted) return;

      setSession(data.session);

      if (data.session?.user) {
        await ensureWorkspace(data.session.user);
      }

      if (isMounted) {
        setIsLoading(false);
      }
    })();

    const { data: listener } =
      supabaseClient.auth.onAuthStateChange((_event, sess) => {
        if (_event === "SIGNED_OUT") {
          setSession(null);
          setBusinessId(null);
          bootstrapInFlightRef.current = null;
          bootstrapUserIdRef.current = null;
          router.replace("/login");
          return;
        }

        setSession(sess);
        if (sess?.user) {
          void ensureWorkspace(sess.user);
        }
      });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [ensureWorkspace, router]);

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
