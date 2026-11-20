import { createAsyncThunk } from "@reduxjs/toolkit";
import { publicApi } from "../api/publicApi.js";

const requestError = (error) => ({
  message: error.message || "The request failed.",
  status: error.status,
});

export const fetchPublicTracking = createAsyncThunk(
  "landing/fetchTracking",
  async (trackingId, { rejectWithValue }) => {
    try {
      return { trackingId, data: await publicApi.getTracking(trackingId) };
    } catch (error) {
      return rejectWithValue(requestError(error));
    }
  },
);

export const validatePublicTracking = createAsyncThunk(
  "landing/validateTracking",
  async (trackingId, { rejectWithValue }) => {
    try {
      return await publicApi.validateTrackingId(trackingId);
    } catch (error) {
      return rejectWithValue(requestError(error));
    }
  },
);

export const submitPublicTicket = createAsyncThunk(
  "landing/submitTicket",
  async (ticket, { rejectWithValue }) => {
    try {
      return await publicApi.raiseTicket(ticket);
    } catch (error) {
      return rejectWithValue(requestError(error));
    }
  },
);
