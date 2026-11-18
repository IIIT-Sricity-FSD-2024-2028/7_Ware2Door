import { useCallback, useEffect, useState } from "react";
import { localAgencyApi } from "../api/localAgencyApi.js";

const listFrom = (result, key) =>
  Array.isArray(result) ? result : result?.[key] || [];

export default function useLocalAgencyData(agencyId, notify, activePage) {
  const [shipments, setShipments] = useState([]);
  const [inbound, setInbound] = useState([]);
  const [agents, setAgents] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [rto, setRto] = useState([]);
  const [tickets, setTickets] = useState([]);

  const load = useCallback(
    async (request, setter, key, label) => {
      try {
        setter(listFrom(await request(), key));
      } catch (error) {
        console.error(`Local Agency ${label} load failed`, error);
        notify(error.message || `Unable to load ${label}.`, true);
      }
    },
    [notify],
  );

  const loadShipments = useCallback(
    () =>
      load(
        () => localAgencyApi.getShipments(agencyId),
        setShipments,
        "shipments",
        "shipments",
      ),
    [agencyId, load],
  );

  const loadInbound = useCallback(
    () =>
      load(
        () => localAgencyApi.getInbound(agencyId),
        setInbound,
        "inbound",
        "inbound shipments",
      ),
    [agencyId, load],
  );

  const loadAgents = useCallback(
    () =>
      load(
        () => localAgencyApi.getAgents(agencyId),
        setAgents,
        "agents",
        "delivery agents",
      ),
    [agencyId, load],
  );

  const loadScanHistory = useCallback(
    () =>
      load(
        () => localAgencyApi.getScanHistory(agencyId),
        setScanHistory,
        "history",
        "scan history",
      ),
    [agencyId, load],
  );

  const loadDeliveries = useCallback(
    () =>
      load(
        () => localAgencyApi.getDeliveries(agencyId),
        setDeliveries,
        "deliveries",
        "deliveries",
      ),
    [agencyId, load],
  );

  const loadRto = useCallback(
    () =>
      load(
        () => localAgencyApi.getRto(agencyId),
        setRto,
        "rto",
        "RTO requests",
      ),
    [agencyId, load],
  );

  const loadTickets = useCallback(
    () =>
      load(
        () => localAgencyApi.getTickets(agencyId),
        setTickets,
        "tickets",
        "support tickets",
      ),
    [agencyId, load],
  );

  useEffect(() => {
    if (!agencyId) return;
    const pageLoaders = {
      dashboard: [loadShipments, loadAgents],
      shipments: [loadShipments],
      scan: [loadInbound, loadAgents, loadScanHistory],
      agents: [loadAgents],
      rto: [loadRto],
      delivery: [loadDeliveries],
      support: [loadTickets],
    };
    (pageLoaders[activePage] || []).forEach((loadPageData) => loadPageData());
  }, [
    activePage,
    agencyId,
    loadInbound,
    loadAgents,
    loadDeliveries,
    loadRto,
    loadScanHistory,
    loadShipments,
    loadTickets,
  ]);

  return {
    shipments,
    inbound,
    agents,
    scanHistory,
    deliveries,
    rto,
    tickets,
    setTickets,
    loadShipments,
    loadInbound,
    loadAgents,
    loadScanHistory,
    loadDeliveries,
    loadRto,
    loadTickets,
  };
}
