import { apiRequest } from "../../landing/api/client.js";
export const warehouseApi = {
  getInventory: (warehouseId) => apiRequest(`/${warehouseId}/stockInventory`),
  getPendingShipments: (warehouseId) =>
    apiRequest(`/${warehouseId}/pendingShipments`),
  getOutbound: (warehouseId) => apiRequest(`/${warehouseId}/outbound`),
  getRto: (warehouseId) => apiRequest(`/rto?warehouseId=${warehouseId}`),
  getPreAlert: (warehouseId) => apiRequest(`/${warehouseId}/preAlert`),
  getHubs: () => apiRequest("/system/hubs"),
  getAgencies: () => apiRequest("/system/agencies"),
  addStock: (warehouseId, body) =>
    apiRequest(`/${warehouseId}/stockAddition`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  dispatch: (warehouseId, body) =>
    apiRequest(`/${warehouseId}/dispatch`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  rejectShipment: (warehouseId, orderId) =>
    apiRequest(`/${warehouseId}/pendingShipments/${orderId}`, {
      method: "DELETE",
    }),
  warehouseInscan: (rtoId) =>
    apiRequest(`/rto/${rtoId}/warehouse-inscan`, { method: "POST" }),
  updateProfile: (warehouseId, body) =>
    apiRequest(`/auth/profile/${warehouseId}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updatePassword: (warehouseId, body) =>
    apiRequest(`/auth/password/${warehouseId}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
