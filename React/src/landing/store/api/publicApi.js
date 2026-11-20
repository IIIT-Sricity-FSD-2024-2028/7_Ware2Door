import { apiRequest } from "../../../store/api/apiClient.js";

export const publicApi = {
  getTracking: (trackingId) =>
    apiRequest(`/track/${encodeURIComponent(trackingId)}?t=${Date.now()}`, {
      cache: "no-store",
    }),

  validateTrackingId: (trackingId) =>
    apiRequest(
      `/tickets/validate/${encodeURIComponent(trackingId)}?t=${Date.now()}`,
    ),

  raiseTicket: (body) =>
    apiRequest("/tickets/raise", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
