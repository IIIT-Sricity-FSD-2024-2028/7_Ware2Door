import { API_BASE } from "../../../config.js";

const SESSION_KEYS = ["session", "at_session", "su_session"];
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

async function readJson(response) {
  return response.json().catch(() => ({}));
}

function responseError(data, fallback, status) {
  const error = new Error(data.message || data.error || fallback);
  error.status = status;
  return error;
}

export function normalizeRole(role) {
  return roleAliases[role] || role;
}

export function isValidRole(role) {
  return validRoles.has(normalizeRole(role));
}

export function readStoredSession() {
  for (const key of SESSION_KEYS) {
    try {
      const stored = JSON.parse(sessionStorage.getItem(key) || "null");
      const role = normalizeRole(stored?.role);
      if (stored?.token && isValidRole(role)) return { ...stored, role };
    } catch {
      sessionStorage.removeItem(key);
    }
  }
  return null;
}

export function saveSession(session) {
  sessionStorage.setItem("session", JSON.stringify(session));
  sessionStorage.removeItem("at_session");
  sessionStorage.removeItem("su_session");
}

export function clearStoredSession() {
  SESSION_KEYS.forEach((key) => sessionStorage.removeItem(key));
}

export const authApi = {
  async validateSession(session) {
    const response = await fetch(`${API_BASE}/auth/session`, {
      headers: { Authorization: `Bearer ${session.token}` },
      credentials: "include",
    });
    const data = await readJson(response);
    if (!response.ok || data.status !== "success") {
      throw responseError(
        data,
        response.status === 401
          ? "Your session has expired. Please log in again."
          : "Unable to validate your session.",
        response.status,
      );
    }
    if (!isValidRole(data.role)) {
      throw new Error("This account does not have portal access.");
    }
    return {
      ...session,
      role: normalizeRole(data.role),
      user: { ...session.user, ...data.user },
    };
  },

  async login(email, password) {
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

    const data = await readJson(response);
    if (!response.ok || data.status !== "success" || !data.token) {
      throw responseError(
        data,
        `Unable to log in (${response.status}).`,
        response.status,
      );
    }
    const role = normalizeRole(data.role);
    if (!isValidRole(role)) {
      throw new Error(
        "The account has an unsupported role. Please contact support.",
      );
    }

    const session = {
      role,
      token: data.token,
      user: data.user,
      loginAt: new Date().toISOString(),
    };
    saveSession(session);
    return session;
  },

  async logout() {
    clearStoredSession();
    return fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  },

  async verifyEmail(email) {
    const response = await fetch(`${API_BASE}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await readJson(response);
    if (!response.ok) {
      throw responseError(data, "Email verification failed.", response.status);
    }
    return data;
  },

  async resetPassword({ email, otp, newPassword }) {
    const response = await fetch(`${API_BASE}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, newPassword }),
    });
    const data = await readJson(response);
    if (!response.ok) {
      throw responseError(data, "Failed to reset password.", response.status);
    }
    return data;
  },
};
