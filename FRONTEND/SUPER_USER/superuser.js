"use strict";


const API_BASE = "http://localhost:8000";
async function suApi(path, method = "GET", body = null) {
    const opts = {
        method,
        headers: { "Content-Type": "application/json", "x-role": "SUPER_USER" },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API_BASE}${path}`, opts);
    return res.json();
}


let _toastTimer = null;
function showToast(msg, isError = false) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.className = "show" + (isError ? " toast-error" : "");
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => { el.className = ""; }, 3500);
}


const _sessionRaw = JSON.parse(localStorage.getItem("session"));
let session = _sessionRaw;
if (!_sessionRaw || _sessionRaw.role !== "SuperUser") {
    window.location.href = "su_auth.html";
}
let role_name = session?.user?.name || "System Administrator";
let email = session?.user?.email || "su@ware2door.com";
let phone = session?.user?.phone || "+91 9000000000";


let state = {
    admins: [],
    warehouses: [],
    hubs: [],
    agencies: [],
    logs: [],
    currentPage: "nav-dashboard",
    adminFilterRole: "all",
    adminSearch: "",
    adminStatusFilter: "",
    adminSort: "name",
};
let pendingActionData = null;
let editAdminId = null;
let dashboardChartObj = null;
let perfChartObj = null;


async function loadAllData() {
    try {
        const [admins, warehouses, hubs, agencies, logs, config] = await Promise.all([
            suApi("/su/admins"),
            suApi("/su/warehouses"),
            suApi("/su/hubs"),
            suApi("/su/agencies"),
            suApi("/su/logs"),
            suApi("/su/config"),
        ]);
        state.admins     = Array.isArray(admins)     ? admins     : [];
        state.warehouses = Array.isArray(warehouses) ? warehouses : [];
        state.hubs       = Array.isArray(hubs)       ? hubs       : [];
        state.agencies   = Array.isArray(agencies)   ? agencies   : [];
        state.logs       = Array.isArray(logs)       ? logs       : [];

        if (config) {
            if (document.getElementById("cfg-low-stock")) document.getElementById("cfg-low-stock").value = config.lowStockThreshold || 50;
            if (document.getElementById("cfg-max-attempts")) document.getElementById("cfg-max-attempts").value = config.maxRtoAttempts || 3;
        }
    } catch (e) {
        showToast("⚠ Failed to load data from backend.", true);
    }
}


async function logAuditAction(admin, module, action, details) {
    const entry = { admin, module, action, details };
    await suApi("/su/logs", "POST", entry).catch(() => {});
    state.logs.unshift({ ...entry, time: new Date().toISOString() });
}


window.drillDown = async function (type, id) {
    let html = "";
    if (type === "Warehouse") {
        const wh = state.warehouses.find((w) => w.id === id);
        if (!wh) return;
        const detail = await suApi(`/su/warehouses/${id}`);
        const invData = detail.invData || [];
        const pendReq = detail.pendReq || [];
        html = `
            <div style="display:flex; gap:16px; margin-bottom:20px;">
                <div style="flex:1; background:linear-gradient(135deg, #ffffff, #f8fafc); padding:16px; border-radius:12px; border:1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align:center;">
                    <div style="font-size:12px; color:#64748b; margin-bottom:8px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;"><i class="fa-solid fa-boxes-stacked" style="color:#3b82f6; margin-right:4px;"></i> INVENTORY</div>
                    <div style="font-size:28px; font-weight:800; color:#0f172a;">${wh.inventory.toLocaleString()}</div>
                </div>
                <div style="flex:1; background:linear-gradient(135deg, #ffffff, #fff7ed); padding:16px; border-radius:12px; border:1px solid #ffedd5; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align:center;">
                    <div style="font-size:12px; color:#c2410c; margin-bottom:8px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;"><i class="fa-solid fa-clock-rotate-left" style="margin-right:4px;"></i> PENDING ORDERS</div>
                    <div style="font-size:28px; font-weight:800; color:#c2410c;">${wh.pending.toLocaleString()}</div>
                </div>
                <div style="flex:1; background:linear-gradient(135deg, #ffffff, #fef2f2); padding:16px; border-radius:12px; border:1px solid #fee2e2; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align:center;">
                    <div style="font-size:12px; color:#dc2626; margin-bottom:8px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;"><i class="fa-solid fa-rotate-left" style="margin-right:4px;"></i> RTO QUEUE</div>
                    <div style="font-size:28px; font-weight:800; color:#dc2626;">${wh.rto.toLocaleString()}</div>
                </div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; box-shadow: 0 2px 4px -1px rgba(0,0,0,0.02);">
                    <div style="background:#f8fafc; padding:12px 16px; border-bottom:1px solid #e2e8f0;">
                        <h4 style="margin:0; font-size:14px; color:#1e293b; font-weight:700;"><i class="fa-solid fa-box-open" style="color:#64748b; margin-right:6px;"></i> Inventory Health Matrix</h4>
                    </div>
                    <div style="max-height: 220px; overflow-y: auto; padding:8px;">
                        <table class="data-table" style="font-size:12px; margin-bottom:0; border:none; width:100%;">
                            <thead style="background:#f1f5f9; border-radius:6px;"><tr><th style="padding:8px 12px; text-align:left;">SKU</th><th style="padding:8px 12px; text-align:left;">PRODUCT</th><th style="padding:8px 12px; text-align:left;">QTY</th><th style="padding:8px 12px; text-align:left;">STATUS</th></tr></thead>
                            <tbody>${invData.map((i) => {
                                let bc = "background:#dcfce7; color:#166534;";
                                if (i.status.includes("Low")) bc = "background:#fef08a; color:#854d0e;";
                                if (i.status.includes("Out")) bc = "background:#fee2e2; color:#991b1b;";
                                return `<tr><td style="padding:10px 12px; border-bottom:1px solid #f1f5f9;"><strong>${i.id || "—"}</strong></td><td style="padding:10px 12px; border-bottom:1px solid #f1f5f9;">${i.name}</td><td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; font-weight:600;">${i.qty}</td><td style="padding:10px 12px; border-bottom:1px solid #f1f5f9;"><span style="padding:3px 8px; border-radius:12px; font-size:11px; font-weight:700; ${bc}">${i.status}</span></td></tr>`;
                            }).join("") || `<tr><td colspan="4" style="padding:20px; text-align:center; color:#94a3b8;">No inventory data.</td></tr>`}</tbody>
                        </table>
                    </div>
                </div>
                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; box-shadow: 0 2px 4px -1px rgba(0,0,0,0.02);">
                    <div style="background:#fff7ed; padding:12px 16px; border-bottom:1px solid #ffedd5; display:flex; justify-content:space-between; align-items:center;">
                        <h4 style="margin:0; font-size:14px; color:#9a3412; font-weight:700;"><i class="fa-solid fa-truck-ramp-box" style="margin-right:6px;"></i> Pending Operations</h4>
                        ${pendReq.length > 0 ? `<button onclick="cancelAllPending('${id}')" style="background:#ef4444; color:#ffffff; border:none; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px; box-shadow:0 2px 4px rgba(239,68,68,0.2); transition:all 0.2s;"><i class="fa-solid fa-ban"></i> Cancel All</button>` : ''}
                    </div>
                    <div style="max-height: 220px; overflow-y: auto; padding:8px;">
                        <table class="data-table" style="font-size:12px; margin-bottom:0; border:none; width:100%;">
                            <thead style="background:#f1f5f9; border-radius:6px;"><tr><th style="padding:8px 12px; text-align:left;">ORDER ID</th><th style="padding:8px 12px; text-align:left;">DESTINATION</th><th style="padding:8px 12px; text-align:center;">ACTIONS</th></tr></thead>
                            <tbody>${pendReq.map((o) => `<tr>
                                <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9;"><strong>${o.orderId}</strong><br><span style="font-size:10px; color:#64748b;">${o.items} items</span></td>
                                <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; max-width:150px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${o.dest}">${o.dest}</td>
                                <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; text-align:center;">
                                    <button onclick="cancelSinglePending('${id}', '${o.orderId}')" title="Cancel this order" style="background:transparent; color:#ef4444; border:1px solid #fca5a5; padding:4px; border-radius:4px; cursor:pointer; font-size:12px; transition:all 0.2s;"><i class="fa-solid fa-xmark"></i></button>
                                </td>
                            </tr>`).join("") || `<tr><td colspan="3" style="padding:20px; text-align:center; color:#94a3b8;"><i class="fa-solid fa-check-circle" style="font-size:24px; color:#22c55e; margin-bottom:8px; display:block;"></i>All caught up! No pending orders.</td></tr>`}</tbody>
                        </table>
                    </div>
                </div>
            </div>`;
    } else if (type === "Hub") {
        const hub = state.hubs.find((h) => h.id === id);
        if (!hub) return;
        const detail = await suApi(`/su/hubs/${id}`);
        const scans = detail.scans || [];
        html = `
            <div style="display:flex; gap:16px; margin-bottom:20px;">
                <div style="flex:1; background:linear-gradient(135deg, #ffffff, #f0fdf4); padding:16px; border-radius:12px; border:1px solid #bbf7d0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align:center;">
                    <div style="font-size:12px; color:#166534; margin-bottom:8px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;"><i class="fa-solid fa-arrow-down-short-wide" style="margin-right:4px;"></i> IN-SCANNED</div>
                    <div style="font-size:28px; font-weight:800; color:#15803d;">${hub.inScanned.toLocaleString()}</div>
                </div>
                <div style="flex:1; background:linear-gradient(135deg, #ffffff, #eff6ff); padding:16px; border-radius:12px; border:1px solid #bfdbfe; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align:center;">
                    <div style="font-size:12px; color:#1e40af; margin-bottom:8px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;"><i class="fa-solid fa-arrow-up-wide-short" style="margin-right:4px;"></i> OUT-SCANNED</div>
                    <div style="font-size:28px; font-weight:800; color:#1d4ed8;">${hub.outScanned.toLocaleString()}</div>
                </div>
                <div style="flex:1; background:linear-gradient(135deg, #ffffff, #fffbeb); padding:16px; border-radius:12px; border:1px solid #fde68a; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align:center;">
                    <div style="font-size:12px; color:#92400e; margin-bottom:8px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;"><i class="fa-solid fa-gauge" style="margin-right:4px;"></i> CAPACITY</div>
                    <div style="font-size:28px; font-weight:800; color:#b45309;">${hub.capacity}%</div>
                </div>
            </div>
            
            <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; box-shadow: 0 2px 4px -1px rgba(0,0,0,0.02);">
                <div style="background:#f8fafc; padding:12px 16px; border-bottom:1px solid #e2e8f0;">
                    <h4 style="margin:0; font-size:14px; color:#1e293b; font-weight:700;"><i class="fa-solid fa-clipboard-list" style="color:#64748b; margin-right:6px;"></i> Latest Scan Operations</h4>
                </div>
                <div style="max-height: 250px; overflow-y: auto; padding:8px;">
                    <table class="data-table" style="font-size:12px; margin-bottom:0; border:none; width:100%;">
                        <thead style="background:#f1f5f9; border-radius:6px;"><tr><th style="padding:8px 12px; text-align:left;">TRACKING ID</th><th style="padding:8px 12px; text-align:left;">SCAN OPERATION</th><th style="padding:8px 12px; text-align:left;">TIMESTAMP</th></tr></thead>
                        <tbody>${scans.map((s) => {
                            let icon = '<i class="fa-solid fa-circle-check" style="color:#22c55e;"></i>';
                            if (s.type === "Flagged") icon = '<i class="fa-solid fa-triangle-exclamation" style="color:#ef4444;"></i>';
                            

                            let formattedTime = s.time;
                            try {
                                const d = new Date(s.time);
                                formattedTime = d.toLocaleString();
                            } catch (e) {}

                            return `<tr>
                                <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9;"><strong>${s.id}</strong></td>
                                <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; font-weight:600;">${icon} <span style="margin-left:4px;">${s.type}</span></td>
                                <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; color:#64748b;">${formattedTime}</td>
                            </tr>`;
                        }).join("") || `<tr><td colspan="3" style="padding:20px; text-align:center; color:#94a3b8;"><i class="fa-solid fa-folder-open" style="font-size:24px; color:#cbd5e1; margin-bottom:8px; display:block;"></i>No scan operations recorded.</td></tr>`}</tbody>
                    </table>
                </div>
            </div>`;
    } else if (type === "Agency") {
        const ag = state.agencies.find((a) => a.id === id);
        if (!ag) return;
        const detail = await suApi(`/su/agencies/${id}`);
        const roster = detail.agentRoster || [];
        html = `
            <div style="display:flex; gap:16px; margin-bottom:20px;">
                <div style="flex:1; background:linear-gradient(135deg, #ffffff, #f8fafc); padding:16px; border-radius:12px; border:1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align:center;">
                    <div style="font-size:12px; color:#475569; margin-bottom:8px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;"><i class="fa-solid fa-users" style="margin-right:4px;"></i> ACTIVE AGENTS</div>
                    <div style="font-size:28px; font-weight:800; color:#0f172a;">${ag.agents.toLocaleString()}</div>
                </div>
                <div style="flex:1; background:linear-gradient(135deg, #ffffff, #f0fdf4); padding:16px; border-radius:12px; border:1px solid #bbf7d0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align:center;">
                    <div style="font-size:12px; color:#166534; margin-bottom:8px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;"><i class="fa-solid fa-house-circle-check" style="margin-right:4px;"></i> DELIVERED</div>
                    <div style="font-size:28px; font-weight:800; color:#15803d;">${ag.deliveredToday.toLocaleString()}</div>
                </div>
                <div style="flex:1; background:linear-gradient(135deg, #ffffff, #fef2f2); padding:16px; border-radius:12px; border:1px solid #fecaca; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align:center;">
                    <div style="font-size:12px; color:#991b1b; margin-bottom:8px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;"><i class="fa-solid fa-rotate-left" style="margin-right:4px;"></i> RTO RAISED</div>
                    <div style="font-size:28px; font-weight:800; color:#b91c1c;">${ag.rtoRaised.toLocaleString()}</div>
                </div>
            </div>
            
            <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; box-shadow: 0 2px 4px -1px rgba(0,0,0,0.02);">
                <div style="background:#f8fafc; padding:12px 16px; border-bottom:1px solid #e2e8f0;">
                    <h4 style="margin:0; font-size:14px; color:#1e293b; font-weight:700;"><i class="fa-solid fa-users-gear" style="color:#64748b; margin-right:6px;"></i> Agent Roster</h4>
                </div>
                <div style="max-height: 250px; overflow-y: auto; padding:8px;">
                    <table class="data-table" style="font-size:12px; margin-bottom:0; border:none; width:100%;">
                        <thead style="background:#f1f5f9; border-radius:6px;"><tr><th style="padding:8px 12px; text-align:left;">AGENT NAME</th><th style="padding:8px 12px; text-align:left;">CONTACT</th><th style="padding:8px 12px; text-align:center;">ASSIGNED</th><th style="padding:8px 12px; text-align:right;">STATUS</th></tr></thead>
                        <tbody>${roster.map((a) => {
                            let statusOptions = ['Active', 'Busy', 'Offline'];
                            let selectHtml = `<select onchange="changeAgentStatus('${id}', '${a.id}', this.value)" style="padding:4px 8px; border-radius:6px; border:1px solid #cbd5e1; font-size:11px; font-weight:600; cursor:pointer; background:#f8fafc;">
                                ${statusOptions.map(opt => `<option value="${opt}" ${a.status === opt ? 'selected' : ''}>${opt}</option>`).join("")}
                            </select>`;
                            
                            let statusDot = a.status === 'Active' ? '#22c55e' : a.status === 'Busy' ? '#f59e0b' : '#94a3b8';

                            return `<tr>
                                <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9;"><strong>${a.name}</strong><br><span style="font-size:10px; color:#64748b;">ID: ${a.id.split('-')[1] || a.id}</span></td>
                                <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; color:#475569;">${a.phone || "—"}</td>
                                <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; text-align:center;"><span style="background:#e0e7ff; color:#3730a3; padding:2px 8px; border-radius:12px; font-weight:700;">${a.deliveries} items</span></td>
                                <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; text-align:right; display:flex; align-items:center; justify-content:flex-end; gap:6px;">
                                    <div style="width:8px; height:8px; border-radius:50%; background:${statusDot};"></div>
                                    ${selectHtml}
                                </td>
                            </tr>`;
                        }).join("") || `<tr><td colspan="4" style="padding:20px; text-align:center; color:#94a3b8;"><i class="fa-solid fa-user-slash" style="font-size:24px; color:#cbd5e1; margin-bottom:8px; display:block;"></i>No agents registered.</td></tr>`}</tbody>
                    </table>
                </div>
            </div>`;
    }

    const titleMap = {
        Warehouse: '<i class="fa-solid fa-warehouse" style="color:#0f5460;"></i> WAREHOUSE CONTROL PANEL',
        Hub: '<i class="fa-solid fa-building" style="color:#3b82f6;"></i> TRANSIT HUB CONTROL PANEL',
        Agency: '<i class="fa-solid fa-truck-fast" style="color:#f4a32a;"></i> LOCAL AGENCY CONTROL PANEL',
    };
    const title = document.getElementById("admin-modal-title");
    if (title) title.innerHTML = `${titleMap[type] || ""} <span style="color:#94a3b8; font-size:14px; margin-left:10px; font-weight:normal;">ID: ${id}</span>`;
    const body = document.getElementById("view-admin-body");
    if (body) body.innerHTML = html;
    const editBtn = document.getElementById("edit-from-view-btn");
    if (editBtn) editBtn.style.display = "none";
    openModal("view-admin-modal");
};

window.saveConfig = async function () {
    const lowStock = document.getElementById("cfg-low-stock").value;
    const maxRto = document.getElementById("cfg-max-attempts").value;
    try {
        await suApi("/su/config", "PUT", { lowStockThreshold: lowStock, maxRtoAttempts: maxRto });
        showToast("✓ System configurations saved and applied across network.");
        await logAuditAction("SYSTEM", "System Config", "Updated Global Configs", "Super User updated system configuration settings");
    } catch (e) {
        showToast("⚠ Failed to save system configurations.", true);
    }
};
window.viewAdminDetails = viewAdminDetails;
window.confirmDeactivate = confirmDeactivate;


document.getElementById("logout-btn")?.addEventListener("click", () => {
    localStorage.removeItem("session");
    window.location.href = "su_auth.html";
});

window.renderPerfChart = function (type) {
    document.querySelectorAll(".perf-tab").forEach((t) => {
        t.style.background = "transparent"; t.style.color = "#64748b"; t.style.boxShadow = "none"; t.classList.remove("active");
    });
    const activeTab = document.querySelector(`.perf-tab[data-target="${type}"]`);
    if (activeTab) { activeTab.style.background = "white"; activeTab.style.color = "#0f172a"; activeTab.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)"; activeTab.classList.add("active"); }
    ["WH", "HUB", "AG"].forEach((t) => {
        const p = document.getElementById(`perf-panel-${t}`);
        if (p) p.style.display = t === type ? "block" : "none";
    });
    if (type === "WH")  _populatePerfDropdown("perf-select-wh",  state.warehouses, "name");
    if (type === "HUB") _populatePerfDropdown("perf-select-hub", state.hubs,       "name");
    if (type === "AG")  _populatePerfDropdown("perf-select-ag",  state.agencies,   "name");
    window.renderPerfEntityChart(type, 0);
};

window.renderPerfEntityChart = function (type, idx) {
    const canvasId = `perfChart-${type}`;
    setTimeout(() => {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        if (perfChartObj) perfChartObj.destroy();
        let metricCards = "", labels = [], dataset1 = [], label1 = "", color1 = "", entity = null;
        if (type === "WH") {
            entity = state.warehouses[idx];
            if (!entity) return;
            labels = ["Inventory", "Pending Orders", "RTO"];
            dataset1 = [entity.inventory, entity.pending, entity.rto];
            label1 = "Count"; color1 = "#14b8a6";
            metricCards = `<div style="display:flex;gap:12px;margin-bottom:20px;">
                <div style="flex:1;background:#f0fdfa;border:1px solid #99f6e4;padding:14px;border-radius:10px;text-align:center;"><div style="font-size:11px;color:#14b8a6;font-weight:700;">INVENTORY</div><div style="font-size:28px;font-weight:800;color:#0f172a;">${entity.inventory.toLocaleString()}</div></div>
                <div style="flex:1;background:#fffbeb;border:1px solid #fde68a;padding:14px;border-radius:10px;text-align:center;"><div style="font-size:11px;color:#f59e0b;font-weight:700;">PENDING ORDERS</div><div style="font-size:28px;font-weight:800;color:#0f172a;">${entity.pending.toLocaleString()}</div></div>
                <div style="flex:1;background:#fff1f2;border:1px solid #fecdd3;padding:14px;border-radius:10px;text-align:center;"><div style="font-size:11px;color:#ef4444;font-weight:700;">RTO</div><div style="font-size:28px;font-weight:800;color:#0f172a;">${entity.rto || 0}</div></div>
            </div>`;
        } else if (type === "HUB") {
            entity = state.hubs[idx];
            if (!entity) return;
            labels = ["In-Scanned", "Out-Scanned", "Capacity%"];
            dataset1 = [entity.inScanned, entity.outScanned, entity.capacity];
            label1 = "Packages"; color1 = "#3b82f6";
            metricCards = `<div style="display:flex;gap:12px;margin-bottom:20px;">
                <div style="flex:1;background:#eff6ff;border:1px solid #bfdbfe;padding:14px;border-radius:10px;text-align:center;"><div style="font-size:11px;color:#3b82f6;font-weight:700;">IN-SCANNED</div><div style="font-size:28px;font-weight:800;color:#0f172a;">${entity.inScanned.toLocaleString()}</div></div>
                <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;padding:14px;border-radius:10px;text-align:center;"><div style="font-size:11px;color:#22c55e;font-weight:700;">OUT-SCANNED</div><div style="font-size:28px;font-weight:800;color:#0f172a;">${entity.outScanned.toLocaleString()}</div></div>
                <div style="flex:1;background:#f8fafc;border:1px solid #e2e8f0;padding:14px;border-radius:10px;text-align:center;"><div style="font-size:11px;color:#64748b;font-weight:700;">CAPACITY</div><div style="font-size:28px;font-weight:800;color:#0f172a;">${entity.capacity}%</div></div>
            </div>`;
        } else if (type === "AG") {
            entity = state.agencies[idx];
            if (!entity) return;
            labels = ["Delivered", "RTO Raised", "Active Agents"];
            dataset1 = [entity.deliveredToday, entity.rtoRaised, entity.agents];
            label1 = "Count"; color1 = "#22c55e";
            metricCards = `<div style="display:flex;gap:12px;margin-bottom:20px;">
                <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;padding:14px;border-radius:10px;text-align:center;"><div style="font-size:11px;color:#22c55e;font-weight:700;">DELIVERED</div><div style="font-size:28px;font-weight:800;color:#0f172a;">${entity.deliveredToday.toLocaleString()}</div></div>
                <div style="flex:1;background:#fff1f2;border:1px solid #fecdd3;padding:14px;border-radius:10px;text-align:center;"><div style="font-size:11px;color:#ef4444;font-weight:700;">RTO RAISED</div><div style="font-size:28px;font-weight:800;color:#0f172a;">${entity.rtoRaised}</div></div>
                <div style="flex:1;background:#eff6ff;border:1px solid #bfdbfe;padding:14px;border-radius:10px;text-align:center;"><div style="font-size:11px;color:#3b82f6;font-weight:700;">ACTIVE AGENTS</div><div style="font-size:28px;font-weight:800;color:#0f172a;">${entity.agents}</div></div>
            </div>`;
        }
        const cardContainer = document.getElementById(`perf-metric-cards-${type}`);
        if (cardContainer) cardContainer.innerHTML = metricCards;
        perfChartObj = new Chart(ctx, {
            type: "bar",
            data: { labels, datasets: [{ label: label1, data: dataset1, backgroundColor: color1, borderRadius: 6 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "top" } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } },
        });
    }, 80);
};


document.addEventListener("DOMContentLoaded", async () => {
    initSidebar();
    initHeader();
    initDashboardQuickActions();
    initAdminsPageEvents();
    initModals();
    await loadAllData();
    renderDashboard();
    updateAdminBadge();
});

function initSidebar() {
    const navItems = [
        "nav-dashboard", "nav-admins", "nav-warehouses", "nav-hubs", 
        "nav-agencies", "nav-performances", "nav-logs", "nav-config", "nav-settings"
    ];
    navItems.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("click", () => navigateTo(id));
    });
    const topAvatar = document.getElementById("top-avatar");
    if (topAvatar) topAvatar.addEventListener("click", () => navigateTo("nav-settings"));
}

function initHeader() {
    const headerName = document.getElementById("su-header-name");
    if (headerName) headerName.textContent = role_name;
    const initial = role_name.charAt(0).toUpperCase();
    document.querySelectorAll(".su-avatar").forEach((el) => (el.textContent = initial));
}

function initDashboardQuickActions() {
    document.getElementById("dash-add-admin-btn")?.addEventListener("click", () => {
        navigateTo("nav-admins");
        openAddAdminModal();
    });
    document.getElementById("dash-view-logs-btn")?.addEventListener("click", () => navigateTo("nav-logs"));
}

function initAdminsPageEvents() {
    document.getElementById("admin-search")?.addEventListener("input", (e) => {
        state.adminSearch = e.target.value.toLowerCase();
        renderAdmins();
    });
    document.getElementById("admin-status-filter")?.addEventListener("change", (e) => {
        state.adminStatusFilter = e.target.value;
        renderAdmins();
    });
    document.getElementById("admin-sort")?.addEventListener("change", (e) => {
        state.adminSort = e.target.value;
        renderAdmins();
    });
    document.querySelectorAll(".role-tab").forEach((tab) => {
        tab.addEventListener("click", (e) => {
            document.querySelectorAll(".role-tab").forEach((t) => t.classList.remove("active"));
            e.target.classList.add("active");
            state.adminFilterRole = e.target.dataset.role;
            renderAdmins();
        });
    });
    document.getElementById("add-admin-btn")?.addEventListener("click", () => openAddAdminModal());
}

function initModals() {
    const closes = ["close-add-admin-modal", "cancel-add-admin-modal"];
    closes.forEach((id) => document.getElementById(id)?.addEventListener("click", () => closeModal("add-admin-modal")));
    document.getElementById("save-add-admin-modal")?.addEventListener("click", handleAddAdmin);
    document.getElementById("close-view-admin-modal")?.addEventListener("click", () => closeModal("view-admin-modal"));
    document.getElementById("cancel-view-admin-modal")?.addEventListener("click", () => closeModal("view-admin-modal"));
    document.getElementById("open-edit-modal")?.addEventListener("click", openEditProfileModal);
    document.getElementById("close-edit-modal")?.addEventListener("click", () => closeModal("edit-modal"));
    document.getElementById("cancel-edit-modal")?.addEventListener("click", () => closeModal("edit-modal"));
    document.getElementById("save-edit-modal")?.addEventListener("click", handleEditProfileSave);
    document.getElementById("change-pwd-btn")?.addEventListener("click", () => openModal("pwd-modal"));
    document.getElementById("close-pwd-modal")?.addEventListener("click", () => closeModal("pwd-modal"));
    document.getElementById("cancel-pwd-modal")?.addEventListener("click", () => closeModal("pwd-modal"));
    document.getElementById("save-pwd-modal")?.addEventListener("click", handlePasswordSave);
    document.getElementById("close-confirm-modal")?.addEventListener("click", () => closeModal("confirm-modal"));
    document.getElementById("cancel-confirm-modal")?.addEventListener("click", () => closeModal("confirm-modal"));
    document.getElementById("close-facility-access-modal")?.addEventListener("click", () => closeModal("facility-access-modal"));
    document.getElementById("cancel-facility-access-modal")?.addEventListener("click", () => closeModal("facility-access-modal"));
    document.querySelectorAll(".modal-overlay").forEach((overlay) => {
        overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(overlay.id); });
    });
}

function getStatusBadgeClass(status) {
    if (!status) return "status-pending";
    const s = status.toLowerCase();
    if (s === "operational") return "status-active";
    if (s === "critical") return "status-suspended";
    return "status-pending";
}

function getRoleBadge(role) {
    if (role === "WareHouse" || role === "WAREHOUSE") return `<span class="admin-role-badge role-badge--warehouse"><i class="fa-solid fa-warehouse"></i> Warehouse Dashboard</span>`;
    if (role === "TransitHub" || role === "TRANSIT_HUB") return `<span class="admin-role-badge role-badge--hub"><i class="fa-solid fa-building"></i> Transit Hub</span>`;
    if (role === "LocalAgency" || role === "LOCAL_AGENCY") return `<span class="admin-role-badge role-badge--agency"><i class="fa-solid fa-truck-fast"></i> Local Agency</span>`;
    return "";
}

function getAvatarClass(role) {
    if (role === "WareHouse" || role === "WAREHOUSE") return "admin-avatar--warehouse";
    if (role === "TransitHub" || role === "TRANSIT_HUB") return "admin-avatar--hub";
    if (role === "LocalAgency" || role === "LOCAL_AGENCY") return "admin-avatar--agency";
    return "";
}

function getCardClass(role) {
    if (role === "WareHouse" || role === "WAREHOUSE") return "admin-card--warehouse";
    if (role === "TransitHub" || role === "TRANSIT_HUB") return "admin-card--hub";
    if (role === "LocalAgency" || role === "LOCAL_AGENCY") return "admin-card--agency";
    return "";
}

function navigateTo(navId) {
    document.querySelectorAll(".menu-item").forEach((el) => el.classList.remove("active", "stng-active"));
    document.querySelectorAll(".page-content").forEach((el) => (el.style.display = "none"));
    const navItem = document.getElementById(navId);
    if (navItem) {
        if (navId === "nav-settings") navItem.classList.add("stng-active");
        else navItem.classList.add("active");
    }
    state.currentPage = navId;
    const pageMap = {
        "nav-dashboard": { id: ".dashboard-page", title: "Dashboard", render: renderDashboard },
        "nav-admins": { id: ".admins-page", title: "Admin Management", render: renderAdmins },
        "nav-warehouses": { id: ".warehouses-page", title: "Warehouse Overview", render: renderWarehouses },
        "nav-hubs": { id: ".hubs-page", title: "Transit Hub Overview", render: renderHubs },
        "nav-agencies": { id: ".agencies-page", title: "Local Agency Overview", render: renderAgencies },
        "nav-performances": { id: ".performances-page", title: "Performance Analytics", render: renderPerformances },
        "nav-logs": { id: ".logs-page", title: "System Audit Log", render: renderLogs },
        "nav-config": { id: ".config-page", title: "System Configuration", render: () => {} },
        "nav-settings": { id: ".settings-container", title: "Settings", render: renderSettings },
    };
    const target = pageMap[navId];
    if (target) {
        const el = document.querySelector(target.id);
        if (el) el.style.display = "block";
        const titleEl = document.getElementById("header-title");
        if (titleEl) titleEl.textContent = target.title;
        target.render();
    }
}

function renderDashboard() {
    const welcomeName = document.getElementById("su-welcome-name");
    if (welcomeName) welcomeName.textContent = role_name;
    const dateEl = document.getElementById("su-welcome-date");
    if (dateEl) dateEl.textContent = "— " + new Date().toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" });
    document.getElementById("dash-total-admins").textContent = state.admins.length;
    document.getElementById("dash-warehouses").textContent = state.warehouses.length;
    document.getElementById("dash-hubs").textContent = state.hubs.length;
    document.getElementById("dash-agencies").textContent = state.agencies.length;
    const activeWH = state.warehouses.filter((w) => w.isActive !== false).length;
    document.getElementById("dash-wh-badge").textContent = `${activeWH}/${state.warehouses.length} Active`;
    const activeHubs = state.hubs.filter((h) => h.isActive !== false).length;
    document.getElementById("dash-hub-badge").textContent = `${activeHubs}/${state.hubs.length} Active`;
    const activeAg = state.agencies.filter((a) => a.isActive !== false).length;
    document.getElementById("dash-ag-badge").textContent = `${activeAg}/${state.agencies.length} Active`;
    

    const ctx = document.getElementById("dashboardChart");
    if (ctx) {
        if (dashboardChartObj) dashboardChartObj.destroy();
        dashboardChartObj = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Warehouses", "Transit Hubs", "Local Agencies"],
                datasets: [{ data: [state.warehouses.length, state.hubs.length, state.agencies.length], backgroundColor: ["#14b8a6", "#3b82f6", "#22c55e"], borderWidth: 0 }],
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: "70%", plugins: { legend: { position: "right" } } },
        });
    }

    const tbody = document.getElementById("dash-activity-tbody");
    const recentLogs = state.logs.slice(0, 5);
    if (tbody) {
        tbody.innerHTML = recentLogs.map((log) => `
            <tr>
                <td style="font-weight:600;color:var(--text-dark);">${log.admin}</td>
                <td><span style="font-size:11px;color:var(--text-muted);background:#f1f5f9;padding:3px 8px;border-radius:12px;">${log.module}</span></td>
                <td style="color:var(--text-mid);">${log.action}</td>
                <td style="font-size:12px;color:var(--text-light);"><i class="fa-regular fa-clock" style="margin-right:4px;"></i>${new Date(log.time).toLocaleTimeString()}</td>
            </tr>`).join("");
    }
}

function updateAdminBadge() {
    const badge = document.getElementById("admins-count-badge");
    if (badge) badge.textContent = state.admins.length;
}

function renderAdmins() {
    updateAdminBadge();
    const grid = document.getElementById("admin-cards-grid");
    if (!grid) return;
    let filtered = state.admins.filter((a) => {
        if (state.adminFilterRole !== "all" && a._type !== state.adminFilterRole && a.type !== state.adminFilterRole) return false;
        const status = a.isActive !== false ? "Operational" : "Critical";
        if (state.adminStatusFilter && status !== state.adminStatusFilter) return false;
        if (state.adminSearch) {
            const s = state.adminSearch;
            return (a.name.toLowerCase().includes(s) || a.email.toLowerCase().includes(s) || a.id.toLowerCase().includes(s));
        }
        return true;
    });
    if (state.adminSort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));
    else if (state.adminSort === "role") filtered.sort((a, b) => (a._type || a.type).localeCompare(b._type || b.type));
    else if (state.adminSort === "created") filtered.sort((a, b) => b.id.localeCompare(a.id));
    
    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-light);">No admin accounts found matching your filters.</div>`;
        document.getElementById("admin-pagination").innerHTML = "";
        return;
    }
    grid.innerHTML = filtered.map((admin) => {
        const initials = admin.name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
        const status = admin.isActive !== false ? "Operational" : "Critical";
        const role = admin._type || admin.type;
        return `
        <div class="admin-card ${getCardClass(role)}">
            <div class="admin-card-top">
                <div class="admin-avatar ${getAvatarClass(role)}">${initials}</div>
                <div class="admin-info">
                    <p class="admin-name">${admin.name}</p>
                    <p class="admin-id">${admin.id}</p>
                </div>
            </div>
            ${getRoleBadge(role)}
            <div style="margin-top:14px;">
                <div class="admin-details">
                    <div class="admin-detail-item"><p class="admin-detail-label">EMAIL</p><p class="admin-detail-val" title="${admin.email}">${admin.email}</p></div>
                    <div class="admin-detail-item"><p class="admin-detail-label">PHONE</p><p class="admin-detail-val">${admin.phone}</p></div>
                </div>
                <div class="admin-details" style="border-bottom:none;padding-bottom:0;margin-bottom:14px;">
                    <div class="admin-detail-item"><p class="admin-detail-label">FACILITY LOCATION</p><p class="admin-detail-val" title="${admin.address}">${admin.address}</p></div>
                    <div class="admin-detail-item"><p class="admin-detail-label">STATUS</p><p class="admin-detail-val"><span class="admin-status-badge ${getStatusBadgeClass(status)}">${status}</span></p></div>
                </div>
            </div>
            <div class="admin-card-actions">
                <button class="action-btn view" onclick="viewAdminDetails('${admin.id}')" title="View Details"><i class="fa-solid fa-eye"></i></button>
                <button class="action-btn edit" onclick="openEditAdmin('${admin.id}')" title="Edit Admin"><i class="fa-solid fa-pen"></i></button>
                ${status === "Critical" ? `<button class="action-btn suspend" style="color:var(--green);" onclick="confirmDeactivate('${admin.id}', 'activate')" title="Activate Account"><i class="fa-solid fa-user-check"></i></button>` : `<button class="action-btn suspend" onclick="confirmDeactivate('${admin.id}', 'suspend')" title="Suspend Account"><i class="fa-solid fa-user-slash"></i></button>`}
                <button class="action-btn delete" onclick="confirmDeactivate('${admin.id}', 'delete')" title="Delete Account"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`;
    }).join("");
    document.getElementById("admin-pagination").innerHTML = `<span class="pg-info">Showing ${filtered.length} of ${state.admins.length} admins</span>`;
}

