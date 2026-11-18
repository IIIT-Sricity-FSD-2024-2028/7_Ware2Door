import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client.js";
import { Layout } from "../components/Layout.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";
import { AnalyticsPage } from "../pages/AnalyticsPage.jsx";
import { EscalationsPage } from "../pages/EscalationsPage.jsx";
import { NodesPage } from "../pages/NodesPage.jsx";
import { ThirdPartyPartnersPage } from "../pages/ThirdPartyPartnersPage.jsx";

const EMPTY_PERFORMANCE = { warehouses: [], hubs: [], agencies: [] };

const endpoints = {
  nodes: { path: "/superuser/nodes", key: "nodes" },
  analytics: { path: "/superuser/node-performance", key: "performance" },
  escalations: { path: "/superuser/escalations", key: "escalations" },
  partners: { path: "/superuser/third-parties", key: "partners" },
};

function getList(data, key) {
  if (Array.isArray(data)) return data;
  return data?.[key] || [];
}

function AppBody() {
  const { isAuthenticated, session } = useAuth();
  if (!isAuthenticated || session?.role !== "SUPER_USER") return null;
  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const { logout, session } = useAuth();
  const [section, setSection] = useState("nodes");
  const [nodes, setNodes] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [partners, setPartners] = useState([]);
  const [performance, setPerformance] = useState(EMPTY_PERFORMANCE);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (name = section) => {
      const endpoint = endpoints[name];
      if (!endpoint) return;

      setLoading(true);
      setError("");
      try {
        const data = await apiRequest(endpoint.path, { method: "GET" });
        if (name === "analytics") {
          setPerformance(data || EMPTY_PERFORMANCE);
        } else {
          const items = getList(data, endpoint.key);
          if (name === "nodes") setNodes(items);
          if (name === "escalations") setEscalations(items);
          if (name === "partners") setPartners(items);
        }
      } catch (requestError) {
        setError(requestError.message || "Unable to load data.");
      } finally {
        setLoading(false);
      }
    },
    [section],
  );

  useEffect(() => {
    setQuery("");
    setType("");
    setStatus("");
    load(section);
  }, [load, section]);

  const filteredNodes = useMemo(
    () =>
      nodes.filter(
        (node) =>
          (!query ||
            `${node.name || ""} ${node.city || ""}`
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (!type || node.type === type) &&
          (!status ||
            (status === "valid"
              ? node.isSubscriptionValid
              : !node.isSubscriptionValid)),
      ),
    [nodes, query, type, status],
  );

  const filteredEscalations = useMemo(
    () =>
      escalations.filter(
        (ticket) =>
          (!query ||
            `${ticket.ticketId || ""} ${ticket.trackingId || ""}`
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (!status || ticket.escalationStatus === status) &&
          (!type || ticket.priority === type),
      ),
    [escalations, query, type, status],
  );

  const filteredPartners = useMemo(
    () =>
      partners.filter(
        (partner) =>
          (!query ||
            (partner.name || "").toLowerCase().includes(query.toLowerCase())) &&
          (!status ||
            (status === "active" ? partner.isActive : !partner.isActive)),
      ),
    [partners, query, status],
  );

  let page;
  if (section === "analytics") {
    page = (
      <AnalyticsPage
        data={performance}
        error={error}
        loading={loading}
        onRefresh={() => load("analytics")}
      />
    );
  } else if (section === "escalations") {
    page = (
      <EscalationsPage
        data={escalations}
        filteredData={filteredEscalations}
        error={error}
        loading={loading}
        query={query}
        onQueryChange={setQuery}
        status={status}
        onStatusChange={setStatus}
        priority={type}
        onPriorityChange={setType}
        onRefresh={() => load("escalations")}
      />
    );
  } else if (section === "partners") {
    page = (
      <ThirdPartyPartnersPage
        data={partners}
        filteredData={filteredPartners}
        error={error}
        loading={loading}
        query={query}
        onQueryChange={setQuery}
        status={status}
        onStatusChange={setStatus}
        onRefresh={() => load("partners")}
      />
    );
  } else {
    page = (
      <NodesPage
        data={nodes}
        filteredData={filteredNodes}
        error={error}
        loading={loading}
        query={query}
        onQueryChange={setQuery}
        type={type}
        onTypeChange={setType}
        status={status}
        onStatusChange={setStatus}
        onRefresh={() => load("nodes")}
      />
    );
  }

  return (
    <Layout
      section={section}
      setSection={setSection}
      onLogout={logout}
      session={session}
    >
      {page}
    </Layout>
  );
}

export function App() {
  return <AppBody />;
}
