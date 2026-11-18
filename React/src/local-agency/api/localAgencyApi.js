import { apiRequest } from "../../landing/api/client.js";

export const localAgencyApi = {
  getShipments: (agencyId) => apiRequest(`/agency/${agencyId}/shipments`),
  getInbound: (agencyId) => apiRequest(`/agency/${agencyId}/inbound`),
  getAgents: (agencyId) => apiRequest(`/agency/${agencyId}/agents`),
  assignAgent: (agencyId, body) =>
    apiRequest(`/agency/${agencyId}/assignAgent`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  addAgent: (agencyId, body) =>
    apiRequest(`/agency/${agencyId}/agents`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateAgent: (agencyId, agentId, body) =>
    apiRequest(`/agency/${agencyId}/agents/${agentId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteAgent: (agencyId, agentId) =>
    apiRequest(`/agency/${agencyId}/agents/${agentId}`, {
      method: "DELETE",
    }),
  getScanHistory: (agencyId) => apiRequest(`/agency/${agencyId}/scanHistory`),
  inscan: (agencyId, trackingId) =>
    apiRequest(`/agency/${agencyId}/inscan`, {
      method: "POST",
      body: JSON.stringify({ trackingId }),
    }),
  outscan: (agencyId, trackingId) =>
    apiRequest(`/agency/${agencyId}/outscan`, {
      method: "POST",
      body: JSON.stringify({ trackingId }),
    }),
  getRto: (agencyId) => apiRequest(`/agency/${agencyId}/rto`),
  initiateRto: (agencyId, body) =>
    apiRequest(`/agency/${agencyId}/rto`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getDeliveries: (agencyId) => apiRequest(`/agency/${agencyId}/deliveries`),
  confirmDelivery: (agencyId, trackingId) =>
    apiRequest(`/agency/${agencyId}/deliveries/${trackingId}/deliver`, {
      method: "POST",
    }),
  recordDeliveryAttempt: (agencyId, trackingId, body) =>
    apiRequest(`/agency/${agencyId}/deliveries/${trackingId}/attempt`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getTickets: (agencyId) => apiRequest(`/tickets/agency/${agencyId}`),
  getTracking: (trackingId) => apiRequest(`/track/${trackingId}`),
  resolveTicket: (ticketId) =>
    apiRequest(`/tickets/${ticketId}/resolve`, { method: "POST" }),
  escalateTicket: (ticketId, body) =>
    apiRequest(`/tickets/${ticketId}/escalate`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  updateTicketStatus: (ticketId, status) =>
    apiRequest(`/tickets/${ticketId}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),
  updateProfile: (agencyId, body) =>
    apiRequest(`/auth/profile/${agencyId}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updatePassword: (agencyId, body) =>
    apiRequest(`/auth/password/${agencyId}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