function renderWarehouses() {
    document.getElementById("wh-total").textContent = state.warehouses.length;
    document.getElementById("wh-inventory").textContent = state.warehouses.reduce((acc, w) => acc + (w.inventory || 0), 0).toLocaleString();
    document.getElementById("wh-pending").textContent = state.warehouses.reduce((acc, w) => acc + (w.pending || 0), 0).toLocaleString();
    document.getElementById("wh-rto").textContent = state.warehouses.reduce((acc, w) => acc + (w.rto || 0), 0).toLocaleString();
    
    const whActive = state.warehouses.filter(w => w.isActive !== false).length;
    const whBadge = document.getElementById("wh-active-badge");
    if (whBadge) {
        whBadge.textContent = `${whActive} Active`;
        whBadge.className = `stat-badge ${whActive === state.warehouses.length && whActive > 0 ? 'stat-badge--green' : 'stat-badge--orange'}`;
    }
    const tbody = document.getElementById("wh-tbody");
    if (!tbody) return;
    tbody.innerHTML = state.warehouses.map((wh) => {
        const isCritical = wh.status === "Critical";
        const rowStyle = isCritical ? "background:linear-gradient(90deg,#fff1f2 0,#fff1f2 3px,#fffbfb 3px);border-left:3px solid #ef4444;" : "";
        return `
        <tr style="${rowStyle}">
            <td><strong style="color:var(--text-dark);">${wh.name}</strong><br><span style="font-size:11px;color:var(--text-light); font-family:monospace;">${wh.id}</span>${isCritical ? ' <span style="font-size:10px;background:#ef4444;color:white;padding:1px 5px;border-radius:4px;margin-left:4px;">SUSPENDED</span>' : ""}</td>
            <td>${wh.email}</td>
            <td style="color:var(--text-muted);"><i class="fa-solid fa-location-dot" style="margin-right:4px;color:var(--text-light);font-size:11px;"></i>${wh.city || wh.address || "—"}</td>
            <td style="font-weight:600;color:var(--teal-dark);">${(wh.inventory || 0).toLocaleString()}</td>
            <td><span class="stat-badge stat-badge--orange">${wh.pending || 0}</span></td>
            <td><span class="stat-badge stat-badge--red">${wh.rto || 0}</span></td>
            <td><span class="admin-status-badge ${getStatusBadgeClass(wh.status)}">${wh.status}</span></td>
            <td>
                <div style="display:flex; justify-content:center; gap:8px;">
                    <button class="tbl-action-btn tbl-action--view" onclick="drillDown('Warehouse', '${wh.id}')" title="Manage Warehouse"><i class="fa-solid fa-list-check"></i></button>
                    <button class="tbl-action-btn tbl-action--delete" onclick="cancelAllPending('${wh.id}')" title="Bypass / Cancel Pending Orders"><i class="fa-solid fa-forward-step"></i></button>
                </div>
            </td>
        </tr>`;
    }).join("");
}

