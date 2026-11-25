import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchWarehousePendingShipments,
  rejectWarehouseShipment,
} from "../store/actions/warehouseActions.js";
import {
  openWarehouseDispatch,
  setSelectedWarehouseOrders,
  setWarehouseToast,
  toggleSelectedWarehouseOrder,
} from "../store/slices/warehouseUiSlice.js";
import { fmtDate, stockStatus } from "../utils/warehouseUtils.js";

export default function ShipmentRequestsPage() {
  const dispatch = useDispatch();
  const warehouseId = useSelector((state) => state.auth.session?.user?.id);
  const { pending, inventory } = useSelector((state) => state.warehouse.data);
  const selectedIds = useSelector(
    (state) => state.warehouse.ui.selectedOrderIds,
  );
  const selected = new Set(selectedIds);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("");
  const [stock, setStock] = useState("");
  const availability = (product) => {
    const item = inventory.find(
      (entry) =>
        (entry.itemName || "").toLowerCase() === (product || "").toLowerCase(),
    );
    const label = stockStatus(item?.quantity || 0);
    return {
      label,
      key: label === "In Stock" ? "in" : label === "Low Stock" ? "low" : "out",
    };
  };
  const query = search.toLowerCase();
  const shipments = pending.filter(
    (item) =>
      (!query ||
        `${item.orderId} ${item.productName} ${item.sku}`
          .toLowerCase()
          .includes(query)) &&
      (!source || item.source === source) &&
      (!stock || availability(item.productName).key === stock),
  );
  const onSelectAll = (checked) =>
    dispatch(
      setSelectedWarehouseOrders(
        checked ? shipments.map((item) => item.orderId) : [],
      ),
    );
  const onSelect = (orderId, checked) =>
    dispatch(toggleSelectedWarehouseOrder({ orderId, checked }));
  const onAccept = () => {
    const ids = pending
      .filter((item) => selected.has(item.orderId))
      .map((item) => item.orderId);
    if (ids.length) {
      dispatch(openWarehouseDispatch({ orderIds: ids, bulk: true }));
    }
  };
  const onReject = async (orderId) => {
    try {
      await dispatch(
        rejectWarehouseShipment({ warehouseId, orderId }),
      ).unwrap();
      await dispatch(fetchWarehousePendingShipments(warehouseId)).unwrap();
      dispatch(
        setWarehouseToast({ msg: `Shipment #${orderId} rejected.` }),
      );
    } catch (error) {
      dispatch(
        setWarehouseToast({
          msg: typeof error === "string" ? error : error.message,
          isError: true,
        }),
      );
    }
  };
  const onDispatch = (orderId) =>
    dispatch(openWarehouseDispatch({ orderIds: [orderId] }));

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
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          <option value="">All Platforms</option>
          <option>Amazon</option>
          <option>Shopsy</option>
          <option>Flipkart</option>
          <option>Meesho</option>
        </select>
        <select
          className="filter-select"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
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
