import React from "react";
import { downloadCsv } from "../../utils/dataExport.js";
export default function RtoPage({
  data,
  search,
  status,
  reason,
  scanId,
  onSearch,
  onStatus,
  onReason,
  onScanId,
  onInscan,
  page,
  perPage,
  onPage,
  fmtDate,
  onExportError,
}) {
  const rows = data.filter(
    (r) =>
      (!search ||
        `${r.trackingId} ${r.customerName}`
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (!status || r.status === status) &&
      (!reason || r.reason === reason),
  );
  const pages = Math.max(1, Math.ceil(rows.length / perPage));
  const visibleRows = rows.slice((page - 1) * perPage, page * perPage);
  const exportData = () => {
    try {
      downloadCsv(
        "warehouse-rto-requests.csv",
        [
          "Tracking ID",
          "Customer",
          "RTO Reason",
          "Return Status",
          "Last Scanned",
          "Date",
        ],
        rows.map((request) => [
          request.trackingId,
          request.customerName,
          request.reason || "—",
          request.status,
          fmtDate(request.lastScannedAt),
          fmtDate(request.createdAt),
        ]),
      );
    } catch (error) {
      onExportError(error.message || "Unable to export RTO data.");
    }
  };

  return (
    <div className="rto-page page-content">
      <div className="page-title-row">
        <div>
          <h2 className="page-title">Manage RTO</h2>
          <p className="page-subtitle">
            Track and manage return-to-origin shipments from local delivery
            agencies.
          </p>
        </div>
        <button className="btn-secondary-dark" onClick={exportData}>
          <i className="fa-solid fa-download"></i> Export Data
        </button>
      </div>
      <div className="stat-grid rto-stat-grid">
        <div className="stat-card">
          <p className="stat-label">TOTAL RTO REQUESTS</p>
          <p className="stat-value">{rows.length}</p>
          <span className="stat-unit">returns</span>
        </div>
        <div className="stat-card">
          <p className="stat-label">IN TRANSIT</p>
          <p className="stat-value">
            {
              rows.filter((r) => r.status === "RTO In Transit to Warehouse")
                .length
            }
          </p>
          <span className="stat-unit">shipments</span>
        </div>
        <div className="stat-card">
          <p className="stat-label">RECEIVED TO STOCK</p>
          <p className="stat-value">
            {rows.filter((r) => r.status === "Returned to Warehouse").length}
          </p>
          <span className="stat-unit">restocked</span>
        </div>
      </div>
      <div className="filter-row">
        <div className="search-box" style={{ flex: 1 }}>
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            placeholder="Search by tracking ID, order ID or customer..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={status}
          onChange={(e) => onStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option>RTO Initiated</option>
          <option>RTO At Hub</option>
          <option>RTO In Transit to Warehouse</option>
          <option>Returned to Warehouse</option>
        </select>
        <select
          className="filter-select"
          value={reason}
          onChange={(e) => onReason(e.target.value)}
        >
          <option value="">All Reasons</option>
          <option>Customer Unavailable</option>
          <option>Incorrect Address</option>
          <option>Refused by Customer</option>
          <option>3 OTP Failures</option>
        </select>
      </div>
      <div className="card-white">
        <h3>RTO Warehouse Inscan</h3>
        <div className="search-box">
          <input
            placeholder="Enter RTO ID (e.g. RTOID-1746280000-001)"
            value={scanId}
            onChange={(e) => onScanId(e.target.value)}
          />
          <button className="btn-primary" onClick={onInscan}>
            Inscan RTO
          </button>
        </div>
      </div>
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>TRACKING ID</th>
              <th>CUSTOMER</th>
              <th>RTO REASON</th>
              <th>RETURN STATUS</th>
              <th>LAST SCANNED</th>
              <th>DATE</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((r, i) => (
              <tr key={i}>
                <td>{r.trackingId}</td>
                <td>{r.customerName}</td>
                <td>
                  <span className="rto-reason-badge">{r.reason || "—"}</span>
                </td>
                <td>
                  <span
                    className={`rto-status-badge ${
                      r.status === "Returned to Warehouse"
                        ? "rto-status-received"
                        : "rto-status-transit"
                    }`}
                  >
                    <i className="fa-solid fa-circle"></i>
                    {r.status}
                  </span>
                </td>
                <td>{fmtDate(r.lastScannedAt)}</td>
                <td>{fmtDate(r.createdAt)}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan="6" className="empty-msg">
                  No RTO records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {rows.length > 0 && (
          <div className="pagination-bar">
            <span className="pg-info">
              Showing {(page - 1) * perPage + 1}-
              {Math.min(page * perPage, rows.length)} of {rows.length}
            </span>
            <button
              className="pg-btn"
              disabled={page <= 1}
              onClick={() => onPage(page - 1)}
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            {Array.from({ length: pages }, (_, index) => index + 1).map(
              (number) => (
                <button
                  key={number}
                  className={`pg-btn${number === page ? " active" : ""}`}
                  onClick={() => onPage(number)}
                >
                  {number}
                </button>
              ),
            )}
            <button
              className="pg-btn"
              disabled={page >= pages}
              onClick={() => onPage(page + 1)}
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
