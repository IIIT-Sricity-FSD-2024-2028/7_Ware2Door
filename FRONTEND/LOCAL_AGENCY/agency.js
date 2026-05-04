const API = 'http://localhost:8000';
const session = JSON.parse(localStorage.getItem('session') || 'null');
if (!session || !session.user) { window.location.href = '../AUTH/auth.html'; }
const user = session.user;
let role_name = user.name || 'Manager';
let email = user.email || '';
let phone = user.phone || '';
const agencyId = user.agencyId || user.id;

document.querySelector('.name').innerHTML = role_name;
document.querySelector('.role').innerHTML = 'Local Delivery Agency';
setAvatarInitials();

const AGENCY_ID = agencyId;
let agentsList = [], shipmentsList = [], inboundList = [], deliveriesList = [], rtoList = [], ticketsList = [], scanHistoryList = [];
let unknownScanErrors = 0;
let unknownScanLog = [];

async function api(url, method = 'GET', body = null) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json', 'x-role': 'LOCAL_AGENCY' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API + url, opts);
    return await res.json();
  } catch (e) { console.error('API Error:', e); return null; }
}

async function loadAgents() { const r = await api(`/agency/${agencyId}/agents`); agentsList = Array.isArray(r) ? r : []; }
async function loadShipments() { const r = await api(`/agency/${agencyId}/shipments`); shipmentsList = Array.isArray(r) ? r : []; }
async function loadInbound() { const r = await api(`/agency/${agencyId}/inbound`); inboundList = Array.isArray(r) ? r : []; }
async function loadDeliveries() { const r = await api(`/agency/${agencyId}/deliveries`); deliveriesList = Array.isArray(r) ? r : []; }
async function loadRTO() { const r = await api(`/agency/${agencyId}/rto`); rtoList = Array.isArray(r) ? r : []; }
async function loadTickets() { const r = await api(`/tickets/agency/${agencyId}`); ticketsList = Array.isArray(r) ? r : []; }
async function loadScanHistory() { const r = await api(`/agency/${agencyId}/scanHistory`); scanHistoryList = Array.isArray(r) ? r : []; }


async function init() {
  await Promise.all([
    loadAgents(),
    loadShipments(),
    loadInbound(),
    loadDeliveries(),
    loadRTO(),
    loadTickets(),
    loadScanHistory()
  ]);
}

init().then(() => {
  renderDashboard();
});

const navMap = {
  "nav-dashboard": { page: ".dashboard-page", title: "Dashboard" },
  "nav-shipments": { page: ".shipments-page", title: "Shipments" },
  "nav-scan": { page: ".scan-page", title: "Scan Operations" },
  "nav-agents": { page: ".agents-page", title: "Delivery Agents" },
  "nav-rto": { page: ".rto-page", title: "RTO Management" },
  "nav-delivery": { page: ".delivery-page", title: "Shipment Delivery" },
  "nav-support": { page: ".support-page", title: "Support Tickets" },
  "nav-settings": { page: ".settings-container", title: "Settings" },
};

const TICKETS_PER_PAGE = 5;


let currentDeliveryShipment = null;
let selectedDeliveryStatus = null;
let otpAttempts = 0;
let otpIntent = "Deliver";
let tempDeliveryNotes = "";
let pendingOTPShipment = null;

let pendingAgentAssignShipmentId = null;
let selectedAgentForScan = null;
let activeScanTab = "in-scan";

let activeShipmentTab = "all";

let currentTicketPage = 1;
let activeTicketFilter = "Open";
let ticketSearchQuery = "";
let currentViewingTicket = null;

const tfaToggle = document.getElementById("tfa-toggle");
const tfaKnob = document.getElementById("tfa-knob");
let tfaEnabled = false;

Object.keys(navMap).forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("click", () => navigateTo(id));
});

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("tab-active"));
    this.classList.add("tab-active");
    activeShipmentTab = this.dataset.tab;
    renderShipments();
  });
});

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("scan-tab-inscan")
    ?.addEventListener("click", () => switchScanTab("in-scan"));
  document
    .getElementById("scan-tab-outscan")
    ?.addEventListener("click", () => switchScanTab("out-scan"));
  document
    .getElementById("scan-submit-btn")
    ?.addEventListener("click", doInScanFromInput);
  document
    .getElementById("scan-tracking-input")
    ?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doInScanFromInput();
    });
  document
    .getElementById("scan-search-input")
    ?.addEventListener("input", () => {
      if (activeScanTab === "in-scan") renderInScanTable();
      else renderOutScanTable();
    });

  document
    .getElementById("agent-picker-confirm-btn")
    ?.addEventListener("click", async () => {
      if (!selectedAgentForScan || !pendingAgentAssignShipmentId) return;
      const r = await api(`/agency/${agencyId}/assignAgent`, 'POST', { trackingId: pendingAgentAssignShipmentId, agentId: selectedAgentForScan.id });
      if (r && r.success) {
        showToast(`✓ ${selectedAgentForScan.name} assigned to ${pendingAgentAssignShipmentId}`);
        closeAgentPicker();
        await init();
        renderOutScanTable();
      } else {
        showToast("⚠ Failed to assign agent.", true);
      }
    });
  document
    .getElementById("close-agent-picker")
    ?.addEventListener("click", closeAgentPicker);
  document
    .getElementById("cancel-agent-picker")
    ?.addEventListener("click", closeAgentPicker);
  document
    .getElementById("agent-picker-modal")
    ?.addEventListener("click", (e) => {
      if (e.target === document.getElementById("agent-picker-modal"))
        closeAgentPicker();
    });

  const qaItems = document.querySelectorAll(".qa-item");
  qaItems.forEach((item) => {
    if (item.textContent.includes("Verify OTP")) {
      item.setAttribute("onclick", "navigateTo('nav-delivery')");
    }
  });
});

document
  .getElementById("agent-search")
  .addEventListener("input", () => renderAgents(getAgentFilters()));
document
  .getElementById("agent-status-filter")
  .addEventListener("change", () => renderAgents(getAgentFilters()));
document
  .getElementById("add-agent-btn")
  .addEventListener("click", () =>
    document.getElementById("add-agent-modal").classList.add("active"),
  );
document
  .getElementById("close-agent-modal")
  .addEventListener("click", closeAgentModal);
document
  .getElementById("cancel-agent-modal")
  .addEventListener("click", closeAgentModal);
document.getElementById("add-agent-modal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("add-agent-modal"))
    closeAgentModal();
});
document.getElementById("cancel-agent-modal").addEventListener("click", () => {
  document.getElementById("add-agent-modal").classList.remove("active");
});
document.getElementById("save-agent-modal").addEventListener("click", async () => {
  const name = document.getElementById("agent-name-input").value.trim();
  const phone = document.getElementById("agent-phone-input").value.trim();
  const email = document.getElementById("agent-email-input").value.trim();
  const area = document.getElementById("agent-area-input").value.trim();
  if (!name || !phone || !area) {
    showToast("⚠ Please fill all required fields.", true);
    return;
  }
  const r = await api(`/agency/${agencyId}/agents`, 'POST', { name, phone, email, area });
  if (r && !r.error) {
    [
      "agent-name-input",
      "agent-phone-input",
      "agent-email-input",
      "agent-area-input",
    ].forEach((id) => (document.getElementById(id).value = ""));
    closeAgentModal();
    await init();
    renderAgents(getAgentFilters());
    showToast(`✓ Agent ${name} added successfully.`);
  } else {
    showToast(r?.error || "⚠ Failed to add agent.", true);
  }
});

function openEditAgentModal(agentId) {
  const agent = agentsList.find(a => a.id === agentId);
  if (!agent) return;
  document.getElementById("edit-agent-id-input").value = agentId;
  document.getElementById("edit-agent-name-input").value = agent.name;
  document.getElementById("edit-agent-phone-input").value = agent.phone;
  document.getElementById("edit-agent-email-input").value = agent.email;
  document.getElementById("edit-agent-area-input").value = agent.area;
  document.getElementById("edit-agent-status-select").value = agent.status;
  document.getElementById("edit-agent-modal").classList.add("active");
}