function renderHubs() {
    document.getElementById("hub-total").textContent = state.hubs.length;
    document.getElementById("hub-inscanned").textContent = state.hubs.reduce((acc, h) => acc + (h.inScanned || 0), 0).toLocaleString();
    document.getElementById("hub-outscanned").textContent = state.hubs.reduce((acc, h) => acc + (h.outScanned || 0), 0).toLocaleString();
    document.getElementById("hub-flagged").textContent = state.hubs.reduce((acc, h) => acc + (h.flagged || 0), 0).toLocaleString();
    
    const hubActive = state.hubs.filter(h => h.isActive !== false).length;
    const hubBadge = document.getElementById("hub-active-badge");
    if (hubBadge) {
        hubBadge.textContent = `${hubActive} Active`;
        hubBadge.className = `stat-badge ${hubActive === state.hubs.length && hubActive > 0 ? 'stat-badge--green' : 'stat-badge--orange'}`;
    }
    const tbody = document.getElementById("hub-tbody");
    if (!tbody) return;
    tbody.innerHTML = state.hubs.map((hub) => {
        const isCritical = hub.status === "Critical";
        const rowStyle = isCritical ? "background:linear-gradient(90deg,#fff1f2 0,#fff1f2 3px,#fffbfb 3px);border-left:3px solid #ef4444;" : "";
        return `
        <tr style="${rowStyle}">
            <td><strong style="color:var(--text-dark);">${hub.name}</strong><br><span style="font-size:11px;color:var(--text-light); font-family:monospace;">${hub.id}</span>${isCritical ? ' <span style="font-size:10px;background:#ef4444;color:white;padding:1px 5px;border-radius:4px;margin-left:4px;">SUSPENDED</span>' : ""}</td>
            <td>${hub.email}</td>
            <td style="color:var(--text-muted);"><i class="fa-solid fa-location-dot" style="margin-right:4px;color:var(--text-light);font-size:11px;"></i>${hub.city || hub.address || "—"}</td>
            <td style="font-weight:600;color:var(--blue);">${(hub.inScanned || 0).toLocaleString()}</td>
            <td style="font-weight:600;color:var(--green);">${(hub.outScanned || 0).toLocaleString()}</td>
            <td><div class="health-bar-wrap" style="width:100px;"><div class="health-bar"><div class="health-bar-fill hb-blue" style="width:${hub.capacity || 0}%"></div></div><span class="health-pct" style="font-size:10px;">${hub.capacity || 0}%</span></div></td>
            <td><span class="admin-status-badge ${getStatusBadgeClass(hub.status)}">${hub.status}</span></td>
            <td>
                <div style="display:flex; justify-content:center; gap:8px;">
                    <button class="tbl-action-btn tbl-action--view" onclick="drillDown('Hub', '${hub.id}')" title="Manage Hub"><i class="fa-solid fa-list-check"></i></button>
                    <button class="tbl-action-btn tbl-action--delete" onclick="bypassHubOutscan('${hub.id}')" title="Bypass / Out-Scan All"><i class="fa-solid fa-forward-step"></i></button>
                </div>
            </td>
        </tr>`;
    }).join("");
}

