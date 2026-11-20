import superAdminReducer from "./slices/superAdminSlice.js";
import superAdminUiReducer from "./slices/superAdminUiSlice.js";

export const superAdminReducers = {
  superAdmin: superAdminReducer,
  superAdminUi: superAdminUiReducer,
};