document.getElementById("close-edit-agent-modal").addEventListener("click", () => {
  document.getElementById("edit-agent-modal").classList.remove("active");
});
document.getElementById("cancel-edit-agent-modal").addEventListener("click", () => {
  document.getElementById("edit-agent-modal").classList.remove("active");
});
document.getElementById("edit-agent-modal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("edit-agent-modal")) {
    document.getElementById("edit-agent-modal").classList.remove("active");
  }
});
document.getElementById("save-edit-agent-modal").addEventListener("click", async () => {
  const agentId = document.getElementById("edit-agent-id-input").value;
  const name = document.getElementById("edit-agent-name-input").value.trim();
  const phone = document.getElementById("edit-agent-phone-input").value.trim();
  const email = document.getElementById("edit-agent-email-input").value.trim();
  const area = document.getElementById("edit-agent-area-input").value.trim();
  const status = document.getElementById("edit-agent-status-select").value;
  if (!name || !phone || !area) {
    showToast("⚠ Please fill out all required fields (*)", true);
    return;
  }
  const r = await api(`/agency/${agencyId}/agents/${agentId}`, "PUT", {
    name, phone, email, area, status
  });
  if (r && r.id) {
    showToast("✓ Agent updated successfully");
    document.getElementById("edit-agent-modal").classList.remove("active");
    await init();
    renderAgents(getAgentFilters());
  } else {
    showToast(r?.error || "⚠ Failed to update agent", true);
  }
});

document.getElementById("new-rto-btn").addEventListener("click", () => {
  document.getElementById("rto-agent-select").innerHTML = agentsList
    .map((a) => `<option value="${a.name}">${a.name} (${a.id})</option>`)
    .join("");
  document.getElementById("new-rto-modal").classList.add("active");
});
document
  .getElementById("close-rto-modal")
  .addEventListener("click", closeRTOModal);
document
  .getElementById("cancel-rto-modal")
  .addEventListener("click", closeRTOModal);
document.getElementById("new-rto-modal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("new-rto-modal")) closeRTOModal();
});
document.getElementById("save-rto-modal").addEventListener("click", async () => {
  const trackingId = document.getElementById("rto-tracking-input").value.trim();
  const customer = document.getElementById("rto-customer-input").value.trim();
  const agent = document.getElementById("rto-agent-select").value;
  const reason = document.getElementById("rto-reason-input").value.trim();
  const confirmed = document.getElementById("rto-confirm-cb").checked;

  if (!trackingId || !customer || !reason) {
    showToast("⚠ Please fill all required fields.", true);
    return;
  }
  if (!confirmed) {
    showToast("⚠ Please confirm the delivery attempt checkbox.", true);
    return;
  }

  const r = await api(`/agency/${agencyId}/rto`, 'POST', { trackingId, customerName: customer, agentName: agent, reason });
  if (r && r.status === 'success') {
    ["rto-tracking-input", "rto-customer-input", "rto-reason-input"].forEach(
      (id) => (document.getElementById(id).value = ""),
    );
    document.getElementById("rto-confirm-cb").checked = false;
    closeRTOModal();
    await init();
    showToast(`✓ RTO request submitted for ${trackingId}`);
  } else {
    showToast("⚠ Failed to submit RTO request.", true);
  }
});

document.getElementById("delivery-lookup-btn").addEventListener("click", () => {
  const tid = document.getElementById("delivery-tracking-input").value.trim();
  const msg = document.getElementById("delivery-lookup-msg");
  msg.style.color = "#ef4444";

  if (!tid) {
    msg.innerHTML = "⚠ Please enter a tracking ID.";
    return;
  }

  const normalized = tid.startsWith("#") ? tid : "#" + tid;
  const inbound = inboundList.find(
    (s) => s.trackingId === normalized || s.trackingId === tid,
  );

  if (!inbound) {
    msg.innerHTML = `⚠ "${tid}" not found in the system.`;
    document.getElementById("delivery-status-section").style.display = "none";
    document.getElementById("delivery-status-footer").style.display = "none";
    return;
  }
  if (inbound.scanStatus !== "out-scan" && inbound.status !== "Out for Delivery") {
    msg.innerHTML = `⚠ ${inbound.trackingId} has not been out-scanned yet.`;
    document.getElementById("delivery-status-section").style.display = "none";
    document.getElementById("delivery-status-footer").style.display = "none";
    return;
  }

  currentDeliveryShipment = deliveriesList.find((d) => d.trackingId === inbound.trackingId) || {
    trackingId: inbound.trackingId,
    customer: inbound.customerName || "Customer",
    agent: inbound.assignedAgentName || "Unassigned",
    address: inbound.agency || "Agency",
    attempts: 0,
    status: "Out for Delivery",
    notes: "",
  };

  msg.style.color = "#16a34a";
  msg.innerHTML = `✓ Found: ${inbound.trackingId} — ready for status update.`;
  document.getElementById("delivery-status-section").style.display = "block";
  document.getElementById("delivery-status-footer").style.display = "flex";
  selectedDeliveryStatus = null;
  document
    .querySelectorAll(".delivery-status-card")
    .forEach((c) => c.classList.remove("dsc-selected"));
});

document
  .getElementById("confirm-delivery-status-btn")
  .addEventListener("click", async () => {
    if (!selectedDeliveryStatus) {
      showToast("⚠ Please select a delivery status.", true);
      return;
    }
    if (!currentDeliveryShipment) return;

    const notes = document.getElementById("delivery-notes").value.trim();
    const ship = currentDeliveryShipment;

    if (selectedDeliveryStatus === "Delivered") {
      otpIntent = "Deliver";
      otpAttempts = 0;
      pendingOTPShipment = ship;
      document.getElementById("otp-tracking-id").innerHTML = ship.trackingId || '';
      document.getElementById("otp-customer").innerHTML = ship.customer || ship.customerName || '';
      document.getElementById("otp-agent").innerHTML = ship.agent || ship.agentName || ship.agentId || '';
      document.getElementById("otp-modal").classList.add("active");
      clearOTPBoxes();
      document.getElementById("otp-attempts-msg").innerHTML = "";
      setTimeout(() => document.querySelectorAll(".otp-box")[0]?.focus(), 50);
      closeDeliveryStatusModal();
    } else if (selectedDeliveryStatus === "Customer Refused") {
      if (!notes) {
        showToast("⚠ Internal Delivery Notes are mandatory when a customer refuses the package.", true);
        return;
      }
      otpIntent = "Refuse";
      otpAttempts = 0;
      tempDeliveryNotes = notes;
      pendingOTPShipment = ship;
      document.getElementById("otp-tracking-id").innerHTML = ship.trackingId || '';
      document.getElementById("otp-customer").innerHTML = ship.customer || ship.customerName || '';
      document.getElementById("otp-agent").innerHTML = ship.agent || ship.agentName || ship.agentId || '';
      document.getElementById("otp-modal").classList.add("active");
      clearOTPBoxes();
      document.getElementById("otp-attempts-msg").innerHTML = "";
      setTimeout(() => document.querySelectorAll(".otp-box")[0]?.focus(), 50);
      closeDeliveryStatusModal();
    } else {
      const r = await api(`/agency/${agencyId}/deliveries/${ship.trackingId.replace('#', '')}/attempt`, 'POST', { failStatus: selectedDeliveryStatus, notes });
      if (r && r.status === 'success') {
        closeDeliveryStatusModal();
        await init();
        renderDelivery();
        renderRTO();
        renderShipments();
        renderDashboard();
        if (r.autoRTO) {
          showToast(`⚠ 3 attempts reached. ${ship.trackingId} auto-raised to RTO.`, true);
          setTimeout(() => navigateTo("nav-rto"), 1500);
        } else {
          showToast(`Status updated: ${selectedDeliveryStatus}`);
        }
      } else {
        showToast("⚠ Failed to record delivery attempt.", true);
      }
    }
  });