function renderAgencies() {
    document.getElementById("ag-total").textContent = state.agencies.length;
    document.getElementById("ag-agents").textContent = state.agencies.reduce((acc, a) => acc + (a.agents || 0), 0).toLocaleString();
    document.getElementById("ag-delivered").textContent = state.agencies.reduce((acc, a) => acc + (a.deliveredToday || 0), 0).toLocaleString();
    document.getElementById("ag-rto").textContent = state.agencies.reduce((acc, a) => acc + (a.rtoRaised || 0), 0).toLocaleString();
    
    const agActive = state.agencies.filter(a => a.isActive !== false).length;
    const agBadge = document.getElementById("ag-active-badge");
    if (agBadge) {
        agBadge.textContent = `${agActive} Active`;
        agBadge.className = `stat-badge ${agActive === state.agencies.length && agActive > 0 ? 'stat-badge--green' : 'stat-badge--orange'}`;
    }
    const tbody = document.getElementById("ag-tbody");
    if (!tbody) return;
    tbody.innerHTML = state.agencies.map((ag) => {
        const isCritical = ag.status === "Critical";
        const rowStyle = isCritical ? "background:linear-gradient(90deg,#fff1f2 0,#fff1f2 3px,#fffbfb 3px);border-left:3px solid #ef4444;" : "";
        return `
        <tr style="${rowStyle}">
            <td><strong style="color:var(--text-dark);">${ag.name}</strong><br><span style="font-size:11px;color:var(--text-light); font-family:monospace;">${ag.id}</span>${isCritical ? ' <span style="font-size:10px;background:#ef4444;color:white;padding:1px 5px;border-radius:4px;margin-left:4px;">SUSPENDED</span>' : ""}</td>
            <td>${ag.email}</td>
            <td style="color:var(--text-muted);"><i class="fa-solid fa-location-dot" style="margin-right:4px;color:var(--text-light);font-size:11px;"></i>${ag.city || ag.address || "—"}</td>
            <td style="font-weight:600;">${ag.agents || 0} <span style="font-size:10px;font-weight:normal;color:var(--text-light);">agents</span></td>
            <td style="font-weight:600;color:var(--green);">${(ag.deliveredToday || 0).toLocaleString()}</td>
            <td><span class="stat-badge stat-badge--red">${ag.rtoRaised || 0}</span></td>
            <td><span class="admin-status-badge ${getStatusBadgeClass(ag.status)}">${ag.status}</span></td>
            <td>
                <div style="display:flex; justify-content:center; gap:8px;">
                    <button class="tbl-action-btn tbl-action--view" onclick="drillDown('Agency', '${ag.id}')" title="Manage Agency"><i class="fa-solid fa-list-check"></i></button>
                </div>
            </td>
        </tr>`;
    }).join("");
}

