import React, { useMemo, useState } from "react";
import { fmtDate } from "../utils/transitHubUtils.js";

export default function ScanOperationsPage({
  mode,
  onMode,
  inscanValue,
  outscanValue,
  onInscanValue,
  onOutscanValue,
  onInscan,
  onOutscan,
  scanHistory,
}) {
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [agency, setAgency] = useState("");
  const rows = useMemo(
    () =>
      scanHistory.filter((row) => {
        const query = search.toLowerCase();
        return (
          (!query ||
            `${row.trackingId || ""} ${row.agencyName || ""}`
              .toLowerCase()
              .includes(query)) &&
          (!status || (row.flagged ? "FLAGGED" : row.status) === status) &&
          (!agency || (row.agencyName || "Not assigned") === agency)
        );
      }),
    [agency, scanHistory, search, status],
  );
  const total = scanHistory.length;
  const errors = scanHistory.filter((row) => row.flagged).length;

  return (
    <div className="scan-page page-content" id="page-scan">
      <div className="page-title-row">
        <div>
          <h2 className="page-title">
            {mode === "inscan" ? "In-Scan Operation" : "Out-Scan Operation"}
          </h2>
          <p className="page-subtitle">
            {mode === "inscan"
              ? "Register incoming packages and update real-time inventory."
              : "Register outgoing packages and dispatch them to local agencies."}
          </p>
        </div>
      </div>
      <div
        className="card-white"
        style={{
          marginBottom: 24,
          background: "white",
          borderRadius: 14,
          padding: "20px 24px",
          boxShadow: "0 1px 4px rgba(0,0,0,.08)",
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 11,
            fontWeight: 600,
            color: "#94a3b8",
            letterSpacing: ".06em",
          }}
        >
          TRACKING ID
        </p>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 10,
              border: "2px solid #f4a32a",
              borderRadius: 10,
              padding: "12px 16px",
              background: "white",
            }}
          >
            <i
              className="fa-solid fa-barcode"
              style={{ color: "#94a3b8", fontSize: 16 }}
            ></i>
            <input
              style={{
                border: "none",
                outline: "none",
                flex: 1,
                fontFamily: "Poppins,sans-serif",
                fontSize: 14,
                color: "#334155",
                background: "transparent",
              }}
              placeholder="Enter or scan tracking number (e.g. WD-88412)"
              value={mode === "inscan" ? inscanValue : outscanValue}
              onChange={(event) =>
                mode === "inscan"
                  ? onInscanValue(event.target.value)
                  : onOutscanValue(event.target.value)
              }
              onKeyDown={(event) =>
                event.key === "Enter" &&
                (mode === "inscan" ? onInscan() : onOutscan())
              }
            />
          </div>
          <button
            className="btn-primary"
            style={{ padding: "13px 22px", fontSize: 14 }}
            onClick={mode === "inscan" ? onInscan : onOutscan}
          >
            <i className="fa-solid fa-barcode"></i>{" "}
            {mode === "inscan" ? "In-Scan Package" : "Out-Scan Package"}
          </button>
        </div>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 12,
            color: "#94a3b8",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <i className="fa-solid fa-circle-info"></i>Supports 1D and 2D
          barcodes. Scanned items appear in the table below immediately.
        </p>
      </div>
      <div
        className="stat-grid"
        style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 24 }}
      >
        <ScanStat
          icon="fa-chart-bar"
          label="TOTAL SCANNED"
          value={total}
          badge="Total"
        />
        <ScanStat
          icon="fa-circle-check"
          label="SUCCESSFUL SCANS"
          value={total - errors}
          badge="Success"
          success
        />
        <ScanStat
          icon="fa-circle-exclamation"
          label="FLAGGED ERRORS"
          value={errors}
          badge="Errors"
          error
        />
      </div>
      <div className="table-card">
        <div className="table-header-row">
          <div
            className="tab-row"
            style={{ margin: 0, background: "#f1f5f9", padding: 4 }}
          >
            <button
              className={`tab-btn${mode === "inscan" ? " tab-active" : ""}`}
              onClick={() => onMode("inscan")}
            >
              In-Scan
            </button>
            <button
              className={`tab-btn${mode === "outscan" ? " tab-active" : ""}`}
              onClick={() => onMode("outscan")}
            >
              Out-Scan
            </button>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="search-box" style={{ width: 220 }}>
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                placeholder="Search Package ID..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <button
              className="btn-ghost"
              style={{ padding: "8px 12px" }}
              onClick={() => setFilterOpen((value) => !value)}
            >
              <i className="fa-solid fa-filter"></i>
            </button>
          </div>
        </div>
        {filterOpen && (
          <div
            style={{
              display: "flex",
              padding: "10px 20px",
              gap: 10,
              borderBottom: "1px solid #f1f5f9",
              background: "#f8fafc",
            }}
          >
            <select
              className="filter-select"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All Status</option>
              <option>Scanned In</option>
              <option>Outscan</option>
              <option value="FLAGGED">Flagged</option>
            </select>
            <select
              className="filter-select"
              value={agency}
              onChange={(event) => setAgency(event.target.value)}
            >
              <option value="">All Agencies</option>
              {[
                ...new Set(
                  scanHistory.map((row) => row.agencyName || "Not assigned"),
                ),
              ].map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </div>
        )}
        <table className="data-table">
          <thead>
            <tr>
              <th>TRACKING ID</th>
              <th>STATUS</th>
              <th>ASSIGNED AGENCY</th>
              <th>TIMESTAMP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.trackingId}-${index}`}>
                <td>
                  <span className="trk-id-dark">{row.trackingId || "—"}</span>
                </td>
                <td>
                  <span
                    className={`status-badge ${row.flagged ? "badge-err" : row.status === "Outscan" ? "badge-out" : "badge-in"}`}
                  >
                    <i
                      className={`fa-solid ${row.flagged ? "fa-triangle-exclamation" : "fa-circle"}`}
                    ></i>
                    {row.flagged
                      ? "FLAGGED"
                      : row.status === "Outscan"
                        ? "SCANNED OUT"
                        : "SCANNED IN"}
                  </span>
                </td>
                <td>{row.agencyName || "—"}</td>
                <td>
                  {row.flagged ? (
                    <em style={{ color: "#ef4444", fontSize: 11 }}>
                      {row.flagMsg ||
                        "Unknown tracking ID — not found in manifest"}
                    </em>
                  ) : (
                    fmtDate(row.timestamp)
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={4} className="empty-msg">
                  No scans found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="table-footer-row">
          <span className="showing-label">
            Showing 1–{rows.length} of {rows.length} scans
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="page-btn" disabled>
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <button className="page-btn" disabled>
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScanStat({ icon, label, value, badge, success, error }) {
  const color = success ? "#16a34a" : error ? "#ef4444" : "#f4a32a";
  return (
    <div className="stat-card">
      <div className="stat-top">
        <div
          className="stat-icon-box"
          style={{
            background: success ? "#dcfce7" : error ? "#fff1f0" : undefined,
          }}
        >
          <i className={`fa-solid ${icon}`} style={{ color }}></i>
        </div>
        <span
          className="stat-badge"
          style={{
            background: success ? "#dcfce7" : error ? "#fff1f0" : "#eff6ff",
            color,
          }}
        >
          {badge}
        </span>
      </div>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      <span className="stat-unit">scans</span>
    </div>
  );
}
