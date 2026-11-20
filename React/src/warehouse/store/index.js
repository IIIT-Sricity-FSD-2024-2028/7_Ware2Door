import { combineReducers } from "@reduxjs/toolkit";
import warehouseDataReducer from "./slices/warehouseDataSlice.js";
import warehouseUiReducer from "./slices/warehouseUiSlice.js";

const warehouseReducer = combineReducers({
    data: warehouseDataReducer,
    ui: warehouseUiReducer,
});

export default warehouseReducer;
