import { createSlice } from "@reduxjs/toolkit";

const initialPage =
  typeof window !== "undefined" &&
  window.location.pathname === "/testmode/addshipment"
    ? "testmode-addshipment"
    : "landing";

const landingUiSlice = createSlice({
  name: "landingUi",
  initialState: { page: initialPage },
  reducers: {
    setLandingPage(state, action) {
      state.page = action.payload;
    },
  },
});

export const { setLandingPage } = landingUiSlice.actions;
export default landingUiSlice.reducer;