function renderLogs() {
    const tbody = document.getElementById("log-tbody");
    if (!tbody) return;
    const searchTerm = document.getElementById("log-search")?.value.toLowerCase() || "";
    const moduleF = document.getElementById("log-module-filter")?.value || "";
    const filtered = state.logs.filter((l) => {
        if (searchTerm && !l.admin.toLowerCase().includes(searchTerm) && !l.details.toLowerCase().includes(searchTerm) && !l.action.toLowerCase().includes(searchTerm)) return false;
        if (moduleF && !l.module.includes(moduleF)) return false;
        return true;
    });
    document.getElementById("log-count-label").textContent = `Showing ${filtered.length} events`;
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-msg">No logs found.</td></tr>`;
        return;
    }
    tbody.innerHTML = filtered.map((log) => `
        <tr>
            <td style="color:var(--text-light);font-size:12px;"><i class="fa-regular fa-clock" style="margin-right:4px;"></i>${new Date(log.time).toLocaleString()}</td>
            <td style="font-weight:600;color:var(--text-dark);">${log.admin}</td>
            <td><span style="font-size:11px;color:var(--text-muted);background:#f1f5f9;padding:3px 8px;border-radius:12px;">${log.module}</span></td>
            <td style="color:var(--text-mid);font-weight:500;">${log.action}</td>
            <td style="color:var(--text-muted);font-size:12px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${log.details}">${log.details}</td>
        </tr>`).join("");
}

