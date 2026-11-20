import { combineReducers } from "@reduxjs/toolkit";
import publicDataReducer from "./slices/publicDataSlice.js";
import landingUiReducer from "./slices/landingUiSlice.js";

const landingReducer = combineReducers({
  data: publicDataReducer,
  ui: landingUiReducer,
});

export default landingReducer;
