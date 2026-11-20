import { createSlice } from "@reduxjs/toolkit";
import { logout } from "../../../auth/store/actions/authActions.js";
import {
    fetchWarehouseInventory,
    fetchWarehouseOutbound,
    fetchWarehousePendingShipments,
    fetchWarehousePreAlert,
    fetchWarehouseRtos,
    fetchWarehouseSystemOptions,
} from "../actions/warehouseActions.js";

const initialState = {
    page: "dashboard",
    inventoryOpen: false,
    modal: null,
    dispatchOrderIds: [],
    bulkDispatch: false,
    selectedOrderIds: [],
    toast: null,
    loadRequestIds: {},
};

function trackLoadFailure(builder, thunk, resource) {
    builder
        .addCase(thunk.pending, (state, action) => {
            state.loadRequestIds[resource] = action.meta.requestId;
        })
        .addCase(thunk.fulfilled, (state, action) => {
            if (state.loadRequestIds[resource] === action.meta.requestId) {
                delete state.loadRequestIds[resource];
            }
        })
        .addCase(thunk.rejected, (state, action) => {
            if (
                action.meta.aborted ||
                state.loadRequestIds[resource] !== action.meta.requestId
            ) {
                return;
            }
            delete state.loadRequestIds[resource];
            state.toast = {
                msg: action.payload || action.error.message,
                isError: true,
            };
        });
}

const warehouseUiSlice = createSlice({
    name: "warehouseUi",
    initialState,
    reducers: {
        setWarehousePage(state, action) {
            state.page = action.payload;
            if (
                !["prealert", "outbound", "inventory-overview", "stock-addition"].includes(
                    action.payload,
                )
            ) {
                state.inventoryOpen = false;
            }
        },
        toggleWarehouseInventory(state) {
            state.inventoryOpen = !state.inventoryOpen;
        },
        setSelectedWarehouseOrders(state, action) {
            state.selectedOrderIds = action.payload;
        },
        toggleSelectedWarehouseOrder(state, action) {
            const selected = new Set(state.selectedOrderIds);
            if (action.payload.checked) selected.add(action.payload.orderId);
            else selected.delete(action.payload.orderId);
            state.selectedOrderIds = [...selected];
        },
        openWarehouseDispatch(state, action) {
            const { orderIds, bulk = false } = action.payload;
            state.dispatchOrderIds = orderIds;
            state.bulkDispatch = bulk;
            state.modal = "dispatch";
        },
        setWarehouseModal(state, action) {
            state.modal = action.payload;
        },
        closeWarehouseModal(state) {
            state.modal = null;
            state.dispatchOrderIds = [];
            state.bulkDispatch = false;
        },
        setWarehouseToast(state, action) {
            state.toast = action.payload;
        },
        clearWarehouseToast(state) {
            state.toast = null;
        },
    },
    extraReducers(builder) {
        builder.addCase(logout.pending, () => initialState);
        trackLoadFailure(builder, fetchWarehouseInventory, "inventory");
        trackLoadFailure(builder, fetchWarehousePendingShipments, "pending");
        trackLoadFailure(builder, fetchWarehouseOutbound, "outbound");
        trackLoadFailure(builder, fetchWarehouseRtos, "rtos");
        trackLoadFailure(builder, fetchWarehousePreAlert, "preAlert");
        trackLoadFailure(builder, fetchWarehouseSystemOptions, "systemOptions");
    },
});

export const {
    clearWarehouseToast,
    closeWarehouseModal,
    openWarehouseDispatch,
    setWarehouseModal,
    setWarehousePage,
    setWarehouseToast,
    setSelectedWarehouseOrders,
    toggleSelectedWarehouseOrder,
    toggleWarehouseInventory,
} = warehouseUiSlice.actions;
export default warehouseUiSlice.reducer;