function renderSettings() {
    document.getElementById("su-settings-name").textContent = role_name;
    document.getElementById("su-settings-email").textContent = email;
    document.getElementById("su-settings-phone").textContent = phone;
    const initial = role_name.charAt(0).toUpperCase();
    const av = document.getElementById("su-settings-avatar");
    if (av) av.textContent = initial;
}

function renderPerformances() {
    renderPerfChart("WH");
}

function _populatePerfDropdown(id, items, nameField) {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = items.map((it, idx) => `<option value="${idx}">${it[nameField]}</option>`).join("");
}

function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("active");
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove("active");
}

function confirmDeactivate(adminId, action) {
    pendingActionData = { id: adminId, action: action };
    const admin = state.admins.find((a) => a.id === adminId);
    if (!admin) return;
    const titleEl = document.getElementById("confirm-modal-title");
    const msgEl = document.getElementById("confirm-modal-msg");
    const btn = document.getElementById("proceed-confirm-modal");
    if (action === "suspend") {
        titleEl.textContent = "Suspend Admin Account";
        msgEl.innerHTML = `Are you sure you want to suspend the account for <strong>${admin.name}</strong>? They will immediately lose access to the system.`;
        btn.textContent = "Suspend Account";
        btn.className = "modal-save modal-save--danger";
    } else if (action === "activate") {
        titleEl.textContent = "Reactivate Admin Account";
        msgEl.innerHTML = `Are you sure you want to reactivate the account for <strong>${admin.name}</strong>?`;
        btn.textContent = "Reactivate";
        btn.className = "modal-save";
    } else if (action === "delete") {
        titleEl.textContent = "Delete Admin Account";
        msgEl.innerHTML = `<strong>WARNING:</strong> You are about to permanently delete the account for <strong>${admin.name}</strong>. This action cannot be undone.`;
        btn.textContent = "Delete Forever";
        btn.className = "modal-save modal-save--danger";
    }
    btn.onclick = executeConfirmAction;
    openModal("confirm-modal");
}

async function executeConfirmAction() {
    if (!pendingActionData) return;
    const { id, action } = pendingActionData;
    const admin = state.admins.find((a) => a.id === id);
    if (!admin) return;

    let successMsg = "";
    let logAction = "";

    try {
        if (action === "delete") {
            await suApi(`/su/admins/${id}`, "DELETE");
            successMsg = "✓ Admin account deleted permanently.";
            logAction = "Account Deleted";
        } else if (action === "suspend") {
            await suApi(`/su/admins/${id}/status`, "PUT", { active: false });
            successMsg = "✓ Admin account suspended.";
            logAction = "Account Suspended";
        } else if (action === "activate") {
            await suApi(`/su/admins/${id}/status`, "PUT", { active: true });
            successMsg = "✓ Admin account reactivated.";
            logAction = "Account Reactivated";
        }

        showToast(successMsg);
        await logAuditAction("SYSTEM", "Admin Management", logAction, `Admin ID ${id} (${admin.name}) was modified by Super User`);
        
        closeModal("confirm-modal");
        await loadAllData();
        renderAdmins();
        renderWarehouses();
        renderHubs();
        renderAgencies();
        renderDashboard();
    } catch (e) {
        showToast("⚠ Failed to complete action on backend.", true);
    }
}

function viewAdminDetails(id) {
    const admin = state.admins.find((a) => a.id === id);
    if (!admin) return;
    const role = admin._type || admin.type;
    const status = admin.isActive !== false ? "Operational" : "Critical";
    const initials = admin.name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
    const body = document.getElementById("view-admin-body");
    body.innerHTML = `
        <div class="admin-card-top" style="margin-bottom:24px;">
            <div class="admin-avatar ${getAvatarClass(role)}" style="width:64px;height:64px;font-size:20px;">${initials}</div>
            <div class="admin-info">
                <p class="admin-name" style="font-size:18px;">${admin.name}</p>
                <p class="admin-id" style="font-size:13px;margin-bottom:6px;">${admin.id}</p>
                ${getRoleBadge(role)}
                <span class="admin-status-badge ${getStatusBadgeClass(status)}" style="margin-left:8px;">${status}</span>
            </div>
        </div>
        <h4 style="margin:0 0 12px;font-size:12px;color:var(--text-light);text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #f1f5f9;padding-bottom:8px;">Contact & Location</h4>
        <div class="view-detail-row">
            <div class="view-detail-item"><p class="view-detail-label">EMAIL ADDRESS</p><p class="view-detail-val">${admin.email}</p></div>
            <div class="view-detail-item"><p class="view-detail-label">PHONE NUMBER</p><p class="view-detail-val">${admin.phone || "—"}</p></div>
        </div>
        <div class="view-detail-row">
            <div class="view-detail-item"><p class="view-detail-label">ADDRESS</p><p class="view-detail-val">${admin.address || "—"}</p></div>
        </div>
    `;
    const title = document.getElementById("view-admin-title");
    if (title) title.textContent = "Admin Details";
    const editBtn = document.getElementById("edit-from-view-btn");
    if (editBtn) {
        editBtn.style.display = "inline-flex";
        editBtn.onclick = () => { closeModal("view-admin-modal"); openEditAdmin(id); };
    }
    openModal("view-admin-modal");
}

function openAddAdminModal() {
    editAdminId = null;
    document.getElementById("admin-role-select").disabled = false;
    document.getElementById("admin-name-input").value = "";
    document.getElementById("admin-email-input").value = "";
    document.getElementById("admin-phone-input").value = "";
    document.getElementById("admin-facility-input").value = "";
    document.getElementById("admin-city-input").value = "";
    ["name", "email", "phone", "facility", "city"].forEach(f => {
        const err = document.getElementById(`err-admin-${f}`);
        if(err) err.style.display = "none";
    });
    document.getElementById("admin-modal-title").textContent = "Add New Admin";
    document.getElementById("save-add-admin-modal").innerHTML = `<i class="fa-solid fa-user-plus"></i> Create Admin`;
    openModal("add-admin-modal");
}

