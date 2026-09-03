"use strict";

const API_BASE = "http://127.0.0.1:8000";

function getSession() {
    return JSON.parse(localStorage.getItem("su_session") || "null");
}

function requireAuth() {
    if (!getSession()?.token) {
        window.location.href = "su_login.html";
        return false;
    }
    return true;
}

function doLogout() {
    localStorage.removeItem("su_session");
    window.location.href = "su_login.html";
}

let allNodes = [];
let allEscalations = [];
let allPartners = [];
let perfData = { warehouses: [], hubs: [], agencies: [] };
const charts = {};

document.addEventListener("DOMContentLoaded", () => {
    if (!requireAuth()) return;
    const session = getSession();
    const nameEl = document.getElementById("su-user-name");
    if (nameEl && session?.user?.name) nameEl.textContent = session.user.name;
    showSection("nodes");
});

function showSection(name) {
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".menu-item").forEach(m => m.classList.remove("active"));
    document.getElementById(`section-${name}`).classList.add("active");
    document.getElementById(`nav-${name}`).classList.add("active");
    const titles = { nodes: "Nodes", analytics: "Node Analytics", escalations: "Escalations", partners: "Third Party" };
    document.getElementById("header-title").textContent = titles[name] || "";
    if (name === "nodes") loadNodes();
    if (name === "analytics") loadNodePerformance();
    if (name === "escalations") loadEscalations();
    if (name === "partners") loadPartners();
}

