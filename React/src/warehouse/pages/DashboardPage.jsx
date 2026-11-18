import React from "react";
import { fmtDate } from "../utils/warehouseUtils.js";

export default function DashboardPage({
  user = {},
  greeting,
  today,
  stats,
  activityRows = [],
  onShipments,
  onPreAlerts,
}) {
  return (
    <div className="dashboard-page page-content">
      <section className="welcome-banner" aria-labelledby="warehouse-welcome">
        <div className="welcome-text">
          <p className="welcome-label">Welcome back,</p>
          <h2 className="welcome-heading" id="warehouse-welcome">
            {greeting},{" "}
            <span className="welcome-name-dynamic">
              {user.name || "Warehouse Admin"}
            </span>
            <span className="welcome-date"> · {today}</span>
          </h2>
          <p className="welcome-sub">
            Everything looks steady across all zones today. You have
            <span className="alert-count">
              {" "}
              {stats.shipments} pending shipment(s)
            </span>{" "}
            that require attention.
          </p>
          <div className="welcome-actions">
            <button
              className="btn-primary dash-new-shipment-btn"
              onClick={onShipments}
              type="button"
            >
              <i className="fa-solid fa-plus" aria-hidden="true"></i>
              New Shipment
            </button>
            <button
              className="btn-secondary dash-export-btn"
              onClick={onPreAlerts}
              type="button"
            >
              <i className="fa-solid fa-bell" aria-hidden="true"></i>
              Pre-Alerts
            </button>
          </div>
        </div>
        <div className="welcome-icon-wrap" aria-hidden="true">
          <i className="fa-solid fa-chart-simple welcome-icon"></i>
        </div>
      </section>

      <section className="stat-grid" aria-label="Warehouse summary">
        <article className="stat-card">
          <div className="stat-top">
            <div className="stat-icon-box">
              <i className="fa-solid fa-clipboard-check" aria-hidden="true"></i>
            </div>
            <span className="stat-badge stat-badge--green"></span>
          </div>
          <p className="stat-label">TOTAL INVENTORY</p>
          <p className="stat-value">{stats.inventory}</p>
          <span className="stat-unit">units</span>
        </article>
        <article className="stat-card">
          <div className="stat-top">
            <div className="stat-icon-box">
              <i className="fa-solid fa-box-open" aria-hidden="true"></i>
            </div>
            <span className="stat-badge stat-badge--orange"></span>
          </div>
          <p className="stat-label">PENDING SHIPMENTS</p>
          <p className="stat-value">{stats.shipments}</p>
          <span className="stat-unit">orders</span>
        </article>
        <article className="stat-card">
          <div className="stat-top">
            <div className="stat-icon-box">
              <i
                className="fa-solid fa-arrow-up-right-from-square"
                aria-hidden="true"
              ></i>
            </div>
            <span className="stat-badge stat-badge--blue"></span>
          </div>
          <p className="stat-label">OUTBOUND TODAY</p>
          <p className="stat-value">{stats.outbound}</p>
          <span className="stat-unit">dispatches</span>
        </article>
        <article className="stat-card">
          <div className="stat-top">
            <div className="stat-icon-box stat-icon-box--red">
              <i className="fa-solid fa-rotate-left" aria-hidden="true"></i>
            </div>
            <span className="stat-badge"></span>
          </div>
          <p className="stat-label">RTO REQUESTS</p>
          <p className="stat-value">{stats.rto}</p>
          <span className="stat-unit">returns</span>
        </article>
      </section>

      <section className="activity-card" aria-labelledby="warehouse-activity">
        <div className="activity-header">
          <div>
            <h3 className="activity-title" id="warehouse-activity">
              Warehouse Activity
            </h3>
            <p className="activity-sub">
              Monitoring shipments currently in transit
            </p>
          </div>
          <div className="live-pill">
            <span className="live-dot" aria-hidden="true"></span>
            LIVE UPDATES
          </div>
        </div>
        <div className="activity-table-wrap">
          <table className="activity-table">
            <thead>
              <tr>
                <th scope="col">TRACKING ID</th>
                <th scope="col">LAST UPDATE</th>
                <th scope="col">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {activityRows.length ? (
                activityRows.map((row, index) => (
                  <tr key={row._id || row.labelId || row.trackingId || index}>
                    <td>{row.labelId || row.trackingId || "—"}</td>
                    <td>
                      {fmtDate(
                        row.lastUpdated || row.updatedAt || row.addedAt,
                      )}
                    </td>
                    <td>
                      <span className="stat-badge stat-badge--green">
                        {row.status || "In Stock"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="activity-empty" colSpan="3">
                    No recent warehouse activity.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
