import { createSlice } from "@reduxjs/toolkit";
import { logout } from "../../../auth/store/actions/authActions.js";
import {
  fetchTransitHubDashboard,
  fetchTransitHubInventory,
  fetchTransitHubReports,
} from "../actions/transitHubActions.js";

const initialState = {
  page: "dashboard",
  inventoryOpen: false,
  scanMode: "inscan",
  modal: null,
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
        msg: action.payload || action.error.message,
        isError: true,
      };
    });
}

const transitHubUiSlice = createSlice({
  name: "transitHubUi",
  initialState,
  reducers: {
    setTransitHubPage(state, action) {
      state.page = action.payload;
      state.inventoryOpen = ["hub-inv", "reports"].includes(action.payload);
    },
    setTransitHubScanMode(state, action) {
      state.scanMode = action.payload;
    },
    toggleTransitHubInventory(state) {
      state.inventoryOpen = !state.inventoryOpen;
    },
    setTransitHubModal(state, action) {
      state.modal = action.payload;
    },
    setTransitHubToast(state, action) {
      state.toast = action.payload;
    },
    clearTransitHubToast(state) {
      state.toast = null;
    },
  },
  extraReducers(builder) {
    builder.addCase(logout.pending, () => initialState);
    trackLoadFailure(builder, fetchTransitHubDashboard, "dashboard");
    trackLoadFailure(builder, fetchTransitHubInventory, "inventory");
    trackLoadFailure(builder, fetchTransitHubReports, "reports");
  },
});

export const {
  clearTransitHubToast,
  setTransitHubPage,
  setTransitHubModal,
  setTransitHubScanMode,
  setTransitHubToast,
  toggleTransitHubInventory,
} = transitHubUiSlice.actions;
export default transitHubUiSlice.reducer;
