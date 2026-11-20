import { createSlice } from "@reduxjs/toolkit";
import { logout } from "../../../auth/store/actions/authActions.js";

const initialState = { section: "nodes" };

const superAdminUiSlice = createSlice({
  name: "superAdminUi",
  initialState,
  reducers: {
    setSuperAdminSection(state, action) {
      state.section = action.payload;
    },
    resetSuperAdminUi: () => initialState,
  },
  extraReducers(builder) {
    builder.addCase(logout.pending, () => initialState);
  },
});

export const { resetSuperAdminUi, setSuperAdminSection } =
  superAdminUiSlice.actions;
export default superAdminUiSlice.reducer;
