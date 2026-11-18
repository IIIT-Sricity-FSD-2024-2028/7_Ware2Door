import React from "react";

export default function ShipmentRequestsPage({
  shipments,
  selected,
  onSelectAll,
  onSelect,
  search,
  source,
  priority,
  stock,
  onSearch,
  onSource,
  onPriority,
  onStock,
  onAccept,
  onReject,
  onDispatch,
  availability,
  fmtDate,
}) {
  return (
    <div className="shipment-page page-content">
      <div className="page-title-row">
        <div>
          <h2 className="page-title">Shipment Requests</h2>
          <p className="page-subtitle">
            Incoming shipment requests from external platforms awaiting
            warehouse processing. Filter and approve to start fulfillment.
          </p>
        </div>
        <button
          className="btn-primary"
          id="accept-selected-btn"
          disabled={!selected.size}
          onClick={onAccept}
        >
          <i className="fa-solid fa-check"></i> Accept Selected (
          <span>{selected.size}</span>)
        </button>
      </div>
      <div className="filter-row">
        <div className="search-box" style={{ flex: 2 }}>
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            id="shipment-search"
            placeholder="Search by order ID, product name, or SKU..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={source}
          onChange={(e) => onSource(e.target.value)}
        >
          <option value="">All Platforms</option>
          <option>Amazon</option>
          <option>Shopsy</option>
          <option>Flipkart</option>
          <option>Meesho</option>
        </select>
        <select
          className="filter-select"
          value={priority}
          onChange={(e) => onPriority(e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="express">Express</option>
          <option value="normal">Normal</option>
        </select>
        <select
          className="filter-select"
          value={stock}
          onChange={(e) => onStock(e.target.value)}
        >
          <option value="">All Stock Levels</option>
          <option value="in">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={
                    shipments.length > 0 &&
                    shipments.every((s) => selected.has(s.orderId))
                  }
                  onChange={(e) => onSelectAll(e.target.checked)}
                />
              </th>
              <th>ORDER ID</th>
              <th>SOURCE</th>
              <th>CUSTOMER</th>
              <th>PRODUCT</th>
              <th>QTY</th>
              <th>AVAILABILITY</th>
              <th>DESTINATION</th>
              <th>PRIORITY</th>
              <th>TIME</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s, index) => {
              const av = availability(s.productName);
              return (
                <tr key={`${s.orderId}-${index}`}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(s.orderId)}
                      onChange={(e) =>
                        onSelect(s.orderId, e.target.checked)
                      }
                    />
                  </td>
                  <td>{s.orderId}</td>
                  <td>{s.source}</td>
                  <td>{s.customerName}</td>
                  <td>{s.productName}</td>
                  <td>{s.qty || s.quantity}</td>
                  <td>
                    <span
                      className={`stat-badge ${av.key === "in" ? "stat-badge--green" : av.key === "low" ? "stat-badge--orange" : ""}`}
                    >
                      {av.label}
                    </span>
                  </td>
                  <td>{s.city || s.destination || "—"}</td>
                  <td>
                    <span
                      className={`stat-badge ${s.priority === "express" ? "stat-badge--blue" : ""}`}
                    >
                      {s.priority}
                    </span>
                  </td>
                  <td>{fmtDate(s.receivedAt || s.createdAt)}</td>
                  <td>
                    <button
                      className="action-btn reject"
                      onClick={() => onReject(s.orderId)}
                      title="Reject"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                    <button
                      className={`action-btn accept${av.key === "out" ? " action-btn--faded" : ""}`}
                      disabled={av.key === "out"}
                      onClick={() => onDispatch(s.orderId)}
                      title="Accept"
                    >
                      <i className="fa-solid fa-check"></i>
                    </button>
                  </td>
                </tr>
              );
            })}
            {!shipments.length && (
              <tr>
                <td colSpan="11" className="empty-msg">
                  No shipment requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
