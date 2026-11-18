import React, { useMemo } from "react";
import { statBadgeClass } from "../utils/helpers.js";

export default function Dashboard({ user, shipments, agents, goTo }) {
  const stats = useMemo(
    () => ({
      totalShipments: shipments.length,
      pending: shipments.filter((s) => s.status === "Pending").length,
      outDelivery: shipments.filter((s) => s.status === "Out for Delivery")
        .length,
      rtoPending: shipments.filter((s) => s.status?.includes("RTO")).length,
    }),
    [shipments],
  );
  const activeDeliveries = shipments
    .filter((s) => s.status === "Out for Delivery" || s.status === "Pending")
    .slice(0, 5);
  const agentsOnDuty = agents.filter((a) => a.status === "Active").length;
  const agentsBusy = agents.filter((a) => a.status === "Busy").length;
  const agentsOff = agents.filter((a) => a.status === "Offline").length;

  const now = new Date();
  const todayStr = now.toLocaleDateString("en-IN", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const firstName = (user.name || "").split(" ")[0] || "LB";

  return (
    <div className="dashboard-page page-content">
      <div className="welcome-banner">
        <div className="welcome-text">
          <p className="welcome-label">Welcome back,</p>
          <h2 className="welcome-heading">
            Good Day, <span className="welcome-name-dynamic">{firstName}</span>
            <span className="welcome-date"> — {todayStr}</span>
          </h2>
          <p className="welcome-sub">
            Everything looks steady across all zones today. You have{" "}
            <span className="alert-count">
              <span style={{ color: "#f4a32a", fontWeight: 600 }}>
                {stats.rtoPending} critical alert
                {stats.rtoPending !== 1 ? "s" : ""}
              </span>
            </span>{" "}
            that require attention.
          </p>
          <div className="welcome-actions">
            <button
              className="btn-primary dash-scan-btn"
              onClick={() => goTo("scan", "Scan Operations")}
            >
              <i className="fa-solid fa-barcode"></i> Scan Package
            </button>
          </div>
        </div>
        <div className="welcome-icon-wrap">
          <i className="fa-solid fa-truck-fast welcome-icon"></i>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon-box">
              <i className="fa-solid fa-clipboard-list"></i>
            </div>
            <span className="stat-badge stat-badge--blue">+12%↑</span>
          </div>
          <p className="stat-label">TOTAL SHIPMENTS</p>
          <p className="stat-value" id="dash-total-shipments">
            {stats.totalShipments}
          </p>
          <span className="stat-unit">packages</span>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon-box">
              <i className="fa-solid fa-box-open"></i>
            </div>
            <span className="stat-badge stat-badge--orange">Today</span>
          </div>
          <p className="stat-label">PENDING DELIVERIES</p>
          <p className="stat-value" id="dash-pending">
            {stats.pending}
          </p>
          <span className="stat-unit">packages</span>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon-box">
              <i className="fa-solid fa-truck"></i>
            </div>
            <span className="stat-badge stat-badge--blue">In Transit</span>
          </div>
          <p className="stat-label">OUT FOR DELIVERY</p>
          <p className="stat-value" id="dash-out-delivery">
            {stats.outDelivery}
          </p>
          <span className="stat-unit">packages</span>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon-box stat-icon-box--red">
              <i className="fa-solid fa-rotate-left"></i>
            </div>
            <span className="stat-badge stat-badge--orange">Action Needed</span>
          </div>
          <p className="stat-label">RTO PENDING</p>
          <p className="stat-value" id="dash-rto-pending">
            {stats.rtoPending}
          </p>
          <span className="stat-unit">returns</span>
        </div>
      </div>

      <div className="dash-bottom-grid">
        <div className="activity-card" style={{ flex: 2 }}>
          <div className="activity-header">
            <div>
              <h3 className="activity-title">Active Deliveries</h3>
              <p className="activity-sub">
                Monitoring shipments currently in transit
              </p>
            </div>
            <button
              className="btn-ghost"
              onClick={() => goTo("shipments", "Shipments")}
            >
              View All
            </button>
          </div>
          <table className="activity-table">
            <thead>
              <tr>
                <th>TRACKING ID</th>
                <th>CUSTOMER</th>
                <th>AGENT</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody id="dash-activity-tbody">
              {activeDeliveries.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      textAlign: "center",
                      color: "#94a3b8",
                      padding: 18,
                      fontSize: 13,
                    }}
                  >
                    No active deliveries.
                  </td>
                </tr>
              )}
              {activeDeliveries.map((d, i) => (
                <tr key={i}>
                  <td>{d.trackingId}</td>
                  <td>{d.customerName}</td>
                  <td>{d.agentName || "—"}</td>
                  <td>
                    <span className={`stat-badge ${statBadgeClass(d.status)}`}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="quick-actions-card">
          <h3 className="activity-title" style={{ marginBottom: 16 }}>
            Quick Actions
          </h3>
          <div
            className="qa-item"
            onClick={() => goTo("rto", "RTO Management")}
          >
            <div className="qa-icon qa-icon--red">
              <i className="fa-solid fa-rotate-left"></i>
            </div>
            <span>Raise RTO Request</span>
            <i className="fa-solid fa-chevron-right qa-arrow"></i>
          </div>
          <div
            className="qa-item"
            onClick={() => goTo("delivery", "Shipment Delivery")}
          >
            <div className="qa-icon qa-icon--orange">
              <i className="fa-solid fa-shield-check"></i>
            </div>
            <span>Verify OTP</span>
            <i className="fa-solid fa-chevron-right qa-arrow"></i>
          </div>
          <div className="agent-avail-section">
            <h4 className="agent-avail-title">AGENT AVAILABILITY</h4>
            <div className="agent-avail-row">
              <span className="avail-dot avail-green"></span>
              <span className="avail-label">On Duty</span>
              <span className="avail-count" id="agents-on-duty">
                {agentsOnDuty}
              </span>
            </div>
            <div className="agent-avail-row">
              <span className="avail-dot avail-orange"></span>
              <span className="avail-label">Busy</span>
              <span className="avail-count" id="agents-busy">
                {agentsBusy}
              </span>
            </div>
            <div className="agent-avail-row">
              <span className="avail-dot avail-grey"></span>
              <span className="avail-label">Off Duty</span>
              <span className="avail-count" id="agents-off">
                {agentsOff}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
