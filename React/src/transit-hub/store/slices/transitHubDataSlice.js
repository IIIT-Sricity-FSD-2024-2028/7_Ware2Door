import { createSlice } from "@reduxjs/toolkit";
import { logout } from "../../../auth/store/actions/authActions.js";
import {
  fetchTransitHubDashboard,
  fetchTransitHubInventory,
  fetchTransitHubReports,
} from "../actions/transitHubActions.js";

const initialState = {
  stats: { inbound: 0, pending: 0, outbound: 0, capacity: 0, maxCapacity: 1 },
  inventory: [],
  reports: { inbound: [], outbound: [], inventory: [], prealert: [] },
  scanHistory: [],
  agencies: [],
  requests: {},
};

function trackRequest(builder, thunk, resource, assign) {
  builder
    .addCase(thunk.pending, (state, action) => {
      state.requests[resource] = {
        status: "pending",
        error: "",
        requestId: action.meta.requestId,
      };
    })
    .addCase(thunk.fulfilled, (state, action) => {
      if (state.requests[resource]?.requestId !== action.meta.requestId) return;
      assign(state, action.payload);
      state.requests[resource] = { status: "fulfilled", error: "" };
    })
    .addCase(thunk.rejected, (state, action) => {
      if (
        action.meta.aborted ||
        state.requests[resource]?.requestId !== action.meta.requestId
      ) {
        return;
      }
      state.requests[resource] = {
        status: "rejected",
        error:
          action.payload || action.error.message || "Unable to load hub data.",
      };
    });
}

const transitHubDataSlice = createSlice({
  name: "transitHubData",
  initialState,
  reducers: {
    resetTransitHubData: () => initialState,
  },
  extraReducers(builder) {
    trackRequest(builder, fetchTransitHubDashboard, "dashboard", (state, data) => {
      state.stats = data.stats;
      state.inventory = data.inventory;
      state.reports = data.reports;
      state.scanHistory = data.scanHistory;
      state.agencies = data.agencies;
    });
    trackRequest(builder, fetchTransitHubInventory, "inventory", (state, data) => {
      state.inventory = data;
    });
    trackRequest(builder, fetchTransitHubReports, "reports", (state, data) => {
      state.reports = { ...state.reports, ...data.reports };
      state.scanHistory = data.scanHistory;
    });
    builder.addCase(logout.pending, () => initialState);
  },
});

export const { resetTransitHubData } = transitHubDataSlice.actions;
export default transitHubDataSlice.reducer;
