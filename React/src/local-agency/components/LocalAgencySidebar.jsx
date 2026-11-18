import React from "react";
import logoImg from "../assets/logo.png";

const navigationItems = [
  ["dashboard", "Dashboard", "Dashboard", "fa-table-columns"],
  ["shipments", "Shipment List", "Shipments", "fa-list-check"],
  ["scan", "Scan Operations", "Scan Operations", "fa-barcode"],
  ["agents", "Delivery Agents", "Delivery Agents", "fa-people-carry-box"],
  ["rto", "RTO Management", "RTO Management", "fa-rotate-left"],
  ["delivery", "Shipment Delivery", "Shipment Delivery", "fa-truck-fast"],
  ["support", "Support Tickets", "Support Tickets", "fa-headset"],
];

export default function LocalAgencySidebar({ activePage, onNavigate }) {
  return (
    <div className="sidebar">
      <div className="logo-section">
        <img src={logoImg} alt="Ware2Door" />
      </div>
      <ul className="menu">
        {navigationItems.map(([page, label, title, icon]) => (
          <li
            key={page}
            className={`menu-item${activePage === page ? " active" : ""}`}
            id={`nav-${page}`}
            onClick={() => onNavigate(page, title)}
          >
            <div className="icon-box">
              <i className={`fa-solid ${icon}`}></i>
            </div>
            <span>{label}</span>
          </li>
        ))}
      </ul>
      <div className="bottom">
        <li
          className={`menu-item stng-btn${activePage === "settings" ? " stng-active" : ""}`}
          id="nav-settings"
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
