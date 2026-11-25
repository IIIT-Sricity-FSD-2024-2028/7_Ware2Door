import React from "react";
import { useDispatch } from "react-redux";
import logoImg from "../assets/logo.png";
import { setLocalAgencyPage } from "../store/slices/localAgencyUiSlice.js";

const navigationItems = [
  ["dashboard", "Dashboard", "Dashboard", "fa-table-columns"],
  ["shipments", "Shipment List", "Shipments", "fa-list-check"],
  ["scan", "Scan Operations", "Scan Operations", "fa-barcode"],
  ["agents", "Delivery Agents", "Delivery Agents", "fa-people-carry-box"],
  ["rto", "RTO Management", "RTO Management", "fa-rotate-left"],
  ["delivery", "Shipment Delivery", "Shipment Delivery", "fa-truck-fast"],
  ["support", "Support Tickets", "Support Tickets", "fa-headset"],
];

export default function LocalAgencySidebar({ activePage }) {
  const dispatch = useDispatch();
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
            onClick={() => dispatch(setLocalAgencyPage(page))}
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
          onClick={() => dispatch(setLocalAgencyPage("settings"))}
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
