"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { NewAccount, SessionUser } from "@/lib/types";
import { ensureSeedData, findUserByCredentials, registerAccount } from "@/lib/firestoreRepo";

type Credentials = {
  email: string;
  pin: string;
};

type SessionContextValue = {
  user: SessionUser | null;
  loading: boolean;
  login: (credentials: Credentials) => Promise<boolean>;
  register: (account: NewAccount) => Promise<{ ok: boolean; reason?: string }>;
  logout: () => void;
};

const STORAGE_KEY = "zerorir_session";
const SEEDED_FLAG_KEY = "zerorir_seed_checked";

const SessionContext = createContext<SessionContextValue | null>(null);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as SessionUser;
    } catch {
      return null;
    }
  });
  const loading = false;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.localStorage.getItem(SEEDED_FLAG_KEY) === "1") {
      return;
    }

    const runSeedCheck = () => {
      void ensureSeedData()
        .then(() => {
          window.localStorage.setItem(SEEDED_FLAG_KEY, "1");
        })
        .catch(() => {
          // Firestore can fail before rules/config are ready; keep auth flow usable.
        });
    };

    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(runSeedCheck);
      return;
    }

    const timeout = window.setTimeout(runSeedCheck, 250);
    return () => window.clearTimeout(timeout);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      loading,
      login: async (credentials) => {
        const nextUser = await findUserByCredentials(credentials.email, credentials.pin);
        if (!nextUser) return false;

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
        setUser(nextUser);
        return true;
      },
      register: async (account) => {
        const result = await registerAccount(account);
        if (!result.ok || !result.user) {
          return { ok: false, reason: result.reason || "Could not create account." };
        }

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result.user));
        setUser(result.user);
        return { ok: true };
      },
      logout: () => {
        window.localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      },
    }),
    [loading, user]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useAppSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useAppSession must be used within AppProviders");
  return context;
}
