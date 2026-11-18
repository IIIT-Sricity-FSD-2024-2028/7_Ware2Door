import React from "react";
import { downloadCsv } from "../../utils/dataExport.js";

const headers = [
  "Tracking ID",
  "Destination Hub",
  "Local Agency",
  "Departure Time",
  "Driver & Vehicle",
];

export default function OutboundPage({
  shipments,
  fmtDate,
  onExportError,
}) {
  const exportData = () => {
    try {
      downloadCsv(
        "warehouse-outbound-shipments.csv",
        headers,
        shipments.map((shipment) => [
          shipment.trackingId,
          shipment.hubName || shipment.hubId,
          shipment.agencyName || shipment.agencyId,
          fmtDate(shipment.createdAt),
          `${shipment.driverName || "Unassigned"} / ${shipment.vehicleNo || "N/A"}`,
        ]),
      );
    } catch (error) {
      onExportError(error.message || "Unable to export outbound data.");
    }
  };

  return (
    <div className="outbound-page page-content">
      <div className="page-title-row">
        <div>
          <h2 className="page-title">Outbound</h2>
          <p className="page-subtitle">
            Monitor shipments leaving the warehouse to transit hubs.
          </p>
        </div>
        <button className="btn-secondary-dark" onClick={exportData}>
          <i className="fa-solid fa-download"></i> Export Data
        </button>
      </div>
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>TRACKING ID</th>
              <th>DESTINATION HUB</th>
              <th>LOCAL AGENCY</th>
              <th>DEPARTURE TIME</th>
              <th>DRIVER &amp; VEHICLE</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s, i) => (
              <tr key={i}>
                <td>{s.trackingId}</td>
                <td>{s.hubName || s.hubId}</td>
                <td>{s.agencyName || s.agencyId}</td>
                <td>{fmtDate(s.createdAt)}</td>
                <td>
                  {s.driverName || "Unassigned"} / {s.vehicleNo || "N/A"}
                </td>
              </tr>
            ))}
            {!shipments.length && (
              <tr>
                <td colSpan="5" className="empty-msg">
                  No outbound shipments.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
