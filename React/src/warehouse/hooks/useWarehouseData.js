import { useEffect, useMemo, useRef, useState } from "react";
import { warehouseApi } from "../api/warehouseApi.js";
import {
  normalizeInventory,
  normalizeRto,
  normalizeShipment,
  stockStatus,
} from "../utils/warehouseUtils.js";

export default function useWarehouseData(warehouseId, notify) {
  const [inventory, setInventory] = useState([]);
  const [pending, setPending] = useState([]);
  const [outbound, setOutbound] = useState([]);
  const [rtos, setRtos] = useState([]);
  const [preAlert, setPreAlert] = useState({
    active_hubs: 0,
    total_out_scanned: 0,
    hubs: [],
  });
  const [hubs, setHubs] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [recentStock, setRecentStock] = useState([]);
  const initialLoadWarehouseRef = useRef(null);

  const load = async (path, setter, fallback, label) => {
    try {
      const result = await path();
      setter(Array.isArray(result) ? result : fallback(result));
    } catch (error) {
      console.error(`${label} load failed`, error);
      notify(error.message || `Unable to load ${label}.`, true);
    }
  };

  const loadInventory = () =>
    load(
      () => warehouseApi.getInventory(warehouseId),
      (result) => setInventory(normalizeInventory(result)),
      (result) => normalizeInventory(result.inventory || []),
      "inventory",
    );

  const loadPending = () =>
    load(
      () => warehouseApi.getPendingShipments(warehouseId),
      (result) => setPending(result.map(normalizeShipment)),
      (result) => (result.pendingShipments || []).map(normalizeShipment),
      "shipment requests",
    );

  const loadOutbound = () =>
    load(
      () => warehouseApi.getOutbound(warehouseId),
      setOutbound,
      (result) => result.outbound || [],
      "outbound shipments",
    );

  const loadRtos = () =>
    load(
      () => warehouseApi.getRto(warehouseId),
      (result) => setRtos(result.map(normalizeRto)),
      (result) => (result.rto || []).map(normalizeRto),
      "RTO shipments",
    );

  const loadPreAlert = () =>
    load(
      () => warehouseApi.getPreAlert(warehouseId),
      (result) =>
        setPreAlert(Array.isArray(result) ? { hubs: result } : result),
      (result) => result,
      "pre-alerts",
    );

  useEffect(() => {
    if (!warehouseId || initialLoadWarehouseRef.current === warehouseId) return;
    initialLoadWarehouseRef.current = warehouseId;
    loadInventory();
    loadPending();
    loadOutbound();
    loadRtos();
    Promise.all([warehouseApi.getHubs(), warehouseApi.getAgencies()])
      .then(([hubData, agencyData]) => {
        setHubs(Array.isArray(hubData) ? hubData : []);
        setAgencies(Array.isArray(agencyData) ? agencyData : []);
      })
      .catch((error) => {
        console.error("Warehouse system data load failed", error);
        notify(error.message, true);
      });
  }, [warehouseId]);

  const availability = (product) => {
    const item = inventory.find(
      (entry) =>
        (entry.itemName || "").toLowerCase() === (product || "").toLowerCase(),
    );
    const status = stockStatus(item?.quantity || 0);
    return {
      label: status,
      key:
        status === "In Stock" ? "in" : status === "Low Stock" ? "low" : "out",
    };
  };

  const addStock = async (labelId, itemName, quantityValue) => {
    const quantity = Number(quantityValue);
    if (!labelId || !itemName || quantity < 1)
      return notify("Please fill all fields correctly.", true);
    try {
      await warehouseApi.addStock(warehouseId, {
        labelID: labelId,
        itemName,
        quantity,
      });
      setRecentStock((items) => [
        { labelId, itemName, quantity, addedAt: new Date().toISOString() },
        ...items,
      ]);
      notify("Stock added to inventory");
      loadInventory();
    } catch (error) {
      notify(error.message, true);
    }
  };

  const dispatch = async (orderId, hubId, agencyId) => {
    try {
      const result = await warehouseApi.dispatch(warehouseId, {
        orderId,
        hubId,
        agencyId,
      });
      if (result?.success === false)
        throw new Error(result.error || "Unable to dispatch shipment.");
      notify("Shipment dispatched successfully");
      await Promise.all([loadPending(), loadOutbound(), loadInventory()]);
      return true;
    } catch (error) {
      notify(error.message, true);
      return false;
    }
  };

  const reject = async (id) => {
    try {
      await warehouseApi.rejectShipment(warehouseId, id);
      notify(`Shipment #${id} rejected.`);
      loadPending();
    } catch (error) {
      notify(error.message, true);
    }
  };

  const inscan = async (rtoId) => {
    if (!rtoId.trim()) {
      notify("Enter RTO ID", true);
      return false;
    }
    try {
      const result = await warehouseApi.warehouseInscan(rtoId.trim());
      if (result.status !== "success")
        throw new Error(result.flagMsg || result.message);
      notify("RTO inscan successful");
      loadRtos();
      loadInventory();
      return true;
    } catch (error) {
      notify(error.message, true);
      return false;
    }
  };

  const stats = useMemo(
    () => ({
      inventory: inventory.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0,
      ),
      shipments: pending.length,
      outbound: outbound.length,
      rto: rtos.length,
    }),
    [inventory, pending, outbound, rtos],
  );

  return {
    inventory,
    pending,
    outbound,
    rtos,
    preAlert,
    hubs,
    agencies,
    recentStock,
    setRecentStock,
    availability,
    addStock,
    dispatch,
    reject,
    inscan,
    loadPreAlert,
    stats,
  };
}
