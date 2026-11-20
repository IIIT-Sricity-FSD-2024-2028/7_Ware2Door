import { apiRequest } from "../../../store/api/apiClient.js";

export const warehouseApi = {
    getInventory: (warehouseId, signal) =>
        apiRequest(`/${warehouseId}/stockInventory`, { signal }),
    getPendingShipments: (warehouseId, signal) =>
        apiRequest(`/${warehouseId}/pendingShipments`, { signal }),
    getOutbound: (warehouseId, signal) =>
        apiRequest(`/${warehouseId}/outbound`, { signal }),
    getRto: (warehouseId, signal) =>
        apiRequest(`/rto?warehouseId=${warehouseId}`, { signal }),
    getPreAlert: (warehouseId, signal) =>
        apiRequest(`/${warehouseId}/preAlert`, { signal }),
    getHubs: (signal) => apiRequest("/system/hubs", { signal }),
    getAgencies: (signal) => apiRequest("/system/agencies", { signal }),
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
        apiRequest(
            `/${encodeURIComponent(warehouseId)}/pendingShipments/${encodeURIComponent(orderId)}`,
            {
                method: "DELETE",
            },
        ),
    warehouseInscan: (rtoId) =>
        apiRequest(`/rto/${encodeURIComponent(rtoId)}/warehouse-inscan`, {
            method: "POST",
        }),
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
