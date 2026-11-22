import { createSlice } from "@reduxjs/toolkit";
import { logout } from "../../../auth/store/actions/authActions.js";
import { fetchAdminTeamsSection } from "../actions/adminTeamsActions.js";

const initialState = {
  nodes: [],
  drivers: [],
  escalations: [],
  partners: [],
  performance: { warehouses: [], hubs: [], agencies: [] },
  loadingBySection: {},
  errorsBySection: {},
  requestIdsBySection: {},
};

const adminTeamsSlice = createSlice({
  name: "adminTeams",
  initialState,
  reducers: {
    resetAdminTeams: () => initialState,
  },
  extraReducers(builder) {
    builder
      .addCase(logout.pending, () => initialState)
      .addCase(fetchAdminTeamsSection.pending, (state, action) => {
        state.loadingBySection[action.meta.arg] = true;
        state.errorsBySection[action.meta.arg] = "";
        state.requestIdsBySection[action.meta.arg] = action.meta.requestId;
      })
      .addCase(fetchAdminTeamsSection.fulfilled, (state, action) => {
        if (
          state.requestIdsBySection[action.meta.arg] !== action.meta.requestId
        ) {
          return;
        }
        state.loadingBySection[action.meta.arg] = false;
        state.errorsBySection[action.meta.arg] = "";
        delete state.requestIdsBySection[action.meta.arg];
        Object.assign(state, action.payload);
      })
      .addCase(fetchAdminTeamsSection.rejected, (state, action) => {
        if (
          action.meta.aborted ||
          state.requestIdsBySection[action.meta.arg] !== action.meta.requestId
        ) {
          return;
        }
        state.loadingBySection[action.meta.arg] = false;
        delete state.requestIdsBySection[action.meta.arg];
        state.errorsBySection[action.meta.arg] =
          action.error.message || "Unable to load Admin Teams data.";
      });
  },
});

export const { resetAdminTeams } = adminTeamsSlice.actions;
export default adminTeamsSlice.reducer;