document
  .getElementById("close-delivery-status-modal")
  .addEventListener("click", closeDeliveryStatusModal);
document
  .getElementById("cancel-delivery-status")
  .addEventListener("click", closeDeliveryStatusModal);
document
  .getElementById("delivery-status-modal")
  .addEventListener("click", (e) => {
    if (e.target === document.getElementById("delivery-status-modal"))
      closeDeliveryStatusModal();
  });

document.querySelectorAll(".otp-box").forEach((box, idx, boxes) => {
  box.addEventListener("input", (e) => {
    const val = e.target.value.replace(/\D/g, "");
    e.target.value = val;
    if (val && idx < boxes.length - 1) boxes[idx + 1].focus();
  });
  box.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !box.value && idx > 0) boxes[idx - 1].focus();
  });
});

document.getElementById("otp-verify-btn").addEventListener("click", async () => {
  const entered = [...document.querySelectorAll(".otp-box")]
    .map((b) => b.value)
    .join("");
  const msg = document.getElementById("otp-attempts-msg");

  if (entered.length < 6) {
    msg.innerHTML = "Please enter all 6 digits.";
    return;
  }

  if (entered === "000000") {
    document.getElementById("otp-modal").classList.remove("active");
    const ship = pendingOTPShipment;

    if (otpIntent === "Deliver") {
      const r = await api(`/agency/${agencyId}/deliveries/${ship.trackingId.replace('#', '')}/deliver`, 'POST');
      if (r && r.status === 'success') {
        showToast(`✓ ${ship.trackingId} successfully delivered!`);
        await init();
        renderDelivery();
        renderShipments();
        renderDashboard();
      } else {
        showToast("⚠ Failed to mark delivered.", true);
      }
    } else if (otpIntent === "Refuse") {
      const payload = {
        trackingId: ship.trackingId,
        reason: `Customer Refused: ${tempDeliveryNotes}`,
      };
      if (ship.customerName || ship.customer) payload.customerName = ship.customerName || ship.customer;
      if (ship.agentId) payload.agentId = ship.agentId;

      const r = await api(`/agency/${agencyId}/rto`, 'POST', payload);
      if (r && r.status === 'success') {
        showToast(`⚠ ${ship.trackingId} marked as Refused. Auto-moved to RTO.`);
        await init();
        renderDelivery();
        renderRTO();
        renderShipments();
        renderDashboard();
        setTimeout(() => navigateTo("nav-rto"), 1500);
      } else {
        showToast("⚠ Failed to process refusal.", true);
      }
    }
  } else {
    otpAttempts++;
    document
      .querySelectorAll(".otp-box")
      .forEach((b) => b.classList.add("otp-error"));
    document.getElementById("otp-last-attempt").innerHTML =
      "Last OTP attempt: just now";
    setTimeout(
      () =>
        document
          .querySelectorAll(".otp-box")
          .forEach((b) => b.classList.remove("otp-error")),
      600,
    );

    if (otpAttempts >= 3) {
      msg.innerHTML = "3 failed OTP attempts. Raising RTO automatically...";
      setTimeout(async () => {
        document.getElementById("otp-modal").classList.remove("active");
        const ship = pendingOTPShipment;
        const rtoPayload = { trackingId: ship.trackingId, reason: "OTP verification failed after 3 attempts" };
        if (ship.customerName || ship.customer) rtoPayload.customerName = ship.customerName || ship.customer;
        if (ship.agentId) rtoPayload.agentId = ship.agentId;
        await api(`/agency/${agencyId}/rto`, 'POST', rtoPayload);
        pendingOTPShipment = null;
        await init();
        renderDelivery();
        renderRTO();
        renderShipments();
        renderDashboard();
        showToast(
          `⚠ OTP failed 3 times. ${ship.trackingId} raised to RTO.`,
          true,
        );
        setTimeout(() => navigateTo("nav-rto"), 1200);
      }, 1000);
    } else {
      const remaining = 3 - otpAttempts;
      msg.innerHTML = `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`;
      clearOTPBoxes();
      setTimeout(() => document.querySelectorAll(".otp-box")[0]?.focus(), 50);
    }
  }
});

document.getElementById("otp-modal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("otp-modal")) {
    document.getElementById("otp-modal").classList.remove("active");
  }
});

const closeOtpBtn = document.getElementById("close-otp-modal");
if (closeOtpBtn) {
  closeOtpBtn.addEventListener("click", () => {
    document.getElementById("otp-modal").classList.remove("active");
  });
}

document.querySelectorAll(".ticket-filter-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    const f = this.dataset.filter;
    if (activeTicketFilter === f) {
      return;
    }
    activeTicketFilter = f;
    document
      .querySelectorAll(".ticket-filter-btn")
      .forEach((b) => b.classList.remove("ticket-filter-active"));
    this.classList.add("ticket-filter-active");
    currentTicketPage = 1;
    renderTickets();
  });
});
document.getElementById("ticket-search").addEventListener("input", function () {
  ticketSearchQuery = this.value.toLowerCase();
  currentTicketPage = 1;
  renderTickets();
});
document
  .getElementById("back-to-tickets")
  .addEventListener("click", renderTickets);
document.getElementById("ticket-resolve-btn").addEventListener("click", async () => {
  if (!currentViewingTicket || normalizeTicketStatus(currentViewingTicket.status) === "Resolved")
    return;
  const t = ticketsList.find(
    (t) => t.ticketId === currentViewingTicket.ticketId,
  );
  if (t) {
    const r = await api(`/tickets/${t.ticketId}/resolve`, 'POST');
    if (r && r.success) {
      t.status = "Resolved";
      currentViewingTicket.status = "Resolved";
      document.getElementById("detail-status-badge").innerHTML = "Resolved";
      document.getElementById("detail-status-badge").className =
        "ticket-status-badge " + ticketStatusBadgeClass("Resolved");
      const rb = document.getElementById("ticket-resolve-btn");
      rb.disabled = true;
      rb.style.opacity = "0.5";
      rb.innerHTML = `<i class="fa-solid fa-circle-check"></i> Resolved`;
      showToast(`✓ Ticket ${t.ticketId} marked as Resolved`);
    } else {
      showToast("⚠ Failed to resolve ticket.", true);
    }
  }
});
document.getElementById("ticket-update-status-btn").addEventListener("click", () => {
  if (!currentViewingTicket) return;
  document.getElementById("update-status-select").value = normalizeTicketStatus(currentViewingTicket.status);
  document.getElementById("update-status-modal").classList.add("active");
});

document.getElementById("close-status-modal").addEventListener("click", () => {
  document.getElementById("update-status-modal").classList.remove("active");
});
document.getElementById("cancel-status-modal").addEventListener("click", () => {
  document.getElementById("update-status-modal").classList.remove("active");
});

document.getElementById("confirm-status-modal").addEventListener("click", async () => {
  if (!currentViewingTicket) return;
  const newStatus = document.getElementById("update-status-select").value;
  const t = ticketsList.find((t) => t.ticketId === currentViewingTicket.ticketId);
  if (t) {
    const r = await api(`/tickets/${t.ticketId}/status`, 'POST', { status: newStatus });
    if (r && r.success) {
      t.status = newStatus;
      currentViewingTicket.status = newStatus;
      const normalStatus = normalizeTicketStatus(newStatus);
      document.getElementById("detail-status-badge").innerHTML = normalStatus;
      document.getElementById("detail-status-badge").className =
        "ticket-status-badge " + ticketStatusBadgeClass(normalStatus);
      
      const rb = document.getElementById("ticket-resolve-btn");
      if (normalStatus === "Resolved") {
        rb.disabled = true;
        rb.style.opacity = "0.5";
        rb.innerHTML = `<i class="fa-solid fa-circle-check"></i> Resolved`;
      } else {
        rb.disabled = false;
        rb.style.opacity = "1";
        rb.innerHTML = `<i class="fa-solid fa-circle-check"></i> Mark as Resolved`;
      }
      
      showToast(`✓ Ticket ${t.ticketId} status updated to ${newStatus}`);
      document.getElementById("update-status-modal").classList.remove("active");
      renderTickets();
    } else {
      showToast("⚠ Failed to update ticket status.", true);
    }
  }
});

