import { API_BASE } from "../../config.js";

export { API_BASE };

function getStoredSession() {
  for (const storage of [sessionStorage, localStorage]) {
    try {
      const session = JSON.parse(storage.getItem("session") || "null");
      if (session?.token) return session;
    } catch {
      continue;
    }
  }
  return null;
}

export async function apiRequest(path, options = {}) {
  const session = getStoredSession();
  const isForm =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(options.headers || {}),
    },
    credentials: "include",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}
