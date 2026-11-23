import { createSlice } from "@reduxjs/toolkit";
import { logout } from "../../../auth/store/actions/authActions.js";
import {
  addAgencyAgent,
  deleteAgencyAgent,
  escalateAgencyTicket,
  fetchAgencyAgents,
  fetchAgencyDeliveries,
  fetchAgencyInbound,
  fetchAgencyRto,
  fetchAgencyScanHistory,
  fetchAgencyShipments,
  fetchAgencyTickets,
  resolveAgencyTicket,
  updateAgencyAgent,
  updateAgencyTicketStatus,
} from "../actions/localAgencyActions.js";

const initialState = {
  shipments: [],
  inbound: [],
  agents: [],
  scanHistory: [],
  deliveries: [],
  rto: [],
  tickets: [],
  requests: {},
};

function trackRequest(builder, thunk, resource, key) {
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
      state[key] = action.payload;
      state.requests[resource] = { status: "fulfilled", error: "" };
    })
    .addCase(thunk.rejected, (state, action) => {
      if (state.requests[resource]?.requestId !== action.meta.requestId) return;
      state.requests[resource] = {
        status: "rejected",
        error:
          action.payload || action.error.message || "Unable to load agency data.",
      };
    });
}

function updateTicket(state, action, status) {
  const ticketId = action.meta.arg.ticketId;
  state.tickets = state.tickets.map((ticket) =>
    ticket.ticketId === ticketId ? { ...ticket, status } : ticket,
  );
}

const localAgencyDataSlice = createSlice({
  name: "localAgencyData",
  initialState,
  reducers: {
    resetLocalAgencyData: () => initialState,
    updateLocalAgencyTicket(state, action) {
      const { ticketId, status } = action.payload;
      state.tickets = state.tickets.map((ticket) =>
        ticket.ticketId === ticketId ? { ...ticket, status } : ticket,
      );
    },
  },
  extraReducers(builder) {
    trackRequest(builder, fetchAgencyShipments, "shipments", "shipments");
    trackRequest(builder, fetchAgencyInbound, "inbound", "inbound");
    trackRequest(builder, fetchAgencyAgents, "agents", "agents");
    trackRequest(builder, fetchAgencyScanHistory, "scanHistory", "scanHistory");
    trackRequest(builder, fetchAgencyDeliveries, "deliveries", "deliveries");
    trackRequest(builder, fetchAgencyRto, "rto", "rto");
    trackRequest(builder, fetchAgencyTickets, "tickets", "tickets");
    builder
      .addCase(addAgencyAgent.fulfilled, () => {})
      .addCase(updateAgencyAgent.fulfilled, () => {})
      .addCase(deleteAgencyAgent.fulfilled, (state, action) => {
        if (action.payload) {
          state.agents = state.agents.filter(
            (agent) => agent.id !== action.meta.arg.agentId,
          );
        }
      })
      .addCase(resolveAgencyTicket.fulfilled, (state, action) => {
        if (action.payload?.success) updateTicket(state, action, "Resolved");
      })
      .addCase(escalateAgencyTicket.fulfilled, (state, action) => {
        if (action.payload?.success) updateTicket(state, action, "Escalated");
      })
      .addCase(updateAgencyTicketStatus.fulfilled, (state, action) => {
        if (action.payload?.success) {
          updateTicket(state, action, action.meta.arg.status);
        }
      })
      .addCase(logout.pending, () => initialState);
  },
});

export const { resetLocalAgencyData, updateLocalAgencyTicket } =
  localAgencyDataSlice.actions;
export default localAgencyDataSlice.reducer;