document.getElementById("open-edit-modal").addEventListener("click", () => {
  document.getElementById("edit-name").value = role_name;
  document.getElementById("edit-email").value = email;
  document.getElementById("edit-phone").value = phone;
  document.getElementById("modal-display-name").innerHTML = role_name;
  document.getElementById("modal-display-role").innerHTML =
    "Local Delivery Agency | ID: " + agencyId;
  document.getElementById("edit-modal").classList.add("active");
});
document
  .getElementById("close-edit-modal")
  .addEventListener("click", closeEditModal);
document
  .getElementById("cancel-edit-modal")
  .addEventListener("click", closeEditModal);
document.getElementById("edit-modal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("edit-modal")) closeEditModal();
});
document.getElementById("save-edit-modal").addEventListener("click", async () => {
  const n = document.getElementById("edit-name").value.trim();
  const em = document.getElementById("edit-email").value.trim();
  const ph = document.getElementById("edit-phone").value.trim();
  if (em && (!em.includes("@") || !em.includes("."))) {
    showToast("⚠ Invalid email format.", true);
    return;
  }
  if (ph && !/^(\+91[\s-]?)?\d{10}$/.test(ph)) {
    showToast("⚠ Phone must be exactly 10 digits.", true);
    return;
  }
  try {
    const res = await fetch(`${API}/auth/profile/${agencyId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-role": "LOCAL_AGENCY" },
      body: JSON.stringify({ name: n, email: em, phone: ph })
    });
    const data = await res.json();
    if (!data.success) { showToast(data.error || "Failed to update profile.", true); return; }
  } catch (e) {
    showToast("Backend connection failed.", true);
    return;
  }
  if (n) {
    role_name = n;
    document.querySelector(".name").innerHTML = n;
    setAvatarInitials();
  }
  if (em) email = em;
  if (ph) phone = ph;
  refreshSettingsUI();
  closeEditModal();
  showToast("✓ Profile updated.");
});
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("session");
  window.location.reload();
});

const topAvatar = document.getElementById("top-avatar");
if (topAvatar) {
  topAvatar.addEventListener("click", () => {
    navigateTo("nav-settings");
  });
}
document
  .querySelector(".dash-scan-btn")
  .addEventListener("click", () => navigateTo("nav-scan"));

if (tfaToggle) {
  tfaToggle.addEventListener("click", () => {
    tfaEnabled = !tfaEnabled;
    tfaToggle.style.background = tfaEnabled ? "#f4a32a" : "#e2e8f0";
    tfaKnob.style.left = tfaEnabled ? "22px" : "2px";
    showToast(
      tfaEnabled
        ? "✓ Two-factor authentication enabled."
        : "Two-factor authentication disabled.",
    );
  });
}

const changePwdBtn = document.getElementById("change-pwd-btn");
if (changePwdBtn) {
  changePwdBtn.addEventListener("click", () => {
    ["pwd-current", "pwd-new", "pwd-confirm"].forEach((id) => {
      const f = document.getElementById(id);
      if (f) f.value = "";
    });
    document.getElementById("pwd-modal").classList.add("active");
  });
}
const closePwdBtn = document.getElementById("close-pwd-modal");
const cancelPwdBtn = document.getElementById("cancel-pwd-modal");
const pwdModalEl = document.getElementById("pwd-modal");
if (closePwdBtn) closePwdBtn.addEventListener("click", closePwdModal);
if (cancelPwdBtn) cancelPwdBtn.addEventListener("click", closePwdModal);
if (pwdModalEl)
  pwdModalEl.addEventListener("click", (e) => {
    if (e.target === pwdModalEl) closePwdModal();
  });

const savePwdBtn = document.getElementById("save-pwd-modal");
if (savePwdBtn) {
  savePwdBtn.addEventListener("click", async () => {
    const cur = document.getElementById("pwd-current").value;
    const nw = document.getElementById("pwd-new").value;
    const cnf = document.getElementById("pwd-confirm").value;
    if (!cur || !nw || !cnf) {
      showToast("Please fill all fields.", true);
      return;
    }
    if (nw !== cnf) {
      showToast("Passwords do not match.", true);
      return;
    }
    if (nw.length < 6) {
      showToast("Password must be at least 6 characters.", true);
      return;
    }
    try {
      const res = await fetch(`${API}/auth/password/${agencyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-role": "LOCAL_AGENCY" },
        body: JSON.stringify({ currentPassword: cur, newPassword: nw })
      });
      const data = await res.json();
      if (!data.success) { showToast(data.error || "Incorrect current password.", true); return; }
    } catch (e) {
      showToast("Backend connection failed.", true);
      return;
    }
    const now = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const pwdEl = document.getElementById("s-pwd-changed");
    if (pwdEl) pwdEl.textContent = "Last changed: " + now;
    closePwdModal();
    showToast("✓ Password updated successfully.");
  });
}





function setAvatarInitials() {
  const initials = role_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  document.querySelector(".header .avatar").innerHTML = initials;
  document.querySelector(".header .avatar").title = role_name;
}

function navigateTo(navId) {
  document
    .querySelectorAll(".menu-item")
    .forEach((b) => b.classList.remove("active", "stng-active"));
  document
    .querySelectorAll(".page-content")
    .forEach((p) => (p.style.display = "none"));
  const conf = navMap[navId];
  if (!conf) return;
  document.querySelector(conf.page).style.display = "block";
  document.getElementById("header-title").innerHTML = conf.title;
  const el = document.getElementById(navId);
  if (el) {
    if (navId === "nav-settings") el.classList.add("stng-active");
    else el.classList.add("active");
  }
  const renders = {
    "nav-dashboard": renderDashboard,
    "nav-shipments": renderShipments,
    "nav-agents": () => renderAgents(getAgentFilters()),
    "nav-rto": renderRTO,
    "nav-delivery": renderDelivery,
    "nav-support": () => {
      activeTicketFilter = "Open";
      ticketSearchQuery = "";
      currentTicketPage = 1;
      document.querySelectorAll(".ticket-filter-btn").forEach((b) => {
        b.classList.toggle("ticket-filter-active", b.dataset.filter === "Open");
      });
      const si = document.getElementById("ticket-search");
      if (si) si.value = "";
      renderTickets();
    },
    "nav-scan": renderScanPage,
    "nav-settings": refreshSettingsUI,
  };
  if (renders[navId]) renders[navId]();
}

function getAllDeliveries() {
  return deliveriesList;
}

function getMergedShipments() {
  return shipmentsList;
}

function refreshSettingsUI() {
  document.querySelector(".settings-user-name").innerHTML = role_name;
  document.querySelector(".settings-user-role").innerHTML =
    "Local Delivery Agency &nbsp;|&nbsp; ID: " + agencyId;
  document.querySelector(".settings-email").innerHTML = email;
  document.querySelector(".settings-phone").innerHTML = phone;
}

