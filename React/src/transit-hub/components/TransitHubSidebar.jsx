import React from "react";
import { useDispatch } from "react-redux";
import logoImg from "../assets/logo.png";
import {
  setTransitHubPage,
  toggleTransitHubInventory,
} from "../store/slices/transitHubUiSlice.js";

const items = [
  ["dashboard", "Dashboard", "fa-table-columns"],
  ["scan", "Scan Operations", "fa-barcode"],
];

export default function TransitHubSidebar({ activePage, inventoryOpen }) {
  const dispatch = useDispatch();
  return (
    <div className="sidebar" id="sidebar">
      <div className="logo-section">
        <img src={logoImg} alt="Ware2Door" className="logo-img" />
      </div>
      <ul className="menu">
        <li
          className={`menu-item${activePage === "dashboard" ? " active" : ""}`}
          id="nav-dashboard"
          onClick={() => dispatch(setTransitHubPage("dashboard"))}
        >
          <div className="icon-box">
            <i className="fa-solid fa-table-columns"></i>
          </div>
          <span>Dashboard</span>
        </li>
        <li
          className={`menu-item has-sub${inventoryOpen ? " active" : ""}`}
          id="nav-inv-toggle"
          onClick={() => dispatch(toggleTransitHubInventory())}
        >
          <div className="icon-box">
            <i className="fa-solid fa-boxes-stacked"></i>
          </div>
          <span>Manage Inventory</span>
          <i
            className={`fa-solid fa-chevron-down nav-chevron${inventoryOpen ? " open" : ""}`}
            id="inv-chevron"
          ></i>
        </li>
        {inventoryOpen && (
          <ul className="nav-submenu open" id="inv-submenu">
            <li
              className={`menu-sub-item${activePage === "hub-inv" ? " active" : ""}`}
              id="nav-hub-inv"
              onClick={() => dispatch(setTransitHubPage("hub-inv"))}
            >
              <div className="icon-box">
                <i className="fa-solid fa-list-ul"></i>
              </div>
              <span>Hub Inventory</span>
            </li>
            <li
              className={`menu-sub-item${activePage === "reports" ? " active" : ""}`}
              id="nav-reports"
              onClick={() => dispatch(setTransitHubPage("reports"))}
            >
              <div className="icon-box">
                <i className="fa-solid fa-chart-bar"></i>
              </div>
              <span>Reports</span>
            </li>
          </ul>
        )}
        <li
          className={`menu-item${activePage === "scan" ? " active" : ""}`}
          id="nav-scan"
          onClick={() => dispatch(setTransitHubPage("scan"))}
        >
          <div className="icon-box">
            <i className="fa-solid fa-barcode"></i>
          </div>
          <span>Scan Operations</span>
        </li>
      </ul>
      <div className="bottom">
        <li
          className={`menu-item stng-btn${activePage === "settings" ? " active" : ""}`}
          id="nav-settings"
          onClick={() => dispatch(setTransitHubPage("settings"))}
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