async function apiFetch(path) {
    const token = getSession()?.token || "";
    const res = await fetch(`${API_BASE}${path}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        credentials: "include"
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.message || `Request failed (${res.status})`);
    return d;
}

async function loadNodes() {
    document.getElementById("su-nodes-body").innerHTML =
        '<tr><td colspan="6" class="empty-msg"><i class="fa-solid fa-spinner fa-spin"></i> Loading…</td></tr>';
    try {
        allNodes = await apiFetch("/superuser/nodes");
        updateNodeStats();
        renderNodes(allNodes);
    } catch (e) {
        document.getElementById("su-nodes-body").innerHTML =
            `<tr><td colspan="6" class="empty-msg"><i class="fa-solid fa-triangle-exclamation" style="color:#ef4444"></i> ${e.message}</td></tr>`;
    }
}

function updateNodeStats() {
    document.getElementById("su-stat-wh").textContent = allNodes.filter(n => n.type === "WAREHOUSE").length;
    document.getElementById("su-stat-hub").textContent = allNodes.filter(n => n.type === "TRANSIT_HUB").length;
    document.getElementById("su-stat-ag").textContent = allNodes.filter(n => n.type === "LOCAL_AGENCY").length;
    document.getElementById("su-stat-valid").textContent = allNodes.filter(n => n.isSubscriptionValid).length;
    document.getElementById("su-stat-expired").textContent = allNodes.filter(n => !n.isSubscriptionValid).length;
}

function filterNodes() {
    const q = document.getElementById("su-node-search").value.toLowerCase();
    const type = document.getElementById("su-node-type").value;
    const status = document.getElementById("su-node-status").value;
    const filtered = allNodes.filter(n => {
        const matchQ = !q || n.name.toLowerCase().includes(q) || (n.city || "").toLowerCase().includes(q);
        const matchT = !type || n.type === type;
        const matchS = !status || (status === "valid" ? n.isSubscriptionValid : !n.isSubscriptionValid);
        return matchQ && matchT && matchS;
    });
    renderNodes(filtered);
}

function renderNodes(nodes) {
    const tbody = document.getElementById("su-nodes-body");
    if (!nodes.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No nodes found.</td></tr>';
        return;
    }
    const typeLabel = { WAREHOUSE: "Warehouse", TRANSIT_HUB: "Transit Hub", LOCAL_AGENCY: "Local Agency" };
    const typeCls = { WAREHOUSE: "type--warehouse", TRANSIT_HUB: "type--hub", LOCAL_AGENCY: "type--agency" };
    tbody.innerHTML = nodes.map(n => {
        const subBadge = n.isSubscriptionValid
            ? '<span class="sub-status sub-active"><i class="fa-solid fa-circle-check"></i> Valid</span>'
            : '<span class="sub-status sub-expired"><i class="fa-solid fa-circle-xmark"></i> Expired</span>';
        const activeBadge = n.isActive !== false
            ? '<span class="sub-status sub-active"><i class="fa-solid fa-circle-check"></i> Active</span>'
            : '<span class="sub-status sub-expired"><i class="fa-solid fa-ban"></i> Inactive</span>';
        const endDate = n.subscriptionEndDate
            ? new Date(n.subscriptionEndDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
            : "—";
        return `<tr>
            <td><strong>${n.name}</strong><br><span style="font-size:11px;color:var(--text-light)">${n.id}</span></td>
            <td><span class="type-badge ${typeCls[n.type] || ""}">${typeLabel[n.type] || n.type}</span></td>
            <td>${n.city || "—"}</td>
            <td>${activeBadge}</td>
            <td>${subBadge}</td>
            <td style="font-size:13px">${endDate}</td>
        </tr>`;
    }).join("");
}

async function loadNodePerformance() {
    try {
        perfData = await apiFetch("/superuser/node-performance");
        populatePerfDropdown("su-perf-select-wh", perfData.warehouses);
        populatePerfDropdown("su-perf-select-hub", perfData.hubs);
        populatePerfDropdown("su-perf-select-ag", perfData.agencies);
        const activeTab = document.querySelector(".perf-tab.active-tab")?.dataset?.target || "WH";
        renderPerfChart(activeTab, 0);
    } catch (e) {
        ["WH", "HUB", "AG"].forEach(t => {
            const el = document.getElementById(`su-perf-cards-${t}`);
            if (el) el.innerHTML = `<p style="color:#ef4444">${e.message}</p>`;
        });
    }
}

function populatePerfDropdown(id, items) {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = items.map((it, i) => `<option value="${i}">${it.name}</option>`).join("");
}

function switchPerfTab(type) {
    document.querySelectorAll(".perf-tab").forEach(t => {
        const isActive = t.dataset.target === type;
        t.style.background = isActive ? "white" : "transparent";
        t.style.color = isActive ? "#0f172a" : "#64748b";
        t.style.boxShadow = isActive ? "0 1px 3px rgba(0,0,0,0.1)" : "none";
        if (isActive) t.classList.add("active-tab"); else t.classList.remove("active-tab");
    });
    ["WH", "HUB", "AG"].forEach(t => {
        const p = document.getElementById(`su-perf-panel-${t}`);
        if (p) p.style.display = t === type ? "block" : "none";
    });
    renderPerfChart(type, 0);
}

function renderPerfChart(type, idx) {
    let entity, labels, dataset, label, color, metricCards;

    if (type === "WH") {
        entity = perfData.warehouses[idx];
        if (!entity) return;
        labels = ["Inventory", "Pending Orders", "RTO"];
        dataset = [entity.inventory, entity.pending, entity.rto];
        label = "Count"; color = "#14b8a6";
        metricCards = `<div style="display:flex;gap:12px;margin-bottom:20px">
            <div style="flex:1;background:#f0fdfa;border:1px solid #99f6e4;padding:14px;border-radius:10px;text-align:center"><div style="font-size:11px;color:#14b8a6;font-weight:700">INVENTORY</div><div style="font-size:28px;font-weight:800;color:#0f172a">${(entity.inventory || 0).toLocaleString()}</div></div>
            <div style="flex:1;background:#fffbeb;border:1px solid #fde68a;padding:14px;border-radius:10px;text-align:center"><div style="font-size:11px;color:#f59e0b;font-weight:700">PENDING ORDERS</div><div style="font-size:28px;font-weight:800;color:#0f172a">${(entity.pending || 0).toLocaleString()}</div></div>
            <div style="flex:1;background:#fff1f2;border:1px solid #fecdd3;padding:14px;border-radius:10px;text-align:center"><div style="font-size:11px;color:#ef4444;font-weight:700">RTO</div><div style="font-size:28px;font-weight:800;color:#0f172a">${entity.rto || 0}</div></div>
        </div>`;
    } else if (type === "HUB") {
        entity = perfData.hubs[idx];
        if (!entity) return;
        labels = ["In-Scanned", "Out-Scanned", "Capacity%"];
        dataset = [entity.inScanned, entity.outScanned, entity.capacity];
        label = "Packages"; color = "#3b82f6";
        metricCards = `<div style="display:flex;gap:12px;margin-bottom:20px">
            <div style="flex:1;background:#eff6ff;border:1px solid #bfdbfe;padding:14px;border-radius:10px;text-align:center"><div style="font-size:11px;color:#3b82f6;font-weight:700">IN-SCANNED</div><div style="font-size:28px;font-weight:800;color:#0f172a">${(entity.inScanned || 0).toLocaleString()}</div></div>
            <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;padding:14px;border-radius:10px;text-align:center"><div style="font-size:11px;color:#22c55e;font-weight:700">OUT-SCANNED</div><div style="font-size:28px;font-weight:800;color:#0f172a">${(entity.outScanned || 0).toLocaleString()}</div></div>
            <div style="flex:1;background:#f8fafc;border:1px solid #e2e8f0;padding:14px;border-radius:10px;text-align:center"><div style="font-size:11px;color:#64748b;font-weight:700">CAPACITY</div><div style="font-size:28px;font-weight:800;color:#0f172a">${entity.capacity || 0}%</div></div>
        </div>`;
    } else {
        entity = perfData.agencies[idx];
        if (!entity) return;
        labels = ["Delivered Today", "RTO Raised", "Active Agents"];
        dataset = [entity.deliveredToday, entity.rtoRaised, entity.agents];
        label = "Count"; color = "#22c55e";
        metricCards = `<div style="display:flex;gap:12px;margin-bottom:20px">
            <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;padding:14px;border-radius:10px;text-align:center"><div style="font-size:11px;color:#22c55e;font-weight:700">DELIVERED TODAY</div><div style="font-size:28px;font-weight:800;color:#0f172a">${(entity.deliveredToday || 0).toLocaleString()}</div></div>
            <div style="flex:1;background:#fff1f2;border:1px solid #fecdd3;padding:14px;border-radius:10px;text-align:center"><div style="font-size:11px;color:#ef4444;font-weight:700">RTO RAISED</div><div style="font-size:28px;font-weight:800;color:#0f172a">${entity.rtoRaised || 0}</div></div>
            <div style="flex:1;background:#eff6ff;border:1px solid #bfdbfe;padding:14px;border-radius:10px;text-align:center"><div style="font-size:11px;color:#3b82f6;font-weight:700">ACTIVE AGENTS</div><div style="font-size:28px;font-weight:800;color:#0f172a">${entity.agents || 0}</div></div>
        </div>`;
    }

    document.getElementById(`su-perf-cards-${type}`).innerHTML = metricCards;

    const canvasId = `su-perfChart-${type}`;
    if (charts[canvasId]) { charts[canvasId].destroy(); }
    const ctx = document.getElementById(canvasId).getContext("2d");
    charts[canvasId] = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label,
                data: dataset,
                backgroundColor: color + "33",
                borderColor: color,
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: "#f1f5f9" }, ticks: { font: { family: "Poppins", size: 12 } } },
                x: { grid: { display: false }, ticks: { font: { family: "Poppins", size: 12 } } }
            }
        }
    });
}

async function loadEscalations() {
    document.getElementById("su-esc-body").innerHTML =
        '<tr><td colspan="4" class="empty-msg"><i class="fa-solid fa-spinner fa-spin"></i> Loading…</td></tr>';
    try {
        allEscalations = await apiFetch("/superuser/escalations");
        updateEscStats();
        renderEscalations(allEscalations);
    } catch (e) {
        document.getElementById("su-esc-body").innerHTML =
            `<tr><td colspan="4" class="empty-msg"><i class="fa-solid fa-triangle-exclamation" style="color:#ef4444"></i> ${e.message}</td></tr>`;
    }
}

function updateEscStats() {
    document.getElementById("su-stat-esc-total").textContent = allEscalations.length;
    document.getElementById("su-stat-esc-pending").textContent = allEscalations.filter(t => t.escalationStatus === "Pending").length;
    document.getElementById("su-stat-esc-reviewing").textContent = allEscalations.filter(t => t.escalationStatus === "Reviewing").length;
    document.getElementById("su-stat-esc-resolved").textContent = allEscalations.filter(t => t.resolved).length;
}

function filterEscalations() {
    const q = document.getElementById("su-esc-search").value.toLowerCase();
    const status = document.getElementById("su-esc-status").value;
    const priority = document.getElementById("su-esc-priority").value;
    const filtered = allEscalations.filter(t => {
        const matchQ = !q || (t.ticketId || "").toLowerCase().includes(q) || (t.trackingId || "").toLowerCase().includes(q);
        return matchQ && (!status || t.escalationStatus === status) && (!priority || t.priority === priority);
    });
    renderEscalations(filtered);
}

function renderEscalations(tickets) {
    const tbody = document.getElementById("su-esc-body");
    if (!tickets.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-msg"><i class="fa-solid fa-circle-check" style="color:var(--green)"></i> No escalations found.</td></tr>';
        return;
    }
    const pCls = { High: "priority-high", Medium: "priority-medium", Low: "priority-low" };
    const eCls = { Pending: "esc-pending", Reviewing: "esc-reviewing", Resolved: "esc-resolved" };
    tbody.innerHTML = tickets.map(t => `<tr>
        <td><strong>${t.ticketId}</strong></td>
        <td><code style="font-size:11px;background:#f1f5f9;padding:2px 5px;border-radius:4px">${t.trackingId}</code></td>
        <td><span class="priority-badge ${pCls[t.priority] || "priority-low"}">${t.priority || "Low"}</span></td>
        <td><span class="esc-status ${eCls[t.escalationStatus] || "esc-pending"}">${t.escalationStatus || "Pending"}</span></td>
    </tr>`).join("");
}

async function loadPartners() {
    document.getElementById("su-tp-body").innerHTML =
        '<tr><td colspan="5" class="empty-msg"><i class="fa-solid fa-spinner fa-spin"></i> Loading…</td></tr>';
    try {
        allPartners = await apiFetch("/superuser/third-parties");
        updatePartnerStats();
        renderPartners(allPartners);
    } catch (e) {
        document.getElementById("su-tp-body").innerHTML =
            `<tr><td colspan="5" class="empty-msg"><i class="fa-solid fa-triangle-exclamation" style="color:#ef4444"></i> ${e.message}</td></tr>`;
    }
}

function updatePartnerStats() {
    document.getElementById("su-stat-tp-total").textContent = allPartners.length;
    document.getElementById("su-stat-tp-active").textContent = allPartners.filter(p => p.isActive).length;
    document.getElementById("su-stat-tp-overlimit").textContent = allPartners.filter(p => p.limit > 0 && (p.currentMonthUsage / p.limit) >= 0.8).length;
}

function filterPartners() {
    const q = document.getElementById("su-tp-search").value.toLowerCase();
    const status = document.getElementById("su-tp-status").value;
    const filtered = allPartners.filter(p => {
        const matchQ = !q || p.name.toLowerCase().includes(q);
        const matchS = !status || (status === "active" ? p.isActive : !p.isActive);
        return matchQ && matchS;
    });
    renderPartners(filtered);
}

function renderPartners(partners) {
    const tbody = document.getElementById("su-tp-body");
    if (!partners.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No partners found.</td></tr>';
        return;
    }
    const tierColors = {
        Starter: { bg: "#f1f5f9", color: "#475569" },
        Growth: { bg: "#eff6ff", color: "#3b82f6" },
        Business: { bg: "#f0fdf4", color: "#16a34a" },
        Enterprise: { bg: "#fdf4ff", color: "#9333ea" }
    };
    tbody.innerHTML = partners.map(p => {
        const tc = tierColors[p.tier] || tierColors.Starter;
        const tierBadge = `<span style="background:${tc.bg};color:${tc.color};padding:4px 8px;border-radius:4px;font-size:12px;font-weight:600">${p.tier}</span>`;
        const activeBadge = p.isActive
            ? '<span class="sub-status sub-active"><i class="fa-solid fa-circle-check"></i> Active</span>'
            : '<span class="sub-status sub-expired"><i class="fa-solid fa-circle-pause"></i> Inactive</span>';
        const usagePct = p.limit > 0 ? Math.min(100, Math.round((p.currentMonthUsage / p.limit) * 100)) : 0;
        const barColor = usagePct >= 90 ? "#ef4444" : usagePct >= 70 ? "#f59e0b" : "#3b82f6";
        const withinBadge = p.withinLimit
            ? '<span class="sub-status sub-active"><i class="fa-solid fa-circle-check"></i> Within Limit</span>'
            : '<span class="sub-status sub-expired"><i class="fa-solid fa-triangle-exclamation"></i> Exceeded</span>';
        return `<tr>
            <td><strong>${p.name}</strong></td>
            <td>${tierBadge}</td>
            <td>${activeBadge}</td>
            <td>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;font-size:12px">
                    <span>${p.currentMonthUsage.toLocaleString()} / ${p.limit.toLocaleString()}</span>
                    <span>${usagePct}%</span>
                </div>
                <div style="width:100%;height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden">
                    <div style="height:100%;width:${usagePct}%;background:${barColor}"></div>
                </div>
            </td>
            <td>${withinBadge}</td>
        </tr>`;
    }).join("");
}