function renderDashboard() {
  document.querySelector(".welcome-name-dynamic").innerHTML =
    role_name.split(" ")[0];
  const now = new Date();
  document.querySelector(".welcome-date").innerHTML =
    "— " +
    now.toLocaleDateString("en-IN", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

  const merged = getMergedShipments();
  const rtoCount = merged.filter((s) => s.status === "RTO").length;

  document.querySelector(".alert-count").innerHTML =
    `<span style="color:#f4a32a;font-weight:600;">${rtoCount} critical alert${rtoCount !== 1 ? "s" : ""}</span>`;

  document.getElementById("dash-total-shipments").innerHTML = shipmentsList.length;
  document.getElementById("dash-pending").innerHTML = shipmentsList.filter(
    (s) => s.status === "Arrived at Agency" || s.status === "In Transit to Agency",
  ).length;
  document.getElementById("dash-out-delivery").innerHTML = shipmentsList.filter(
    (s) => s.status === "Out for Delivery",
  ).length;
  document.getElementById("dash-rto-pending").innerHTML = rtoCount;

  document.getElementById("agents-on-duty").innerHTML = agentsList.filter(
    (a) => a.status === "Active",
  ).length;
  document.getElementById("agents-busy").innerHTML = agentsList.filter(
    (a) => a.status === "Busy",
  ).length;
  document.getElementById("agents-off").innerHTML = agentsList.filter(
    (a) => a.status === "Offline",
  ).length;

  const tbody = document.getElementById("dash-activity-tbody");
  const active = merged
    .filter((s) => s.status === "Out for Delivery" || s.status === "Failed")
    .slice(0, 5);
  if (!active.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:30px;font-size:13px;">No active deliveries.</td></tr>`;
    return;
  }
  tbody.innerHTML = active
    .map(
      (s) => `
        <tr>
            <td style="font-weight:600;color:#1e293b;">${s.trackingId}</td>
            <td>
                <div style="font-weight:500;">${s.customer}</div>
                <div style="font-size:11px;color:#94a3b8;">${(s.address || "").split(",").pop().trim()}</div>
            </td>
            <td style="font-size:13px;">${s.agent}</td>
            <td>${statusBadge(s.status)}</td>
        </tr>`,
    )
    .join("");
}

function renderShipments() {
  const tbody = document.getElementById("shipments-tbody");
  let merged = getMergedShipments();

  if (activeShipmentTab === "out")
    merged = shipmentsList.filter((s) => s.status === "Out for Delivery");
  else if (activeShipmentTab === "completed")
    merged = shipmentsList.filter((s) => s.status === "Delivered");
  else if (activeShipmentTab === "failed")
    merged = shipmentsList.filter((s) => s.status === "Failed");
  else if (activeShipmentTab === "rto")
    merged = shipmentsList.filter((s) => s.status === "RTO");
  else
    merged = shipmentsList;

  if (!merged.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-msg">No shipments found.</td></tr>`;
    return;
  }

  tbody.innerHTML = merged
    .map((s) => {
      const warehouse = s.warehouseName || "—";
      const customer = s.customerName || "—";

      const deliveryEntry = deliveriesList.find(d => d.trackingId === s.trackingId);
      const agent = deliveryEntry?.agentName || s.agentName || "Unassigned";
      const attempts = s.attemptCount ?? 0;
      return `
        <tr>
            <td><strong style="color:#1e293b;">${s.trackingId}</strong></td>
            <td style="font-size:13px;color:#64748b;">${warehouse}</td>
            <td><div style="font-weight:500;">${customer}</div></td>
            <td style="font-size:12px;color:#64748b;max-width:160px;">${s.customerAddress || "—"}</td>
            <td>${agent === "Unassigned" ? `<span style="color:#94a3b8;font-size:12px;font-style:italic;">Unassigned</span>` : agent}</td>
            <td style="text-align:center;font-weight:600;">${attempts}</td>
            <td>${statusBadge(s.status)}</td>
        </tr>`;
    })
    .join("");
}

function renderScanPage() {
  switchScanTab(activeScanTab);
}

function switchScanTab(tab) {
  activeScanTab = tab;
  document
    .getElementById("scan-tab-inscan")
    .classList.toggle("scan-tab-active", tab === "in-scan");
  document
    .getElementById("scan-tab-outscan")
    .classList.toggle("scan-tab-active", tab === "out-scan");
  document.getElementById("scan-input-bar").style.display =
    tab === "in-scan" ? "block" : "none";
  document.getElementById("inscan-table").style.display =
    tab === "in-scan" ? "table" : "none";
  document.getElementById("outscan-table").style.display =
    tab === "out-scan" ? "table" : "none";

  if (tab === "in-scan") {
    document.getElementById("scan-page-title").textContent =
      "In-Scan Operations";
    document.getElementById("scan-page-subtitle").textContent =
      "Register incoming packages and update real-time inventory.";
    renderInScanTable();
  } else {
    document.getElementById("scan-page-title").textContent =
      "Out-Scan Operations";
    document.getElementById("scan-page-subtitle").textContent =
      "Assign delivery agents and dispatch packages for last-mile delivery.";
    renderOutScanTable();
  }
  renderScanStats();
}

function renderScanStats() {
  const scannedIn = scanHistoryList.filter(
    (s) => s.status === "Scanned In" || s.status === "Out-Scanned",
  ).length;
  const flagged =
    scanHistoryList.filter((s) => s.flagged).length + unknownScanErrors;
  document.getElementById("scan-total-today").textContent =
    inboundList.length;
  document.getElementById("scan-successful").textContent = scannedIn;
  document.getElementById("scan-flagged-errors").textContent = flagged;
}

function renderInScanTable() {
  const tbody = document.getElementById("inscan-tbody");
  const search = (
    document.getElementById("scan-search-input")?.value || ""
  ).toLowerCase();

  const allRows = scanHistoryList.filter((s) => {
    if (!search) return true;
    return (
      s.trackingId.toLowerCase().includes(search) ||
      (s.orderId && s.orderId.toLowerCase().includes(search))
    );
  });

  if (!allRows.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-msg" style="padding:30px;">
            <i class="fa-solid fa-barcode" style="font-size:28px;color:#cbd5e1;display:block;margin-bottom:8px;"></i>
            Scan a package above to see it logged here.
        </td></tr>`;
    return;
  }

  tbody.innerHTML = allRows
    .map((s) => {
      let statusHtml;
      if (s.status === "Scanned In")
        statusHtml = `<span class="scan-badge scan-badge--scanned"><i class="fa-solid fa-circle-check"></i> Scanned In</span>`;
      else if (s.flagged)
        statusHtml = `<span class="scan-badge scan-badge--flagged"><i class="fa-solid fa-triangle-exclamation"></i> ${s.flagMsg}</span>`;
      else if (s.status === "Out-Scanned")
        statusHtml = `<span class="scan-badge" style="background:#eff6ff;color:#2563eb;"><i class="fa-solid fa-truck"></i> Out-Scanned</span>`;
      else
        statusHtml = `<span class="scan-badge scan-badge--flagged"><i class="fa-solid fa-circle-xmark"></i> ${s.status}</span>`;

      const originText = !s.productName || s.productName === "—" ? "No origin found" : s.productName;
      const originStyle =
        !s.productName || s.productName === "—"
          ? "color:#cbd5e1;font-style:italic;"
          : "color:#64748b;";

      return `
        <tr>
            <td>
                <strong style="color:#1e293b;">${s.trackingId}</strong>
            </td>
            <td>${statusHtml}</td>
            <td style="font-size:13px;${originStyle}">${originText}</td>
            <td style="font-size:12px;color:#94a3b8;">${new Date(s.scannedAt).toLocaleString("en-IN", {
              day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
            })}</td>
        </tr>`;
    })
    .join("");
}

async function doInScanFromInput() {
  const input = document.getElementById("scan-tracking-input");
  const tid = input.value.trim();
  if (!tid) {
    showToast("⚠ Please enter a tracking ID.", true);
    return;
  }


  const normalized = tid.startsWith("#") ? tid.substring(1) : tid;
  const r = await api(`/agency/${AGENCY_ID}/inscan`, 'POST', { trackingId: normalized });
  
  if (r && r.status === 'success') {
    showToast(`✓ ${normalized} successfully scanned in.`);
  } else {
    unknownScanErrors++;
    showToast(`⚠ ${r?.flagMsg || 'Scan failed.'}`, true);
  }

  input.value = "";
  await init();
  renderInScanTable();
  renderScanStats();
  renderDashboard();
}

function _performInScan(s) {

}

function renderOutScanTable() {
  const tbody = document.getElementById("outscan-tbody");
  const search = (
    document.getElementById("scan-search-input")?.value || ""
  ).toLowerCase();
  let list = inboundList.filter((s) => s.scanStatus === "in-scan");
  if (search)
    list = list.filter((s) => s.trackingId.toLowerCase().includes(search));

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-msg">No packages ready for out-scan.<br><span style="font-size:12px;color:#cbd5e1;">Complete in-scan first, then return here to assign agents and dispatch.</span></td></tr>`;
    return;
  }

  tbody.innerHTML = list
    .map((s) => {
      const agentCell = s.assignedAgentName
        ? `<div style="display:flex;align-items:center;gap:8px;">
                   <div style="width:32px;height:32px;border-radius:50%;background:#f4a32a;color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">${s.assignedAgentName
                     .split(" ")
                     .map((w) => w[0])
                     .join("")
                     .slice(0, 2)
                     .toUpperCase()}</div>
                   <div>
                       <div style="font-weight:600;font-size:13px;color:#1e293b;">${s.assignedAgentName}</div>
                       <div style="font-size:11px;color:#16a34a;">Available</div>
                   </div>
                   <i class="fa-solid fa-circle-check" style="color:#16a34a;font-size:13px;margin-left:4px;"></i>
               </div>`
        : `<button class="select-agent-btn" onclick="openAgentPickerForScan('${s.trackingId}')">
                   <i class="fa-solid fa-user-circle"></i> Select Agent
               </button>`;

      const outscanBtn = s.assignedAgentName
        ? `<button class="btn-primary" style="padding:6px 16px;font-size:12px;background:#16a34a;" onclick="doOutscan('${s.trackingId}')">Outscan</button>`
        : `<button style="padding:6px 16px;font-size:12px;background:#e2e8f0;color:#94a3b8;border:none;border-radius:8px;cursor:not-allowed;font-family:'Poppins',sans-serif;font-weight:500;" disabled>Outscan</button>`;

      return `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:10px;">
                    <i class="fa-solid fa-cube" style="color:#94a3b8;font-size:14px;"></i>
                    <div>
                        <strong style="color:#1e293b;">${s.trackingId}</strong>
                    </div>
                </div>
            </td>
            <td style="font-size:13px;color:#64748b;">${s.hubName || "—"}</td>
            <td style="font-size:12px;color:#94a3b8;">${new Date(s.updatedAt[s.updatedAt.length-1]).toLocaleString("en-IN", {day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"})}</td>
            <td>${agentCell}</td>
            <td>${outscanBtn}</td>
        </tr>`;
    })
    .join("");
}

async function doOutscan(trackingId) {
  const r = await api(`/agency/${agencyId}/outscan`, 'POST', { trackingId });
  if (r && r.status === 'success') {
    showToast(`✓ Out-Scan complete for ${trackingId} → ${r.agentName}`);
    await init();
    renderOutScanTable();
    renderScanStats();
    renderDashboard();
  } else {
    showToast(`⚠ ${r?.flagMsg || 'Out-scan failed.'}`, true);
  }
}

function openAgentPickerForScan(trackingId) {
  pendingAgentAssignShipmentId = trackingId;
  selectedAgentForScan = null;

  const grid = document.getElementById("agent-picker-grid");
  grid.innerHTML = agentsList
    .map((a) => {
      const initials = a.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      const statusDot =
        a.status === "Active"
          ? "avail-green"
          : a.status === "Busy"
            ? "avail-orange"
            : "avail-grey";
      return `
        <div class="agent-picker-card" onclick="selectAgentForScan('${a.id}', '${a.name}', this)">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                <div style="width:44px;height:44px;border-radius:50%;background:#334155;color:white;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;">${initials}</div>
                <div style="text-align:right;">
                    <div style="font-size:15px;font-weight:700;color:#f4a32a;">${a.assigned}</div>
                    <div style="font-size:10px;color:#94a3b8;letter-spacing:0.04em;">DELIVERIES</div>
                </div>
            </div>
            <div style="font-weight:600;font-size:14px;color:#1e293b;margin-bottom:5px;">${a.name}</div>
            <div style="display:flex;align-items:center;gap:5px;">
                <span class="avail-dot ${statusDot}" style="width:7px;height:7px;border-radius:50%;display:inline-block;flex-shrink:0;"></span>
                <span style="font-size:12px;color:#64748b;">${a.status} &nbsp;·&nbsp; ID: ${a.id}</span>
            </div>
        </div>`;
    })
    .join("");

  document.getElementById("agent-picker-selected-label").textContent =
    "No agent selected";
  document.getElementById("agent-picker-confirm-btn").disabled = true;
  document.getElementById("agent-picker-modal").classList.add("active");
}

function selectAgentForScan(agentId, agentName, cardEl) {
  selectedAgentForScan = { id: agentId, name: agentName };
  document
    .querySelectorAll(".agent-picker-card")
    .forEach((c) => c.classList.remove("agent-picker-selected"));
  cardEl.classList.add("agent-picker-selected");
  document.getElementById("agent-picker-selected-label").textContent =
    agentName + " selected";
  document.getElementById("agent-picker-confirm-btn").disabled = false;
}

function closeAgentPicker() {
  document.getElementById("agent-picker-modal").classList.remove("active");
  pendingAgentAssignShipmentId = null;
  selectedAgentForScan = null;
}

function renderAgents(filter = {}) {
  const list = agentsList.filter((a) => {
    if (
      filter.search &&
      !a.name.toLowerCase().includes(filter.search) &&
      !a.id.toLowerCase().includes(filter.search)
    )
      return false;
    if (filter.status && a.status !== filter.status) return false;
    return true;
  });
  document.getElementById("agents-showing-label").innerHTML =
    `Showing ${list.length} of ${agentsList.length} agents`;
  const tbody = document.getElementById("agents-tbody");
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-msg">No agents found.</td></tr>`;
    return;
  }
  const maxAssigned = Math.max(...agentsList.map((a) => a.assigned), 1);
  tbody.innerHTML = list
    .map((a) => {
      const pct = Math.round((a.assigned / maxAssigned) * 100);
      const statusCls =
        a.status === "Active"
          ? "agent-active"
          : a.status === "Busy"
            ? "agent-busy"
            : "agent-offline";
      const dotCls =
        a.status === "Active"
          ? "dot-green"
          : a.status === "Busy"
            ? "dot-orange"
            : "dot-grey";
      const initials = a.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      return `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:38px;height:38px;border-radius:50%;background:#f4a32a;color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;">${initials}</div>
                    <div>
                        <div style="font-weight:600;color:#1e293b;">${a.name}</div>
                        <div style="font-size:11px;color:#94a3b8;">ID: ${a.id}</div>
                    </div>
                </div>
            </td>
            <td style="font-size:13px;">${a.phone}</td>
            <td>
                <div class="shipment-bar-wrap">
                    <span style="font-weight:600;color:#1e293b;min-width:18px;">${a.assigned}</span>
                    <div class="shipment-bar"><div class="shipment-bar-fill" style="width:${pct}%"></div></div>
                </div>
            </td>
            <td><span class="agent-status-badge ${statusCls}"><span class="agent-dot ${dotCls}"></span>${a.status}</span></td>
            <td style="font-size:13px;color:#64748b;">${a.area}</td>
            <td>
                <button class="action-btn edit"   onclick="openEditAgentModal('${a.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn delete" onclick="removeAgent('${a.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>`;
    })
    .join("");
}

