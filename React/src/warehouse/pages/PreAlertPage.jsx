import React from "react";
export default function PreAlertPage({ report, expanded, onToggle, onSend }) {
  const hubs = report?.hubs || [];
  const sourceBadge = (source) => {
    const value = source || "N/A";
    const sourceClasses = {
      Amazon: "src-amazon",
      Shopsy: "src-shopsy",
      Flipkart: "src-flipkart",
      Meesho: "src-meesho",
    };
    return (
      <span className={`src-badge ${sourceClasses[value] || "src-amazon"}`}>
        {value[0]}
      </span>
    );
  };

  return (
    <div className="prealert-page page-content">
      <div className="page-title-row">
        <div>
          <h2 className="page-title">Transit Hub Pre-Alerts</h2>
          <p className="page-subtitle">
            Outbound shipments from this warehouse grouped by transit hub. Click
            a hub to view shipments and send pre-alerts.
          </p>
        </div>
      </div>
      <div className="stat-grid pa-stat-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon-box">
              <i
                className="fa-solid fa-location-dot"
                style={{ color: "#f4a32a" }}
              ></i>
            </div>
            <span className="stat-badge stat-badge--green">Active</span>
          </div>
          <p className="stat-label">ACTIVE TRANSIT HUBS</p>
          <p className="stat-value">{report?.active_hubs || hubs.length}</p>
          <span className="stat-unit">hubs</span>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon-box">
              <i
                className="fa-solid fa-arrow-up-right-from-square"
                style={{ color: "#2563eb" }}
              ></i>
            </div>
            <span className="stat-badge stat-badge--blue">Today</span>
          </div>
          <p className="stat-label">TOTAL OUT-SCANNED</p>
          <p className="stat-value">{report?.total_out_scanned || 0}</p>
          <span className="stat-unit">shipments</span>
        </div>
      </div>
      <h3
        style={{
          margin: "0 0 16px",
          fontSize: 16,
          fontWeight: 600,
          color: "#1e293b",
        }}
      >
        Transit Hubs
      </h3>
      <div className="pa-hub-grid">
        {hubs.map((h) => {
          const ships = h.shipments || [];
          const open = expanded === h.hubId;
          return (
            <div
              className={`pa-hub-card${open ? " pa-hub-card--expanded" : ""}${
                ships.length ? "" : " pa-hub-card--empty"
              }`}
              key={h.hubId}
            >
              <div className="pa-hub-header" onClick={() => onToggle(h.hubId)}>
                <div className="pa-hub-left">
                  <div
                    className={`pa-hub-icon${ships.length ? "" : " pa-hub-icon--grey"}`}
                  >
                    <i className="fa-solid fa-building"></i>
                  </div>
                  <div>
                    <p className="pa-hub-name">{h.hubName || h.hubId}</p>
                    <p className="pa-hub-addr">{h.hubAddress || ""}</p>
                  </div>
                </div>
                <i
                  className={`fa-solid fa-chevron-down pa-hub-arrow${open ? " pa-hub-arrow--open" : ""}`}
                ></i>
              </div>
              <div className="pa-hub-stats">
                <div className="pa-hub-stat">
                  <p className="pa-stat-label">OUT-SCANNED</p>
                  <p className="pa-stat-val">{ships.length}</p>
                </div>
                <div className="pa-hub-stat">
                  <p className="pa-stat-label">DRIVER</p>
                  <p
                    className="pa-stat-val"
                    style={{ fontSize: 13, whiteSpace: "nowrap" }}
                  >
                    {h.driverName || "—"}
                  </p>
                </div>
                <div className="pa-hub-stat">
                  <p className="pa-stat-label">VEHICLE</p>
                  <p
                    className="pa-stat-val"
                    style={{ fontSize: 13, whiteSpace: "nowrap" }}
                  >
                    {h.vehicleNo || "—"}
                  </p>
                </div>
              </div>
              {open && (
                <div className="pa-shipments-section">
                  <p className="pa-shipments-title">
                    <i className="fa-solid fa-boxes-stacked"></i>
                    Outbound Shipments to this Hub
                  </p>
                  <table className="pa-ship-table">
                    <thead>
                      <tr>
                        <th>TRACKING ID</th>
                        <th>ORDER ID</th>
                        <th>SOURCE</th>
                        <th>AGENCY</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ships.map((s, index) => (
                        <tr key={`${s.trackingId}-${index}`}>
                          <td style={{ fontWeight: 600, color: "#1e293b" }}>
                            {s.trackingId}
                          </td>
                          <td style={{ color: "#64748b", fontSize: 12 }}>
                            {s.trackingId}
                          </td>
                          <td>{sourceBadge(s.productName || s.source)}</td>
                          <td style={{ fontSize: 12 }}>
                            {s.agencyName || s.agencyId || "N/A"}
                          </td>
                          <td>
                            <span className="pa-status-badge">
                              <i className="fa-solid fa-circle-check"></i>
                              Out-Scanned
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <button
                className={`pa-send-btn${ships.length ? "" : " pa-send-btn--disabled"}`}
                disabled={!ships.length}
                onClick={() => onSend(h.hubId, h.hubName, ships.length)}
              >
                <i className="fa-solid fa-paper-plane"></i>{" "}
                {ships.length
                  ? `Send Pre-Alert (${ships.length} shipment${
                      ships.length !== 1 ? "s" : ""
                    })`
                  : "No Shipments"}
              </button>
            </div>
          );
        })}
        {!hubs.length && <p className="empty-msg">No active hubs.</p>}
      </div>
    </div>
  );
}
