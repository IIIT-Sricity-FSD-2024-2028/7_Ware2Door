import { apiRequest as requestApi } from "../../../store/api/apiClient.js";

async function apiRequest(path, signal) {
  const data = await requestApi(path, { signal });
  if (data?.error || data?.success === false) {
    throw new Error(data.error || data.message || "Request failed");
  }
  return data;
}

const endpoints = {
  nodes: { path: "/superuser/nodes", key: "nodes" },
  analytics: { path: "/superuser/node-performance", key: "performance" },
  escalations: { path: "/superuser/escalations", key: "escalations" },
  partners: { path: "/superuser/third-parties", key: "partners" },
};

function getList(data, key) {
  if (Array.isArray(data)) return data;
  return data?.[key] || data?.data || [];
}

export async function fetchSuperAdminSection(section, signal) {
  const endpoint = endpoints[section];
  if (!endpoint) throw new Error(`Unknown Super Admin section: ${section}`);
  const data = await apiRequest(endpoint.path, signal);
  if (section === "analytics") {
    return {
      performance: data || { warehouses: [], hubs: [], agencies: [] },
    };
  }
  return { [endpoint.key]: getList(data, endpoint.key) };
}
