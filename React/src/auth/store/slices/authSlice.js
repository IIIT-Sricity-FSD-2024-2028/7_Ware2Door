import { createSlice } from "@reduxjs/toolkit";
import {
  login,
  logout,
  resetPassword,
  updateAuthUser,
  validateAuthSession,
  verifyResetEmail,
} from "../actions/authActions.js";

const initialState = {
  session: null,
  isLoading: true,
  authError: "",
  validationStatus: "idle",
  passwordResetStatus: "idle",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.authError = "";
    },
  },
  extraReducers(builder) {
    builder
      .addCase(validateAuthSession.pending, (state) => {
        state.isLoading = true;
        state.validationStatus = "pending";
      })
      .addCase(validateAuthSession.fulfilled, (state, action) => {
        state.session = action.payload;
        state.isLoading = false;
        state.validationStatus = "fulfilled";
        state.authError = "";
      })
      .addCase(validateAuthSession.rejected, (state, action) => {
        state.session = null;
        state.isLoading = false;
        state.validationStatus = "rejected";
        state.authError = action.payload || "";
      })
      .addCase(login.pending, (state) => {
        state.authError = "";
      })
      .addCase(login.fulfilled, (state, action) => {
        state.session = action.payload;
        state.authError = "";
      })
      .addCase(login.rejected, (state, action) => {
        state.authError = action.payload || "Unable to sign in. Please try again.";
      })
      .addCase(logout.pending, () => ({ ...initialState, isLoading: false }))
      .addCase(updateAuthUser.fulfilled, (state, action) => {
        state.session = action.payload;
      })
      .addCase(verifyResetEmail.pending, (state) => {
        state.passwordResetStatus = "pending";
      })
      .addCase(verifyResetEmail.fulfilled, (state) => {
        state.passwordResetStatus = "fulfilled";
      })
      .addCase(verifyResetEmail.rejected, (state) => {
        state.passwordResetStatus = "rejected";
      })
      .addCase(resetPassword.pending, (state) => {
        state.passwordResetStatus = "pending";
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.passwordResetStatus = "fulfilled";
      })
      .addCase(resetPassword.rejected, (state) => {
        state.passwordResetStatus = "rejected";
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
