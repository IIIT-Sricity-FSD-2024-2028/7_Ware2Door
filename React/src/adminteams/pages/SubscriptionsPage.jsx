import { Icon } from "../components/Icon.jsx";
import { Stats } from "../components/Stats.jsx";
import { Welcome } from "../components/Welcome.jsx";
import { Filter } from "../components/Filter.jsx";
import { formatDate, isExpired } from "../utils.js";

const typeClasses = {
  WAREHOUSE: "type--warehouse",
  TRANSIT_HUB: "type--hub",
  LOCAL_AGENCY: "type--agency",
};

const typeLabels = {
  WAREHOUSE: "Warehouse",
  TRANSIT_HUB: "Transit Hub",
  LOCAL_AGENCY: "Local Agency",
};

function NodeRows({ nodes, cards = false, onClick }) {
  if (!nodes.length)
    return cards ? (
      <div className="loading-placeholder">No nodes found.</div>
    ) : (
      <tr>
        <td colSpan="6" className="empty-msg">
          No nodes found.
        </td>
      </tr>
    );
  if (cards)
    return nodes.map((node) => {
      const type = node.type || node._type;
      const expired =
        node.isSubscriptionValid === false ||
        isExpired(node.subscription?.endDate);
      const docs =
        node.legalDocs || node.legalDocuments || node.documents || [];
      return (
        <div
          className={`node-card${node.isActive === false ? " inactive" : ""}`}
          key={node.id}
          onClick={() => onClick?.(node)}
        >
          <div
            className={
              node.isActive === false
                ? ""
                : expired
                  ? "nc-expired-stripe"
                  : "nc-active-stripe"
            }
          />
          <div className="node-card-top">
            <div
              className={`node-card-icon ${type === "WAREHOUSE" ? "node-card-icon--wh" : type === "TRANSIT_HUB" ? "node-card-icon--hub" : "node-card-icon--ag"}`}
            >
              <Icon
                name={
                  type === "WAREHOUSE"
                    ? "fa-warehouse"
                    : type === "TRANSIT_HUB"
                      ? "fa-building"
                      : "fa-truck-fast"
                }
              />
            </div>
            <div className="node-card-badges">
              <span className={`type-badge ${typeClasses[type]}`}>
                {typeLabels[type] || type}
              </span>
              <span
                className={`sub-status ${node.isActive === false || expired ? "sub-expired" : "sub-active"}`}
              >
                <Icon
                  name={
                    node.isActive === false
                      ? "fa-ban"
                      : expired
                        ? "fa-circle-xmark"
                        : "fa-circle-check"
                  }
                />{" "}
                {node.isActive === false
                  ? "Inactive"
                  : expired
                    ? "Expired"
                    : "Active"}
              </span>
            </div>
          </div>
          <p className="node-card-name">{node.name}</p>
          <p className="node-card-city">
            <Icon name="fa-location-dot" />
            {node.city || "—"}
          </p>
          <div className="node-card-divider" />
          <div className="node-card-meta">
            <div className="node-card-rate">
              ₹{Number(node.subscription?.monthlyRate || 0).toLocaleString()}
              <small>/mo</small>
            </div>
            <div className="node-card-end">
              <div>UNTIL</div>
              <div>{formatDate(node.subscription?.endDate)}</div>
              <div className="node-card-docs">
                {docs.length} doc{docs.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>
        </div>
      );
    });
  return nodes.map((node) => (
    <tr key={node.id}>
      <td>
        <strong>{node.name}</strong>
        <br />
        <span style={{ fontSize: 11, color: "var(--text-light)" }}>
          {node.id}
        </span>
      </td>
      <td>
        <span className={`type-badge ${typeClasses[node.type]}`}>
          {typeLabels[node.type] || node.type}
        </span>
      </td>
      <td>{node.city || "—"}</td>
      <td>
        <span
          className={`sub-status ${node.isActive === false ? "sub-expired" : "sub-active"}`}
        >
          <Icon name={node.isActive === false ? "fa-ban" : "fa-circle-check"} />{" "}
          {node.isActive === false ? "Inactive" : "Active"}
        </span>
      </td>
      <td>
        <span
          className={`sub-status ${node.isSubscriptionValid ? "sub-active" : "sub-expired"}`}
        >
          <Icon
            name={
              node.isSubscriptionValid ? "fa-circle-check" : "fa-circle-xmark"
            }
          />{" "}
          {node.isSubscriptionValid ? "Valid" : "Expired"}
        </span>
      </td>
      <td>{formatDate(node.subscriptionEndDate)}</td>
    </tr>
  ));
}

export function SubscriptionsPage({
  nodes,
  nodeFilter,
  query,
  setQuery,
  type,
  setType,
  status,
  setStatus,
  open,
  act,
  load,
}) {
  return (
    <>
      <Welcome
        role="admin"
        icon="fa-building-circle-check"
        title="Node Partner Licences"
        description="Manage Warehouses, Transit Hubs, and Local Agencies — extend subscriptions, upload legal documents, and control active status."
      >
        {act(
          <>
            <Icon name="fa-plus" /> Add New Node
          </>,
          () => open("add-node"),
          "btn-primary",
        )}
        {act("Refresh", load)}
      </Welcome>
      <Stats
        items={[
          [
            "fa-warehouse",
            "var(--gold)",
            "Warehouses",
            nodes.filter((n) => (n.type || n._type) === "WAREHOUSE").length,
          ],
          [
            "fa-building",
            "var(--blue)",
            "Transit Hubs",
            nodes.filter((n) => (n.type || n._type) === "TRANSIT_HUB").length,
          ],
          [
            "fa-truck-fast",
            "var(--green)",
            "Local Agencies",
            nodes.filter((n) => (n.type || n._type) === "LOCAL_AGENCY").length,
          ],
          [
            "fa-circle-pause",
            "var(--red)",
            "Inactive",
            nodes.filter((n) => n.isActive === false).length,
          ],
          [
            "fa-clock",
            "var(--orange)",
            "Expired",
            nodes.filter((n) =>
              isExpired(n.subscription?.endDate || n.subscriptionEndDate),
            ).length,
          ],
        ]}
      />
      <Filter
        query={query}
        setQuery={setQuery}
        placeholder="Search by name, city, email…"
        extra={
          <>
            <select
              className="filter-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="WAREHOUSE">Warehouse</option>
              <option value="TRANSIT_HUB">Transit Hub</option>
              <option value="LOCAL_AGENCY">Local Agency</option>
            </select>
            <select
              className="filter-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </>
        }
      />
      <div className="node-grid">
        {nodeFilter.map((n) => (
          <NodeRows
            key={n.id}
            nodes={[n]}
            cards
            onClick={() => open("node-detail", n)}
          />
        ))}
      </div>
    </>
  );
}
