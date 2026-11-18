import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { API_BASE } from "../config.js";

const AuthContext = createContext(undefined);
const validRoles = new Set([
  "WAREHOUSE",
  "TRANSIT_HUB",
  "LOCAL_AGENCY",
  "ADMIN_TEAMS",
  "SUPER_USER",
]);
const roleAliases = {
  WareHouse: "WAREHOUSE",
  TransitHub: "TRANSIT_HUB",
  LocalAgency: "LOCAL_AGENCY",
  SUPERUSER: "SUPER_USER",
};

function readSession() {
  for (const key of ["session", "at_session", "su_session"]) {
    try {
      const stored = JSON.parse(localStorage.getItem(key) || "null");
      const role = roleAliases[stored?.role] || stored?.role;
      if (stored?.token && validRoles.has(role)) return { ...stored, role };
    } catch {
      localStorage.removeItem(key);
    }
  }
  return null;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const clearSession = useCallback(() => {
    localStorage.removeItem("session");
    localStorage.removeItem("at_session");
    localStorage.removeItem("su_session");
    setSession(null);
  }, []);

  const validateSession = useCallback(async () => {
    const stored = readSession();
    if (!stored) {
      clearSession();
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/session`, {
        headers: { Authorization: `Bearer ${stored.token}` },
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.status !== "success") {
        clearSession();
        setAuthError(
          response.status === 401
            ? "Your session has expired. Please log in again."
            : data.message || "Unable to validate your session.",
        );
        return;
      }
      if (!validRoles.has(data.role)) {
        clearSession();
        setAuthError("This account does not have portal access.");
        return;
      }

      const next = {
        ...stored,
        role: data.role,
        user: { ...stored.user, ...data.user },
      };
      localStorage.setItem("session", JSON.stringify(next));
      localStorage.removeItem("at_session");
      localStorage.removeItem("su_session");
      setSession(next);
      setAuthError("");
    } catch {
      clearSession();
      setAuthError("Unable to verify your session. Please log in again.");
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    void validateSession();

    function handlePageShow(event) {
      if (event.persisted) void validateSession();
    }

    function handleStorage(event) {
      if (
        event.key === null ||
        ["session", "at_session", "su_session"].includes(event.key)
      ) {
        void validateSession();
      }
    }

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("storage", handleStorage);
    };
  }, [validateSession]);

  async function login(email, password) {
    let response;
    try {
      response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(
          "Unable to connect to the server. Please check that the backend is running and try again.",
        );
      }
      throw error;
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.status !== "success" || !data.token) {
      throw new Error(data.message || `Unable to log in (${response.status}).`);
    }
    if (!validRoles.has(data.role)) {
      throw new Error(
        "The account has an unsupported role. Please contact support.",
      );
    }

    const next = {
      role: data.role,
      token: data.token,
      user: data.user,
      loginAt: new Date().toISOString(),
    };
    localStorage.setItem("session", JSON.stringify(next));
    localStorage.removeItem("at_session");
    localStorage.removeItem("su_session");
    setSession(next);
    setAuthError("");
  }

  async function logout() {
    clearSession();
    setAuthError("");
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}
  }

  const value = useMemo(
    () => ({
      session,
      role: session?.role,
      isAuthenticated: Boolean(session?.token && validRoles.has(session.role)),
      isLoading,
      authError,
      login,
      logout,
    }),
    [authError, isLoading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
