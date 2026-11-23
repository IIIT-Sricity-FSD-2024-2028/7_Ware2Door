import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  authApi,
  clearStoredSession,
  readStoredSession,
  saveSession,
} from "../api/authApi.js";

export const validateAuthSession = createAsyncThunk(
  "auth/validateSession",
  async (_, { rejectWithValue }) => {
    const stored = readStoredSession();
    if (!stored) {
      clearStoredSession();
      return null;
    }
    try {
      const session = await authApi.validateSession(stored);
      saveSession(session);
      return session;
    } catch (error) {
      clearStoredSession();
      return rejectWithValue(
        error.status === 401
          ? "Your session has expired. Please log in again."
          : error.message || "Unable to verify your session. Please log in again.",
      );
    }
  },
  {
    condition: (_, { getState }) =>
      getState().auth.validationStatus !== "pending",
  },
);

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      return await authApi.login(email, password);
    } catch (error) {
      return rejectWithValue(error.message || "Unable to sign in. Please try again.");
    }
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await authApi.logout();
  } catch {
    clearStoredSession();
  }
});

export const updateAuthUser = createAsyncThunk(
  "auth/updateUser",
  async (user, { getState, rejectWithValue }) => {
    const session = getState().auth.session;
    if (!session) return rejectWithValue("Your session is no longer available.");
    const updatedSession = {
      ...session,
      user: { ...session.user, ...user },
    };
    saveSession(updatedSession);
    return updatedSession;
  },
);

export const verifyResetEmail = createAsyncThunk(
  "auth/verifyResetEmail",
  async (email, { rejectWithValue }) => {
    try {
      return await authApi.verifyEmail(email);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to connect to the server.");
    }
  },
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (credentials, { rejectWithValue }) => {
    try {
      return await authApi.resetPassword(credentials);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to connect to the server.");
    }
  },
);