async function removeAgent(agentId) {
  const r = await api(`/agency/${agencyId}/agents/${agentId}`, 'DELETE');
  if (r) {
    await init();
    renderAgents(getAgentFilters());
    showToast(`Agent removed successfully.`);
  } else {
    showToast(`Failed to remove agent.`, true);
  }
}

function getAgentFilters() {
  return {
    search: document.getElementById("agent-search").value.toLowerCase(),
    status: document.getElementById("agent-status-filter").value,
  };
}

function closeAgentModal() {
  document.getElementById("add-agent-modal").classList.remove("active");
}

function renderRTO() {
  const rtoTheadRow = document.querySelector(".rto-page .data-table thead tr");
  if (rtoTheadRow && rtoTheadRow.children.length === 7) {
    rtoTheadRow.removeChild(rtoTheadRow.lastElementChild);
  }

  document.getElementById("rto-total").innerHTML = rtoList.length;
  document.getElementById("rto-transit").innerHTML = rtoList.filter(
    (r) => !['Returned to Warehouse'].includes(r.status)
  ).length;
  document.getElementById("rto-approved").innerHTML = rtoList.filter(
    (r) => r.status === "Returned to Warehouse"
  ).length;

  const tbody = document.getElementById("rto-tbody");
  if (!rtoList.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-msg">No RTO requests found.</td></tr>`;
    return;
  }
  tbody.innerHTML = rtoList
    .map((r) => {
      const statusCls =
        r.status === "Returned to Warehouse" ? "status-delivered" : "status-out";
      return `<tr>
            <td><strong style="color:#1e293b;">${r.trackingId}</strong><br><span style="font-size:11px;color:#94a3b8;">${r.rtoId}</span></td>
            <td>${r.customerName}</td>
            <td style="font-size:13px;">${r.agentName || r.agentId || '—'}</td>
            <td style="font-size:12px;color:#64748b;max-width:180px;">${r.reason}</td>
            <td><span class="status-badge ${statusCls}">${r.status}</span></td>
            <td style="color:#94a3b8;font-size:12px;">${r.date || new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
        </tr>`;
    })
    .join("");
}


