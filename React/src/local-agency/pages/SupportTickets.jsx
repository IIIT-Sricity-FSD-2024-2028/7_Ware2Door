import React, { useState } from "react";
import { localAgencyApi } from "../api/localAgencyApi.js";
import LocalAgencyModal from "../components/LocalAgencyModal.jsx";
import { validateTrackingId } from "../../utils/inputValidation.js";
import { fmtDate } from "../utils/helpers.js";

const TICKETS_PER_PAGE = 10;

function normalizeStatus(s) {
  if (!s) return "Open";
  if (s === "Escalated") return "Escalated";
  const map = {
    open: "Open",
    resolved: "Resolved",
    "in progress": "In Progress",
    pending: "Pending",
    escalated: "Escalated",
  };
  return map[s.toLowerCase()] || s;
}

function statusBadgeClass(s) {
  return (
    {
      Open: "status-open",
      Resolved: "status-resolved",
      "In Progress": "status-progress",
      Pending: "status-pending",
      Escalated: "status-escalated",
    }[s] || "status-pending"
  );
}

function priorityColor(p) {
  return p === "High" ? "#ef4444" : p === "Medium" ? "#f4a32a" : "#16a34a";
}

const TIMELINE_DESCS = {
  "Order Received": "Your order has been received and confirmed",
  "Picked and Packed":
    "Package has been picked from inventory and packed for shipping",
  "Shipment Dispatched":
    "Package has left the warehouse and is en route to the transit hub",
  "In Scan at Transit Hub":
    "Package arrived at the regional transit hub for sorting",
  "Outscan at Transit Hub":
    "Package has been sorted and dispatched from the transit hub",
  "In Scan at Local Delivery Agency":
    "Package has arrived at the local delivery center near you",
  "Out for Delivery":
    "Package is out for delivery with your local delivery agent",
  Delivered: "Package successfully delivered to destination",
};

