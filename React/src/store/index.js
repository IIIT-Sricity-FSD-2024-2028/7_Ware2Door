import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../auth/store/slices/authSlice.js";
import landingReducer from "../landing/store/index.js";
import warehouseReducer from "../warehouse/store/index.js";
import transitHubReducer from "../transit-hub/store/index.js";
import localAgencyReducer from "../local-agency/store/index.js";
import { adminTeamsReducers } from "../adminteams/store/index.js";
import { superAdminReducers } from "../superadmin/store/index.js";

const store = configureStore({
  reducer: {
    auth: authReducer,
    landing: landingReducer,
    warehouse: warehouseReducer,
    transitHub: transitHubReducer,
    localAgency: localAgencyReducer,
    ...adminTeamsReducers,
    ...superAdminReducers,
  },
});

export default store;
