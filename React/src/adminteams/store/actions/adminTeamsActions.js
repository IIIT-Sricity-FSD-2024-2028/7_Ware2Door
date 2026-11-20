import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  createDriverApi,
  createNodeApi,
  createPartnerApi,
  deleteDriverApi,
  deletePartnerApi,
  fetchSectionData,
  updateDriverApi,
  updateEscalationApi,
  updateNodeStatusApi,
  updateNodeSubscriptionApi,
  updatePartnerStatusApi,
  updatePartnerTierApi,
  uploadNodeDocumentsApi,
} from "../api/adminTeamsApi.js";

export const fetchAdminTeamsSection = createAsyncThunk(
  "adminTeams/fetchSection",
  (section) => fetchSectionData(section),
);

function createMutationThunk(type, apiRequest, section, successMessage) {
  return createAsyncThunk(type, async (payload, { dispatch, getState }) => {
    const result = await apiRequest(payload);
    const refresh = getState().auth.session
      ? await dispatch(fetchAdminTeamsSection(section))
      : null;
    return {
      result,
      successMessage,
      refreshError: refresh?.error?.message || "",
    };
  });
}

export const createPartner = createMutationThunk(
  "adminTeams/createPartner",
  createPartnerApi,
  "partners",
  "Partner added successfully.",
);
export const updatePartnerTier = createMutationThunk(
  "adminTeams/updatePartnerTier",
  updatePartnerTierApi,
  "partners",
  "Tier updated",
);
export const updatePartnerStatus = createMutationThunk(
  "adminTeams/updatePartnerStatus",
  updatePartnerStatusApi,
  "partners",
  "Partner status updated",
);
export const deletePartner = createMutationThunk(
  "adminTeams/deletePartner",
  deletePartnerApi,
  "partners",
  "Partner deleted",
);

export const createNode = createAsyncThunk(
  "adminTeams/createNode",
  async ({ node, files = [] }, { dispatch, getState, rejectWithValue }) => {
    const result = await createNodeApi(node);
    if (files.length && result.node?.id) {
      try {
        await uploadNodeDocumentsApi(result.node.id, files);
      } catch (error) {
        if (getState().auth.session) {
          await dispatch(fetchAdminTeamsSection("subscriptions"));
        }
        return rejectWithValue({
          message: error.message,
          createdNode: result.node,
        });
      }
    }
    const refresh = getState().auth.session
      ? await dispatch(fetchAdminTeamsSection("subscriptions"))
      : null;
    return {
      result,
      successMessage: "Node created successfully",
      refreshError: refresh?.error?.message || "",
      uploadedDocuments: Boolean(files.length && result.node?.id),
    };
  },
);
export const updateNodeSubscription = createMutationThunk(
  "adminTeams/updateNodeSubscription",
  updateNodeSubscriptionApi,
  "subscriptions",
  "Subscription updated",
);
export const updateNodeStatus = createMutationThunk(
  "adminTeams/updateNodeStatus",
  updateNodeStatusApi,
  "subscriptions",
  "Node status updated",
);
export const uploadNodeDocuments = createMutationThunk(
  "adminTeams/uploadNodeDocuments",
  ({ nodeId, files }) => uploadNodeDocumentsApi(nodeId, files),
  "subscriptions",
  "Legal documents uploaded",
);

export const createDriver = createMutationThunk(
  "adminTeams/createDriver",
  createDriverApi,
  "fleet",
  "Driver registered",
);
export const updateDriver = createMutationThunk(
  "adminTeams/updateDriver",
  updateDriverApi,
  "fleet",
  "Driver updated",
);
export const deleteDriver = createMutationThunk(
  "adminTeams/deleteDriver",
  deleteDriverApi,
  "fleet",
  "Driver deleted",
);

export const updateEscalation = createMutationThunk(
  "adminTeams/updateEscalation",
  updateEscalationApi,
  "escalation",
  "Escalation updated",
);
