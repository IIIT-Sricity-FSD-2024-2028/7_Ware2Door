import React from "react";
export default function InventoryOverviewPage({
  items,
  search,
  status,
  page,
  perPage,
  onSearch,
  onStatus,
  onPage,
  onAddStock,
  fmtDate,
}) {
  const filtered = items.filter(
    (i) =>
      (!search ||
        `${i.itemName} ${i.labelId}`
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (!status || i.status === status),
  );
  const pages = Math.ceil(filtered.length / perPage);
  return (
    <div className="inventory-overview-page page-content">
      <div className="page-title-row">
        <div>
          <h2 className="page-title">Inventory Overview</h2>
          <p className="page-subtitle">
            View and manage all shipments currently stored in warehouse
            inventory.
          </p>
        </div>
        <button className="btn-primary" onClick={onAddStock}>
          <i className="fa-solid fa-plus"></i> Add Stock
        </button>
      </div>
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card inv-stat">
          <p className="inv-stat-num">{items.length}</p>
          <p className="inv-stat-label">Total Items</p>
        </div>
        <div className="stat-card inv-stat">
          <p className="inv-stat-num">
            {items.reduce((n, i) => n + Number(i.quantity || 0), 0)}
          </p>
          <p className="inv-stat-label">Total Quantity</p>
        </div>
        <div className="stat-card inv-stat">
          <p className="inv-stat-num">
            {items.filter((i) => i.status === "Low Stock").length}
          </p>
          <p className="inv-stat-label">Low Stock</p>
        </div>
        <div className="stat-card inv-stat">
          <p className="inv-stat-num">
            {items.filter((i) => i.status === "Critical").length}
          </p>
          <p className="inv-stat-label">Critical</p>
        </div>
      </div>
      <div className="filter-row">
        <div className="search-box" style={{ flex: 1 }}>
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            placeholder="Search by item name or label ID..."
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
          <option>In Stock</option>
          <option>Low Stock</option>
          <option>Critical</option>
        </select>
      </div>
      <div className="table-card">
        <div className="table-header-row">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <i
              className="fa-solid fa-boxes-stacked"
              style={{ color: "#64748b" }}
            ></i>
            <strong>Shipments in Inventory</strong>
          </div>
          <span className="showing-label">
            Showing {filtered.length ? (page - 1) * perPage + 1 : 0}-
            {Math.min(page * perPage, filtered.length)} of {filtered.length}
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>LABEL ID</th>
              <th>ITEM NAME</th>
              <th>QUANTITY</th>
              <th>STATUS</th>
              <th>LAST UPDATED</th>
            </tr>
          </thead>
          <tbody>
            {filtered
              .slice((page - 1) * perPage, page * perPage)
              .map((i, n) => (
                <tr key={n}>
                  <td>{i.labelId}</td>
                  <td>{i.itemName}</td>
                  <td>{i.quantity}</td>
                  <td>
                    <span className="stat-badge">{i.status}</span>
                  </td>
                  <td>{fmtDate(i.lastUpdated || i.updatedAt)}</td>
                </tr>
              ))}
            {!filtered.length && (
              <tr>
                <td colSpan="5" className="empty-msg">
                  No items match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="pagination-bar">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              className={`pg-btn${page === i + 1 ? " active" : ""}`}
              onClick={() => onPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
