import { createAsyncThunk } from "@reduxjs/toolkit";
import { transitHubApi } from "../api/transitHubApi.js";

const rejectRequest = (error, rejectWithValue) =>
  rejectWithValue(error.message || "The transit hub request failed.");
const asList = (result, key) =>
  Array.isArray(result) ? result : result?.[key] || [];

export const fetchTransitHubDashboard = createAsyncThunk(
  "transitHub/fetchDashboard",
  async (hubId, { rejectWithValue, signal }) => {
    try {
      const [inventory, inbound, outbound, capacity, history, agencies] =
        await Promise.all([
          transitHubApi.getInventory(hubId, signal),
          transitHubApi.getInbound(hubId, signal),
          transitHubApi.getOutbound(hubId, signal),
          transitHubApi.getCapacity(hubId, signal),
          transitHubApi.getScanHistory(hubId, signal),
          transitHubApi.getAgencies(signal),
        ]);
      const inventoryRows = asList(inventory, "inventory");
      const inboundRows = asList(inbound, "inbound");
      const outboundRows = asList(outbound, "outbound");
      const historyRows = asList(history, "history");
      const maxCapacity =
        typeof capacity === "number"
          ? capacity
          : capacity.maxCapacity || capacity.capacity || 1;
      return {
        stats: {
          inbound: inventoryRows.length,
          pending: inboundRows.length,
          outbound: outboundRows.length,
          capacity: inventoryRows.length,
          maxCapacity,
        },
        inventory: inventoryRows,
        reports: {
          inbound: inventoryRows,
          outbound: outboundRows,
          inventory: inventoryRows,
          prealert: inboundRows,
          scanHistory: historyRows,
        },
        scanHistory: historyRows,
        agencies: Array.isArray(agencies) ? agencies : [],
      };
    } catch (error) {
      return rejectRequest(error, rejectWithValue);
    }
  },
);

export const fetchTransitHubInventory = createAsyncThunk(
  "transitHub/fetchInventory",
  async (hubId, { rejectWithValue, signal }) => {
    try {
      return asList(await transitHubApi.getInventory(hubId, signal), "inventory");
    } catch (error) {
      return rejectRequest(error, rejectWithValue);
    }
  },
);

export const fetchTransitHubReports = createAsyncThunk(
  "transitHub/fetchReports",
  async (hubId, { rejectWithValue, signal }) => {
    try {
      const [inventory, inbound, outbound, history] = await Promise.all([
        transitHubApi.getInventory(hubId, signal),
        transitHubApi.getInbound(hubId, signal),
        transitHubApi.getOutbound(hubId, signal),
        transitHubApi.getScanHistory(hubId, signal),
      ]);
      const inventoryRows = asList(inventory, "inventory");
      const historyRows = asList(history, "history");
      return {
        reports: {
          inbound: inventoryRows,
          prealert: asList(inbound, "inbound"),
          outbound: asList(outbound, "outbound"),
        },
        scanHistory: historyRows,
      };
    } catch (error) {
      return rejectRequest(error, rejectWithValue);
    }
  },
);

export const performTransitHubInscan = createAsyncThunk(
  "transitHub/inscan",
  async ({ hubId, trackingId }, { rejectWithValue }) => {
    try {
      return await transitHubApi.inscan(hubId, trackingId);
    } catch (error) {
      return rejectRequest(error, rejectWithValue);
    }
  },
);

export const performTransitHubOutscan = createAsyncThunk(
  "transitHub/outscan",
  async ({ hubId, trackingId }, { rejectWithValue }) => {
    try {
      return await transitHubApi.outscan(hubId, trackingId);
    } catch (error) {
      return rejectRequest(error, rejectWithValue);
    }
  },
);

export const updateTransitHubProfile = createAsyncThunk(
  "transitHub/updateProfile",
  async ({ hubId, profile }, { rejectWithValue }) => {
    try {
      await transitHubApi.updateProfile(hubId, profile);
      return profile;
    } catch (error) {
      return rejectRequest(error, rejectWithValue);
    }
  },
);

export const updateTransitHubPassword = createAsyncThunk(
  "transitHub/updatePassword",
  async ({ hubId, currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      await transitHubApi.updatePassword(hubId, {
        currentPassword,
        newPassword,
      });
    } catch (error) {
      return rejectRequest(error, rejectWithValue);
    }
  },
);
