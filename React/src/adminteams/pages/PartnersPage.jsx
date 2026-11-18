import { useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { Welcome } from "../components/Welcome.jsx";
import { Stats } from "../components/Stats.jsx";
import { Filter } from "../components/Filter.jsx";
import { Table } from "../components/Table.jsx";

export function PartnersPage({
  data,
  find,
  open,
  act,
  mutate,
  query,
  setQuery,
}) {
  const usage = data.reduce(
    (sum, partner) => sum + (partner.currentMonthUsage || 0),
    0,
  );
  const [tier, setTier] = useState(""),
    [status, setStatus] = useState("");
  const filtered = find(data).filter(
    (p) =>
      (!tier || p.tier === tier) &&
      (!status || (status === "active" ? p.isActive : !p.isActive)),
  );
  return (
    <>
      <Welcome
        role="admin"
        icon="fa-handshake"
        title="Third Party Partners"
        description="Manage external businesses integrated into the Ware2Door network via API."
      >
        {act(
          <>
            <Icon name="fa-plus" /> Add Partner
          </>,
          () => open("partner"),
          "btn-primary",
        )}
      </Welcome>
      <Stats
        items={[
          ["fa-handshake", "#6366f1", "Total Partners", data.length],
          [
            "fa-circle-check",
            "var(--green)",
            "Active",
            data.filter((p) => p.isActive).length,
          ],
          [
            "fa-circle-pause",
            "var(--orange)",
            "Inactive",
            data.filter((p) => !p.isActive).length,
          ],
          [
            "fa-key",
            "#a855f7",
            "API Calls (This Month)",
            usage.toLocaleString(),
          ],
        ]}
      />
      <Filter
        query={query}
        setQuery={setQuery}
        placeholder="Search by name, email, tier…"
        extra={
          <>
            <select
              className="filter-select"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
            >
              <option value="">All Tiers</option>
              <option>Starter</option>
              <option>Growth</option>
              <option>Business</option>
              <option>Enterprise</option>
            </select>
            <select
              className="filter-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </>
        }
      />
      <Table
        headers={[
          "PARTNER",
          "TIER",
          "API KEY",
          "USAGE THIS MONTH",
          "CONTACT",
          "JOINED",
          "STATUS",
          "ACTIONS",
        ]}
        rows={filtered.map((p) => {
          const limit = p.tierLimits?.maxShipmentsPerMonth || 100;
          const percent = Math.min(
            100,
            Math.round(((p.currentMonthUsage || 0) / limit) * 100),
          );
          return [
            <>
              <strong>{p.name}</strong>
              <br />
              <small>{p.email}</small>
            </>,
            <span
              className={`tier-badge tier--${String(p.tier || "Starter").toLowerCase()}`}
            >
              {p.tier || "Starter"}
            </span>,
            <div className="api-key-cell">
              <code>
                {p.apiKey
                  ? `${p.apiKey.slice(0, 10)}...${p.apiKey.slice(-4)}`
                  : "N/A"}
              </code>
              {p.apiKey && (
                <button
                  className="api-key-eye"
                  title="View API Key"
                  onClick={() => open("api-key", p)}
                >
                  <Icon name="fa-eye" />
                </button>
              )}
            </div>,
            <div className="usage-cell">
              <span>
                {(p.currentMonthUsage || 0).toLocaleString()} /{" "}
                {limit.toLocaleString()} ({percent}%)
              </span>
              <div className="usage-bar">
                <span style={{ width: `${percent}%` }} />
              </div>
            </div>,
            <>
              <div>{p.contact?.name || p.contactName || "N/A"}</div>
              <small>{p.contact?.phone || p.contactPhone || "N/A"}</small>
            </>,
            p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—",
            <span
              className={`sub-status ${p.isActive ? "sub-active" : "sub-expired"}`}
            >
              <Icon name={p.isActive ? "fa-circle-check" : "fa-circle-pause"} />{" "}
              {p.isActive ? "Active" : "Inactive"}
            </span>,
            <div className="action-btn-group">
              <button
                className="btn-ghost"
                title="Change Tier"
                onClick={() => open("tier", p)}
              >
                <Icon name="fa-arrow-up-right-dots" />
              </button>
              <button
                className="btn-ghost"
                title={p.isActive ? "Deactivate" : "Activate"}
                onClick={() =>
                  mutate(
                    `/admin-teams/partners/${p.id}/status`,
                    "PUT",
                    { isActive: !p.isActive },
                    "Partner status updated",
                  )
                }
              >
                <Icon name={p.isActive ? "fa-ban" : "fa-check"} />
              </button>
              <button
                className="btn-ghost"
                title="Delete"
                onClick={() =>
                  confirm("Delete this partner?") &&
                  mutate(
                    `/admin-teams/partners/${p.id}`,
                    "DELETE",
                    {},
                    "Partner deleted",
                  )
                }
              >
                <Icon name="fa-trash" />
              </button>
            </div>,
          ];
        })}
      />
    </>
  );
}
