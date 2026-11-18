import React from "react";
import WarehouseHeader from "./WarehouseHeader.jsx";
import WarehouseSidebar from "./WarehouseSidebar.jsx";

export default function WarehouseShell({
  children,
  activePage,
  headerTitle,
  inventoryOpen,
  onNavigate,
  onToggleInventory,
  user,
  initials,
  onSettings,
  toast,
}) {
  return (
    <div
      className="warehouse-app"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      {toast && (
        <div
          className={`toast${toast.isError ? " toast-error" : ""}`}
          role={toast.isError ? "alert" : "status"}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: toast.isError ? "#ef4444" : "#f4a32a",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 500,
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          {toast.msg}
        </div>
      )}
      <WarehouseSidebar
        activePage={activePage}
        inventoryOpen={inventoryOpen}
        onNavigate={onNavigate}
        onToggleInventory={onToggleInventory}
      />
      <div className="main">
        <WarehouseHeader
          title={headerTitle}
          user={user}
          initials={initials}
          onSettings={onSettings}
        />
        {children}
      </div>
    </div>
  );
}
