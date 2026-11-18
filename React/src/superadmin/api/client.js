import { API_BASE } from "../../config.js";

export { API_BASE };

export async function apiRequest(path, options = {}) {
  const session = JSON.parse(localStorage.getItem("session") || "null");
  const requestOptions =
    typeof options === "string" ? { method: options } : options;
  const isForm = requestOptions.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    ...requestOptions,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(requestOptions.headers || {}),
    },
    credentials: "include",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}
