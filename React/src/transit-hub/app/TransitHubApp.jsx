import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import TransitHubShell from "../components/TransitHubShell.jsx";
import TransitHubModals from "../components/TransitHubModals.jsx";
import DashboardPage from "../pages/DashboardPage.jsx";
import HubInventoryPage from "../pages/HubInventoryPage.jsx";
import ReportsPage from "../pages/ReportsPage.jsx";
import ScanOperationsPage from "../pages/ScanOperationsPage.jsx";
import SettingsPage from "../pages/SettingsPage.jsx";
import {
  fetchTransitHubDashboard,
  fetchTransitHubInventory,
} from "../store/actions/transitHubActions.js";
import { initials } from "../utils/transitHubUtils.js";
import hubStylesUrl from "../styles/hub.css?url";

export default function TransitHubApp() {
  const dispatch = useDispatch();
  const hubId = useSelector((state) => state.auth.session?.user?.id);
  const activePage = useSelector((state) => state.transitHub.ui.page);

  useEffect(() => {
    const styleLink = document.createElement("link");
    styleLink.rel = "stylesheet";
    styleLink.href = hubStylesUrl;
    styleLink.dataset.portalStyle = "transit-hub";
    document.head.appendChild(styleLink);
    return () => styleLink.remove();
  }, []);

  useEffect(() => {
    const reset = document.createElement("style");
    reset.id = "hub-reset";
    reset.textContent =
      "body{background:#f1f5f9!important;background-image:none!important;}body::before,body::after{display:none!important;}";
    document.head.appendChild(reset);
    return () => document.getElementById("hub-reset")?.remove();
  }, []);

  useEffect(() => {
    if (!hubId) return undefined;
    const dashboardRequest = dispatch(fetchTransitHubDashboard(hubId));
    const inventoryRequest = dispatch(fetchTransitHubInventory(hubId));
    return () => {
      dashboardRequest.abort();
      inventoryRequest.abort();
    };
  }, [dispatch, hubId]);

  return (
    <TransitHubShell initials={initials}>
      {activePage === "dashboard" && <DashboardPage />}
      {activePage === "hub-inv" && <HubInventoryPage />}
      {activePage === "reports" && <ReportsPage />}
      {activePage === "scan" && <ScanOperationsPage />}
      {activePage === "settings" && <SettingsPage />}
      <TransitHubModals />
    </TransitHubShell>
  );
}
