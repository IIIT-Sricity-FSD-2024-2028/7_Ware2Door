import { createSlice } from "@reduxjs/toolkit";
import {
  fetchPublicTracking,
  submitPublicTicket,
  validatePublicTracking,
} from "../actions/publicActions.js";

const initialState = {
  tracking: { data: null, status: "idle", error: null },
  trackingValidation: { status: "idle", error: null },
  ticketSubmission: { status: "idle", error: null },
};

const publicDataSlice = createSlice({
  name: "publicData",
  initialState,
  reducers: {
    clearPublicTracking(state) {
      state.tracking = initialState.tracking;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchPublicTracking.pending, (state) => {
        state.tracking.status = "pending";
        state.tracking.error = null;
      })
      .addCase(fetchPublicTracking.fulfilled, (state, action) => {
        state.tracking.data = {
          tid: action.payload.trackingId,
          data: action.payload.data,
        };
        state.tracking.status = "fulfilled";
        state.tracking.error = null;
      })
      .addCase(fetchPublicTracking.rejected, (state, action) => {
        state.tracking.status = "rejected";
        state.tracking.error = action.payload || {
          message: action.error.message || "Unable to load tracking data.",
        };
      })
      .addCase(validatePublicTracking.pending, (state) => {
        state.trackingValidation.status = "pending";
        state.trackingValidation.error = null;
      })
      .addCase(validatePublicTracking.fulfilled, (state) => {
        state.trackingValidation.status = "fulfilled";
        state.trackingValidation.error = null;
      })
      .addCase(validatePublicTracking.rejected, (state, action) => {
        state.trackingValidation.status = "rejected";
        state.trackingValidation.error = action.payload || {
          message: action.error.message || "Unable to validate tracking ID.",
        };
      })
      .addCase(submitPublicTicket.pending, (state) => {
        state.ticketSubmission.status = "pending";
        state.ticketSubmission.error = null;
      })
      .addCase(submitPublicTicket.fulfilled, (state) => {
        state.ticketSubmission.status = "fulfilled";
        state.ticketSubmission.error = null;
      })
      .addCase(submitPublicTicket.rejected, (state, action) => {
        state.ticketSubmission.status = "rejected";
        state.ticketSubmission.error = action.payload || {
          message: action.error.message || "Unable to submit support ticket.",
        };
      });
  },
});

export const { clearPublicTracking } = publicDataSlice.actions;
export default publicDataSlice.reducer;
