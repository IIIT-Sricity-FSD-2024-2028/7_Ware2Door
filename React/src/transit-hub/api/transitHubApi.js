import { apiRequest } from "../../landing/api/client.js";

export const transitHubApi = {
  getInventory: (hubId) => apiRequest(`/hub/${hubId}/inventory`),
  getInbound: (hubId) => apiRequest(`/hub/${hubId}/inbound`),
  getOutbound: (hubId) => apiRequest(`/hub/${hubId}/outbound`),
  getScanHistory: (hubId) => apiRequest(`/hub/${hubId}/scanHistory`),
  getCapacity: (hubId) => apiRequest(`/hub/${hubId}/capacity`),
  getAgencies: () => apiRequest("/system/agencies"),
  inscan: (hubId, trackingId) =>
    apiRequest(`/hub/${hubId}/inscan`, {
      method: "POST",
      body: JSON.stringify({ trackingId }),
    }),
  outscan: (hubId, trackingId) =>
    apiRequest(`/hub/${hubId}/outscan`, {
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
