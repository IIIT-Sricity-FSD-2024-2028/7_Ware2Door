import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "../components/Icon.jsx";
import { Welcome } from "../components/Welcome.jsx";
import { Stats } from "../components/Stats.jsx";
import { Filter } from "../components/Filter.jsx";
import { Table } from "../components/Table.jsx";
import { formatDate } from "../utils.js";
import {
  fetchAdminTeamsSection,
  updateEscalation,
} from "../store/actions/adminTeamsActions.js";
import { openAdminModal } from "../store/slices/adminTeamsUiSlice.js";

export function EscalationsPage() {
  const dispatch = useDispatch();
  const data = useSelector((state) => state.adminTeams.escalations);
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState(""),
    [status, setStatus] = useState("");
  const open = (kind, record = null) =>
    dispatch(openAdminModal({ kind, record }));
  const load = () => dispatch(fetchAdminTeamsSection("escalation"));
  useEffect(() => {
    dispatch(fetchAdminTeamsSection("escalation"));
  }, [dispatch]);
  const filtered = data
    .filter(
      (escalation) =>
        !query ||
        JSON.stringify(escalation).toLowerCase().includes(query.toLowerCase()),
    )
    .filter(
      (escalation) =>
        (!priority || escalation.priority === priority) &&
        (!status || escalation.escalationStatus === status),
    );
  return (
    <>
      <Welcome
        role="admin"
        icon="fa-shield-halved"
        title="Central Escalation Desk"
        description="Handle tickets escalated from Local Agencies. Assign officers, coordinate across nodes, and resolve cross-network issues."
        color="linear-gradient(135deg,#064e3b 0%,#065f46 55%,#047857 100%)"
      >
        <button className="btn-emerald" onClick={load}>
          <Icon name="fa-rotate" /> Refresh
        </button>
      </Welcome>
      <Stats
        items={[
          ["fa-ticket", "var(--orange)", "Total Escalated", data.length],
          [
            "fa-eye",
            "var(--blue)",
            "Under Review",
            data.filter((e) => e.escalationStatus === "Reviewing").length,
          ],
          [
            "fa-check-double",
            "var(--green)",
            "Resolved",
            data.filter((e) => e.escalationStatus === "Resolved").length,
          ],
          [
            "fa-fire",
            "var(--red)",
            "High Priority",
            data.filter((e) => e.priority === "High").length,
          ],
        ]}
      />
      <Filter
        query={query}
        setQuery={setQuery}
        placeholder="Search Ticket ID, Tracking ID, Agency…"
        extra={
          <>
            <select
              className="filter-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <select
              className="filter-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option>Pending</option>
              <option>Reviewing</option>
              <option>Resolved</option>
            </select>
          </>
        }
      />
      <Table
        headers={[
          "TICKET ID",
          "TRACKING ID",
          "AGENCY",
          "SUBJECT",
          "PRIORITY",
          "ESCALATED ON",
          "ESC. STATUS",
          "NOTE",
          "ACTIONS",
        ]}
        rows={filtered.map((e) => [
          e.ticketId || e.id,
          e.trackingId || "—",
          e.agencyName || e.agency || e.agencyId || "—",
          e.subject || "—",
          <span
            className={`priority-badge priority-${String(e.priority || "low").toLowerCase()}`}
          >
            {e.priority || "Low"}
          </span>,
          formatDate(e.createdAt || e.escalatedAt),
          <span
            className={`esc-status esc-${String(e.escalationStatus || "Pending").toLowerCase()}`}
          >
            {e.escalationStatus || "Pending"}
          </span>,
          e.escalationNote || e.note || "—",
          <div className="action-btn-group">
            <button
              className="action-btn"
              title="View ticket"
              aria-label={`View ticket ${e.ticketId || e.id}`}
              onClick={() => open("ticket-detail", e)}
            >
              <Icon name="fa-eye" />
            </button>
            <button
              className="action-btn edit"
              title="Update"
              onClick={() => open("escalation", e)}
            >
              <Icon name="fa-pen" />
            </button>
            {e.escalationStatus !== "Resolved" && (
              <button
                className="action-btn resolve"
                title="Resolve"
                onClick={() =>
                  dispatch(
                    updateEscalation({
                      id: e.ticketId || e.id,
                      escalation: {
                        escalationStatus: "Resolved",
                        status: "Resolved",
                      },
                    }),
                  )
                }
              >
                <Icon name="fa-check-double" />
              </button>
            )}
          </div>,
        ])}
      />
    </>
  );
}
