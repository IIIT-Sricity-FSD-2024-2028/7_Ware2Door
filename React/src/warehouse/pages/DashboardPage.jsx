import React from "react";
import { useSelector } from "react-redux";
import { fmtDate } from "../utils/warehouseUtils.js";
import { setWarehousePage } from "../store/slices/warehouseUiSlice.js";
import { useDispatch } from "react-redux";

export default function DashboardPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.session?.user || {});
  const { inventory, pending, outbound, rtos } = useSelector(
    (state) => state.warehouse.data,
  );
  const stats = {
    inventory: inventory.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    ),
    shipments: pending.length,
    outbound: outbound.length,
    rto: rtos.length,
  };
  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12
      ? "Good Morning"
      : greetingHour < 17
        ? "Good Afternoon"
        : "Good Evening";
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="dashboard-page page-content">
      <div className="welcome-banner">
        <div className="welcome-text">
          <p className="welcome-label">Welcome back,</p>
          <h2 className="welcome-heading">
            {greeting},{" "}
            <span className="welcome-name-dynamic">{user.name}</span>
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
              onClick={() => dispatch(setWarehousePage("shipments"))}
            >
              <i className="fa-solid fa-plus"></i> New Shipment
            </button>
            <button
              className="btn-secondary dash-export-btn"
              onClick={() => dispatch(setWarehousePage("prealert"))}
            >
              <i className="fa-solid fa-bell"></i> Pre-Alerts
            </button>
          </div>
        </div>
        <div className="welcome-icon-wrap">
          <i className="fa-solid fa-chart-simple welcome-icon"></i>
        </div>
      </div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon-box">
              <i className="fa-solid fa-clipboard-check"></i>
            </div>
            <span className="stat-badge stat-badge--green"></span>
          </div>
          <p className="stat-label">TOTAL INVENTORY</p>
          <p className="stat-value" id="dash-inventory">
            {stats.inventory}
          </p>
          <span className="stat-unit">units</span>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon-box">
              <i className="fa-solid fa-box-open"></i>
            </div>
            <span
              className="stat-badge stat-badge--orange"
              id="dash-shipment-badge"
            ></span>
          </div>
          <p className="stat-label">PENDING SHIPMENTS</p>
          <p className="stat-value" id="dash-shipments">
            {stats.shipments}
          </p>
          <span className="stat-unit">orders</span>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon-box">
              <i className="fa-solid fa-arrow-up-right-from-square"></i>
            </div>
            <span
              className="stat-badge stat-badge--blue"
              id="dash-outbound-badge"
            ></span>
          </div>
          <p className="stat-label">OUTBOUND TODAY</p>
          <p className="stat-value" id="dash-outbound">
            {stats.outbound}
          </p>
          <span className="stat-unit">dispatches</span>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon-box stat-icon-box--red">
              <i className="fa-solid fa-rotate-left"></i>
            </div>
            <span className="stat-badge"></span>
          </div>
          <p className="stat-label">RTO REQUESTS</p>
          <p className="stat-value" id="dash-rto">
            {stats.rto}
          </p>
          <span className="stat-unit">returns</span>
        </div>
      </div>
      <div className="activity-card">
        <div className="activity-header">
          <div>
            <h3 className="activity-title">Warehouse Activity</h3>
            <p className="activity-sub">
              Monitoring shipments currently in transit
            </p>
          </div>
          <div className="live-pill">
            <span className="live-dot"></span> LIVE UPDATES
          </div>
        </div>
        <table className="activity-table">
          <thead>
            <tr>
              <th>TRACKING ID</th>
              <th>LAST UPDATE</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody id="activity-tbody">
            {inventory.slice(0, 5).map((row, i) => (
              <tr key={i}>
                <td>{row.labelId || row.trackingId || "—"}</td>
                <td>{fmtDate(row.lastUpdated || row.updatedAt || row.addedAt)}</td>
                <td>
                  <span className="stat-badge stat-badge--green">
                    {row.status || "In Stock"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
