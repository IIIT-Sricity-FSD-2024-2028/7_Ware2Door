import { combineReducers } from "@reduxjs/toolkit";
import localAgencyDataReducer from "./slices/localAgencyDataSlice.js";
import localAgencyUiReducer from "./slices/localAgencyUiSlice.js";

const localAgencyReducer = combineReducers({
  data: localAgencyDataReducer,
  ui: localAgencyUiReducer,
});

export default localAgencyReducer;
