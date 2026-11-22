import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import {
  fetchWarehouseInventory,
  fetchWarehouseOutbound,
  fetchWarehousePendingShipments,
  fetchWarehousePreAlert,
  fetchWarehouseRtos,
  fetchWarehouseSystemOptions,
} from "../store/actions/warehouseActions.js";
import { initials } from "../utils/warehouseUtils.js";

export default function WarehouseApp() {
  const dispatch = useDispatch();
  const warehouseId = useSelector((state) => state.auth.session?.user?.id);
  const page = useSelector((state) => state.warehouse.ui.page);

  useEffect(() => {
    if (!warehouseId) return;
    dispatch(fetchWarehouseInventory(warehouseId));
    dispatch(fetchWarehousePendingShipments(warehouseId));
    dispatch(fetchWarehouseOutbound(warehouseId));
    dispatch(fetchWarehouseRtos(warehouseId));
    dispatch(fetchWarehouseSystemOptions());
  }, [dispatch, warehouseId]);

  useEffect(() => {
    if (page === "prealert" && warehouseId) {
      dispatch(fetchWarehousePreAlert(warehouseId));
    }
  }, [dispatch, page, warehouseId]);

  return (
    <WarehouseShell initials={initials}>
      {page === "dashboard" && <DashboardPage />}
      {page === "shipments" && <ShipmentRequestsPage />}
      {page === "rto" && <RtoPage />}
      {page === "prealert" && <PreAlertPage />}
      {page === "outbound" && <OutboundPage />}
      {page === "inventory-overview" && <InventoryOverviewPage />}
      {page === "stock-addition" && <StockAdditionPage />}
      {page === "settings" && <SettingsPage />}
      <WarehouseModals />
    </WarehouseShell>
  );
}
