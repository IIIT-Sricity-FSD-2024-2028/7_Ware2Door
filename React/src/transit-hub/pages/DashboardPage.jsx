import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setTransitHubPage,
  setTransitHubScanMode,
} from "../store/slices/transitHubUiSlice.js";

export default function DashboardPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.session?.user || {});
  const stats = useSelector((state) => state.transitHub.data.stats);
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
  const navigate = (page) => dispatch(setTransitHubPage(page));
  const onScan = () => navigate("scan");
  const onInventory = () => navigate("hub-inv");
  const onReports = () => navigate("reports");
  const onInscan = () => {
    dispatch(setTransitHubScanMode("inscan"));
    onScan();
  };
  const onOutscan = () => {
    dispatch(setTransitHubScanMode("outscan"));
    onScan();
  };
  const capacity = Math.min(
    100,
    Math.round((stats.capacity / Math.max(stats.maxCapacity, 1)) * 100),
  );

  return (
    <div className="dashboard-page page-content" id="page-dashboard">
      <div className="welcome-banner">
        <div className="welcome-text">
          <p className="welcome-label">Welcome back,</p>
          <h2 className="welcome-heading">
            <span>{greeting},</span>
            <span> {user.name}</span>
            <span> · {today}</span>
          </h2>
          <p className="welcome-sub">
            Everything looks steady across all zones today. You have{" "}
            <span className="alert-count">{stats.pending} pending scan(s)</span>{" "}
            that require attention.
          </p>
          <div className="welcome-actions">
            <button className="btn-primary dash-scan-btn" onClick={onScan}>
              <i className="fa-solid fa-barcode"></i> Scan Package
            </button>
            <button
              className="btn-secondary-dark"
              onClick={onReports}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                fontFamily: "'Poppins',sans-serif",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 7,
                border: "none",
                transition: "0.2s",
              }}
            >
              <i className="fa-regular fa-file-lines"></i> Export Reports
            </button>
          </div>
        </div>
        <div className="welcome-icon-wrap">
          <i className="fa-solid fa-chart-bar welcome-icon"></i>
        </div>
      </div>
      <div className="stat-grid">
        <StatCard
          icon="fa-right-to-bracket"
          badge="+Active"
          value={stats.inbound}
          label="INBOUND TODAY"
        />
        <StatCard
          icon="fa-clipboard-list"
          badge="Pending"
          value={stats.pending}
          label="PENDING SCANS"
          badgeClass="stat-badge--orange"
        />
        <StatCard
          icon="fa-right-from-bracket"
          badge="Steady"
          value={stats.outbound}
          label="OUTBOUND TODAY"
        />
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon-box stat-icon-box--orange">
              <i className="fa-solid fa-warehouse"></i>
            </div>
            <span className="stat-badge stat-badge--orange">Capacity</span>
          </div>
          <p className="stat-label">HUB CAPACITY</p>
          <p className="stat-value">{capacity}%</p>
          <div className="cap-bar-dash">
            <div
              className="cap-fill-dash"
              style={{ width: `${capacity}%` }}
            ></div>
          </div>
        </div>
      </div>
      <div className="dash-bottom-grid">
        <div className="activity-card" style={{ flex: 2 }}>
          <div className="activity-header">
            <div>
              <h3 className="activity-title">Quick Operations</h3>
              <p className="activity-sub">
                Jump directly into scanning activities
              </p>
            </div>
          </div>
          <QuickOperation
            icon="fa-right-to-bracket"
            className="qa-icon--blue"
            label="Start In-Scan"
            onClick={onInscan}
          />
          <QuickOperation
            icon="fa-right-from-bracket"
            className="qa-icon--orange"
            label="Start Out-Scan"
            onClick={onOutscan}
          />
          <QuickOperation
            icon="fa-boxes-stacked"
            className="qa-icon--green"
            label="View Inventory"
            onClick={onInventory}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  badge,
  value,
  label,
  badgeClass = "stat-badge--blue",
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <div className="stat-icon-box">
          <i className={`fa-solid ${icon}`}></i>
        </div>
        <span className={`stat-badge ${badgeClass}`}>{badge}</span>
      </div>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      <span className="stat-unit">packages</span>
    </div>
  );
}

function QuickOperation({ icon, className, label, onClick }) {
  return (
    <div className="qa-item" onClick={onClick}>
      <div className={`qa-icon ${className}`}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <span>{label}</span>
      <i className="fa-solid fa-chevron-right qa-arrow"></i>
    </div>
  );
}
