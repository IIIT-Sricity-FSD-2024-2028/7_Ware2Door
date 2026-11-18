import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext.jsx";
import useLocalAgencyData from "../hooks/useLocalAgencyData.js";
import Dashboard from "../pages/Dashboard.jsx";
import Shipments from "../pages/Shipments.jsx";
import ScanOperations from "../pages/ScanOperations.jsx";
import DeliveryAgents from "../pages/DeliveryAgents.jsx";
import RtoManagement from "../pages/RtoManagement.jsx";
import ShipmentDelivery from "../pages/ShipmentDelivery.jsx";
import SupportTickets from "../pages/SupportTickets.jsx";
import Settings from "../pages/Settings.jsx";
import LocalAgencyShell from "../components/LocalAgencyShell.jsx";
import { initials } from "../utils/helpers.js";

const titles = {
  dashboard: "Dashboard",
  shipments: "Shipments",
  scan: "Scan Operations",
  agents: "Delivery Agents",
  rto: "RTO Management",
  delivery: "Shipment Delivery",
  support: "Support Tickets",
  settings: "Settings",
};

export default function LocalAgencyApp() {
  const { session, logout } = useAuth();
  const user = session?.user || {};
  const agencyId = user.id;
  const [page, setPage] = useState("dashboard");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    document.body.classList.add("agency-body");
    return () => document.body.classList.remove("agency-body");
  }, []);

  const showToast = useCallback((msg, isError = false) => {
    setToast({ msg, isError });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const localAgencyData = useLocalAgencyData(agencyId, showToast, page);

  const navigate = (nextPage) => {
    setPage(nextPage);
  };

  return (
    <LocalAgencyShell
      activePage={page}
      headerTitle={titles[page]}
      onNavigate={navigate}
      user={user}
      initials={initials}
      onSettings={() => navigate("settings")}
      toast={toast}
    >
      {page === "dashboard" && (
        <Dashboard
          user={user}
          shipments={localAgencyData.shipments}
          agents={localAgencyData.agents}
          goTo={navigate}
        />
      )}
      {page === "shipments" && (
        <Shipments shipments={localAgencyData.shipments} />
      )}
      {page === "scan" && (
        <ScanOperations
          agencyId={agencyId}
          showToast={showToast}
          inbound={localAgencyData.inbound}
          agents={localAgencyData.agents}
          scanHistory={localAgencyData.scanHistory}
          loadShipments={localAgencyData.loadShipments}
          loadInbound={localAgencyData.loadInbound}
          loadAgents={localAgencyData.loadAgents}
          loadScanHistory={localAgencyData.loadScanHistory}
        />
      )}
      {page === "agents" && (
        <DeliveryAgents
          agencyId={agencyId}
          showToast={showToast}
          agents={localAgencyData.agents}
          loadAgents={localAgencyData.loadAgents}
        />
      )}
      {page === "rto" && (
        <RtoManagement
          agencyId={agencyId}
          showToast={showToast}
          rto={localAgencyData.rto}
          loadRto={localAgencyData.loadRto}
        />
      )}
      {page === "delivery" && (
        <ShipmentDelivery
          agencyId={agencyId}
          showToast={showToast}
          deliveries={localAgencyData.deliveries}
          loadDeliveries={localAgencyData.loadDeliveries}
          loadShipments={localAgencyData.loadShipments}
          loadRto={localAgencyData.loadRto}
          onNavigateRto={() => navigate("rto")}
        />
      )}
      {page === "support" && (
        <SupportTickets
          agencyId={agencyId}
          showToast={showToast}
          tickets={localAgencyData.tickets}
          setTickets={localAgencyData.setTickets}
          loadTickets={localAgencyData.loadTickets}
        />
      )}
      {page === "settings" && (
        <Settings
          user={user}
          agencyId={agencyId}
          logout={logout}
          showToast={showToast}
        />
      )}
    </LocalAgencyShell>
  );
}
