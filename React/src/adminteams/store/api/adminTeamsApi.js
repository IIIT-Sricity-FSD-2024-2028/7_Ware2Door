import { apiRequest as requestApi } from "../../../store/api/apiClient.js";

async function apiRequest(path, options = {}) {
  const data = await requestApi(path, options);
  if (data?.error || data?.success === false) {
    throw new Error(data.error || data.message || "Request failed");
  }
  return data;
}

const list = (value, key) =>
  Array.isArray(value) ? value : value?.[key] || value?.data || [];

export async function fetchSectionData(section) {
  if (section === "subscriptions") {
    return { nodes: list(await apiRequest("/admin-teams/nodes"), "nodes") };
  }
  if (section === "fleet") {
    const [driverData, nodeData] = await Promise.all([
      apiRequest("/admin-teams/drivers"),
      apiRequest("/admin-teams/nodes"),
    ]);
    return {
      drivers: list(driverData, "drivers"),
      nodes: list(nodeData, "nodes"),
    };
  }
  if (section === "escalation") {
    return {
      escalations: list(
        await apiRequest("/admin-teams/escalations"),
        "escalations",
      ),
    };
  }
  if (section === "partners") {
    return {
      partners: list(await apiRequest("/admin-teams/partners"), "partners"),
    };
  }
  if (section === "analytics") {
    return {
      performance: await apiRequest("/admin-teams/node-performance"),
    };
  }
  throw new Error(`Unknown Admin Teams section: ${section}`);
}

function jsonRequest(path, method, body) {
  return apiRequest(path, { method, body: JSON.stringify(body) });
}

export const createPartnerApi = (partner) =>
  jsonRequest("/admin-teams/partners", "POST", partner);
export const updatePartnerTierApi = ({ id, tier }) =>
  jsonRequest(`/admin-teams/partners/${id}/tier`, "PUT", { tier });
export const updatePartnerStatusApi = ({ id, isActive }) =>
  jsonRequest(`/admin-teams/partners/${id}/status`, "PUT", { isActive });
export const deletePartnerApi = (id) =>
  jsonRequest(`/admin-teams/partners/${id}`, "DELETE", {});

export const createNodeApi = (node) =>
  jsonRequest("/admin-teams/nodes", "POST", node);
export const updateNodeSubscriptionApi = ({ id, endDate, monthlyRate }) =>
  jsonRequest(`/admin-teams/nodes/${id}/subscription`, "PUT", {
    endDate,
    monthlyRate,
  });
export const updateNodeStatusApi = ({ id, isActive }) =>
  jsonRequest(`/admin-teams/nodes/${id}/status`, "PUT", { isActive });
export function uploadNodeDocumentsApi(nodeId, files) {
  const body = new FormData();
  files.forEach((file) => body.append("files", file));
  return apiRequest(`/admin-teams/nodes/${nodeId}/legal-docs`, {
    method: "POST",
    body,
  });
}

export const createDriverApi = (driver) =>
  jsonRequest("/admin-teams/drivers", "POST", driver);
export const updateDriverApi = ({ id, driver }) =>
  jsonRequest(`/admin-teams/drivers/${id}`, "PUT", driver);
export const deleteDriverApi = (id) =>
  jsonRequest(`/admin-teams/drivers/${id}`, "DELETE", {});

export const updateEscalationApi = ({ id, escalation }) =>
  jsonRequest(`/admin-teams/escalations/${id}`, "PUT", escalation);
