import React, { useState } from "react";
import { localAgencyApi } from "../api/localAgencyApi.js";
import { agentStatusClass, agentDotClass } from "../utils/helpers.js";
import LocalAgencyModal from "../components/LocalAgencyModal.jsx";
import {
  validateEmail,
  validatePhone,
  validateRequiredText,
} from "../../utils/inputValidation.js";

export default function DeliveryAgents({
  agencyId,
  showToast,
  agents,
  loadAgents,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    area: "",
    status: "Active",
  });

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const validateAgentForm = () =>
    validateRequiredText(form.name, "Agent name", { max: 80 }) ||
    validatePhone(form.phone) ||
    validateEmail(form.email) ||
    validateRequiredText(form.area, "Area coverage", { max: 120 });

  async function addAgent() {
    const validationError = validateAgentForm();
    if (validationError) {
      showToast(validationError, true);
      return;
    }
    try {
      await localAgencyApi.addAgent(agencyId, {
        name: form.name,
        phone: form.phone,
        email: form.email,
        area: form.area,
      });
      showToast("Agent added successfully");
      setAddModal(false);
      setForm({ name: "", phone: "", email: "", area: "", status: "Active" });
      loadAgents();
    } catch (e) {
      showToast(e.message, true);
    }
  }

  async function saveEdit() {
    if (!editingAgent) return;
    const validationError = validateAgentForm();
    if (validationError) {
      showToast(validationError, true);
      return;
    }
    try {
      await localAgencyApi.updateAgent(agencyId, editingAgent.id, {
        name: form.name,
        phone: form.phone,
        email: form.email,
        area: form.area,
        status: form.status,
      });
      showToast("Agent updated");
      setEditModal(false);
      loadAgents();
    } catch (e) {
      showToast(e.message, true);
    }
  }

  async function deleteAgent(agentId, agentName) {
    if (!window.confirm(`Remove agent ${agentName}?`)) return;
    try {
      await localAgencyApi.deleteAgent(agencyId, agentId);
      showToast("Agent removed");
      loadAgents();
    } catch (e) {
      showToast(e.message, true);
    }
  }

  function openEdit(a) {
    setEditingAgent(a);
    setForm({
      name: a.name || "",
      phone: a.phone || "",
      email: a.email || "",
      area: a.area || a.areaCoverage || "",
      status: a.status || "Active",
    });
    setEditModal(true);
  }

  const filtered = agents.filter((a) => {
    const q = search.toLowerCase();
    return (
      (!q ||
        (a.name || "").toLowerCase().includes(q) ||
        (a.phone || "").toLowerCase().includes(q)) &&
      (!statusFilter || a.status === statusFilter)
    );
  });

  return (
    <div className="agents-page page-content">
      <div className="page-title-row">
        <div>
          <h2 className="page-title">Delivery Agents</h2>
          <p className="page-subtitle">
            Manage and track your last-mile delivery personnel.
          </p>
        </div>
        <button
          className="btn-primary"
          id="add-agent-btn"
          onClick={() => {
            setForm({
              name: "",
              phone: "",
              email: "",
              area: "",
              status: "Active",
            });
            setAddModal(true);
          }}
        >
          <i className="fa-solid fa-user-plus"></i> Add New Agent
        </button>
      </div>

      <div className="filter-row">
        <div className="search-box" style={{ flex: 1 }}>
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            id="agent-search"
            placeholder="Search agents by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          id="agent-status-filter"
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Busy">Busy</option>
          <option value="Offline">Offline</option>
        </select>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>AGENT NAME</th>
              <th>PHONE NUMBER</th>
              <th>ASSIGNED SHIPMENTS</th>
              <th>STATUS</th>
              <th>AREA COVERAGE</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody id="agents-tbody">
            {filtered.map((a, i) => (
              <tr key={i}>
                <td>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: "#f4a32a",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {(a.name || "?")
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>
                        {a.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        ID: {a.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td>{a.phone}</td>
                <td>
                  <div className="shipment-bar-wrap">
                    <span
                      style={{
                        fontWeight: 600,
                        color: "#1e293b",
                        minWidth: 18,
                      }}
                    >
                      {a.assigned ?? 0}
                    </span>
                    <div className="shipment-bar">
                      <div
                        className="shipment-bar-fill"
                        style={{
                          width: `${Math.min(100, ((a.assigned ?? 0) / Math.max(...filtered.map((x) => x.assigned ?? 0), 1)) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    className={`agent-status-badge ${agentStatusClass(a.status)}`}
                  >
                    <span
                      className={`agent-dot ${agentDotClass(a.status)}`}
                    ></span>
                    {a.status}
                  </span>
                </td>
                <td>{a.area || a.areaCoverage || "—"}</td>
                <td>
                  <button
                    className="action-btn edit"
                    title="Edit"
                    onClick={() => openEdit(a)}
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button
                    className="action-btn delete"
                    title="Remove Agent"
                    onClick={() => deleteAgent(a.id, a.name)}
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-msg">
                  No agents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="table-footer-row">
          <span
            id="agents-showing-label"
            style={{ fontSize: 12, color: "#94a3b8" }}
          >
            Showing {filtered.length} of {agents.length}
          </span>
        </div>
      </div>

      <LocalAgencyModal
        id="add-agent-modal"
        open={addModal}
        onClose={() => setAddModal(false)}
      >
        <div className="modal-header modal-header--dark">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <i
              className="fa-solid fa-user-plus"
              style={{ color: "white", fontSize: 16 }}
            ></i>
            <div>
              <h3 style={{ color: "white" }}>Add New Agent</h3>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.65)",
                }}
              >
                Add a new delivery agent to your fleet
              </p>
            </div>
          </div>
          <button
            className="modal-close modal-close--light"
            id="close-agent-modal"
            onClick={() => setAddModal(false)}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-field">
            <label>Full Name *</label>
            <div className="input-icon-wrap">
              <i className="fa-solid fa-hashtag"></i>
              <input
                type="text"
                id="agent-name-input"
                placeholder="Enter agent's full name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
              />
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginBottom: 18,
            }}
          >
            <div className="modal-field" style={{ margin: 0 }}>
              <label>Phone Number *</label>
              <div className="input-icon-wrap">
                <i className="fa-solid fa-phone"></i>
                <input
                  type="tel"
                  id="agent-phone-input"
                  placeholder="+91 XXXXXXXXXX"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                />
              </div>
            </div>
            <div className="modal-field" style={{ margin: 0 }}>
              <label>Email Address *</label>
              <div className="input-icon-wrap">
                <i className="fa-solid fa-envelope"></i>
                <input
                  type="email"
                  id="agent-email-input"
                  placeholder="agent@ware2door.com"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="modal-field">
            <label>Area Coverage *</label>
            <div className="input-icon-wrap">
              <i className="fa-solid fa-location-dot"></i>
              <input
                type="text"
                id="agent-area-input"
                placeholder="e.g., North Sector, Downtown"
                value={form.area}
                onChange={(e) => setField("area", e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button
            className="modal-cancel"
            id="cancel-agent-modal"
            onClick={() => setAddModal(false)}
          >
            Cancel
          </button>
          <button
            className="modal-save modal-save--orange"
            id="save-agent-modal"
            onClick={addAgent}
          >
            Add Agent
          </button>
        </div>
      </LocalAgencyModal>

      <LocalAgencyModal
        id="edit-agent-modal"
        open={editModal}
        onClose={() => setEditModal(false)}
      >
        <div className="modal-header modal-header--dark">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <i
              className="fa-solid fa-user-pen"
              style={{ color: "white", fontSize: 16 }}
            ></i>
            <div>
              <h3 style={{ color: "white" }}>Edit Agent</h3>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.65)",
                }}
              >
                Update delivery agent details
              </p>
            </div>
          </div>
          <button
            className="modal-close modal-close--light"
            id="close-edit-agent-modal"
            onClick={() => setEditModal(false)}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-field">
            <label>Full Name *</label>
            <div className="input-icon-wrap">
              <i className="fa-solid fa-hashtag"></i>
              <input
                type="text"
                id="edit-agent-name-input"
                placeholder="Enter agent's full name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
              />
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginBottom: 18,
            }}
          >
            <div className="modal-field" style={{ margin: 0 }}>
              <label>Phone Number *</label>
              <div className="input-icon-wrap">
                <i className="fa-solid fa-phone"></i>
                <input
                  type="tel"
                  id="edit-agent-phone-input"
                  placeholder="+91 XXXXXXXXXX"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                />
              </div>
            </div>
            <div className="modal-field" style={{ margin: 0 }}>
              <label>Email Address *</label>
              <div className="input-icon-wrap">
                <i className="fa-solid fa-envelope"></i>
                <input
                  type="email"
                  id="edit-agent-email-input"
                  placeholder="agent@ware2door.com"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                />
              </div>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginBottom: 18,
            }}
          >
            <div className="modal-field" style={{ margin: 0 }}>
              <label>Area Coverage *</label>
              <div className="input-icon-wrap">
                <i className="fa-solid fa-location-dot"></i>
                <input
                  type="text"
                  id="edit-agent-area-input"
                  placeholder="e.g., North Sector, Downtown"
                  value={form.area}
                  onChange={(e) => setField("area", e.target.value)}
                />
              </div>
            </div>
            <div className="modal-field" style={{ margin: 0 }}>
              <label>Status</label>
              <select
                id="edit-agent-status-select"
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  outline: "none",
                  fontFamily: "'Poppins',sans-serif",
                  fontSize: 13,
                }}
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Busy">Busy</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button
            className="modal-cancel"
            id="cancel-edit-agent-modal"
            onClick={() => setEditModal(false)}
          >
            Cancel
          </button>
          <button
            className="modal-save modal-save--orange"
            id="save-edit-agent-modal"
            onClick={saveEdit}
          >
            Update Agent
          </button>
        </div>
      </LocalAgencyModal>
    </div>
  );
}
