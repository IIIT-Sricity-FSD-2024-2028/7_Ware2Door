import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext.jsx";
import useTransitHubData from "../hooks/useTransitHubData.js";
import useTransitHubUi from "../hooks/useTransitHubUi.js";
import TransitHubShell from "../components/TransitHubShell.jsx";
import TransitHubModals from "../components/TransitHubModals.jsx";
import DashboardPage from "../pages/DashboardPage.jsx";
import HubInventoryPage from "../pages/HubInventoryPage.jsx";
import ReportsPage from "../pages/ReportsPage.jsx";
import ScanOperationsPage from "../pages/ScanOperationsPage.jsx";
import SettingsPage from "../pages/SettingsPage.jsx";
import {
  initials,
  validatePassword,
  validateProfile,
} from "../utils/transitHubUtils.js";
import hubStylesUrl from "../styles/hub.css?url";

const titles = {
  dashboard: "Dashboard",
  "hub-inv": "Hub Inventory",
  reports: "Reports",
  scan: "Scan Operations",
  settings: "Settings",
};

export default function TransitHubApp() {
  const { session, logout } = useAuth();
  const user = session?.user || {};
  const hubId = user.id;
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const styleLink = document.createElement("link");
    styleLink.rel = "stylesheet";
    styleLink.href = hubStylesUrl;
    styleLink.dataset.portalStyle = "transit-hub";
    document.head.appendChild(styleLink);
    return () => styleLink.remove();
  }, []);

  const notify = useCallback((msg, isError = false) => {
    setToast({ msg, isError });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const data = useTransitHubData(hubId, notify);
  const ui = useTransitHubUi({ user, hubId, data, notify });
  const {
    page: activePage,
    inventoryOpen,
    setInventoryOpen,
    scanMode,
    setScanMode,
    inventorySearch,
    setInventorySearch,
    inscanValue,
    setInscanValue,
    outscanValue,
    setOutscanValue,
    inscanResult,
    outscanResult,
    tfaEnabled,
    setTfaEnabled,
    editOpen,
    setEditOpen,
    passwordOpen,
    setPasswordOpen,
    editName,
    setEditName,
    editEmail,
    setEditEmail,
    editPhone,
    setEditPhone,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    navigate: goTo,
    inscan: performInscan,
    outscan: performOutscan,
    saveProfile,
    savePassword,
  } = ui;

  useEffect(() => {
    const reset = document.createElement("style");
    reset.id = "hub-reset";
    reset.textContent =
      "body{background:#f1f5f9!important;background-image:none!important;}body::before,body::after{display:none!important;}";
    document.head.appendChild(reset);
    return () => document.getElementById("hub-reset")?.remove();
  }, []);

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12
      ? "Good Morning"
      : greetingHour < 17
        ? "Good Afternoon"
        : "Good Evening";
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <TransitHubShell
      activePage={activePage}
      inventoryOpen={inventoryOpen}
      onNavigate={goTo}
      onToggleInventory={() => setInventoryOpen((value) => !value)}
      headerTitle={
        activePage === "scan"
          ? scanMode === "inscan"
            ? "In-Scan Operations"
            : "Out-Scan Operations"
          : titles[activePage]
      }
      user={user}
      initials={initials}
      onSettings={() => goTo("settings")}
      toast={toast}
    >
      {activePage === "dashboard" && (
        <DashboardPage
          user={user}
          stats={data.stats}
          greeting={greeting}
          today={today}
          onScan={() => goTo("scan")}
          onInventory={() => goTo("hub-inv")}
          onReports={() => goTo("reports")}
          onInscan={() => {
            setScanMode("inscan");
            goTo("scan");
          }}
          onOutscan={() => {
            setScanMode("outscan");
            goTo("scan");
          }}
        />
      )}
      {activePage === "hub-inv" && (
        <HubInventoryPage
          inventory={data.inventory}
          search={inventorySearch}
          onSearch={setInventorySearch}
          onExportError={(message) => notify(message, true)}
        />
      )}
      {activePage === "reports" && (
        <ReportsPage
          reports={data.reports}
          hubName={user.name}
          agencies={data.agencies}
          onExportError={(message) => notify(message, true)}
        />
      )}
      {activePage === "scan" && (
        <ScanOperationsPage
          mode={scanMode}
          onMode={setScanMode}
          inscanValue={inscanValue}
          outscanValue={outscanValue}
          onInscanValue={setInscanValue}
          onOutscanValue={setOutscanValue}
          onInscan={performInscan}
          onOutscan={performOutscan}
          inscanResult={inscanResult}
          outscanResult={outscanResult}
          scanHistory={data.scanHistory}
        />
      )}
      {activePage === "settings" && (
        <SettingsPage
          user={user}
          initials={initials}
          tfaEnabled={tfaEnabled}
          onToggleTfa={() => {
            setTfaEnabled((value) => !value);
            notify(
              tfaEnabled
                ? "Two-factor authentication disabled."
                : "✓ Two-factor authentication enabled.",
            );
          }}
          onEdit={() => {
            setEditName(user.name || "");
            setEditEmail(user.email || "");
            setEditPhone(user.phone || "");
            setEditOpen(true);
          }}
          onPassword={() => setPasswordOpen(true)}
          onLogout={logout}
        />
      )}
      <TransitHubModals
        editOpen={editOpen}
        passwordOpen={passwordOpen}
        editName={editName}
        editEmail={editEmail}
        editPhone={editPhone}
        currentPassword={currentPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        onCloseEdit={() => setEditOpen(false)}
        onClosePassword={() => setPasswordOpen(false)}
        onEditName={setEditName}
        onEditEmail={setEditEmail}
        onEditPhone={setEditPhone}
        onCurrentPassword={setCurrentPassword}
        onNewPassword={setNewPassword}
        onConfirmPassword={setConfirmPassword}
        onSaveProfile={() => saveProfile(validateProfile)}
        onSavePassword={() => savePassword(validatePassword)}
        initials={initials}
      />
    </TransitHubShell>
  );
}
