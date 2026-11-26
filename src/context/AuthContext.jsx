import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { requestJson } from "../api/client.js";
import { ACCESS_CHANGED_EVENT, SESSION_EXPIRED_EVENT, clearSession, readSession, saveSession } from "../api/session.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession());
  const [checking, setChecking] = useState(() => Boolean(readSession()));
  const [notice, setNotice] = useState(null);

  const refreshUser = useCallback(async () => {
    const { data } = await requestJson("/api/auth/me");
    const current = readSession();
    if (!current) return null;
    const next = { ...current, user: data.user };
    saveSession(next);
    setSession(next);
    return data.user;
  }, []);

  useEffect(() => {
    if (!readSession()) return;
    refreshUser()
      .catch(() => undefined)
      .finally(() => setChecking(false));
  }, [refreshUser]);

  useEffect(() => {
    const onExpired = () => {
      setSession(null);
      setNotice("Your session has ended. Sign in again.");
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  useEffect(() => {
    const onAccessChanged = () => {
      refreshUser().catch(() => undefined);
    };
    window.addEventListener(ACCESS_CHANGED_EVENT, onAccessChanged);
    return () => window.removeEventListener(ACCESS_CHANGED_EVENT, onAccessChanged);
  }, [refreshUser]);

  useEffect(() => {
    if (!session) return undefined;
    const remaining = Date.parse(session.expires_at) - Date.now();
    const timer = window.setTimeout(() => {
      clearSession();
      setSession(null);
      setNotice("Your session has expired. Sign in again.");
    }, Math.max(0, Math.min(remaining, 2_147_000_000)));
    return () => window.clearTimeout(timer);
  }, [session]);

  const startSession = useCallback((data) => {
    const next = { token: data.token, expires_at: data.expires_at, user: data.user };
    saveSession(next);
    setNotice(null);
    setSession(next);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { data } = await requestJson("/api/auth/login", { method: "POST", body: { email, password }, auth: false });
      startSession(data);
    },
    [startSession]
  );

  const register = useCallback(
    async (name, email, password) => {
      const { data } = await requestJson("/api/auth/register", {
        method: "POST",
        body: { name, email, password },
        auth: false,
      });
      startSession(data);
    },
    [startSession]
  );

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    setNotice(null);
  }, []);

  const user = session?.user ?? null;
  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(session),
      isAdmin: user?.role === "admin",
      isApproved: user?.role === "admin" || user?.approval_status === "APPROVED",
      checking,
      notice,
      login,
      register,
      logout,
      refreshUser,
    }),
    [session, user, checking, notice, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
