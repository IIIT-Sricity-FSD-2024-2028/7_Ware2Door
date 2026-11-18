import React from "react";
import { fmtDate } from "../utils/transitHubUtils.js";
import { downloadCsv } from "../../utils/dataExport.js";

export default function HubInventoryPage({
  inventory,
  search,
  onSearch,
  onExportError,
}) {
  const filtered = inventory.filter((item) => {
    const query = search.toLowerCase();
    return (
      !query ||
      `${item.trackingId || ""} ${item.productName || ""}`
        .toLowerCase()
        .includes(query)
    );
  });
  const exportData = () => {
    try {
      downloadCsv(
        "transit-hub-inventory.csv",
        ["Tracking ID", "Origin Warehouse", "Delivery Agency", "Arrival Time"],
        filtered.map((item) => [
          item.trackingId || "—",
          item.warehouseName || item.warehouseId || "—",
          item.agencyName || "—",
          fmtDate(item.scannedAt || item.inscanTime),
        ]),
      );
    } catch (error) {
      onExportError(error.message || "Unable to export hub inventory.");
    }
  };

  return (
    <div className="hub-inv-page page-content" id="page-hub-inv">
      <div className="page-title-row">
        <div>
          <h2 className="page-title">Hub Inventory</h2>
          <p className="page-subtitle">
            All shipments currently at this transit hub.
          </p>
        </div>
        <button className="btn-primary" onClick={exportData}>
          <i className="fa-solid fa-download"></i> Export CSV
        </button>
      </div>
      <div className="filter-row" style={{ marginBottom: 20 }}>
        <div className="search-box" style={{ flex: 1 }}>
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            placeholder="Search by Tracking ID or product…"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
          />
        </div>
        <select className="filter-select">
          <option>All Destinations</option>
        </select>
      </div>
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>TRACKING ID</th>
              <th>ORIGIN WAREHOUSE</th>
              <th>DELIVERY AGENCY</th>
              <th>ARRIVAL TIME</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, index) => (
              <tr key={`${row.trackingId}-${index}`}>
                <td>{row.trackingId || "—"}</td>
                <td>{row.warehouseName || row.warehouseId || "—"}</td>
                <td>{row.agencyName || "—"}</td>
                <td>{fmtDate(row.scannedAt || row.inscanTime)}</td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td
                  colSpan={4}
                  style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}
                >
                  No inventory data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div
        className="welcome-banner"
        style={{ marginTop: 20, padding: "24px 30px" }}
      >
        <div className="welcome-text">
          <p className="welcome-label">HUB OVERVIEW</p>
          <h2 className="welcome-heading" style={{ fontSize: 18 }}>
            The transit hub is currently at{" "}
            <span style={{ color: "#f4a32a" }}>
              {Math.round((inventory.length / 200) * 100)}% capacity
            </span>
          </h2>
          <p className="welcome-sub">
            All sorting lines operational. Transit flow remains efficient with
            minimal delays across the network.
          </p>
        </div>
        <div className="welcome-icon-wrap">
          <i className="fa-solid fa-cube welcome-icon"></i>
        </div>
      </div>
    </div>
  );
}
