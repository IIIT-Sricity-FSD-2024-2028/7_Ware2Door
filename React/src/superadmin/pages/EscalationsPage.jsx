import { DataTable } from "../components/DataTable.jsx";
import { FilterBar } from "../components/FilterBar.jsx";
import { Icon } from "../components/Icon.jsx";
import { Stats } from "../components/Stats.jsx";
import { Welcome } from "../components/Welcome.jsx";

export function EscalationsPage({
  data,
  filteredData,
  error,
  loading,
  query,
  onQueryChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  onRefresh,
}) {
  return (
    <>
      <Welcome
        icon="fa-triangle-exclamation"
        title="Escalations"
        description="Monitor all escalated tickets and their resolution status."
      >
        <button className="btn-ghost" onClick={onRefresh}>
          <Icon name="fa-rotate" /> Refresh
        </button>
      </Welcome>
      <Stats
        items={[
          ["fa-ticket", "var(--purple)", "Total Escalations", data.length],
          [
            "fa-clock",
            "var(--orange)",
            "Pending",
            data.filter((ticket) => ticket.escalationStatus === "Pending")
              .length,
          ],
          [
            "fa-magnifying-glass",
            "var(--blue)",
            "Reviewing",
            data.filter((ticket) => ticket.escalationStatus === "Reviewing")
              .length,
          ],
          [
            "fa-circle-check",
            "var(--green)",
            "Resolved",
            data.filter((ticket) => ticket.resolved).length,
          ],
        ]}
      />
      <FilterBar
        query={query}
        onQueryChange={onQueryChange}
        placeholder="Search ticket or tracking ID…"
      >
        <select
          className="filter-select"
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          <option value="">All Status</option>
          <option>Pending</option>
          <option>Reviewing</option>
          <option>Resolved</option>
        </select>
        <select
          className="filter-select"
          value={priority}
          onChange={(event) => onPriorityChange(event.target.value)}
        >
          <option value="">All Priority</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
      </FilterBar>
      <DataTable
        headers={["Ticket ID", "Tracking ID", "Priority", "Status"]}
        columns={4}
        loading={loading}
        error={error}
        isEmpty={!filteredData.length}
        emptyMessage="No escalations found."
      >
        {filteredData.map((ticket) => (
          <tr key={ticket.ticketId}>
            <td>
              <strong>{ticket.ticketId}</strong>
            </td>
            <td>
              <code>{ticket.trackingId}</code>
            </td>
            <td>
              <span
                className={`priority-badge priority-${(ticket.priority || "low").toLowerCase()}`}
              >
                {ticket.priority || "Low"}
              </span>
            </td>
            <td>
              <span
                className={`esc-status esc-${(ticket.escalationStatus || "pending").toLowerCase()}`}
              >
                {ticket.escalationStatus || "Pending"}
              </span>
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
