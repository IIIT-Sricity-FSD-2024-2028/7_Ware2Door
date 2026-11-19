import { apiRequest } from "../../../store/api/apiClient.js";

export const transitHubApi = {
  getInventory: (hubId, signal) =>
    apiRequest(`/hub/${hubId}/inventory`, { signal }),
  getInbound: (hubId, signal) =>
    apiRequest(`/hub/${hubId}/inbound`, { signal }),
  getOutbound: (hubId, signal) =>
    apiRequest(`/hub/${hubId}/outbound`, { signal }),
  getScanHistory: (hubId, signal) =>
    apiRequest(`/hub/${hubId}/scanHistory`, { signal }),
  getCapacity: (hubId, signal) =>
    apiRequest(`/hub/${hubId}/capacity`, { signal }),
  getAgencies: (signal) => apiRequest("/system/agencies", { signal }),
  inscan: (hubId, trackingId) =>
    apiRequest(`/hub/${encodeURIComponent(hubId)}/inscan`, {
      method: "POST",
      body: JSON.stringify({ trackingId }),
    }),
  outscan: (hubId, trackingId) =>
    apiRequest(`/hub/${encodeURIComponent(hubId)}/outscan`, {
      method: "POST",
      body: JSON.stringify({ trackingId }),
    }),
  updateProfile: (hubId, body) =>
    apiRequest(`/auth/profile/${hubId}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updatePassword: (hubId, body) =>
    apiRequest(`/auth/password/${hubId}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
