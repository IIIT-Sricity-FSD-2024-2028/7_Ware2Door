import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import { logout } from "../../../auth/store/actions/authActions.js";
import {
  fetchAdminTeamsSection,
  createDriver,
  createNode,
  createPartner,
  deleteDriver,
  deletePartner,
  updateDriver,
  updateEscalation,
  updateNodeStatus,
  updateNodeSubscription,
  updatePartnerStatus,
  updatePartnerTier,
  uploadNodeDocuments,
} from "../actions/adminTeamsActions.js";
import { resetAdminTeams } from "./adminTeamsSlice.js";

const initialState = {
  section: "partners",
  modal: null,
  selectedRecord: null,
  toast: null,
  loadRequestIds: {},
  mutationRequestIds: {},
};

const mutations = [
  createDriver,
  createNode,
  createPartner,
  deleteDriver,
  deletePartner,
  updateDriver,
  updateEscalation,
  updateNodeStatus,
  updateNodeSubscription,
  updatePartnerStatus,
  updatePartnerTier,
  uploadNodeDocuments,
];

const adminTeamsUiSlice = createSlice({
  name: "adminTeamsUi",
  initialState,
  reducers: {
    setAdminTeamsSection(state, action) {
      state.section = action.payload;
    },
    openAdminModal(state, action) {
      state.modal = action.payload.kind;
      state.selectedRecord = action.payload.record || null;
    },
    closeAdminModal(state) {
      state.modal = null;
      state.selectedRecord = null;
    },
    showAdminToast(state, action) {
      state.toast = action.payload;
    },
    clearAdminToast(state) {
      state.toast = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(logout.pending, () => initialState)
      .addCase(resetAdminTeams, () => initialState)
      .addCase(fetchAdminTeamsSection.pending, (state, action) => {
        state.loadRequestIds[action.meta.arg] = action.meta.requestId;
      })
      .addCase(fetchAdminTeamsSection.fulfilled, (state, action) => {
        if (state.loadRequestIds[action.meta.arg] === action.meta.requestId) {
          delete state.loadRequestIds[action.meta.arg];
        }
      })
      .addCase(fetchAdminTeamsSection.rejected, (state, action) => {
        if (
          action.meta.aborted ||
          state.loadRequestIds[action.meta.arg] !== action.meta.requestId
        ) {
          return;
        }
        delete state.loadRequestIds[action.meta.arg];
        state.toast = {
          message: action.error.message || "Unable to load Admin Teams data.",
          kind: "error",
        };
      })
      .addCase(createNode.rejected, (state, action) => {
        if (!state.mutationRequestIds[action.meta.requestId]) return;
        delete state.mutationRequestIds[action.meta.requestId];
        if (action.payload?.createdNode) {
          state.modal = "upload-docs";
          state.selectedRecord = action.payload.createdNode;
        }
        state.toast = {
          message:
            action.payload?.message ||
            action.error.message ||
            "Unable to create node.",
          kind: "error",
        };
      })
      .addMatcher(
        isAnyOf(...mutations.map((thunk) => thunk.pending)),
        (state, action) => {
          state.mutationRequestIds[action.meta.requestId] = true;
        },
      )
      .addMatcher(
        isAnyOf(...mutations.map((thunk) => thunk.fulfilled)),
        (state, action) => {
          if (!state.mutationRequestIds[action.meta.requestId]) return;
          delete state.mutationRequestIds[action.meta.requestId];
          const { result, successMessage, refreshError } = action.payload;
          state.toast = refreshError
            ? { message: refreshError, kind: "error" }
            : { message: successMessage, kind: "success" };
          if (action.type === createPartner.fulfilled.type) {
            const partner = result?.partner;
            if (partner?.apiKey) {
              state.modal = "api-key";
              state.selectedRecord = partner;
            } else {
              state.modal = null;
              state.selectedRecord = null;
            }
          } else {
            state.modal = null;
            state.selectedRecord = null;
          }
        },
      )
      .addMatcher(
        isAnyOf(...mutations.map((thunk) => thunk.rejected)),
        (state, action) => {
          if (action.type === createNode.rejected.type) return;
          if (!state.mutationRequestIds[action.meta.requestId]) return;
          delete state.mutationRequestIds[action.meta.requestId];
          state.toast = {
            message: action.error.message || "The requested operation failed.",
            kind: "error",
          };
        },
      );
  },
});

export const {
  clearAdminToast,
  closeAdminModal,
  openAdminModal,
  setAdminTeamsSection,
  showAdminToast,
} = adminTeamsUiSlice.actions;
export default adminTeamsUiSlice.reducer;
