import { useCallback, useEffect, useRef, useState } from "react";
import { transitHubApi } from "../api/transitHubApi.js";
import {
  normalizeIdentifier,
  validateTrackingId,
} from "../../utils/inputValidation.js";

export default function useTransitHubData(hubId, notify) {
  const [stats, setStats] = useState({
    inbound: 0,
    pending: 0,
    outbound: 0,
    capacity: 0,
    maxCapacity: 1,
  });
  const [inventory, setInventory] = useState([]);
  const [reports, setReports] = useState({
    inbound: [],
    outbound: [],
    inventory: [],
  });
  const [scanHistory, setScanHistory] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const loadedHub = useRef(null);

  const loadDashboard = useCallback(async () => {
    try {
      const [inventory, inbound, outbound, capacity, history, agencyRows] =
        await Promise.all([
          transitHubApi.getInventory(hubId),
          transitHubApi.getInbound(hubId),
          transitHubApi.getOutbound(hubId),
          transitHubApi.getCapacity(hubId),
          transitHubApi.getScanHistory(hubId),
          transitHubApi.getAgencies(),
        ]);
      const inventoryRows = Array.isArray(inventory)
        ? inventory
        : inventory.inventory || [];
      const inboundRows = Array.isArray(inbound)
        ? inbound
        : inbound.inbound || [];
      const outboundRows = Array.isArray(outbound)
        ? outbound
        : outbound.outbound || [];
      const maxCapacity =
        typeof capacity === "number"
          ? capacity
          : capacity.maxCapacity || capacity.capacity || 1;
      setStats({
        inbound: inventoryRows.length,
        pending: inboundRows.length,
        outbound: outboundRows.length,
        capacity: inventoryRows.length,
        maxCapacity,
      });
      setInventory(inventoryRows);
      setReports({
        inbound: inventoryRows,
        outbound: outboundRows,
        inventory: inventoryRows,
        prealert: inboundRows,
        scanHistory: Array.isArray(history) ? history : history.history || [],
      });
      setScanHistory(Array.isArray(history) ? history : history.history || []);
      setAgencies(Array.isArray(agencyRows) ? agencyRows : []);
    } catch (error) {
      notify(error.message || "Unable to load hub dashboard.", true);
    }
  }, [hubId, notify]);

  const loadInventory = useCallback(async () => {
    try {
      const result = await transitHubApi.getInventory(hubId);
      setInventory(Array.isArray(result) ? result : result.inventory || []);
    } catch (error) {
      notify(error.message || "Unable to load hub inventory.", true);
    }
  }, [hubId, notify]);

  const loadReports = useCallback(async () => {
    try {
      const [inventory, inbound, outbound, history] = await Promise.all([
        transitHubApi.getInventory(hubId),
        transitHubApi.getInbound(hubId),
        transitHubApi.getOutbound(hubId),
        transitHubApi.getScanHistory(hubId),
      ]);
      const inventoryRows = Array.isArray(inventory)
        ? inventory
        : inventory.inventory || [];
      setReports((current) => ({
        ...current,
        inbound: inventoryRows,
        prealert: Array.isArray(inbound) ? inbound : inbound.inbound || [],
        outbound: Array.isArray(outbound) ? outbound : outbound.outbound || [],
      }));
      setScanHistory(Array.isArray(history) ? history : history.history || []);
    } catch (error) {
      notify(error.message || "Unable to load hub reports.", true);
    }
  }, [hubId, notify]);

  useEffect(() => {
    if (!hubId || loadedHub.current === hubId) return;
    loadedHub.current = hubId;
    loadDashboard();
    loadInventory();
  }, [hubId, loadDashboard, loadInventory]);

  const inscan = async (trackingId) => {
    const id = normalizeIdentifier(trackingId);
    const validationError = validateTrackingId(id, { allowRto: true });
    if (validationError) {
      notify(validationError, true);
      return null;
    }
    try {
      const result = await transitHubApi.inscan(hubId, id);
      await Promise.all([loadDashboard(), loadInventory()]);
      return result;
    } catch (error) {
      notify(error.message || "In-scan failed.", true);
      return null;
    }
  };

  const outscan = async (trackingId) => {
    const id = normalizeIdentifier(trackingId);
    const validationError = validateTrackingId(id);
    if (validationError) {
      notify(validationError, true);
      return null;
    }
    try {
      const result = await transitHubApi.outscan(hubId, id);
      await Promise.all([loadDashboard(), loadInventory()]);
      return result;
    } catch (error) {
      notify(error.message || "Out-scan failed.", true);
      return null;
    }
  };

  return {
    stats,
    inventory,
    reports,
    scanHistory,
    agencies,
    loadReports,
    inscan,
    outscan,
  };
}