window.cancelAllPending = async function(id) {
    if (!confirm("Are you sure you want to cancel ALL pending shipments for this warehouse? This cannot be undone.")) return;
    try {
        await suApi(`/su/warehouses/${id}/pending`, "DELETE");
        showToast("✓ All pending shipments cancelled.");
        await logAuditAction("SYSTEM", "Warehouse Ops", "Cancelled All Pending", `Cancelled all pending requests for Warehouse ${id}`);
        

        drillDown("Warehouse", id);
        

        loadAllData().then(() => {
            renderWarehouses();
            renderDashboard();
        });
    } catch (e) {
        showToast("⚠ Failed to cancel pending shipments.", true);
    }
};

window.cancelSinglePending = async function(whId, orderId) {
    if (!confirm(`Are you sure you want to cancel pending order ${orderId}?`)) return;
    try {
        await suApi(`/su/warehouses/${whId}/pending/${orderId}`, "DELETE");
        showToast(`✓ Order ${orderId} cancelled.`);
        await logAuditAction("SYSTEM", "Warehouse Ops", "Cancelled Pending Order", `Cancelled pending order ${orderId} for Warehouse ${whId}`);
        

        drillDown("Warehouse", whId);
        

        loadAllData().then(() => {
            renderWarehouses();
            renderDashboard();
        });
    } catch (e) {
        showToast("⚠ Failed to cancel pending shipment.", true);
    }
};

window.bypassHubOutscan = async function(hubId) {
    if (!confirm(`Are you sure you want to bypass and Out-Scan all currently In-Scanned shipments at Hub ${hubId}?`)) return;
    try {
        await suApi(`/su/hubs/${hubId}/outscan-all`, "PUT");
        showToast(`✓ All in-scanned shipments for Hub ${hubId} have been successfully out-scanned.`);
        await logAuditAction("SYSTEM", "Hub Ops", "Bypass Out-Scan", `Triggered global out-scan for all pending items at Hub ${hubId}`);
        

        loadAllData().then(() => {
            renderHubs();
            renderDashboard();
        });
    } catch (e) {
        showToast("⚠ Failed to execute hub bypass out-scan.", true);
    }
};

window.changeAgentStatus = async function(agencyId, agentId, newStatus) {
    try {
        await suApi(`/su/agencies/${agencyId}/agents/${agentId}/status`, "PUT", { status: newStatus });
        showToast(`✓ Agent status updated to ${newStatus}`);
        await logAuditAction("SYSTEM", "Agency Ops", "Agent Status Updated", `Changed agent ${agentId} status to ${newStatus}`);
        

        drillDown("Agency", agencyId);
        

        loadAllData().then(() => {
            renderAgencies();
            renderDashboard();
        });
    } catch (e) {
        showToast("⚠ Failed to update agent status.", true);
    }
};

window.openFacilityModal = function(type) {
    openAddAdminModal();
    const sel = document.getElementById("admin-role-select");
    sel.value = type;
    sel.disabled = true;
    let typeName = type === "WareHouse" ? "Warehouse" : type === "TransitHub" ? "Transit Hub" : "Local Agency";
    document.getElementById("admin-modal-title").textContent = `Add New ${typeName}`;
    document.getElementById("save-add-admin-modal").innerHTML = `<i class="fa-solid fa-plus"></i> Create ${typeName}`;
}

