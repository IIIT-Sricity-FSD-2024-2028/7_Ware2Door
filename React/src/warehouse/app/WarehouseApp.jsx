import { useCallback, useState } from "react";

import { useAuth } from "../../auth/AuthContext.jsx";

import useWarehouseData from "../hooks/useWarehouseData.js";
import useWarehouseUi from "../hooks/useWarehouseUi.js";
import {
  fmtDate,
  initials,
  validatePassword,
  validateProfile,
} from "../../../FDFED-REACT/src/warehouse/utils/warehouseUtils.js";

import WarehouseShell from "../components/WarehouseShell.jsx";
import WarehouseModals from "../components/WarehouseModals.jsx";

import DashboardPage from "../pages/DashboardPage.jsx";
import ShipmentRequestsPage from "../pages/ShipmentRequestsPage.jsx";
import RtoPage from "../pages/RtoPage.jsx";
import PreAlertPage from "../pages/PreAlertPage.jsx";
import OutboundPage from "../pages/OutboundPage.jsx";
import InventoryOverviewPage from "../pages/InventoryOverviewPage.jsx";
import StockAdditionPage from "../pages/StockAdditionPage.jsx";
import SettingsPage from "../pages/SettingsPage.jsx";

export default function WarehouseApp() {
  const { session, logout } = useAuth();
  const user = session?.user || {};
  const warehouseId = user.id;
  const [page, setPage] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const notify = useCallback((msg, isError = false) => {
    setToast({ msg, isError });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const data = useWarehouseData(warehouseId, notify);
  const ui = useWarehouseUi({
    page,
    setPage,
    user,
    data,
    notify,
    warehouseId,
  });
  const {
    inventoryOpen,
    setInventoryOpen,
    selected,
    setSelected,
    shipments,
    shipSearch,
    setShipSearch,
    shipSource,
    setShipSource,
    shipPriority,
    setShipPriority,
    shipStock,
    setShipStock,
    rtoSearch,
    setRtoSearch,
    rtoStatus,
    setRtoStatus,
    rtoReason,
    setRtoReason,
    rtoScan,
    setRtoScan,
    rtoPage,
    setRtoPage,
    inventorySearch,
    setInventorySearch,
    inventoryStatus,
    setInventoryStatus,
    inventoryPage,
    setInventoryPage,
    expandedHub,
    setExpandedHub,
    stockLabel,
    setStockLabel,
    stockName,
    setStockName,
    stockQuantity,
    setStockQuantity,
    hubModal,
    setHubModal,
    orderId,
    dispatchOrderIds,
    hubId,
    setHubId,
    agencyId,
    setAgencyId,
    editModal,
    setEditModal,
    passwordModal,
    setPasswordModal,
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
    tfaEnabled,
    setTfaEnabled,
    navigate,
    openDispatch,
    dispatch,
    inscan,
    saveProfile,
    savePassword,
  } = ui;
  const {
    inventory,
    pending,
    outbound,
    rtos,
    preAlert,
    hubs,
    agencies,
    recentStock,
    setRecentStock,
    availability,
    reject,
    stats,
  } = data;
  const addStockFromPage = () =>
    data.addStock(stockLabel, stockName, stockQuantity);
  const inscanFromPage = inscan;
  const titles = {
    dashboard: "Dashboard",
    shipments: "Shipment Requests",
    rto: "Manage RTO",
    prealert: "Pre-Alert",
    outbound: "Outbound",
    "inventory-overview": "Inventory Overview",
    "stock-addition": "Stock Addition",
    settings: "Settings",
  };
  const greeting =
    new Date().getHours() < 12
      ? "Good Morning"
      : new Date().getHours() < 17
        ? "Good Afternoon"
        : "Good Evening";

  return (
    <WarehouseShell
      activePage={page}
      headerTitle={titles[page]}
      inventoryOpen={inventoryOpen}
      onNavigate={navigate}
      onToggleInventory={() => setInventoryOpen((value) => !value)}
      user={user}
      initials={initials}
      onSettings={() => navigate("settings")}
      toast={toast}
    >
      {page === "dashboard" && (
        <DashboardPage
          user={user}
          greeting={greeting}
          today={new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
          stats={stats}
          activityRows={inventory.slice(0, 5)}
          onShipments={() => navigate("shipments")}
          onPreAlerts={() => navigate("prealert")}
        />
      )}
      {page === "shipments" && (
        <ShipmentRequestsPage
          shipments={shipments}
          selected={selected}
          onSelectAll={(checked) =>
            setSelected(
              checked
                ? new Set(
                  shipments.map((item) => item.orderId),
                )
                : new Set(),
            )
          }
          onSelect={(id, checked) =>
            setSelected((previous) => {
              const next = new Set(previous);
              checked ? next.add(id) : next.delete(id);
              return next;
            })
          }
          search={shipSearch}
          source={shipSource}
          priority={shipPriority}
          stock={shipStock}
          onSearch={setShipSearch}
          onSource={setShipSource}
          onPriority={setShipPriority}
          onStock={setShipStock}
          onAccept={() => {
            const selectedOrderIds = pending
              .filter((item) => selected.has(item.orderId))
              .map((item) => item.orderId);
            if (selectedOrderIds.length) openDispatch(selectedOrderIds, true);
          }}
          onReject={reject}
          onDispatch={openDispatch}
          availability={availability}
          fmtDate={fmtDate}
        />
      )}
      {page === "rto" && (
        <RtoPage
          data={rtos}
          search={rtoSearch}
          status={rtoStatus}
          reason={rtoReason}
          scanId={rtoScan}
          onSearch={setRtoSearch}
          onStatus={setRtoStatus}
          onReason={setRtoReason}
          onScanId={setRtoScan}
          onInscan={inscanFromPage}
          page={rtoPage}
          perPage={5}
          onPage={setRtoPage}
          fmtDate={fmtDate}
          onExportError={(message) => notify(message, true)}
        />
      )}
      {page === "prealert" && (
        <PreAlertPage
          report={preAlert}
          expanded={expandedHub}
          onToggle={(id) => setExpandedHub(expandedHub === id ? null : id)}
          onSend={(id, name, count) =>
            notify(
              `Pre-alert sent to ${name || id} — ${count} shipment${count === 1 ? "" : "s"} en route`,
            )
          }
        />
      )}
      {page === "outbound" && (
        <OutboundPage
          shipments={outbound}
          fmtDate={fmtDate}
          onExportError={(message) => notify(message, true)}
        />
      )}
      {page === "inventory-overview" && (
        <InventoryOverviewPage
          items={inventory}
          search={inventorySearch}
          status={inventoryStatus}
          page={inventoryPage}
          perPage={5}
          onSearch={setInventorySearch}
          onStatus={setInventoryStatus}
          onPage={setInventoryPage}
          onAddStock={() => navigate("stock-addition")}
          fmtDate={fmtDate}
        />
      )}
      {page === "stock-addition" && (
        <StockAdditionPage
          labelId={stockLabel}
          itemName={stockName}
          quantity={stockQuantity}
          recent={recentStock}
          onLabelId={setStockLabel}
          onItemName={setStockName}
          onQuantity={setStockQuantity}
          onAdd={addStockFromPage}
          onReset={() => {
            setStockLabel("");
            setStockName("");
            setStockQuantity("");
          }}
          onEdit={(item, index) => {
            setStockLabel(item.labelId || "");
            setStockName(item.itemName || "");
            setStockQuantity(String(item.quantity || ""));
            setRecentStock((items) => items.filter((_, i) => i !== index));
          }}
          onRemove={(index) =>
            setRecentStock((items) => items.filter((_, i) => i !== index))
          }
          fmtDate={fmtDate}
        />
      )}
      {page === "settings" && (
        <SettingsPage
          user={user}
          initials={initials}
          tfaEnabled={tfaEnabled}
          onToggleTfa={() => setTfaEnabled((value) => !value)}
          onEditProfile={() => {
            setEditName(user.name || "");
            setEditEmail(user.email || "");
            setEditPhone(user.phone || "");
            setEditModal(true);
          }}
          onChangePassword={() => setPasswordModal(true)}
          onLogout={logout}
          showToast={notify}
        />
      )}
      <WarehouseModals
        hubOpen={hubModal}
        editOpen={editModal}
        passwordOpen={passwordModal}
        currentOrderId={orderId}
        selectedCount={dispatchOrderIds.length}
        hubs={hubs}
        agencies={agencies}
        hubId={hubId}
        agencyId={agencyId}
        onHubChange={setHubId}
        onAgencyChange={setAgencyId}
        onCloseHub={() => setHubModal(false)}
        onConfirmDispatch={dispatch}
        editName={editName}
        editEmail={editEmail}
        editPhone={editPhone}
        onEditName={setEditName}
        onEditEmail={setEditEmail}
        onEditPhone={setEditPhone}
        onCloseEdit={() => setEditModal(false)}
        onSaveProfile={() => saveProfile(validateProfile)}
        currentPassword={currentPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        onCurrentPassword={setCurrentPassword}
        onNewPassword={setNewPassword}
        onConfirmPassword={setConfirmPassword}
        onClosePassword={() => setPasswordModal(false)}
        onSavePassword={() => savePassword(validatePassword)}
        initials={initials}
      />
    </WarehouseShell>
  );
}
