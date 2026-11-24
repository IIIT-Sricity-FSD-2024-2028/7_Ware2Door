import React from "react";
import { useDispatch, useSelector } from "react-redux";
import WarehouseHeader from "./WarehouseHeader.jsx";
import WarehouseSidebar from "./WarehouseSidebar.jsx";
import WarehouseToast from "./WarehouseToast.jsx";
import { setWarehousePage } from "../store/slices/warehouseUiSlice.js";

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

export default function WarehouseShell({ children, initials }) {
  const dispatch = useDispatch();
  const activePage = useSelector((state) => state.warehouse.ui.page);
  const inventoryOpen = useSelector(
    (state) => state.warehouse.ui.inventoryOpen,
  );
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <WarehouseToast />
      <WarehouseSidebar
        activePage={activePage}
        inventoryOpen={inventoryOpen}
      />
      <div className="main">
        <WarehouseHeader
          title={titles[activePage]}
          initials={initials}
          onSettings={() => dispatch(setWarehousePage("settings"))}
        />
        {children}
      </div>
    </div>
  );
}