function closeRTOModal() {
  document.getElementById("new-rto-modal").classList.remove("active");
}

function renderDelivery() {
  const tbody = document.getElementById("delivery-tbody");
  const active = deliveriesList.filter(
    (s) => s.status === "Out for Delivery" || s.status === "Failed",
  );

  if (!active.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-msg">No active deliveries. Out-scan packages first.</td></tr>`;
    return;
  }

  tbody.innerHTML = active
    .map((s) => {
      const attCls = `attempts-${Math.min(s.attemptCount || 0, 3)}`;
      return `
        <tr>
            <td><strong style="color:#1e293b;">${s.trackingId}</strong></td>
            <td>${s.customerName}</td>
            <td style="font-size:12px;color:#64748b;">${s.customerAddress || "—"}</td>
            <td>${s.agentName}</td>
            <td>${statusBadge(s.status)}</td>
            <td><span class="attempts-badge ${attCls}">${s.attemptCount || 0} attempt${(s.attemptCount || 0) !== 1 ? "s" : ""}</span></td>
            <td>
                <button class="btn-primary" style="padding:6px 14px;font-size:12px;" onclick="openDeliveryStatusModal('${s.trackingId}')">
                    <i class="fa-solid fa-clipboard-check"></i> Update
                </button>
            </td>
        </tr>`;
    })
    .join("");
}

function getDeliveryEntry(trackingId) {
  return deliveriesList.find((d) => d.trackingId === trackingId);
}

function updateDeliveryEntry(trackingId, fields) {

}

function openDeliveryStatusModal(trackingId) {
  currentDeliveryShipment = getDeliveryEntry(trackingId);
  if (!currentDeliveryShipment) return;
  selectedDeliveryStatus = null;

  document.getElementById("delivery-tracking-input").value = trackingId;
  document.getElementById("delivery-lookup-msg").innerHTML = "";
  document.getElementById("delivery-lookup-msg").style.color = "#ef4444";
  document.getElementById("delivery-status-section").style.display = "block";
  document.getElementById("delivery-status-footer").style.display = "flex";
  document.getElementById("delivery-notes").value = "";

  document
    .querySelectorAll(".delivery-status-card")
    .forEach((c) => c.classList.remove("dsc-selected"));
  document.querySelector("#dsc-delivered .dsc-icon").className =
    "dsc-icon dsc-green";
  document.querySelector("#dsc-notavail .dsc-icon").className =
    "dsc-icon dsc-grey";
  document.querySelector("#dsc-address .dsc-icon").className =
    "dsc-icon dsc-grey";
  document.querySelector("#dsc-refused .dsc-icon").className =
    "dsc-icon dsc-grey";

  document.getElementById("delivery-status-modal").classList.add("active");
}

function selectDeliveryStatus(status) {
  selectedDeliveryStatus = status;
  document
    .querySelectorAll(".delivery-status-card")
    .forEach((c) => c.classList.remove("dsc-selected"));
  document.querySelector("#dsc-delivered .dsc-icon").className =
    "dsc-icon dsc-green";
  document.querySelector("#dsc-notavail .dsc-icon").className =
    "dsc-icon dsc-grey";
  document.querySelector("#dsc-address .dsc-icon").className =
    "dsc-icon dsc-grey";
  document.querySelector("#dsc-refused .dsc-icon").className =
    "dsc-icon dsc-grey";

  const cardMap = {
    Delivered: "dsc-delivered",
    "Not Available": "dsc-notavail",
    "Address Not Found": "dsc-address",
    "Customer Refused": "dsc-refused",
  };
  const card = document.getElementById(cardMap[status]);
  if (card) {
    card.classList.add("dsc-selected");
    if (status !== "Delivered") {
      card.querySelector(".dsc-icon").className = "dsc-icon dsc-grey";
      card.querySelector(".dsc-icon").style.background = "#f4a32a";
      card.querySelector(".dsc-icon").style.color = "white";
    }
  }
}

function closeDeliveryStatusModal() {
  document.getElementById("delivery-status-modal").classList.remove("active");
  currentDeliveryShipment = null;
  selectedDeliveryStatus = null;
}

function openOTPModal(shipment) {
  otpAttempts = 0;
  currentDeliveryShipment = shipment;
  document.getElementById("otp-tracking-id").innerHTML = shipment.trackingId;
  document.getElementById("otp-customer").innerHTML = shipment.customer;
  document.getElementById("otp-agent").innerHTML = shipment.agent;
  document.getElementById("otp-attempts-msg").innerHTML = "";
  document.getElementById("otp-last-attempt").innerHTML =
    "Last OTP attempt: just now";
  clearOTPBoxes();
  document.getElementById("otp-modal").classList.add("active");
  setTimeout(() => document.querySelectorAll(".otp-box")[0]?.focus(), 100);
}

function clearOTPBoxes() {
  document.querySelectorAll(".otp-box").forEach((b) => {
    b.value = "";
    b.classList.remove("otp-error");
  });
}

function normalizeTicketStatus(s) {
  if (!s) return 'Open';
  const u = s.trim().toUpperCase();
  if (u === 'OPEN') return 'Open';
  if (u === 'RESOLVED') return 'Resolved';
  if (u === 'IN PROGRESS' || u === 'INPROGRESS') return 'In Progress';
  if (u === 'PENDING') return 'Pending';
  return s;
}

function getFilteredTickets() {
  return ticketsList.map(t => ({ ...t, status: normalizeTicketStatus(t.status) })).filter((t) => {
    const q = ticketSearchQuery;
    const subject = (t.subject || t.category || '').toLowerCase();
    if (
      q &&
      !(t.ticketId || '').toLowerCase().includes(q) &&
      !(t.trackingId || '').toLowerCase().includes(q) &&
      !subject.includes(q)
    )
      return false;
    if (activeTicketFilter && t.status !== activeTicketFilter) return false;
    return true;
  });
}

