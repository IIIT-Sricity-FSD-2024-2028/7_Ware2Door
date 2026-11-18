import React, { useState } from "react";
import { fmtDate } from "../utils/helpers.js";
import LocalAgencyModal from "../components/LocalAgencyModal.jsx";
import LocalAgencyStatusBadge from "../components/LocalAgencyStatusBadge.jsx";

export default function RtoManagement({ rto }) {
  const [selectedRto, setSelectedRto] = useState(null);
  const total = rto.length;
  const inTransit = rto.filter((r) => r.status?.includes("Transit")).length;
  const approved = rto.filter(
    (r) => r.status === "Returned to Warehouse",
  ).length;

  return (
    <div className="rto-page page-content">
      <div className="page-title-row">
        <div>
          <h2 className="page-title">RTO Management</h2>
          <p className="page-subtitle">
            Initiate and track return-to-origin requests for failed deliveries.
          </p>
        </div>
      </div>

      <div className="stat-grid rto-stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon-box stat-icon-box--red">
              <i className="fa-solid fa-rotate-left"></i>
            </div>
            <span className="stat-badge stat-badge--orange"></span>
          </div>
          <p className="stat-label">TOTAL RTO REQUESTS</p>
          <p className="stat-value" id="rto-total">
            {total}
          </p>
          <span className="stat-unit">requests</span>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon-box">
              <i className="fa-solid fa-truck"></i>
            </div>
            <span className="stat-badge stat-badge--blue"></span>
          </div>
          <p className="stat-label">IN TRANSIT BACK</p>
          <p className="stat-value" id="rto-transit">
            {inTransit}
          </p>
          <span className="stat-unit">packages</span>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon-box" style={{ background: "#dcfce7" }}>
              <i
                className="fa-solid fa-check-circle"
                style={{ color: "#16a34a" }}
              ></i>
            </div>
            <span className="stat-badge stat-badge--green"></span>
          </div>
          <p className="stat-label">APPROVED</p>
          <p className="stat-value" id="rto-approved">
            {approved}
          </p>
          <span className="stat-unit">requests</span>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header-row">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <i
              className="fa-solid fa-rotate-left"
              style={{ color: "#ef4444" }}
            ></i>
            <strong>RTO Requests</strong>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>TRACKING ID</th>
              <th>CUSTOMER</th>
              <th>AGENT</th>
              <th>REASON</th>
              <th>STATUS</th>
              <th>DATE</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody id="rto-tbody">
            {rto.map((r, i) => (
              <tr key={i}>
                <td>{r.trackingId}</td>
                <td>{r.customerName || "—"}</td>
                <td>{r.agentName || "—"}</td>
                <td>{r.reason}</td>
                <td>
                  <LocalAgencyStatusBadge status={r.status} />
                </td>
                <td>{fmtDate(r.createdAt)}</td>
                <td>
                  <button
                    className="action-btn view"
                    title="View RTO details"
                    onClick={() => setSelectedRto(r)}
                  >
                    <i className="fa-solid fa-eye"></i>
                  </button>
                </td>
              </tr>
            ))}
            {rto.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-msg">
                  No RTO records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <LocalAgencyModal
        id="rto-details-modal"
        open={Boolean(selectedRto)}
        onClose={() => setSelectedRto(null)}
      >
        <div className="modal-header modal-header--dark">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <i
              className="fa-solid fa-rotate-left"
              style={{ color: "white", fontSize: 16 }}
            ></i>
            <div>
              <h3 style={{ color: "white" }}>RTO Details</h3>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.65)",
                }}
              >
                {selectedRto?.trackingId}
              </p>
            </div>
          </div>
          <button
            className="modal-close modal-close--light"
            onClick={() => setSelectedRto(null)}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-field">
            <label>RTO ID</label>
            <div>{selectedRto?.rtoId || selectedRto?.id || "—"}</div>
          </div>
          <div className="modal-field">
            <label>Reason</label>
            <div>{selectedRto?.reason || "No reason provided."}</div>
          </div>
          {selectedRto?.notes && (
            <div className="modal-field">
              <label>Notes</label>
              <div>{selectedRto.notes}</div>
            </div>
          )}
          <div className="modal-field">
            <label>Status</label>
            <LocalAgencyStatusBadge status={selectedRto?.status} />
          </div>
        </div>
        <div className="modal-footer">
          <button
            className="modal-cancel"
            onClick={() => setSelectedRto(null)}
          >
            Close
          </button>
        </div>
      </LocalAgencyModal>
    </div>
  );
}
