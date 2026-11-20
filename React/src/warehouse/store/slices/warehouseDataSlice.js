import { createSlice } from "@reduxjs/toolkit";
import { logout } from "../../../auth/store/actions/authActions.js";
import {
    addWarehouseStock,
    dispatchWarehouseShipment,
    fetchWarehouseInventory,
    fetchWarehouseOutbound,
    fetchWarehousePendingShipments,
    fetchWarehousePreAlert,
    fetchWarehouseRtos,
    fetchWarehouseSystemOptions,
    inscanWarehouseRto,
    rejectWarehouseShipment,
    updateWarehousePassword,
    updateWarehouseProfile,
} from "../actions/warehouseActions.js";

const initialState = {
    inventory: [],
    pending: [],
    outbound: [],
    rtos: [],
    preAlert: { active_hubs: 0, total_out_scanned: 0, hubs: [] },
    hubs: [],
    agencies: [],
    recentStock: [],
    requests: {},
    mutationRequestIds: {},
};

function trackMutation(builder, thunk, resource, onFulfilled) {
    builder
        .addCase(thunk.pending, (state, action) => {
            state.mutationRequestIds[resource] = action.meta.requestId;
        })
        .addCase(thunk.fulfilled, (state, action) => {
            if (state.mutationRequestIds[resource] !== action.meta.requestId) return;
            delete state.mutationRequestIds[resource];
            onFulfilled(state, action);
        })
        .addCase(thunk.rejected, (state, action) => {
            if (state.mutationRequestIds[resource] === action.meta.requestId) {
                delete state.mutationRequestIds[resource];
            }
        });
}

function trackRequest(builder, thunk, resource, assign) {
    builder
        .addCase(thunk.pending, (state, action) => {
            state.requests[resource] = {
                status: "pending",
                error: "",
                requestId: action.meta.requestId,
            };
        })
        .addCase(thunk.fulfilled, (state, action) => {
            if (state.requests[resource]?.requestId !== action.meta.requestId) return;
            assign(state, action.payload);
            state.requests[resource] = { status: "fulfilled", error: "" };
        })
        .addCase(thunk.rejected, (state, action) => {
            if (action.meta.aborted) return;
            if (state.requests[resource]?.requestId !== action.meta.requestId) return;
            state.requests[resource] = {
                status: "rejected",
                error:
                    action.payload || action.error.message || "Unable to load warehouse data.",
            };
        });
}

const warehouseDataSlice = createSlice({
    name: "warehouseData",
    initialState,
    reducers: {
        resetWarehouseData: () => initialState,
        removeRecentWarehouseStock(state, action) {
            state.recentStock.splice(action.payload, 1);
        },
    },
    extraReducers(builder) {
        trackRequest(builder, fetchWarehouseInventory, "inventory", (state, data) => {
            state.inventory = data;
        });
        trackRequest(builder, fetchWarehousePendingShipments, "pending", (state, data) => {
            state.pending = data;
        });
        trackRequest(builder, fetchWarehouseOutbound, "outbound", (state, data) => {
            state.outbound = data;
        });
        trackRequest(builder, fetchWarehouseRtos, "rtos", (state, data) => {
            state.rtos = data;
        });
        trackRequest(builder, fetchWarehousePreAlert, "preAlert", (state, data) => {
            state.preAlert = data;
        });
        trackRequest(builder, fetchWarehouseSystemOptions, "systemOptions", (state, data) => {
            state.hubs = data.hubs;
            state.agencies = data.agencies;
        });
        trackMutation(builder, addWarehouseStock, "addStock", (state, action) => {
            state.recentStock.unshift(action.payload);
        });
        trackMutation(
            builder,
            dispatchWarehouseShipment,
            "dispatchShipment",
            (state, action) => {
                state.pending = state.pending.filter(
                    (shipment) => shipment.orderId !== action.payload.orderId,
                );
            },
        );
        trackMutation(
            builder,
            rejectWarehouseShipment,
            "rejectShipment",
            (state, action) => {
                state.pending = state.pending.filter(
                    (shipment) => shipment.orderId !== action.payload,
                );
            },
        );
        trackMutation(builder, inscanWarehouseRto, "inscanRto", (state, action) => {
            state.requests.rtos = { status: "idle", error: "" };
            state.requests.inventory = { status: "idle", error: "" };
            state.lastInscan = action.payload.rtoId;
        });
        builder
            .addCase(updateWarehouseProfile.fulfilled, () => { })
            .addCase(updateWarehousePassword.fulfilled, () => { })
            .addCase(logout.pending, () => initialState);
    },
});

export const { removeRecentWarehouseStock, resetWarehouseData } =
    warehouseDataSlice.actions;
export default warehouseDataSlice.reducer;