function renderTickets() {
  document.getElementById("ticket-list-view").style.display = "block";
  document.getElementById("ticket-detail-view").style.display = "none";
  const list = getFilteredTickets();
  const totalPages = Math.ceil(list.length / TICKETS_PER_PAGE);
  if (currentTicketPage > totalPages && totalPages > 0)
    currentTicketPage = totalPages;
  const pageList = list.slice(
    (currentTicketPage - 1) * TICKETS_PER_PAGE,
    currentTicketPage * TICKETS_PER_PAGE,
  );
  document.getElementById("tickets-showing-label").innerHTML =
    `Showing ${(currentTicketPage - 1) * TICKETS_PER_PAGE + 1} to ${Math.min(currentTicketPage * TICKETS_PER_PAGE, list.length)} of ${list.length} tickets`;
  const tbody = document.getElementById("tickets-tbody");
  tbody.innerHTML = !pageList.length
    ? `<tr><td colspan="6" class="empty-msg">No tickets match your filter.</td></tr>`
    : pageList
        .map(
          (t) => `
        <tr>
            <td><strong style="color:#1e293b;">${t.ticketId}</strong></td>
            <td style="color:#64748b;font-size:13px;">${t.trackingId}</td>
            <td>${t.subject || t.category || '—'}</td>
            <td>${ticketStatusBadge(normalizeTicketStatus(t.status))}</td>
            <td style="color:#64748b;font-size:12px;">${t.created || (t.raisedAt ? new Date(t.raisedAt).toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'}) : '—')}</td>
            <td><span class="view-details-link" onclick="openTicketDetail('${t.ticketId}')">View Details</span></td>
        </tr>`,
        )
        .join("");

  const pag = document.getElementById("tickets-pagination");
  pag.innerHTML = "";
  if (totalPages > 1) {
    const prev = document.createElement("button");
    prev.className = "page-btn";
    prev.innerHTML = "Previous";
    prev.disabled = currentTicketPage === 1;
    prev.onclick = () => {
      currentTicketPage--;
      renderTickets();
    };
    pag.appendChild(prev);
    for (let i = 1; i <= totalPages; i++) {
      const b = document.createElement("button");
      b.className = "page-num" + (i === currentTicketPage ? " active" : "");
      b.innerHTML = i;
      b.onclick = () => {
        currentTicketPage = i;
        renderTickets();
      };
      pag.appendChild(b);
    }
    const next = document.createElement("button");
    next.className = "page-btn";
    next.innerHTML = "Next";
    next.disabled = currentTicketPage === totalPages;
    next.onclick = () => {
      currentTicketPage++;
      renderTickets();
    };
    pag.appendChild(next);
  }
}

async function openTicketDetail(ticketId) {
  const t = ticketsList.find((t) => t.ticketId === ticketId);
  if (!t) return;
  currentViewingTicket = t;
  document.getElementById("ticket-list-view").style.display = "none";
  document.getElementById("ticket-detail-view").style.display = "block";
  document.getElementById("detail-ticket-id").innerHTML =
    "Ticket " + t.ticketId;
  const normalStatus = normalizeTicketStatus(t.status);
  document.getElementById("detail-status-badge").innerHTML = normalStatus;
  document.getElementById("detail-status-badge").className =
    "ticket-status-badge " + ticketStatusBadgeClass(normalStatus);
  document.getElementById("detail-assigned").innerHTML = t.assigned || 'Agency Manager';
  const priority = t.priority || 'Low';
  document.getElementById("detail-priority").innerHTML = priority;
  document.getElementById("detail-priority").style.color =
    priority === "High"
      ? "#ef4444"
      : priority === "Medium"
        ? "#f4a32a"
        : "#16a34a";
  document.getElementById("detail-updated").innerHTML = "Updated recently";
  document.getElementById("detail-tkt-id").innerHTML = t.ticketId;
  document.getElementById("detail-trk-id").innerHTML = t.trackingId;
  document.getElementById("detail-ord-id").innerHTML = t.category || '—';
  document.getElementById("detail-created").innerHTML = t.created || (t.raisedAt ? new Date(t.raisedAt).toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'}) : '—');
  const custName = t.custName || '—';
  const initials = custName !== '—' ? custName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) : 'NA';
  document.getElementById("detail-cust-avatar").innerHTML = initials;
  document.getElementById("detail-cust-name").innerHTML = custName;
  document.getElementById("detail-cust-phone").innerHTML = t.custPhone || '—';
  document.getElementById("detail-cust-addr").innerHTML = t.custAddr || '—';
  document.getElementById("detail-issue").innerHTML = `"${t.issue || t.description || '—'}"`;

  const descriptions = {
      'Order Received': 'Your order has been received and confirmed',
      'Picked and Packed': 'Package has been picked from inventory and packed for shipping',
      'Shipment Dispatched': 'Package has left the warehouse and is en route to the transit hub',
      'In Scan at Transit Hub': 'Package arrived at the regional transit hub for sorting',
      'Outscan at Transit Hub': 'Package has been sorted and dispatched from the transit hub',
      'In Scan at Local Delivery Agency': 'Package has arrived at the local delivery center near you',
      'Out for Delivery': 'Package is out for delivery with your local delivery agent',
      'Delivered': 'Package successfully delivered to destination'
  };

  document.getElementById("detail-timeline").innerHTML = "<p style='color:#64748b;font-size:13px;'>Loading timeline...</p>";
  
  const trackData = await api(`/track/${t.trackingId}`);
  if (trackData && trackData.statusSteps) {
      document.getElementById("detail-timeline").innerHTML = trackData.statusSteps
        .map((step) => {
          const dotCls = step.done
            ? "tl-done"
            : step.current
              ? "tl-current"
              : "tl-pending";
          const icon = step.done
            ? "fa-check"
            : step.current
              ? "fa-star"
              : "fa-circle";
          const desc = descriptions[step.label] || '';
          const time = step.time ? new Date(step.time).toLocaleString('en-IN', {dateStyle:'medium', timeStyle:'short'}) : '';
          return `<div class="timeline-item"><div class="timeline-dot ${dotCls}"><i class="fa-solid ${icon}" style="font-size:12px;"></i></div><div class="timeline-content"><p class="tl-title">${step.label}</p><p class="tl-desc">${desc}</p><p class="tl-time">${time}</p></div></div>`;
        })
        .join("");
  } else {
      document.getElementById("detail-timeline").innerHTML = "<p style='color:#ef4444;font-size:13px;'>Timeline unavailable.</p>";
  }

  const rb = document.getElementById("ticket-resolve-btn");
  if (t.status === "Resolved") {
    rb.disabled = true;
    rb.style.opacity = "0.5";
    rb.innerHTML = `<i class="fa-solid fa-circle-check"></i> Resolved`;
  } else {
    rb.disabled = false;
    rb.style.opacity = "1";
    rb.innerHTML = `<i class="fa-solid fa-circle-check"></i> Mark as Resolved`;
  }
}

function statusBadge(status) {
  const map = {
    Delivered: "status-delivered",
    "Out for Delivery": "status-out",
    Failed: "status-failed",
    Arrived: "status-arrived",
    "Arrived at Agency": "status-arrived",
    Pending: "status-pending",
    "In Transit to Agency": "status-pending",
    RTO: "status-rto",
  };
  return `<span class="status-badge ${map[status] || "status-pending"}">${status}</span>`;
}

function ticketStatusBadge(s) {
  const norm = normalizeTicketStatus(s);
  return `<span class="status-badge ${ticketStatusBadgeClass(norm)}">${norm}</span>`;
}
function ticketStatusBadgeClass(s) {
  return (
    {
      Open: "status-open",
      Resolved: "status-resolved",
      "In Progress": "status-progress",
      Pending: "status-pending",
    }[s] || "status-pending"
  );
}

function closeEditModal() {
  document.getElementById("edit-modal").classList.remove("active");
}

function closePwdModal() {
  document.getElementById("pwd-modal").classList.remove("active");
}

function showToast(msg, isError = false) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.style.cssText = `position:fixed;bottom:30px;right:30px;z-index:9999;padding:12px 20px;border-radius:10px;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,0.18);transition:opacity 0.4s;font-family:'Poppins',sans-serif;max-width:340px;color:white;`;
    document.body.appendChild(t);
  }
  t.style.background = isError ? "#ef4444" : "#0b3c44";
  t.innerHTML = msg;
  t.style.opacity = "1";
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity = "0";
  }, 3000);
}


