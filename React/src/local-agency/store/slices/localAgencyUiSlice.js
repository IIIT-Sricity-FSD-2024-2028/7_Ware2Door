import { createSlice } from "@reduxjs/toolkit";
import { logout } from "../../../auth/store/actions/authActions.js";
import {
  fetchAgencyAgents,
  fetchAgencyDeliveries,
  fetchAgencyInbound,
  fetchAgencyRto,
  fetchAgencyScanHistory,
  fetchAgencyShipments,
  fetchAgencyTickets,
} from "../actions/localAgencyActions.js";

const initialState = {
  page: "dashboard",
  toast: null,
  loadRequestIds: {},
};

function trackLoadFailure(builder, thunk, resource) {
  builder
    .addCase(thunk.pending, (state, action) => {
      state.loadRequestIds[resource] = action.meta.requestId;
    })
    .addCase(thunk.fulfilled, (state, action) => {
      if (state.loadRequestIds[resource] === action.meta.requestId) {
        delete state.loadRequestIds[resource];
      }
    })
    .addCase(thunk.rejected, (state, action) => {
      if (
        action.meta.aborted ||
        state.loadRequestIds[resource] !== action.meta.requestId
      ) {
        return;
      }
      delete state.loadRequestIds[resource];
      state.toast = {
        msg: action.payload || action.error.message || "Unable to load agency data.",
        isError: true,
      };
    });
}

const localAgencyUiSlice = createSlice({
  name: "localAgencyUi",
  initialState,
  reducers: {
    setLocalAgencyPage(state, action) {
      state.page = action.payload;
    },
    setLocalAgencyToast(state, action) {
      state.toast = action.payload;
    },
    clearLocalAgencyToast(state) {
      state.toast = null;
    },
  },
  extraReducers(builder) {
    builder.addCase(logout.pending, () => initialState);
    trackLoadFailure(builder, fetchAgencyAgents, "agents");
    trackLoadFailure(builder, fetchAgencyDeliveries, "deliveries");
    trackLoadFailure(builder, fetchAgencyInbound, "inbound");
    trackLoadFailure(builder, fetchAgencyRto, "rto");
    trackLoadFailure(builder, fetchAgencyScanHistory, "scanHistory");
    trackLoadFailure(builder, fetchAgencyShipments, "shipments");
    trackLoadFailure(builder, fetchAgencyTickets, "tickets");
  },
});

export const {
  clearLocalAgencyToast,
  setLocalAgencyPage,
  setLocalAgencyToast,
} = localAgencyUiSlice.actions;
export default localAgencyUiSlice.reducer;