export default function SupportTickets({
  agencyId,
  showToast,
  tickets,
  setTickets,
  loadTickets,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Open");
  const [page, setPage] = useState(1);
  const [view, setView] = useState("list");
  const [currentTicket, setCurrentTicket] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [updateStatusModal, setUpdateStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("Open");

  async function openDetail(t) {
    setCurrentTicket({ ...t });
    setView("detail");
    setTimeline(null);
    const validationError = validateTrackingId(t.trackingId);
    if (validationError) {
      setTimelineLoading(false);
      showToast(`Tracking timeline unavailable: ${validationError}`, true);
      return;
    }
    setTimelineLoading(true);
    try {
      const trackData = await localAgencyApi.getTracking(t.trackingId);
      setTimeline(trackData?.statusSteps || null);
    } catch (error) {
      setTimeline(null);
      showToast(error.message || "Unable to load tracking timeline.", true);
    }
    setTimelineLoading(false);
  }

  async function resolveTicket() {
    if (!currentTicket) return;
    if (normalizeStatus(currentTicket.status) === "Resolved") return;
    try {
      const r = await localAgencyApi.resolveTicket(currentTicket.ticketId);
      if (r && r.success) {
        setCurrentTicket((t) => ({ ...t, status: "Resolved" }));
        setTickets((ts) =>
          ts.map((t) =>
            t.ticketId === currentTicket.ticketId
              ? { ...t, status: "Resolved" }
              : t,
          ),
        );
        showToast(`✓ Ticket ${currentTicket.ticketId} marked as Resolved`);
      } else {
        showToast("Failed to resolve ticket.", true);
      }
    } catch (e) {
      showToast(e.message, true);
    }
  }

  async function escalateTicket() {
    if (!currentTicket) return;
    const status = normalizeStatus(currentTicket.status);
    if (status === "Resolved" || status === "Escalated") {
      showToast("This ticket is already " + status + ".", true);
      return;
    }
    const note = window.prompt(
      "Escalation Note (describe why this needs central desk intervention):",
      "Customer unreachable after 3 delivery attempts.",
    );
    if (note === null) return;
    try {
      const r = await localAgencyApi.escalateTicket(currentTicket.ticketId, {
        escalationNote: note || "Escalated by agency",
      });
      if (r && r.success) {
        setCurrentTicket((t) => ({ ...t, status: "Escalated" }));
        setTickets((ts) =>
          ts.map((t) =>
            t.ticketId === currentTicket.ticketId
              ? { ...t, status: "Escalated" }
              : t,
          ),
        );
        showToast(
          `✓ Ticket ${currentTicket.ticketId} escalated to Central Desk.`,
        );
      } else {
        showToast("Failed to escalate ticket.", true);
      }
    } catch (e) {
      showToast(e.message, true);
    }
  }

  async function updateStatus() {
    if (!currentTicket) return;
    try {
      const r = await localAgencyApi.updateTicketStatus(
        currentTicket.ticketId,
        newStatus,
      );
      if (r && r.success) {
        setCurrentTicket((t) => ({ ...t, status: newStatus }));
        setTickets((ts) =>
          ts.map((t) =>
            t.ticketId === currentTicket.ticketId
              ? { ...t, status: newStatus }
              : t,
          ),
        );
        showToast(
          `✓ Ticket ${currentTicket.ticketId} status updated to ${newStatus}`,
        );
        setUpdateStatusModal(false);
      } else {
        showToast("Failed to update ticket status.", true);
      }
    } catch (e) {
      showToast(e.message, true);
    }
  }

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      (t.ticketId || "").toLowerCase().includes(q) ||
      (t.trackingId || "").toLowerCase().includes(q) ||
      (t.subject || t.category || "").toLowerCase().includes(q);
    const matchS =
      statusFilter === "All" ||
      !statusFilter ||
      normalizeStatus(t.status) === statusFilter;
    return matchQ && matchS;
  });
  const totalPages = Math.ceil(filtered.length / TICKETS_PER_PAGE);
  const pageList = filtered.slice(
    (page - 1) * TICKETS_PER_PAGE,
    page * TICKETS_PER_PAGE,
  );

  const normalCurrent = currentTicket
    ? normalizeStatus(currentTicket.status)
    : "";
  const priority = currentTicket?.priority || "Low";
  const custName = currentTicket?.custName || "—";
  const custInitials =
    custName !== "—"
      ? custName
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "NA";
  const createdDate = currentTicket
    ? currentTicket.created ||
      (currentTicket.raisedAt
        ? new Date(currentTicket.raisedAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—")
    : "";

  if (view === "detail" && currentTicket) {
    return (
      <div className="support-page page-content">
        <div id="ticket-detail-view">
          <div className="page-title-row" style={{ marginBottom: 20 }}>
            <button
              className="back-btn"
              id="back-to-tickets"
              onClick={() => setView("list")}
            >
              <i className="fa-solid fa-arrow-left"></i> Back to Tickets
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn-ghost"
                id="ticket-update-status-btn"
                onClick={() => {
                  setNewStatus(normalCurrent);
                  setUpdateStatusModal(true);
                }}
              >
                <i className="fa-solid fa-arrows-rotate"></i> Update Status
              </button>
              <button
                className="btn-ghost"
                id="ticket-escalate-btn"
                style={{
                  borderColor: "#ef4444",
                  color: "#ef4444",
                  opacity:
                    normalCurrent === "Resolved" ||
                    normalCurrent === "Escalated"
                      ? 0.5
                      : 1,
                }}
                title="Escalate to Central Desk"
                onClick={escalateTicket}
                disabled={
                  normalCurrent === "Resolved" || normalCurrent === "Escalated"
                }
              >
                <i className="fa-solid fa-triangle-exclamation"></i>{" "}
                {normalCurrent === "Escalated" ? "Escalated" : "Escalate"}
              </button>
              <button
                className="btn-primary"
                id="ticket-resolve-btn"
                style={{ opacity: normalCurrent === "Resolved" ? 0.5 : 1 }}
                disabled={normalCurrent === "Resolved"}
                onClick={resolveTicket}
              >
                <i className="fa-solid fa-circle-check"></i>{" "}
                {normalCurrent === "Resolved" ? "Resolved" : "Mark as Resolved"}
              </button>
            </div>
          </div>

          <div className="ticket-detail-header">
            <h2 className="ticket-detail-title" id="detail-ticket-id">
              Ticket {currentTicket.ticketId}
            </h2>
            <span
              className={`ticket-status-badge ${statusBadgeClass(normalCurrent)}`}
              id="detail-status-badge"
            >
              {normalCurrent}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 24px" }}>
            Assigned to:{" "}
            <strong id="detail-assigned">
              {currentTicket.assigned || "Agency Manager"}
            </strong>{" "}
            &bull; Priority:{" "}
            <strong
              id="detail-priority"
              style={{ color: priorityColor(priority) }}
            >
              {priority}
            </strong>
          </p>

          <div className="ticket-detail-grid">
            <div>
              <div className="card-white" style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 18,
                  }}
                >
                  <h3 className="card-section-title" style={{ margin: 0 }}>
                    <i className="fa-solid fa-circle-info"></i> Ticket Details
                  </h3>
                  <span
                    style={{ fontSize: 12, color: "#94a3b8" }}
                    id="detail-updated"
                  >
                    Updated recently
                  </span>
                </div>
                <div className="detail-fields-grid">
                  <div>
                    <p className="field-label-sm">TICKET ID</p>
                    <p className="field-val-sm" id="detail-tkt-id">
                      {currentTicket.ticketId}
                    </p>
                  </div>
                  <div>
                    <p className="field-label-sm">TRACKING ID</p>
                    <p className="field-val-sm" id="detail-trk-id">
                      {currentTicket.trackingId}
                    </p>
                  </div>
                  <div>
                    <p className="field-label-sm">CATEGORY</p>
                    <p className="field-val-sm" id="detail-ord-id">
                      {currentTicket.category || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="field-label-sm">CREATED DATE</p>
                    <p className="field-val-sm" id="detail-created">
                      {createdDate}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card-white" style={{ marginBottom: 16 }}>
                <h3 className="card-section-title">
                  <i className="fa-solid fa-user"></i> Customer Information
                </h3>
                <div className="customer-info-row">
                  <div className="customer-avatar" id="detail-cust-avatar">
                    {custInitials}
                  </div>
                  <div>
                    <p className="customer-name" id="detail-cust-name">
                      {custName}
                    </p>
                  </div>
                </div>
                <div className="detail-fields-grid" style={{ marginTop: 14 }}>
                  <div>
                    <p className="field-label-sm">PHONE</p>
                    <p className="field-val-sm" id="detail-cust-phone">
                      {currentTicket.custPhone || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="field-label-sm">DELIVERY ADDRESS</p>
                    <p className="field-val-sm" id="detail-cust-addr">
                      {currentTicket.custAddr || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card-white">
                <h3 className="card-section-title">
                  <i className="fa-solid fa-file-lines"></i> Issue Description
                </h3>
                <div className="issue-description-box" id="detail-issue">
                  "{currentTicket.issue || currentTicket.description || "—"}"
                </div>
              </div>
            </div>

            <div>
              <div className="card-white">
                <h3 className="card-section-title">
                  <i className="fa-solid fa-timeline"></i> Shipment Timeline
                </h3>
                <div className="timeline" id="detail-timeline">
                  {timelineLoading && (
                    <p style={{ color: "#64748b", fontSize: 13 }}>
                      Loading timeline...
                    </p>
                  )}
                  {!timelineLoading && !timeline && (
                    <p style={{ color: "#ef4444", fontSize: 13 }}>
                      Timeline unavailable.
                    </p>
                  )}
                  {!timelineLoading &&
                    timeline &&
                    timeline.map((step, i) => {
                      const dotCls = step.done
                        ? "tl-done"
                        : step.current
                          ? "tl-current"
                          : "tl-pending";
                      const icon = step.done
                        ? "fa-check"
                        : step.current
                          ? "fa-star"
                          : "fa-circle";
                      const desc = TIMELINE_DESCS[step.label] || "";
                      const time = step.time
                        ? new Date(step.time).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "";
                      return (
                        <div key={i} className="timeline-item">
                          <div className={`timeline-dot ${dotCls}`}>
                            <i
                              className={`fa-solid ${icon}`}
                              style={{ fontSize: 12 }}
                            ></i>
                          </div>
                          <div className="timeline-content">
                            <p className="tl-title">{step.label}</p>
                            <p className="tl-desc">{desc}</p>
                            <p className="tl-time">{time}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <LocalAgencyModal
          id="update-status-modal"
          open={updateStatusModal}
          onClose={() => setUpdateStatusModal(false)}
        >
          <div className="modal-header">
            <h3>Update Ticket Status</h3>
            <button
              className="modal-close"
              id="close-status-modal"
              onClick={() => setUpdateStatusModal(false)}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="modal-body">
            <div className="modal-field">
              <label>Select New Status</label>
              <select
                id="update-status-select"
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  outline: "none",
                  marginTop: 8,
                  fontFamily: "'Poppins',sans-serif",
                  fontSize: 13,
                }}
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="modal-cancel"
              id="cancel-status-modal"
              onClick={() => setUpdateStatusModal(false)}
            >
              Cancel
            </button>
            <button
              className="modal-save modal-save--orange"
              id="confirm-status-modal"
              onClick={updateStatus}
            >
              Update
            </button>
          </div>
        </LocalAgencyModal>
      </div>
    );
  }

  return (
    <div className="support-page page-content">
      <div id="ticket-list-view">
        <div className="page-title-row">
          <div>
            <h2 className="page-title">Support Tickets</h2>
            <p className="page-subtitle">
              Manage and track customer support requests across your logistics
              network.
            </p>
          </div>
        </div>
        <div className="filter-row">
          <div className="search-box" style={{ flex: 1 }}>
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              id="ticket-search"
              placeholder="Search by Ticket ID, Tracking ID or Subject..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          {["Open", "Resolved", "In Progress", "Pending"].map((s) => (
            <button
              key={s}
              className={`ticket-filter-btn${statusFilter === s ? " ticket-filter-active" : ""}`}
              data-filter={s}
              onClick={() => {
                setStatusFilter(s === statusFilter ? "" : s);
                setPage(1);
              }}
            >
              ● {s}
            </button>
          ))}
        </div>
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>TICKET ID</th>
                <th>TRACKING ID</th>
                <th>SUBJECT</th>
                <th>STATUS</th>
                <th>CREATED DATE</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody id="tickets-tbody">
              {pageList.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-msg">
                    No tickets match your filter.
                  </td>
                </tr>
              )}
              {pageList.map((t, i) => {
                const norm = normalizeStatus(t.status);
                const created =
                  t.created ||
                  (t.raisedAt
                    ? new Date(t.raisedAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—");
                return (
                  <tr key={i}>
                    <td>
                      <strong style={{ color: "#1e293b" }}>{t.ticketId}</strong>
                    </td>
                    <td style={{ color: "#64748b", fontSize: 13 }}>
                      {t.trackingId}
                    </td>
                    <td>{t.subject || t.category || "—"}</td>
                    <td>
                      <span
                        className={`status-badge ${statusBadgeClass(norm)}`}
                      >
                        {norm}
                      </span>
                    </td>
                    <td style={{ color: "#64748b", fontSize: 12 }}>
                      {created}
                    </td>
                    <td>
                      <span
                        className="view-details-link"
                        style={{ cursor: "pointer" }}
                        onClick={() => openDetail(t)}
                      >
                        View Details
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="table-footer-row">
            <span
              id="tickets-showing-label"
              style={{ fontSize: 12, color: "#94a3b8" }}
            >
              {filtered.length > 0
                ? `Showing ${(page - 1) * TICKETS_PER_PAGE + 1} to ${Math.min(page * TICKETS_PER_PAGE, filtered.length)} of ${filtered.length} tickets`
                : "No tickets"}
            </span>
            {totalPages > 1 && (
              <div className="pagination" id="tickets-pagination">
                <button
                  className="page-btn"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    className={`page-num${page === i + 1 ? " active" : ""}`}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="page-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
