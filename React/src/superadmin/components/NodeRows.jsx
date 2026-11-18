import { Icon } from "./Icon.jsx";

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

const date = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export function NodeRows({ nodes, cards = false }) {
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
        (node.subscription?.endDate &&
          new Date(node.subscription.endDate) < new Date());
      return (
        <div
          className={`node-card${node.isActive === false ? " inactive" : ""}`}
          key={node.id}
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
              <div>
                {node.subscription?.endDate
                  ? new Date(node.subscription.endDate).toLocaleDateString(
                      "en-IN",
                    )
                  : "—"}
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
      <td style={{ fontSize: 13 }}>{date(node.subscriptionEndDate)}</td>
    </tr>
  ));
}
