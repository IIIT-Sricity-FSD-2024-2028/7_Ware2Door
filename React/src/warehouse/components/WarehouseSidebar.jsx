import React from "react";
import logoImg from "../assets/logo.png";

const items = [
  ["dashboard", "Dashboard", "fa-table-columns"],
  ["shipments", "Shipment Requests", "fa-box"],
  ["rto", "Manage RTO", "fa-truck"],
];

export default function WarehouseSidebar({
  activePage,
  inventoryOpen,
  onNavigate,
  onToggleInventory,
}) {
  return (
    <div className="sidebar">
      <div className="logo-section">
        <img src={logoImg} className="logo" alt="Ware2Door" />
      </div>
      <ul className="menu">
        {items.map(([page, label, icon]) => (
          <li
            key={page}
            className={`menu-item${activePage === page ? " active" : ""}`}
            onClick={() => onNavigate(page, label)}
          >
            <div className="icon-box">
              <i className={`fa-solid ${icon}`}></i>
            </div>
            <span>{label}</span>
          </li>
        ))}
        <li className={`dropdown${inventoryOpen ? " open" : ""}`}>
          <button
            type="button"
            className={`menu-item dropdown-header${inventoryOpen ? " active open" : ""}`}
            onClick={onToggleInventory}
            aria-expanded={inventoryOpen}
            aria-controls="warehouse-inventory-submenu"
          >
            <span className="icon-box">
              <i className="fa-solid fa-boxes-stacked"></i>
            </span>
            <span>Manage Inventory</span>
            <i
              className={`fa-solid fa-chevron-down arrow${inventoryOpen ? " open" : ""}`}
            ></i>
          </button>
          {inventoryOpen && (
            <ul className="submenu" id="warehouse-inventory-submenu">
              {[
                ["prealert", "Pre-Alert"],
                ["outbound", "Outbound"],
                ["inventory-overview", "Inventory Overview"],
                ["stock-addition", "Stock Addition"],
              ].map(([page, label]) => (
                <li
                  key={page}
                  className={`submenu-item${activePage === page ? " active" : ""}`}
                  onClick={() => onNavigate(page, label)}
                >
                  {label}
                </li>
              ))}
            </ul>
          )}
        </li>
      </ul>
      <div className="bottom">
        <li
          className={`menu-item stng-btn${activePage === "settings" ? " active" : ""}`}
          onClick={() => onNavigate("settings", "Settings")}
        >
          <div className="icon-box">
            <i className="fa-solid fa-gear"></i>
          </div>
          <span>Settings</span>
        </li>
      </div>
    </div>
  );
}
