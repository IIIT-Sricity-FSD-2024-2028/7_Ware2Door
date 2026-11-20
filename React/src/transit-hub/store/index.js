import { combineReducers } from "@reduxjs/toolkit";
import transitHubDataReducer from "./slices/transitHubDataSlice.js";
import transitHubUiReducer from "./slices/transitHubUiSlice.js";

const transitHubReducer = combineReducers({
  data: transitHubDataReducer,
  ui: transitHubUiReducer,
});

export default transitHubReducer;
