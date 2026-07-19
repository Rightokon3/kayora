import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  hasValidAdminSession,
  clearAdminSession,
  getStoredAdminUser,
} from "../services/adminApi";
import type { AdminRole } from "../types/adminRoles"; // adjust path to wherever you place adminRoles.ts

/* ============================================================
   ADMIN AUTH CONTEXT
   ------------------------------------------------------------
   Mirrors DriverAuthContext exactly, and for the same reason:
   a route guard that only checks storage once on mount (instead
   of reading from a context that persists across the whole admin
   route tree) goes stale the instant a login succeeds without a
   full remount — same login<->dashboard redirect-loop bug already
   fixed once on the driver side. login.tsx should call signIn()
   directly the moment AdminAuth.login() succeeds — no re-reading
   storage, no stale cache, no loop.
============================================================ */

type AuthStatus = "checking" | "authed" | "guest";

interface AdminUser {
  employeeId: string;
  email: string;
  name: string;
  role: AdminRole;
  profilePicture: string | null;
}

interface AdminAuthContextValue {
  status: AuthStatus;
  admin: AdminUser | null;
  signIn: (user: AdminUser) => void;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    (async () => {
      const valid = await hasValidAdminSession();
      if (!valid) {
        await clearAdminSession();
        setStatus("guest");
        return;
      }
      const storedUser = await getStoredAdminUser();
      setAdmin(storedUser);
      setStatus("authed");
    })();
  }, []);

  const signIn = useCallback((user: AdminUser) => {
    // Called synchronously right after saveAdminSession() succeeds at
    // login — no storage re-read needed, we already know it's valid
    // because we just wrote it.
    setAdmin(user);
    setStatus("authed");
  }, []);

  const signOut = useCallback(async () => {
    await clearAdminSession();
    setAdmin(null);
    setStatus("guest");
  }, []);

  const value = useMemo(() => ({ status, admin, signIn, signOut }), [status, admin, signIn, signOut]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  return ctx;
}