import React from "react";
export default function StockAdditionPage({
  labelId,
  itemName,
  quantity,
  recent,
  onLabelId,
  onItemName,
  onQuantity,
  onAdd,
  onReset,
  onEdit,
  onRemove,
  fmtDate,
}) {
  return (
    <div className="stock-addition-page page-content">
      <div className="page-title-row">
        <div>
          <h2 className="page-title">Warehouse Stock Addition</h2>
          <p className="page-subtitle">
            Add new items to warehouse inventory by manually entering shipment
            details.
          </p>
        </div>
      </div>
      <div className="card-white" style={{ maxWidth: 720 }}>
        <h3 className="card-section-title">
          <i className="fa-solid fa-box"></i> Add Item to Warehouse Inventory
        </h3>
        <div className="stock-form-grid">
          <div className="stock-field">
            <label>Shipment Label ID</label>
            <input
              value={labelId}
              onChange={(e) => onLabelId(e.target.value)}
              placeholder="e.g. SHP-2026-00412"
            />
          </div>
          <div className="stock-field">
            <label>Item Name / Label Name</label>
            <input
              value={itemName}
              onChange={(e) => onItemName(e.target.value)}
              placeholder="e.g. Samsung Galaxy S26"
            />
          </div>
        </div>
        <div className="stock-field" style={{ marginTop: 14 }}>
          <label>Quantity of Shipments</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => onQuantity(e.target.value)}
            placeholder="e.g. 25"
          />
        </div>
        <div className="stock-form-actions">
          <button className="btn-primary" onClick={onAdd}>
            <i className="fa-solid fa-plus"></i> Add to Inventory
          </button>
          <button className="btn-ghost" onClick={onReset}>
            <i className="fa-solid fa-rotate"></i> Reset Form
          </button>
        </div>
      </div>
      <div className="table-card" style={{ marginTop: 24 }}>
        <div className="table-header-row">
          <strong>Recently Added Stock</strong>
          <span className="showing-label">{recent.length} items</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>SHIPMENT LABEL ID</th>
              <th>ITEM NAME</th>
              <th>QTY</th>
              <th>ADDED TIME</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((i, n) => (
              <tr key={n}>
                <td>{i.labelId}</td>
                <td>{i.itemName}</td>
                <td>{i.quantity}</td>
                <td>{fmtDate(i.addedAt)}</td>
                <td>
                  <button
                    className="action-btn edit"
                    onClick={() => onEdit(i, n)}
                    title="Edit"
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => onRemove(n)}
                    title="Delete"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
            {!recent.length && (
              <tr>
                <td colSpan="5" className="empty-msg">
                  No stock added this session yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
