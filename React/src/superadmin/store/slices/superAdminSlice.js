import { createSlice } from "@reduxjs/toolkit";
import { logout } from "../../../auth/store/actions/authActions.js";
import { fetchSuperAdminSectionData } from "../actions/superAdminActions.js";

const initialState = {
  nodes: [],
  escalations: [],
  partners: [],
  performance: { warehouses: [], hubs: [], agencies: [] },
  loadingBySection: {},
  errorsBySection: {},
  requestIdsBySection: {},
};

const superAdminSlice = createSlice({
  name: "superAdmin",
  initialState,
  reducers: {
    resetSuperAdminData: () => initialState,
  },
  extraReducers(builder) {
    builder
      .addCase(logout.pending, () => initialState)
      .addCase(fetchSuperAdminSectionData.pending, (state, action) => {
        state.loadingBySection[action.meta.arg] = true;
        state.errorsBySection[action.meta.arg] = "";
        state.requestIdsBySection[action.meta.arg] = action.meta.requestId;
      })
      .addCase(fetchSuperAdminSectionData.fulfilled, (state, action) => {
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
      .addCase(fetchSuperAdminSectionData.rejected, (state, action) => {
        if (
          action.meta.aborted ||
          state.requestIdsBySection[action.meta.arg] !== action.meta.requestId
        ) {
          return;
        }
        state.loadingBySection[action.meta.arg] = false;
        delete state.requestIdsBySection[action.meta.arg];
        state.errorsBySection[action.meta.arg] =
          action.error.message || "Unable to load Super Admin data.";
      });
  },
});

export const { resetSuperAdminData } = superAdminSlice.actions;
export default superAdminSlice.reducer;