function openEditAdmin(id) {
    const admin = state.admins.find((a) => a.id === id);
    if (!admin) return;
    editAdminId = id;
    const role = admin._type || admin.type;
    const sel = document.getElementById("admin-role-select");
    sel.value = role;
    sel.disabled = true;
    document.getElementById("admin-name-input").value = admin.name;
    document.getElementById("admin-email-input").value = admin.email;
    document.getElementById("admin-phone-input").value = admin.phone || "";
    document.getElementById("admin-facility-input").value = admin.facility || admin.name || "";
    document.getElementById("admin-city-input").value = admin.address || admin.city || "";
    ["name", "email", "phone", "facility", "city"].forEach(f => {
        const err = document.getElementById(`err-admin-${f}`);
        if(err) err.style.display = "none";
    });
    document.getElementById("admin-modal-title").textContent = "Edit Facility / Admin";
    document.getElementById("save-add-admin-modal").innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Update`;
    openModal("add-admin-modal");
}

async function handleAddAdmin() {
    const roleSel = document.getElementById("admin-role-select");
    const roleOpt = roleSel.value;
    const name = document.getElementById("admin-name-input").value.trim();
    const emailV = document.getElementById("admin-email-input").value.trim();
    const facility = document.getElementById("admin-facility-input").value.trim();
    const phoneV = document.getElementById("admin-phone-input").value.trim();
    const city = document.getElementById("admin-city-input").value.trim();

    ["name", "email", "phone", "facility", "city"].forEach(f => {
        const err = document.getElementById(`err-admin-${f}`);
        if(err) err.style.display = "none";
    });

    let isValid = true;
    if (!name || !/^[A-Za-z\s]+$/.test(name)) {
        const err = document.getElementById("err-admin-name");
        err.textContent = "Name must contain only letters and spaces.";
        err.style.display = "block"; isValid = false;
    }
    if (!emailV || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailV)) {
        const err = document.getElementById("err-admin-email");
        err.textContent = "Please enter a valid email address.";
        err.style.display = "block"; isValid = false;
    }
    if (phoneV && !/^(\+91[\s-]?)?\d{10}$/.test(phoneV)) {
        const err = document.getElementById("err-admin-phone");
        err.textContent = "Phone must be exactly 10 digits (optional +91).";
        err.style.display = "block"; isValid = false;
    }
    if (!facility) {
        const err = document.getElementById("err-admin-facility");
        err.textContent = "Facility/Location cannot be empty.";
        err.style.display = "block"; isValid = false;
    }
    if (!city) {
        const err = document.getElementById("err-admin-city");
        err.textContent = "City cannot be empty.";
        err.style.display = "block"; isValid = false;
    }

    if (!isValid) return;

    const payload = { role: roleOpt, name, email: emailV, phone: phoneV, facility, city };

    try {
        if (editAdminId) {
            await suApi(`/su/admins/${editAdminId}`, "PUT", payload);
            showToast(`✓ Updated successfully.`);
            await logAuditAction("SYSTEM", "Admin Management", "Updated Facility/Admin", `Updated ${roleOpt}: ${name}`);
            editAdminId = null;
        } else {
            await suApi("/su/admins", "POST", payload);
            showToast(`✓ Created successfully.`);
            await logAuditAction("SYSTEM", "Admin Management", "Created Facility/Admin", `Created ${roleOpt}: ${name}`);
        }
        roleSel.disabled = false;
        closeModal("add-admin-modal");
        await loadAllData();
        renderAdmins();
        renderWarehouses();
        renderHubs();
        renderAgencies();
        renderDashboard();
    } catch (e) {
        showToast("⚠ Failed to save data.", true);
    }
}

function openEditProfileModal() {
    document.getElementById("edit-name").value = role_name;
    document.getElementById("edit-email").value = email;
    document.getElementById("edit-phone").value = phone;
    document.getElementById("modal-display-name").textContent = role_name;
    const initial = role_name.charAt(0).toUpperCase();
    const modalAv = document.getElementById("modal-su-avatar");
    if (modalAv) modalAv.textContent = initial;
    openModal("edit-modal");
}

function handleEditProfileSave() {
    const n = document.getElementById("edit-name").value.trim();
    const em = document.getElementById("edit-email").value.trim();
    const ph = document.getElementById("edit-phone").value.trim();
    if (em && (!em.includes("@") || !em.includes("."))) { showToast("⚠ Invalid email format.", true); return; }
    if (ph && !/^(\+91[\s-]?)?\d{10}$/.test(ph)) { showToast("⚠ Phone must be exactly 10 digits.", true); return; }
    if (n) role_name = n;
    if (em) email = em;
    if (ph) phone = ph;
    initHeader();
    renderSettings();
    closeModal("edit-modal");
    showToast("✓ Super User profile updated.");
}

function handlePasswordSave() {
    const cur = document.getElementById("pwd-current").value;
    const nw = document.getElementById("pwd-new").value;
    const cnf = document.getElementById("pwd-confirm").value;
    if (!cur || !nw || !cnf) { showToast("⚠ Please fill all password fields.", true); return; }
    if (nw.length < 6) { showToast("⚠ New password must be at least 6 characters.", true); return; }
    if (nw !== cnf) { showToast("⚠ New passwords do not match.", true); return; }
    document.getElementById("pwd-current").value = "";
    document.getElementById("pwd-new").value = "";
    document.getElementById("pwd-confirm").value = "";
    closeModal("pwd-modal");
    showToast("✓ Password changed successfully.");
    logAuditAction("Super User", "Settings", "Password Changed", "Super User changed their login password");
}


const FACILITY_PERMISSIONS = {
    WareHouse: [
        { key: "canDispatch",      icon: "fa-truck-ramp-box",   color: "#14b8a6", bg: "#f0fdfa", name: "Dispatch Shipments",      desc: "Allow dispatching outbound packages to hubs" },
        { key: "canAddStock",      icon: "fa-boxes-stacked",    color: "#3b82f6", bg: "#eff6ff", name: "Add/Remove Stock",         desc: "Allow modifying warehouse inventory levels" },
        { key: "canViewReports",   icon: "fa-chart-bar",        color: "#8b5cf6", bg: "#f5f3ff", name: "View Performance Reports", desc: "Access to analytics and performance data" },
        { key: "canApproveRTO",    icon: "fa-rotate-left",      color: "#ef4444", bg: "#fff1f2", name: "Approve RTO Restocks",     desc: "Accept returned packages into inventory" },
        { key: "canManageAgents",  icon: "fa-user-gear",        color: "#f59e0b", bg: "#fffbeb", name: "Manage Staff Accounts",    desc: "Add or remove warehouse staff members" },
    ],
    TransitHub: [
        { key: "canScanIn",        icon: "fa-arrow-down-to-bracket", color: "#3b82f6", bg: "#eff6ff", name: "In-Scan Packages",       desc: "Log incoming packages at this hub" },
        { key: "canScanOut",       icon: "fa-arrow-up-right-from-square", color: "#22c55e", bg: "#f0fdf4", name: "Out-Scan Packages",  desc: "Log outgoing packages from this hub" },
        { key: "canFlagPackages",  icon: "fa-triangle-exclamation", color: "#ef4444", bg: "#fff1f2", name: "Flag Suspicious Items",   desc: "Mark packages for inspection or hold" },
        { key: "canViewAllRoutes", icon: "fa-route",            color: "#8b5cf6", bg: "#f5f3ff", name: "View All Route Data",      desc: "Access cross-hub routing and logistics info" },
        { key: "canModifyScans",   icon: "fa-pen-to-square",   color: "#f59e0b", bg: "#fffbeb", name: "Modify Scan Records",       desc: "Edit or correct erroneous scan entries" },
    ],
    LocalAgency: [
        { key: "canAssignAgents",  icon: "fa-user-plus",        color: "#22c55e", bg: "#f0fdf4", name: "Assign Delivery Agents",   desc: "Assign agents to delivery tasks" },
        { key: "canInitiateRTO",   icon: "fa-rotate-left",      color: "#ef4444", bg: "#fff1f2", name: "Initiate RTO Requests",    desc: "Raise RTO for failed deliveries" },
        { key: "canViewCustomer",  icon: "fa-address-book",     color: "#3b82f6", bg: "#eff6ff", name: "Access Customer Data",     desc: "View customer contact and address info" },
        { key: "canUpdateStatus",  icon: "fa-clipboard-check",  color: "#14b8a6", bg: "#f0fdfa", name: "Update Delivery Status",   desc: "Mark deliveries as delivered or failed" },
        { key: "canViewFinancials",icon: "fa-indian-rupee-sign",color: "#8b5cf6", bg: "#f5f3ff", name: "View Financial Summary",   desc: "Access COD and payment settlement data" },
    ],
};

const DEPT_ACCESS = {
    WareHouse:   ["Inventory Mgmt", "Shipment Ops", "Returns Dept", "Quality Control", "Reporting"],
    TransitHub:  ["Inbound Ops", "Outbound Ops", "Route Planning", "Exception Mgmt", "Analytics"],
    LocalAgency: ["Delivery Ops", "Agent Mgmt", "Customer Care", "RTO Processing", "Finance"],
};

let _facAccessId = null;
let _facAccessType = null;

window.openFacilityAccessModal = function(id, type) {
    _facAccessId = id;
    _facAccessType = type;
    const facility = state.admins.find(a => a.id === id)
        || state.warehouses.find(w => w.id === id)
        || state.hubs.find(h => h.id === id)
        || state.agencies.find(a => a.id === id);
    if (!facility) return;

    const saved = JSON.parse(localStorage.getItem(`fac_access_${id}`) || "{}");


    const iconMap = { WareHouse: "fa-warehouse", TransitHub: "fa-building", LocalAgency: "fa-truck-fast" };
    const colorMap = { WareHouse: "#14b8a6", TransitHub: "#3b82f6", LocalAgency: "#f59e0b" };
    const typeLabel = { WareHouse: "Warehouse", TransitHub: "Transit Hub", LocalAgency: "Local Agency" };
    document.getElementById("fac-icon-circle").innerHTML = `<i class="fa-solid ${iconMap[type]}" style="color:${colorMap[type]};"></i>`;
    document.getElementById("fac-modal-title").textContent = `${facility.name} — Access Control`;
    document.getElementById("fac-modal-subtitle").textContent = `${typeLabel[type]} · ${id}`;


    const isActive = saved.isActive !== false;
    document.getElementById("fac-status-toggle").checked = isActive;


    const perms = FACILITY_PERMISSIONS[type] || [];
    const savedPerms = saved.permissions || {};
    const permGrid = document.getElementById("fac-permissions-grid");
    permGrid.innerHTML = perms.map(p => {
        const isOn = savedPerms[p.key] !== false;
        return `
        <div class="fac-perm-row">
            <div class="fac-perm-left">
                <div class="fac-perm-icon" style="background:${p.bg};color:${p.color};">
                    <i class="fa-solid ${p.icon}"></i>
                </div>
                <div>
                    <p class="fac-perm-name">${p.name}</p>
                    <p class="fac-perm-desc">${p.desc}</p>
                </div>
            </div>
            <label class="ac-toggle-wrap">
                <input type="checkbox" data-perm="${p.key}" ${isOn ? "checked" : ""}>
                <span class="ac-slider"></span>
            </label>
        </div>`;
    }).join("");


    const depts = DEPT_ACCESS[type] || [];
    const savedDepts = saved.departments || depts;
    const deptGrid = document.getElementById("fac-dept-grid");
    deptGrid.innerHTML = depts.map(d => {
        const isSelected = savedDepts.includes(d);
        return `
        <div class="fac-dept-card ${isSelected ? "selected" : ""}" onclick="this.classList.toggle('selected');this.querySelector('.fac-dept-check').innerHTML=this.classList.contains('selected')?'<i class=\\'fa-solid fa-check\\'></i>':'';" style="user-select:none;">
            <div class="fac-dept-check">${isSelected ? '<i class="fa-solid fa-check"></i>' : ""}</div>
            <span class="fac-dept-label">${d}</span>
        </div>`;
    }).join("");

    openModal("facility-access-modal");
};

window.saveFacilityAccess = async function() {
    if (!_facAccessId || !_facAccessType) return;

    const isActive = document.getElementById("fac-status-toggle").checked;
    const newStatus = isActive ? "Operational" : "Critical";

    const permissions = {};
    document.querySelectorAll("#fac-permissions-grid [data-perm]").forEach(cb => {
        permissions[cb.dataset.perm] = cb.checked;
    });

    const departments = [];
    document.querySelectorAll("#fac-dept-grid .fac-dept-card.selected .fac-dept-label").forEach(el => {
        departments.push(el.textContent);
    });


    const patchArr = (arr) => arr.forEach(item => {
        if (item.id === _facAccessId) {
            item.isActive = isActive;
            item.status = newStatus;
        }
    });
    patchArr(state.warehouses);
    patchArr(state.hubs);
    patchArr(state.agencies);
    patchArr(state.admins);


    const facName = (state.admins.find(a => a.id === _facAccessId)
        || state.warehouses.find(w => w.id === _facAccessId)
        || state.hubs.find(h => h.id === _facAccessId)
        || state.agencies.find(a => a.id === _facAccessId))?.name || _facAccessId;

    localStorage.setItem(`fac_access_${_facAccessId}`, JSON.stringify({
        isActive, permissions, departments, updatedAt: new Date().toISOString()
    }));


    closeModal("facility-access-modal");
    renderWarehouses();
    renderHubs();
    renderAgencies();
    renderAdmins();
    renderDashboard();


    suApi(`/su/admins/${_facAccessId}/status`, "PUT", { active: isActive }).catch(() => {});


    const module = _facAccessType === "WareHouse" ? "Warehouse" : _facAccessType === "TransitHub" ? "Transit Hub" : "Local Agency";
    const permCount = Object.values(permissions).filter(Boolean).length;
    await logAuditAction("Super User", module, "Access Control Updated",
        `${facName}: ${permCount} permissions enabled, Depts: [${departments.join(", ") || "None"}], Status set to ${newStatus}`);

    showToast(`✓ Access control for "${facName}" applied — status now ${newStatus}.`);
};
