import React, { useState } from "react";
import { localAgencyApi } from "../api/localAgencyApi.js";
import {
  normalizeIdentifier,
  validateTrackingId,
} from "../../utils/inputValidation.js";

export default function ScanOperations({
  agencyId,
  showToast,
  inbound: inboundList = [],
  agents = [],
  scanHistory: initialScanHistory = [],
  loadShipments,
  loadInbound,
  loadAgents,
  loadScanHistory,
}) {
  const [scanInput, setScanInput] = useState("");
  const [outscanInput, setOutscanInput] = useState("");
  const [scanMode, setScanMode] = useState("in-scan");
  const [scanSearch, setScanSearch] = useState("");
  const [agentPickerShipment, setAgentPickerShipment] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const scanHistory = initialScanHistory;
  const [unknownErrors, setUnknownErrors] = useState(0);

  const refreshHistory = async () => {
    await Promise.all([loadScanHistory(), loadShipments(), loadInbound()]);
  };

  async function doInscan() {
    const id = normalizeIdentifier(scanInput);
    const validationError = validateTrackingId(id);
    if (validationError) {
      showToast(validationError, true);
      return;
    }
    try {
      const r = await localAgencyApi.inscan(agencyId, id);
      if (r && r.status === "success") {
        showToast(`✓ ${id} successfully scanned in.`);
      } else {
        setUnknownErrors((v) => v + 1);
        showToast(r?.flagMsg || "Scan failed.", true);
      }
      setScanInput("");
      await refreshHistory();
    } catch (e) {
      setUnknownErrors((v) => v + 1);
      showToast(e.message, true);
    }
  }

  async function doOutscan(trackingId) {
    const id = normalizeIdentifier(trackingId);
    const validationError = validateTrackingId(id);
    if (validationError) {
      showToast(validationError, true);
      return;
    }
    try {
      const r = await localAgencyApi.outscan(agencyId, id);
      if (r && r.status === "success") {
        showToast(
          `✓ Out-Scan complete for ${id}${r.agentName ? " → " + r.agentName : ""}`,
        );
      } else {
        showToast(r?.flagMsg || "Out-scan failed.", true);
      }
      await refreshHistory();
    } catch (e) {
      showToast(e.message, true);
    }
  }

  async function doOutscanInput() {
    const id = normalizeIdentifier(outscanInput);
    const validationError = validateTrackingId(id);
    if (validationError) {
      showToast(validationError, true);
      return;
    }
    await doOutscan(id);
    setOutscanInput("");
  }

  async function confirmAgentAssignment() {
    if (!agentPickerShipment || !selectedAgentId) return;
    const validationError = validateTrackingId(agentPickerShipment);
    if (validationError) {
      showToast(validationError, true);
      return;
    }
    const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);
    try {
      const result = await localAgencyApi.assignAgent(agencyId, {
        trackingId: agentPickerShipment,
        agentId: selectedAgentId,
      });
      if (!result?.success)
        throw new Error(result?.error || "Unable to assign delivery agent.");
      showToast(
        `✓ ${selectedAgent?.name || "Agent"} assigned to ${agentPickerShipment}`,
      );
      setAgentPickerShipment(null);
      setSelectedAgentId("");
      await Promise.all([loadInbound(), loadShipments(), loadAgents()]);
    } catch (error) {
      showToast(error.message || "Unable to assign delivery agent.", true);
    }
  }

  const scannedIn = scanHistory.filter(
    (s) => s.status === "Scanned In" || s.status === "Out-Scanned",
  ).length;
  const flaggedCount =
    scanHistory.filter((s) => s.flagged).length + unknownErrors;
  const totalToday = inboundList.length;

  const q = scanSearch.toLowerCase();
  const inscanRows = scanHistory.filter(
    (s) =>
      !q ||
      (s.trackingId || "").toLowerCase().includes(q) ||
      (s.orderId || "").toLowerCase().includes(q),
  );
  const outscanRows = inboundList.filter(
    (s) =>
      s.scanStatus === "in-scan" &&
      (!q || (s.trackingId || "").toLowerCase().includes(q)),
  );

  const fmtScan = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const inscanStatusCell = (s) => {
    if (s.status === "Scanned In")
      return (
        <span className="scan-badge scan-badge--scanned">
          <i className="fa-solid fa-circle-check"></i> Scanned In
        </span>
      );
    if (s.flagged)
      return (
        <span className="scan-badge scan-badge--flagged">
          <i className="fa-solid fa-triangle-exclamation"></i> {s.flagMsg}
        </span>
      );
    if (s.status === "Out-Scanned")
      return (
        <span
          className="scan-badge"
          style={{ background: "#eff6ff", color: "#2563eb" }}
        >
          <i className="fa-solid fa-truck"></i> Out-Scanned
        </span>
      );
    return (
      <span className="scan-badge scan-badge--flagged">
        <i className="fa-solid fa-circle-xmark"></i> {s.status}
      </span>
    );
  };

  return (
    <div className="scan-page page-content">
      <div className="page-title-row">
        <div>
          <h2 className="page-title" id="scan-page-title">
            {scanMode === "in-scan"
              ? "In-Scan Operations"
              : "Out-Scan Operations"}
          </h2>
          <p className="page-subtitle" id="scan-page-subtitle">
            {scanMode === "in-scan"
              ? "Register incoming packages and update real-time inventory."
              : "Assign delivery agents and dispatch packages for last-mile delivery."}
          </p>
        </div>
      </div>

      {scanMode === "in-scan" && (
        <div
          id="scan-input-bar"
          className="card-white"
          style={{ marginBottom: 24 }}
        >
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 11,
              fontWeight: 600,
              color: "#94a3b8",
              letterSpacing: "0.06em",
            }}
          >
            TRACKING ID
          </p>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 10,
                border: "2px solid #f4a32a",
                borderRadius: 10,
                padding: "12px 16px",
                background: "white",
              }}
            >
              <i
                className="fa-solid fa-barcode"
                style={{ color: "#94a3b8", fontSize: 16, flexShrink: 0 }}
              ></i>
              <input
                type="text"
                id="scan-tracking-input"
                placeholder="Enter or scan tracking number (e.g. WD-8892-XT)"
                style={{
                  border: "none",
                  outline: "none",
                  flex: 1,
                  fontFamily: "'Poppins',sans-serif",
                  fontSize: 14,
                  color: "#334155",
                  background: "transparent",
                }}
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") doInscan();
                }}
              />
            </div>
            <button
              className="btn-primary"
              id="scan-submit-btn"
              style={{
                padding: "13px 22px",
                fontSize: 14,
                whiteSpace: "nowrap",
              }}
              onClick={doInscan}
            >
              <i className="fa-solid fa-barcode"></i> In-Scan Package
            </button>
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#94a3b8" }}>
            <i
              className="fa-solid fa-circle-info"
              style={{ marginRight: 4 }}
            ></i>
            Supports 1D and 2D barcodes. Scanned items will appear in the table
            below immediately.
          </p>
        </div>
      )}

      <div
        className="stat-grid"
        style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 24 }}
      >
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon-box">
              <i className="fa-solid fa-box"></i>
            </div>
            <span className="stat-badge stat-badge--blue">Today</span>
          </div>
          <p className="stat-label">TOTAL TODAY</p>
          <p className="stat-value" id="scan-total-today">
            {totalToday}
          </p>
          <span className="stat-unit">packages</span>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon-box" style={{ background: "#dcfce7" }}>
              <i
                className="fa-solid fa-circle-check"
                style={{ color: "#16a34a" }}
              ></i>
            </div>
          </div>
          <p className="stat-label">SUCCESSFUL SCANS</p>
          <p className="stat-value" id="scan-successful">
            {scannedIn}
          </p>
          <span className="stat-unit">scanned</span>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon-box" style={{ background: "#fee2e2" }}>
              <i
                className="fa-solid fa-triangle-exclamation"
                style={{ color: "#ef4444" }}
              ></i>
            </div>
            <span className="stat-badge stat-badge--orange">Action Needed</span>
          </div>
          <p className="stat-label">FLAGGED ERRORS</p>
          <p className="stat-value" id="scan-flagged-errors">
            {flaggedCount}
          </p>
          <span className="stat-unit">errors</span>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header-row">
          <div
            style={{
              display: "flex",
              gap: 4,
              background: "#f1f5f9",
              padding: 4,
              borderRadius: 10,
            }}
          >
            <button
              id="scan-tab-inscan"
              className={`scan-tab${scanMode === "in-scan" ? " scan-tab-active" : ""}`}
              onClick={() => setScanMode("in-scan")}
            >
              In-scan
            </button>
            <button
              id="scan-tab-outscan"
              className={`scan-tab${scanMode === "out-scan" ? " scan-tab-active" : ""}`}
              onClick={() => setScanMode("out-scan")}
            >
              Out-scan
            </button>
          </div>
          <div className="search-box" style={{ width: 220 }}>
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              id="scan-search-input"
              placeholder="Search Package ID..."
              value={scanSearch}
              onChange={(e) => setScanSearch(e.target.value)}
            />
          </div>
        </div>

        {scanMode === "in-scan" && (
          <table className="data-table" id="inscan-table">
            <thead>
              <tr>
                <th>TRACKING ID</th>
                <th>STATUS</th>
                <th>ORIGIN</th>
                <th>TIMESTAMP</th>
              </tr>
            </thead>
            <tbody id="inscan-tbody">
              {inscanRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty-msg" style={{ padding: 30 }}>
                    <i
                      className="fa-solid fa-barcode"
                      style={{
                        fontSize: 28,
                        color: "#cbd5e1",
                        display: "block",
                        marginBottom: 8,
                      }}
                    ></i>
                    Scan a package above to see it logged here.
                  </td>
                </tr>
              )}
              {inscanRows.map((s, i) => {
                const originText =
                  !s.productName || s.productName === "—"
                    ? "No origin found"
                    : s.productName;
                const originStyle =
                  !s.productName || s.productName === "—"
                    ? { color: "#cbd5e1", fontStyle: "italic", fontSize: 13 }
                    : { color: "#64748b", fontSize: 13 };
                return (
                  <tr key={i}>
                    <td>
                      <strong style={{ color: "#1e293b" }}>
                        {s.trackingId}
                      </strong>
                    </td>
                    <td>{inscanStatusCell(s)}</td>
                    <td style={originStyle}>{originText}</td>
                    <td style={{ fontSize: 12, color: "#94a3b8" }}>
                      {fmtScan(s.scannedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {scanMode === "out-scan" && (
          <table className="data-table" id="outscan-table">
            <thead>
              <tr>
                <th>TRACKING ID</th>
                <th>DESTINATION AGENCY</th>
                <th>TIMESTAMP</th>
                <th>ASSIGNED AGENT</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody id="outscan-tbody">
              {outscanRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-msg">
                    No packages ready for out-scan.
                    <br />
                    <span style={{ fontSize: 12, color: "#cbd5e1" }}>
                      Complete in-scan first, then return here to assign agents
                      and dispatch.
                    </span>
                  </td>
                </tr>
              )}
              {outscanRows.map((s, i) => (
                <tr key={i}>
                  <td>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <i
                        className="fa-solid fa-cube"
                        style={{ color: "#94a3b8", fontSize: 14 }}
                      ></i>
                      <strong style={{ color: "#1e293b" }}>
                        {s.trackingId}
                      </strong>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: "#64748b" }}>
                    {s.hubName || "—"}
                  </td>
                  <td style={{ fontSize: 12, color: "#94a3b8" }}>
                    {s.updatedAt
                      ? fmtScan(
                        Array.isArray(s.updatedAt)
                          ? s.updatedAt[s.updatedAt.length - 1]
                          : s.updatedAt,
                      )
                      : "—"}
                  </td>
                  <td>
                    {s.assignedAgentName ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "#f4a32a",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {s.assignedAgentName
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 13,
                              color: "#1e293b",
                            }}
                          >
                            {s.assignedAgentName}
                          </div>
                          <div style={{ fontSize: 11, color: "#16a34a" }}>
                            Available
                          </div>
                        </div>
                        <i
                          className="fa-solid fa-circle-check"
                          style={{
                            color: "#16a34a",
                            fontSize: 13,
                            marginLeft: 4,
                          }}
                        ></i>
                      </div>
                    ) : (
                      <button
                        className="select-agent-btn"
                        onClick={() => {
                          setSelectedAgentId("");
                          setAgentPickerShipment(s.trackingId);
                        }}
                      >
                        <i className="fa-solid fa-user-circle"></i> Select Agent
                      </button>
                    )}
                  </td>
                  <td>
                    {s.assignedAgentName ? (
                      <button
                        className="btn-primary"
                        style={{
                          padding: "6px 16px",
                          fontSize: 12,
                          background: "#16a34a",
                        }}
                        onClick={() => doOutscan(s.trackingId)}
                      >
                        Outscan
                      </button>
                    ) : (
                      <button
                        style={{
                          padding: "6px 16px",
                          fontSize: 12,
                          background: "#e2e8f0",
                          color: "#94a3b8",
                          border: "none",
                          borderRadius: 8,
                          cursor: "not-allowed",
                          fontFamily: "'Poppins',sans-serif",
                          fontWeight: 500,
                        }}
                        disabled
                      >
                        Outscan
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {agentPickerShipment && (
        <div
          className="modal-overlay active"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setAgentPickerShipment(null);
              setSelectedAgentId("");
            }
          }}
        >
          <div className="modal" style={{ width: 680, maxWidth: "95vw" }}>
            <div className="modal-header modal-header--dark">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <i
                  className="fa-solid fa-people-carry-box"
                  style={{ color: "white", fontSize: 16 }}
                ></i>
                <div>
                  <h3 style={{ color: "white" }}>Select Delivery Agent</h3>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 12,
                      color: "rgba(255, 255, 255, 0.65)",
                    }}
                  >
                    Choose an agent to assign this shipment
                  </p>
                </div>
              </div>
              <button
                className="modal-close modal-close--light"
                onClick={() => {
                  setAgentPickerShipment(null);
                  setSelectedAgentId("");
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="modal-body" style={{ padding: 20 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  maxHeight: 400,
                  overflowY: "auto",
                }}
              >
                {agents.map((agent) => {
                  const statusDot =
                    agent.status === "Active"
                      ? "avail-green"
                      : agent.status === "Busy"
                        ? "avail-orange"
                        : "avail-grey";
                  return (
                    <button
                      key={agent.id}
                      type="button"
                      className={`agent-picker-card${selectedAgentId === agent.id ? " agent-picker-selected" : ""}`}
                      style={{ textAlign: "left", fontFamily: "inherit" }}
                      onClick={() => setSelectedAgentId(agent.id)}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            background: "#334155",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 15,
                            fontWeight: 700,
                          }}
                        >
                          {(agent.name || "?")
                            .split(" ")
                            .map((word) => word[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: "#f4a32a",
                            }}
                          >
                            {agent.assigned ?? 0}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: "#94a3b8",
                              letterSpacing: "0.04em",
                            }}
                          >
                            DELIVERIES
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: "#1e293b",
                          marginBottom: 5,
                        }}
                      >
                        {agent.name}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <span className={`avail-dot ${statusDot}`}></span>
                        <span style={{ fontSize: 12, color: "#64748b" }}>
                          {agent.status} · ID: {agent.id}
                        </span>
                      </div>
                    </button>
                  );
                })}
                {!agents.length && (
                  <p style={{ color: "#94a3b8", fontSize: 13 }}>
                    No delivery agents are available.
                  </p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <span
                style={{ fontSize: 13, color: "#64748b", flex: 1 }}
              >
                {agents.find((agent) => agent.id === selectedAgentId)?.name
                  ? `${agents.find((agent) => agent.id === selectedAgentId).name} selected`
                  : "No agent selected"}
              </span>
              <button
                className="modal-cancel"
                onClick={() => {
                  setAgentPickerShipment(null);
                  setSelectedAgentId("");
                }}
              >
                Cancel
              </button>
              <button
                className="modal-save modal-save--orange"
                disabled={!selectedAgentId}
                onClick={confirmAgentAssignment}
              >
                Confirm Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
