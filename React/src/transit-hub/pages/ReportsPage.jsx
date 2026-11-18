import React, { useMemo, useState } from "react";
import { fmtDate } from "../utils/transitHubUtils.js";
import { downloadCsv, printReport } from "../../utils/dataExport.js";

export default function ReportsPage({
  reports,
  hubName,
  agencies,
  onExportError,
}) {
  const [tab, setTab] = useState("inbound");
  const [search, setSearch] = useState("");
  const rows = reports[tab] || [];
  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const query = search.toLowerCase();
        return (
          !query ||
          `${row.trackingId || ""} ${row.warehouseName || row.warehouseId || ""} ${row.agencyName || ""}`
            .toLowerCase()
            .includes(query)
        );
      }),
    [rows, search],
  );
  const agencyCards = (agencies || []).map((agency) => {
    const matchesAgency = (row) =>
      row.agencyId === agency.id ||
      (row.agencyName || "").trim() === (agency.name || "").trim();
    const shipments = (reports.outbound || []).filter(matchesAgency);
    const preAlertShipment = (reports.prealert || []).find(matchesAgency);
    return {
      ...agency,
      shipments,
      driverName:
        shipments.at(-1)?.driverName || preAlertShipment?.driverName || "—",
    };
  });
  const visibleAgencyCards = agencyCards.filter(
    (agency) =>
      !search ||
      String(agency.name || "")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const exportReport = (format) => {
    let headers;
    let exportRows;
    let title;

    if (tab === "prealert") {
      title = "Transit Hub Pre-Alert Report";
      headers = [
        "Agency",
        "Address",
        "City",
        "Pre-Alert Shipments",
        "Driver",
        "Tracking IDs",
      ];
      exportRows = visibleAgencyCards.map((agency) => [
        agency.name || "—",
        agency.address || "—",
        agency.city || "—",
        agency.shipments.length,
        agency.driverName,
        agency.shipments.map((shipment) => shipment.trackingId).join(", "),
      ]);
    } else {
      title = `Transit Hub ${tab === "inbound" ? "Inbound" : "Outbound"} Report`;
      headers = [
        "Tracking ID",
        tab === "inbound" ? "Origin Hub" : "Destination",
        tab === "inbound" ? "Assigned Hub" : "Delivery Agency",
        tab === "inbound" ? "Arrival Time" : "Departure Time",
      ];
      exportRows = filtered.map((row) => {
        const updated = Array.isArray(row.updatedAt)
          ? row.updatedAt.at(-1)
          : row.updatedAt;
        return [
          row.trackingId || "—",
          tab === "inbound"
            ? row.warehouseName || row.warehouseId || "—"
            : row.agencyName || "—",
          row.hubName || hubName || row.agencyName || "—",
          fmtDate(row.inscanTime || updated),
        ];
      });
    }

    try {
      if (format === "csv") {
        const filename = `${title.toLowerCase().replaceAll(" ", "-")}.csv`;
        downloadCsv(filename, headers, exportRows);
      } else {
        printReport(title, headers, exportRows);
      }
    } catch (error) {
      onExportError(error.message || "Unable to export this report.");
    }
  };

  return (
    <div className="reports-page page-content" id="page-reports">
      <div className="page-title-row">
        <div>
          <h2 className="page-title">Operational Reports</h2>
          <p className="page-subtitle">
            Real-time transit hub operational insights and shipment tracking.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn-ghost"
            type="button"
            onClick={() => exportReport("csv")}
          >
            <i className="fa-regular fa-file-lines"></i> CSV
          </button>
          <button
            className="btn-primary"
            type="button"
            onClick={() => exportReport("pdf")}
          >
            <i className="fa-solid fa-download"></i> PDF Export
          </button>
        </div>
      </div>
      <div className="tab-row" id="rep-tab-row">
        <button
          className={`tab-btn${tab === "inbound" ? " tab-active" : ""}`}
          onClick={() => setTab("inbound")}
        >
          Inbound Report
        </button>
        <button
          className={`tab-btn${tab === "outbound" ? " tab-active" : ""}`}
          onClick={() => setTab("outbound")}
        >
          Outbound Report
        </button>
        <button
          className={`tab-btn${tab === "prealert" ? " tab-active" : ""}`}
          onClick={() => setTab("prealert")}
        >
          Pre-Alert
        </button>
      </div>
      {tab === "prealert" ? (
        <div className="table-card">
          <div className="table-header-row">
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#1e293b",
                margin: 0,
              }}
            >
              Active Local Agencies — Pre-Alert
            </h3>
            <div className="search-box" style={{ width: 240 }}>
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                placeholder="Search agency..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
          <div className="agency-grid">
            {visibleAgencyCards.map((agency) => (
              <div className="agency-card" key={agency.id || agency.name}>
                  <div className="agency-card-hdr">
                    <div className="agency-icon">
                      <i className="fa-solid fa-building-columns"></i>
                    </div>
                    <div>
                      <div className="agency-card-name">{agency.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {agency.address || ""}
                        {agency.city ? `, ${agency.city}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="agency-stats">
                    <div>
                      <p className="agency-stat-lbl">PRE-ALERTS</p>
                      <p className="agency-stat-val">
                        {agency.shipments.length}
                      </p>
                    </div>
                    <div>
                      <p className="agency-stat-lbl">DRIVER</p>
                      <p className="agency-stat-val">{agency.driverName}</p>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#94a3b8",
                      marginBottom: 8,
                    }}
                  >
                    DISPATCHED SHIPMENTS
                  </div>
                  <div
                    style={{ color: "#94a3b8", fontSize: 11, marginBottom: 14 }}
                  >
                    {agency.shipments.length
                      ? agency.shipments
                          .slice(0, 3)
                          .map((row) => (
                            <div key={row.trackingId}>• #{row.trackingId}</div>
                          ))
                      : "No shipments dispatched yet"}
                  </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="stat-card" style={{ marginBottom: 20 }}>
            <div className="stat-top">
              <div className="stat-icon-box">
                <i className="fa-solid fa-cube"></i>
              </div>
              <span className="stat-badge stat-badge--blue">Live</span>
            </div>
            <p className="stat-label">
              TOTAL {tab === "inbound" ? "INBOUND" : "OUTBOUND"} SHIPMENTS
            </p>
            <p className="stat-value">{rows.length}</p>
            <span className="stat-unit">
              {tab === "inbound"
                ? `${rows.length} currently in hub inventory`
                : `${rows.length} dispatched from hub`}
            </span>
          </div>
          <div className="table-card">
            <div className="table-header-row">
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#1e293b",
                  margin: 0,
                }}
              >
                Recent {tab === "inbound" ? "Inbound" : "Outbound"} Shipments
              </h3>
              <div className="search-box" style={{ width: 240 }}>
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  placeholder="Search ID..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>TRACKING ID</th>
                  <th>{tab === "inbound" ? "ORIGIN HUB" : "DESTINATION"}</th>
                  <th>
                    {tab === "inbound" ? "ASSIGNED HUB" : "DELIVERY AGENCY"}
                  </th>
                  <th>
                    {tab === "inbound" ? "ARRIVAL TIME" : "DEPARTURE TIME"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, index) => {
                  const updated = Array.isArray(row.updatedAt)
                    ? row.updatedAt.at(-1)
                    : row.updatedAt;
                  return (
                    <tr key={`${row.trackingId}-${index}`}>
                      <td>
                        <span className="trk-id-orange">
                          #{row.trackingId || "—"}
                        </span>
                      </td>
                      <td>
                        {tab === "inbound"
                          ? row.warehouseName || row.warehouseId || "—"
                          : row.agencyName || "—"}
                      </td>
                      <td>{row.hubName || hubName || row.agencyName || "—"}</td>
                      <td>{fmtDate(row.inscanTime || updated)}</td>
                    </tr>
                  );
                })}
                {!filtered.length && (
                  <tr>
                    <td colSpan={4} className="empty-msg">
                      No {tab} records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
