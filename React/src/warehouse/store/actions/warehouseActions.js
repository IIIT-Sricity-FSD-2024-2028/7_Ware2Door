import { createAsyncThunk } from "@reduxjs/toolkit";
import { warehouseApi } from "../api/warehouseApi.js";
import {
    normalizeInventory,
    normalizeRto,
    normalizeShipment,
} from "../../utils/warehouseUtils.js";
import {
    normalizeIdentifier,
    validateRtoId,
} from "../../../utils/inputValidation.js";

const rejectRequest = (error, rejectWithValue) =>
    rejectWithValue(error.message || "The warehouse request failed.");

export const fetchWarehouseInventory = createAsyncThunk(
    "warehouse/fetchInventory",
    async (warehouseId, { rejectWithValue, signal }) => {
        try {
            const result = await warehouseApi.getInventory(warehouseId, signal);
            return normalizeInventory(
                Array.isArray(result) ? result : result.inventory || [],
            );
        } catch (error) {
            return rejectRequest(error, rejectWithValue);
        }
    },
);

export const fetchWarehousePendingShipments = createAsyncThunk(
    "warehouse/fetchPendingShipments",
    async (warehouseId, { rejectWithValue, signal }) => {
        try {
            const result = await warehouseApi.getPendingShipments(warehouseId, signal);
            return (Array.isArray(result) ? result : result.pendingShipments || []).map(
                normalizeShipment,
            );
        } catch (error) {
            return rejectRequest(error, rejectWithValue);
        }
    },
);

export const fetchWarehouseOutbound = createAsyncThunk(
    "warehouse/fetchOutbound",
    async (warehouseId, { rejectWithValue, signal }) => {
        try {
            const result = await warehouseApi.getOutbound(warehouseId, signal);
            return Array.isArray(result) ? result : result.outbound || [];
        } catch (error) {
            return rejectRequest(error, rejectWithValue);
        }
    },
);

export const fetchWarehouseRtos = createAsyncThunk(
    "warehouse/fetchRtos",
    async (warehouseId, { rejectWithValue, signal }) => {
        try {
            const result = await warehouseApi.getRto(warehouseId, signal);
            return (Array.isArray(result) ? result : result.rto || []).map(normalizeRto);
        } catch (error) {
            return rejectRequest(error, rejectWithValue);
        }
    },
);

export const fetchWarehousePreAlert = createAsyncThunk(
    "warehouse/fetchPreAlert",
    async (warehouseId, { rejectWithValue, signal }) => {
        try {
            const result = await warehouseApi.getPreAlert(warehouseId, signal);
            return Array.isArray(result) ? { hubs: result } : result;
        } catch (error) {
            return rejectRequest(error, rejectWithValue);
        }
    },
);

export const fetchWarehouseSystemOptions = createAsyncThunk(
    "warehouse/fetchSystemOptions",
    async (_, { rejectWithValue, signal }) => {
        try {
            const [hubs, agencies] = await Promise.all([
                warehouseApi.getHubs(signal),
                warehouseApi.getAgencies(signal),
            ]);
            return { hubs, agencies };
        } catch (error) {
            return rejectRequest(error, rejectWithValue);
        }
    },
);

export const addWarehouseStock = createAsyncThunk(
    "warehouse/addStock",
    async ({ warehouseId, labelId, itemName, quantity }, { rejectWithValue }) => {
        try {
            await warehouseApi.addStock(warehouseId, {
                labelID: labelId.trim().toUpperCase(),
                itemName: itemName.trim(),
                quantity,
            });
            return { labelId, itemName, quantity, addedAt: new Date().toISOString() };
        } catch (error) {
            return rejectRequest(error, rejectWithValue);
        }
    },
);

export const dispatchWarehouseShipment = createAsyncThunk(
    "warehouse/dispatchShipment",
    async ({ warehouseId, orderId, hubId, agencyId }, { rejectWithValue }) => {
        try {
            const result = await warehouseApi.dispatch(warehouseId, {
                orderId,
                hubId,
                agencyId,
            });
            if (result?.success === false) {
                throw new Error(result.error || "Unable to dispatch shipment.");
            }
            return { orderId, result };
        } catch (error) {
            return rejectRequest(error, rejectWithValue);
        }
    },
);

export const rejectWarehouseShipment = createAsyncThunk(
    "warehouse/rejectShipment",
    async ({ warehouseId, orderId }, { rejectWithValue }) => {
        try {
            await warehouseApi.rejectShipment(warehouseId, orderId);
            return orderId;
        } catch (error) {
            return rejectRequest(error, rejectWithValue);
        }
    },
);

export const inscanWarehouseRto = createAsyncThunk(
    "warehouse/inscanRto",
    async ({ warehouseId, rtoId }, { rejectWithValue }) => {
        try {
            const normalizedRtoId = normalizeIdentifier(rtoId);
            const validationError = validateRtoId(normalizedRtoId);
            if (validationError) return rejectWithValue(validationError);
            const result = await warehouseApi.warehouseInscan(normalizedRtoId);
            if (result.status !== "success") {
                throw new Error(result.flagMsg || result.message || "RTO in-scan failed.");
            }
            return { warehouseId, rtoId: normalizedRtoId, result };
        } catch (error) {
            return rejectRequest(error, rejectWithValue);
        }
    },
);

export const updateWarehouseProfile = createAsyncThunk(
    "warehouse/updateProfile",
    async ({ warehouseId, profile }, { rejectWithValue }) => {
        try {
            await warehouseApi.updateProfile(warehouseId, profile);
            return profile;
        } catch (error) {
            return rejectRequest(error, rejectWithValue);
        }
    },
);

export const updateWarehousePassword = createAsyncThunk(
    "warehouse/updatePassword",
    async ({ warehouseId, currentPassword, newPassword }, { rejectWithValue }) => {
        try {
            await warehouseApi.updatePassword(warehouseId, {
                currentPassword,
                newPassword,
            });
        } catch (error) {
            return rejectRequest(error, rejectWithValue);
        }
    },
);
