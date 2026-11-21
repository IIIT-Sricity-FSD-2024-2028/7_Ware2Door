import adminTeamsReducer from "./slices/adminTeamsSlice.js";
import adminTeamsUiReducer from "./slices/adminTeamsUiSlice.js";

export const adminTeamsReducers = {
  adminTeams: adminTeamsReducer,
  adminTeamsUi: adminTeamsUiReducer,
};
