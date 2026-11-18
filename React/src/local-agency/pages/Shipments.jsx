import React, { useState } from "react";
import LocalAgencyStatusBadge from "../components/LocalAgencyStatusBadge.jsx";

export default function Shipments({ shipments }) {
  const [activeTab, setActiveTab] = useState("all");

  const filtered = shipments.filter((s) => {
    if (activeTab === "out") return s.status === "Out for Delivery";
    if (activeTab === "completed") return s.status === "Delivered";
    if (activeTab === "failed") return s.status === "Failed";
    if (activeTab === "rto") return s.status?.includes("RTO");
    return true;
  });

  return (
    <div className="shipments-page page-content">
      <div className="page-title-row">
        <div>
          <h2 className="page-title">Shipments</h2>
          <p className="page-subtitle">Manage shipments from transit hubs</p>
        </div>
      </div>
      <div className="tab-row">
        {[
          ["all", "All Shipments"],
          ["out", "Out for Delivery"],
          ["completed", "Completed"],
          ["failed", "Failed"],
          ["rto", "RTO"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`tab-btn${activeTab === key ? " tab-active" : ""}`}
            data-tab={key}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>TRACKING ID</th>
              <th>ORIGIN WAREHOUSE</th>
              <th>CUSTOMER NAME</th>
              <th>DELIVERY ADDRESS</th>
              <th>ASSIGNED AGENT</th>
              <th>ATTEMPTS</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody id="shipments-tbody">
            {filtered.map((s, i) => (
              <tr key={i}>
                <td>
                  <strong style={{ color: "#1e293b" }}>{s.trackingId}</strong>
                </td>
                <td style={{ fontSize: 13, color: "#64748b" }}>
                  {s.originWarehouse || s.warehouseName || "—"}
                </td>
                <td>
                  <div style={{ fontWeight: 500 }}>{s.customerName || "—"}</div>
                </td>
                <td
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    maxWidth: 160,
                    lineHeight: 1.4,
                    whiteSpace: "normal",
                  }}
                >
                  {s.customerAddress || "—"}
                </td>
                <td>
                  {s.agentName ? (
                    s.agentName
                  ) : (
                    <span
                      style={{
                        color: "#94a3b8",
                        fontSize: 12,
                        fontStyle: "italic",
                      }}
                    >
                      Unassigned
                    </span>
                  )}
                </td>
                <td style={{ textAlign: "center", fontWeight: 600 }}>
                  {s.attemptCount ?? s.attempts ?? 0}
                </td>
                <td>
                  <LocalAgencyStatusBadge status={s.status} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}
                >
                  No shipments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
