import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import {
  fetchAgencyAgents,
  fetchAgencyDeliveries,
  fetchAgencyInbound,
  fetchAgencyRto,
  fetchAgencyScanHistory,
  fetchAgencyShipments,
  fetchAgencyTickets,
} from "../store/actions/localAgencyActions.js";

export default function LocalAgencyApp() {
  const dispatch = useDispatch();
  const session = useSelector((state) => state.auth.session);
  const user = session?.user || {};
  const agencyId = user.id;
  const page = useSelector((state) => state.localAgency.ui.page);

  useEffect(() => {
    document.body.classList.add("agency-body");
    return () => document.body.classList.remove("agency-body");
  }, []);

  useEffect(() => {
    if (!agencyId) return undefined;
    const pageLoaders = {
      dashboard: [fetchAgencyShipments, fetchAgencyAgents],
      shipments: [fetchAgencyShipments],
      scan: [fetchAgencyInbound, fetchAgencyAgents, fetchAgencyScanHistory],
      agents: [fetchAgencyAgents],
      rto: [fetchAgencyRto],
      delivery: [fetchAgencyDeliveries],
      support: [fetchAgencyTickets],
    };
    const requests = (pageLoaders[page] || []).map((load) =>
      dispatch(load(agencyId)),
    );
    return () => requests.forEach((request) => request.abort());
  }, [agencyId, dispatch, page]);

  return (
    <LocalAgencyShell initials={initials}>
      {page === "dashboard" && (
        <Dashboard />
      )}
      {page === "shipments" && <Shipments />}
      {page === "scan" && <ScanOperations />}
      {page === "agents" && <DeliveryAgents />}
      {page === "rto" && <RtoManagement />}
      {page === "delivery" && <ShipmentDelivery />}
      {page === "support" && <SupportTickets />}
      {page === "settings" && <Settings />}
    </LocalAgencyShell>
  );
}
