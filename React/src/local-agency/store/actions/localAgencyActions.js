import { createAsyncThunk } from "@reduxjs/toolkit";
import { localAgencyApi } from "../api/localAgencyApi.js";

const rejectRequest = (error, rejectWithValue) =>
  rejectWithValue(error.message || "The Local Agency request failed.");
const asList = (result, key) =>
  Array.isArray(result) ? result : result?.[key] || [];

function createListThunk(type, key, request) {
  return createAsyncThunk(type, async (agencyId, { rejectWithValue, signal }) => {
    try {
      return asList(await request(agencyId, signal), key);
    } catch (error) {
      return rejectRequest(error, rejectWithValue);
    }
  });
}

export const fetchAgencyShipments = createListThunk(
  "localAgency/fetchShipments",
  "shipments",
  localAgencyApi.getShipments,
);
export const fetchAgencyInbound = createListThunk(
  "localAgency/fetchInbound",
  "inbound",
  localAgencyApi.getInbound,
);
export const fetchAgencyAgents = createListThunk(
  "localAgency/fetchAgents",
  "agents",
  localAgencyApi.getAgents,
);
export const fetchAgencyScanHistory = createListThunk(
  "localAgency/fetchScanHistory",
  "history",
  localAgencyApi.getScanHistory,
);
export const fetchAgencyDeliveries = createListThunk(
  "localAgency/fetchDeliveries",
  "deliveries",
  localAgencyApi.getDeliveries,
);
export const fetchAgencyRto = createListThunk(
  "localAgency/fetchRto",
  "rto",
  localAgencyApi.getRto,
);
export const fetchAgencyTickets = createListThunk(
  "localAgency/fetchTickets",
  "tickets",
  localAgencyApi.getTickets,
);

export const fetchAgencyTracking = createAsyncThunk(
  "localAgency/fetchTracking",
  async (trackingId, { rejectWithValue }) => {
    try {
      return await localAgencyApi.getTracking(trackingId);
    } catch (error) {
      return rejectRequest(error, rejectWithValue);
    }
  },
);

function createMutation(type, request) {
  return createAsyncThunk(type, async (args, { rejectWithValue }) => {
    try {
      return await request(args);
    } catch (error) {
      return rejectRequest(error, rejectWithValue);
    }
  });
}

export const assignAgencyAgent = createMutation(
  "localAgency/assignAgent",
  ({ agencyId, trackingId, agentId }) =>
    localAgencyApi.assignAgent(agencyId, { trackingId, agentId }),
);
export const addAgencyAgent = createMutation(
  "localAgency/addAgent",
  ({ agencyId, agent }) => localAgencyApi.addAgent(agencyId, agent),
);
export const updateAgencyAgent = createMutation(
  "localAgency/updateAgent",
  ({ agencyId, agentId, agent }) =>
    localAgencyApi.updateAgent(agencyId, agentId, agent),
);
export const deleteAgencyAgent = createMutation(
  "localAgency/deleteAgent",
  ({ agencyId, agentId }) => localAgencyApi.deleteAgent(agencyId, agentId),
);
export const performAgencyInscan = createMutation(
  "localAgency/inscan",
  ({ agencyId, trackingId }) => localAgencyApi.inscan(agencyId, trackingId),
);
export const performAgencyOutscan = createMutation(
  "localAgency/outscan",
  ({ agencyId, trackingId }) => localAgencyApi.outscan(agencyId, trackingId),
);
export const initiateAgencyRto = createMutation(
  "localAgency/initiateRto",
  ({ agencyId, details }) => localAgencyApi.initiateRto(agencyId, details),
);
export const confirmAgencyDelivery = createMutation(
  "localAgency/confirmDelivery",
  ({ agencyId, trackingId }) =>
    localAgencyApi.confirmDelivery(agencyId, trackingId),
);
export const recordAgencyDeliveryAttempt = createMutation(
  "localAgency/recordDeliveryAttempt",
  ({ agencyId, trackingId, details }) =>
    localAgencyApi.recordDeliveryAttempt(agencyId, trackingId, details),
);
export const resolveAgencyTicket = createMutation(
  "localAgency/resolveTicket",
  ({ ticketId }) => localAgencyApi.resolveTicket(ticketId),
);
export const escalateAgencyTicket = createMutation(
  "localAgency/escalateTicket",
  ({ ticketId, escalationNote }) =>
    localAgencyApi.escalateTicket(ticketId, { escalationNote }),
);
export const updateAgencyTicketStatus = createMutation(
  "localAgency/updateTicketStatus",
  ({ ticketId, status }) =>
    localAgencyApi.updateTicketStatus(ticketId, status),
);
export const updateAgencyProfile = createMutation(
  "localAgency/updateProfile",
  ({ agencyId, profile }) => localAgencyApi.updateProfile(agencyId, profile),
);
export const updateAgencyPassword = createMutation(
  "localAgency/updatePassword",
  ({ agencyId, currentPassword, newPassword }) =>
    localAgencyApi.updatePassword(agencyId, { currentPassword, newPassword }),
);
