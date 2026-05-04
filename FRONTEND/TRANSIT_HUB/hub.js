"use strict";

const API_BASE = "http://localhost:8000";
let _hubId = null;
let _hubName = "";
let _sessionRaw = null;
let _sessionRole = "TransitHub";
let _sessionUser = {};
let inventoryData = [];
let inboundData = [];
let outboundData = [];
let scanHistory = [];
let allAgencies = [];
let maxCapacity = null;

try {
    _sessionRaw = JSON.parse(localStorage.getItem("session"));
    _sessionRole = _sessionRaw.role || "TransitHub";
    _sessionUser = _sessionRaw.user || {};
} catch (e) {
    console.warn("No valid session found, using fallback values.");
}


function hubHeaders(extra) {
    return Object.assign({ 'Content-Type': 'application/json', 'x-role': 'TRANSIT_HUB' }, extra || {});
}

_hubId = _sessionUser.id || null;
_hubName = _sessionUser.name || "Transit Hub";

async function fetchHubInventory() {
    try {
        const res = await fetch(`${API_BASE}/hub/${_hubId}/inventory?t=${Date.now()}`, { headers: hubHeaders() });
        const data = await res.json();
        if (Array.isArray(data)) inventoryData = data;
    } catch (e) {
        console.error("fetchHubInventory err", e);
    }
}

async function fetchInbound() {
    try {
        const res = await fetch(`${API_BASE}/hub/${_hubId}/inbound?t=${Date.now()}`, { headers: hubHeaders() });
        const data = await res.json();
        if (Array.isArray(data)) inboundData = data;
    } catch (e) {
        console.error("fetchInbound err", e);
    }
}

async function fetchOutbound() {
    try {
        const res = await fetch(`${API_BASE}/hub/${_hubId}/outbound?t=${Date.now()}`, { headers: hubHeaders() });
        const data = await res.json();
        if (Array.isArray(data)) outboundData = data;
    } catch (e) {
        console.error("fetchOutbound err", e);
    }
}

async function fetchScanHistory() {
    try {
        const res = await fetch(`${API_BASE}/hub/${_hubId}/scanHistory?t=${Date.now()}`, { headers: hubHeaders() });
        const data = await res.json();
        if (Array.isArray(data)) scanHistory = data;
    } catch (e) {
        console.error("fetchScanHistory err", e);
    }
}

async function fetchCapacity() {
    try {
        const res = await fetch(`${API_BASE}/hub/${_hubId}/capacity?t=${Date.now()}`, { headers: hubHeaders() });
        const data = await res.json();
        if (typeof data === "number") maxCapacity = data;
    } catch (e) {
        console.error("fetchCapacity err", e);
    }
}

async function fetchAgencies() {
    try {
        const res = await fetch(`${API_BASE}/system/agencies?t=${Date.now()}`, { headers: hubHeaders() });
        const data = await res.json();
        if (Array.isArray(data)) allAgencies = data;
    } catch (e) {
        console.error("fetchAgencies err", e);
    }
}

async function apiInscan(trackingId) {
    const res = await fetch(`${API_BASE}/hub/${_hubId}/inscan`, {
        method: "POST",
        headers: hubHeaders(),
        body: JSON.stringify({ trackingId }),
    });
    return res.json();
}

async function apiOutscan(trackingId) {
    const res = await fetch(`${API_BASE}/hub/${_hubId}/outscan`, {
        method: "POST",
        headers: hubHeaders(),
        body: JSON.stringify({ trackingId }),
    });
    return res.json();
}

function getUser() {
    return {
        name: _sessionUser.name || "Hub Manager",
        email: _sessionUser.email || "N/A",
        phone: _sessionUser.phone || "N/A",
        address: (_sessionUser.address || "") + (_sessionUser.city ? ", " + _sessionUser.city : ""),
        hubId: _hubId || "N/A",
        hubCode: _hubId || "N/A",
        role: _sessionRole,
        pwdChangedLabel: _sessionUser.passwordUpdatedAt
            ? new Date(_sessionUser.passwordUpdatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
            : "Never",
    };
}

function calcKPIs() {
    const pendingScans = inboundData.length;
    const inboundCount = inventoryData.length;
    const outboundCount = outboundData.length;
    const presentCount = inventoryData.length;
    const capacity = maxCapacity > 0 ? Math.round((presentCount / maxCapacity) * 100) : 0;
    const totalScans = scanHistory.length;
    const successScans = scanHistory.filter(s => !s.flagged).length;
    const flaggedErrors = scanHistory.filter(s => s.flagged).length;
    return {
        inboundCount,
        outboundCount,
        pendingScans,
        capacity,
        totalScans,
        successScans,
        flaggedErrors,
        presentCount,
    };
}

function now12() {
    return new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

function fmtTime(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function fmtDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const time = fmtTime(iso);
    return isToday ? `Today, ${time}` : `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${time}`;
}

function getGreeting() {
    const h = new Date().getHours();
    return h < 12 ? "Good morning," : h < 17 ? "Good afternoon," : "Good evening,";
}

function el(id) {
    return document.getElementById(id);
}

function setText(id, v) {
    const e = el(id);
    if (e) e.textContent = v;
}

function showToast(msg, type = "") {
    const t = el("toast");
    if (!t) return;
    t.textContent = msg;
    t.className = "toast" + (type ? " " + type : "");
    t.style.display = "block";
    clearTimeout(t._tm);
    t._tm = setTimeout(() => {
        t.style.display = "none";
    }, 3200);
}

function getTFA() {
    return sessionStorage.getItem("w2d_hub_tfa") !== "off";
}

document.addEventListener("DOMContentLoaded", () => {
    const PAGE_MAP = {
        dashboard: {
            pageId: "page-dashboard",
            title: "Dashboard",
            navId: "nav-dashboard",
        },
        "hub-inv": {
            pageId: "page-hub-inv",
            title: "Hub Inventory",
            navId: "nav-hub-inv",
        },
        reports: {
            pageId: "page-reports",
            title: "Operational Reports",
            navId: "nav-reports",
        },
        scan: {
            pageId: "page-scan",
            title: "Scan Operations",
            navId: "nav-scan",
        },
        settings: {
            pageId: "page-settings",
            title: "Account Settings",
            navId: "nav-settings",
        },
    };

    function showPage(name) {
        Object.values(PAGE_MAP).forEach((cfg) => {
            const p = el(cfg.pageId);
            if (p) p.style.display = "none";
        });
        document
            .querySelectorAll(".menu-item, .menu-sub-item")
            .forEach((e) => e.classList.remove("active", "stng-active"));
        const cfg = PAGE_MAP[name];
        if (!cfg) return;
        const page = el(cfg.pageId);
        if (page) {
            page.style.display = "block";
            page.style.animation = "fadeIn 0.2s ease";
        }
        setText("header-title", cfg.title);
        const nav = el(cfg.navId);
        if (nav) {
            if (name === "settings") nav.classList.add("stng-active");
            else nav.classList.add("active");
        }
    }

    function openInvMenu() {
        el("inv-submenu").classList.add("open");
        el("inv-chevron").classList.add("open");
        el("nav-inv-toggle").classList.add("active");
    }

    function closeInvMenu() {
        el("inv-submenu").classList.remove("open");
        el("inv-chevron").classList.remove("open");
        el("nav-inv-toggle").classList.remove("active");
    }

    el("nav-dashboard").addEventListener("click", () => {
        closeInvMenu();
        showPage("dashboard");
        renderDashboard();
    });
    el("nav-inv-toggle").addEventListener("click", () => {
        el("inv-submenu").classList.toggle("open");
        el("inv-chevron").classList.toggle("open");
        el("nav-inv-toggle").classList.toggle("active");
    });
    el("nav-hub-inv").addEventListener("click", () => {
        openInvMenu();
        showPage("hub-inv");
        el("nav-hub-inv").classList.add("active");
        renderHubInventory();
    });
    el("nav-reports").addEventListener("click", () => {
        openInvMenu();
        showPage("reports");
        el("nav-reports").classList.add("active");
        renderReports("inbound");
    });
    el("nav-scan").addEventListener("click", () => {
        closeInvMenu();
        showPage("scan");
        renderScanPage();
    });
    el("nav-settings").addEventListener("click", () => {
        closeInvMenu();
        showPage("settings");
        renderSettings();
    });
    el("top-avatar").addEventListener("click", () => {
        closeInvMenu();
        showPage("settings");
        renderSettings();
    });
    el("logout-btn").addEventListener("click", () => {
        sessionStorage.clear();
        localStorage.removeItem("session");
        showToast("Logged out successfully.");
        setTimeout(() => (window.location.href = "../AUTH/home.html"), 1400);
    });

    function renderUser() {
        const u = getUser();
        const init = u.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
        document.querySelectorAll(".name").forEach((e) => (e.innerHTML = u.name));
        document
            .querySelectorAll(".role")
            .forEach((e) => (e.innerHTML = u.role + " &nbsp;|&nbsp; ID: " + u.hubCode));
        setText("top-avatar", init);
        const sa = el("settings-avatar");
        if (sa) sa.textContent = init;
        document
            .querySelectorAll(".user-profile .avatar, #top-avatar, #settings-avatar")
            .forEach((e) => {
                if (e) e.textContent = init;
            });
        setText("settings-name", u.name);
        setText("settings-role", u.role);
        setText("settings-hub-id", u.hubCode);
        setText("s-email", u.email);
        setText("s-phone", u.phone);
        setText("s-address", u.address);
        setText("s-pwd-changed", "Last changed: " + u.pwdChangedLabel);
    }

    function syncAllPages() {
        renderDashboard();
        renderScanStats();
        renderScanTable();
        _renderInboundReport();
        _renderOutboundReport();
        _renderPreAlertReport();
        renderHubInventory();
        const activeRepTab = document.querySelector("[data-rep].tab-active");
        if (activeRepTab) {
            document.querySelectorAll(".rep-panel").forEach((p) => (p.style.display = "none"));
            const target = el("rep-" + activeRepTab.dataset.rep);
            if (target) target.style.display = "block";
        }
    }

    function renderDashboard() {
        const u = getUser();
        const kpi = calcKPIs();
        const now = new Date();
        const init = u.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
        setText("top-avatar", init);
        setText("dash-greeting", getGreeting());
        setText("dash-uname", u.name.split(" ")[0]);
        setText(
            "dash-date",
            " — " +
                now.toLocaleDateString("en-IN", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                }),
        );
        const alertLine = el("dash-alert-line");
        if (alertLine) {
            const n = kpi.pendingScans;
            alertLine.innerHTML =
                `Everything looks steady across all zones today. You have ` +
                `<strong style="color:#f4a32a;">${n} pending scan${n !== 1 ? "s" : ""}</strong>` +
                ` expected to arrive.`;
        }
        setText("dash-inbound", kpi.inboundCount.toLocaleString());
        setText("dash-pending", kpi.pendingScans.toLocaleString());
        setText("dash-outbound", kpi.outboundCount.toLocaleString());
        setText("dash-capacity", kpi.capacity + "%");
        const ib = el("dash-inbound-badge");
        if (ib) ib.textContent = kpi.inboundCount > 5 ? "+Active" : "Low";
        const ob = el("dash-outbound-badge");
        if (ob) ob.textContent = kpi.outboundCount > 2 ? "+Steady" : "Slow";
        const fill = el("dash-cap-fill");
        if (fill) fill.style.width = kpi.capacity + "%";
        setText("inv-instock", kpi.presentCount.toLocaleString());
        setText("inv-pending-count", kpi.pendingScans.toLocaleString());
        setText("inv-dispatched", kpi.outboundCount.toLocaleString());
        setText("dash-success-scans", kpi.successScans.toLocaleString());
        setText("dash-error-scans", kpi.flaggedErrors.toLocaleString());
    }

    el("dash-scan-btn").addEventListener("click", () => {
        closeInvMenu();
        showPage("scan");
        _scanTab = "inscan";
        renderScanPage();
    });
    el("dash-export-btn").addEventListener("click", () => {
        openInvMenu();
        showPage("reports");
        el("nav-reports").classList.add("active");
        renderReports("inbound");
    });
    el("qop-inscan").addEventListener("click", () => {
        closeInvMenu();
        showPage("scan");
        _scanTab = "inscan";
        renderScanPage();
    });
    el("qop-outscan").addEventListener("click", () => {
        closeInvMenu();
        showPage("scan");
        _scanTab = "outscan";
        renderScanPage();
    });

    let _invPage = 1;
    const INV_PER_PAGE = 7;

    function renderHubInventory() {
        _populateDestFilter();
        _applyInvFilter();
        const kpi = calcKPIs();
        setText("hub-ov-pct", kpi.capacity + "% capacity");
    }

    function _populateDestFilter() {
        const sel = el("inv-dest-filter");
        if (!sel) return;
        const dests = [...new Set(inventoryData.map((i) => i.agencyName || "Unknown"))];
        sel.innerHTML =
            `<option value="">All Destinations</option>` +
            dests.map((d) => `<option value="${d}">${d}</option>`).join("");
    }

    function _applyInvFilter() {
        const search = (el("inv-search")?.value || "").toLowerCase();
        const destVal = el("inv-dest-filter")?.value || "";
        const list = inventoryData.filter((item) => {
            const ms =
                !search ||
                item.trackingId.toLowerCase().includes(search) ||
                (item.warehouseName || item.warehouseId || "").toLowerCase().includes(search) ||
                (item.agencyName || "").toLowerCase().includes(search);
            const md = !destVal || (item.agencyName || "") === destVal;
            return ms && md;
        });
        const total = list.length;
        const start = (_invPage - 1) * INV_PER_PAGE;
        const page = list.slice(start, start + INV_PER_PAGE);
        setText(
            "inv-showing",
            total
                ? `Showing ${start + 1}–${Math.min(start + INV_PER_PAGE, total)} of ${total} items`
                : "No items found.",
        );
        el("inv-prev").disabled = _invPage <= 1;
        el("inv-next").disabled = start + INV_PER_PAGE >= total;
        const tbody = el("inv-tbody");
        if (!page.length) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty-msg">
        <i class="fa-solid fa-inbox" style="font-size:24px;color:#e2e8f0;display:block;margin-bottom:8px;"></i>
        No items in inventory. In-scan packages to populate.
      </td></tr>`;
            return;
        }
        tbody.innerHTML = page
            .map((item) => {
                return `
      <tr>
        <td><span class="trk-id-orange">#${item.trackingId}</span></td>
        <td style="color:#64748b;font-size:13px;"><i class="fa-solid fa-location-dot" style="color:#94a3b8;margin-right:6px;font-size:11px;"></i>${item.warehouseName || item.warehouseId || "—"}</td>
        <td style="color:#64748b;font-size:13px;">${item.agencyName || "—"}</td>
        <td style="color:#64748b;font-size:13px;"><i class="fa-regular fa-clock" style="color:#94a3b8;margin-right:6px;font-size:11px;"></i>${fmtDate(item.inscanTime)}</td>
      </tr>`;
            })
            .join("");
    }

    el("inv-search").addEventListener("input", () => {
        _invPage = 1;
        _applyInvFilter();
    });
    el("inv-dest-filter").addEventListener("change", () => {
        _invPage = 1;
        _applyInvFilter();
    });
    el("inv-prev").addEventListener("click", () => {
        if (_invPage > 1) {
            _invPage--;
            _applyInvFilter();
        }
    });
    el("inv-next").addEventListener("click", () => {
        _invPage++;
        _applyInvFilter();
    });
    el("inv-export-csv").addEventListener("click", () => {
        const rows = inventoryData.map(
            (i) =>
                `#${i.trackingId},"${i.warehouseId || ""}","${i.agencyName || ""}",${i.inscanTime || ""}`,
        );
        const csv = ["Tracking ID,Origin Warehouse,Destination Agency,Arrival Time", ...rows].join(
            "\n",
        );
        const a = Object.assign(document.createElement("a"), {
            href: URL.createObjectURL(
                new Blob([csv], {
                    type: "text/csv",
                }),
            ),
            download: "hub_inventory.csv",
        });
        a.click();
        showToast("✓ CSV exported.");
    });

    function renderReports(tab) {
        document.querySelectorAll("[data-rep]").forEach((b) => b.classList.remove("tab-active"));
        const activeBtn = document.querySelector(`[data-rep="${tab}"]`);
        if (activeBtn) activeBtn.classList.add("tab-active");
        const panels = ["rep-inbound", "rep-outbound", "rep-prealert"];
        panels.forEach((pid) => {
            const p = el(pid);
            if (!p) return;
            if (pid === "rep-" + tab) {
                p.style.display = "block";
                p.style.opacity = "0";
                requestAnimationFrame(() => {
                    p.style.transition = "opacity 0.22s ease";
                    p.style.opacity = "1";
                });
            } else {
                p.style.display = "none";
            }
        });
        if (tab === "inbound") _renderInboundReport();
        if (tab === "outbound") _renderOutboundReport();
        if (tab === "prealert") _renderPreAlertReport();
    }

    document
        .querySelectorAll("[data-rep]")
        .forEach((btn) => btn.addEventListener("click", () => renderReports(btn.dataset.rep)));

    function _renderInboundReport(search = "") {
        const list = search
            ? inventoryData.filter(
                  (r) =>
                      (r.trackingId || "").toLowerCase().includes(search) ||
                      (r.warehouseName || r.warehouseId || "").toLowerCase().includes(search) ||
                      (r.agencyName || "").toLowerCase().includes(search),
              )
            : inventoryData;
        setText("rep-inbound-count", inventoryData.length.toLocaleString());
        setText("rep-inbound-trend", `${inventoryData.length} currently in hub inventory`);
        const tbody = el("rep-in-tbody");
        if (!tbody) return;
        if (!list.length) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty-msg">No inbound records found.</td></tr>`;
            return;
        }
        tbody.innerHTML = list
            .map((r) => {
                return `<tr>
        <td><span class="trk-id-orange">#${r.trackingId}</span></td>
        <td style="color:#64748b;font-size:13px;"><i class="fa-solid fa-location-dot" style="color:#94a3b8;margin-right:5px;font-size:11px;"></i>${r.warehouseName || r.warehouseId || "—"}</td>
        <td style="color:#64748b;font-size:13px;">${r.hubName || _hubName}</td>
        <td style="color:#64748b;font-size:13px;"><i class="fa-regular fa-clock" style="color:#94a3b8;margin-right:5px;font-size:11px;"></i>${fmtDate(r.inscanTime)}</td>
      </tr>`;
            })
            .join("");
    }

    el("rep-in-search").addEventListener("input", (e) =>
        _renderInboundReport(e.target.value.toLowerCase()),
    );

    function _renderOutboundReport(search = "") {
        const list = search
            ? outboundData.filter(
                  (r) =>
                      (r.trackingId || "").toLowerCase().includes(search) ||
                      (r.agencyName || "").toLowerCase().includes(search),
              )
            : outboundData;
        setText("rep-outbound-count", outboundData.length.toLocaleString());
        setText("rep-outbound-trend", `${outboundData.length} dispatched from hub`);
        const tbody = el("rep-out-tbody");
        if (!tbody) return;
        if (!list.length) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty-msg">No outbound records found.</td></tr>`;
            return;
        }
        tbody.innerHTML = list
            .map((r) => {
                const lastUpdate = r.updatedAt && r.updatedAt.length ? r.updatedAt[r.updatedAt.length - 1] : null;
                return `<tr>
      <td><span class="trk-id-orange">#${r.trackingId}</span></td>
      <td style="color:#64748b;font-size:13px;"><i class="fa-solid fa-location-dot" style="color:#94a3b8;margin-right:5px;font-size:11px;"></i>${r.agencyName || "—"}</td>
      <td style="color:#64748b;font-size:13px;">${r.agencyName || "—"}</td>
      <td style="color:#64748b;font-size:13px;"><i class="fa-regular fa-clock" style="color:#94a3b8;margin-right:5px;font-size:11px;"></i>${fmtDate(lastUpdate)}</td>
    </tr>`;
            })
            .join("");
    }

    el("rep-out-search").addEventListener("input", (e) =>
        _renderOutboundReport(e.target.value.toLowerCase()),
    );

    function _renderPreAlertReport(search = "") {
        const agencyMap = {};
        outboundData.forEach((s) => {
            const agencyName = s.agencyName || "Unknown Agency";
            if (!agencyMap[agencyName]) {
                agencyMap[agencyName] = {
                    name: agencyName,
                    shipments: [],
                    driverName: null,
                };
            }
            const lastUpdate = s.updatedAt && s.updatedAt.length ? s.updatedAt[s.updatedAt.length - 1] : null;
            agencyMap[agencyName].shipments.push({
                id: s.trackingId,
                dest: s.agencyName || "—",
                time: fmtDate(lastUpdate),
            });
            agencyMap[agencyName].driverName = s.driverName || "—";
        });
        const allAgencyCards = allAgencies.map((a) => ({
            name: a.name,
            address: a.address + ", " + a.city,
            shipments: agencyMap[a.name]?.shipments || [],
            driverName: agencyMap[a.name]?.driverName || null,
        }));
        const list = search
            ? allAgencyCards.filter((a) => a.name.toLowerCase().includes(search))
            : allAgencyCards;
        const grid = el("agency-cards-grid");
        if (!grid) return;
        if (!list.length) {
            grid.innerHTML = `<p style="color:#94a3b8;font-size:13px;padding:20px;">No agencies found.</p>`;
            return;
        }
        grid.innerHTML = list
            .map((a) => {
                const count = a.shipments.length;
                const shipList =
                    count > 0
                        ? a.shipments
                              .slice(0, 3)
                              .map(
                                  (
                                      s,
                                  ) => `<div style="font-size:11px;color:#64748b;margin-top:4px;display:flex;align-items:center;gap:6px;">
              <i class="fa-solid fa-circle" style="font-size:5px;color:#f4a32a;"></i>
              <span class="trk-id-dark" style="font-size:11px;">#${s.id}</span>
              <span style="color:#94a3b8;">→ ${s.dest}</span>
            </div>`,
                              )
                              .join("") +
                          (count > 3
                              ? `<div style="font-size:11px;color:#94a3b8;margin-top:4px;">+${count - 3} more</div>`
                              : "")
                        : `<div style="font-size:11px;color:#94a3b8;margin-top:6px;">No shipments dispatched yet</div>`;
                const btnStyle =
                    count === 0
                        ? "background:#f1f5f9;color:#94a3b8;cursor:not-allowed;"
                        : "background:#f4a32a;color:white;cursor:pointer;";
                return `<div class="agency-card">
        <div class="agency-card-hdr">
          <div class="agency-icon"><i class="fa-solid fa-building-columns"></i></div>
          <div>
            <div class="agency-card-name">${a.name}</div>
            <div style="font-size:11px;color:#94a3b8;">${a.address}</div>
          </div>
        </div>
        <div class="agency-stats">
          <div>
            <p class="agency-stat-lbl">PRE-ALERTS</p>
            <p class="agency-stat-val">${count}</p>
          </div>
          <div>
            <p class="agency-stat-lbl">DRIVER</p>
            <p class="agency-stat-val" style="font-size:13px;">${count > 0 ? a.driverName || "—" : "—"}</p>
          </div>
        </div>
        <div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:8px;letter-spacing:0.05em;">DISPATCHED SHIPMENTS</div>
        <div style="margin-bottom:14px;">${shipList}</div>
        <div class="agency-card-spacer"></div>
        <button
          onclick="${count > 0 ? `sendPreAlert('${a.name}')` : ""}"
          ${count === 0 ? "disabled" : ""}
          style="width:100%;padding:10px 14px;border-radius:10px;font-family:'Poppins',sans-serif;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:7px;border:none;transition:background 0.2s;margin-top:4px;${btnStyle}">
          <i class="fa-solid fa-paper-plane"></i> Send Pre-Alert
        </button>
      </div>`;
            })
            .join("");
    }

    el("rep-pa-search").addEventListener("input", (e) =>
        _renderPreAlertReport(e.target.value.toLowerCase()),
    );

    function sendPreAlert(agencyName) {
        showToast(`✓ Pre-alert sent to ${agencyName} successfully.`);
    }
    window.sendPreAlert = sendPreAlert;

    el("rep-csv-btn").addEventListener("click", () => {
        const activeTab = document.querySelector("[data-rep].tab-active")?.dataset.rep || "inbound";
        let csv, filename;
        if (activeTab === "outbound") {
            const rows = outboundData.map((r) => {
                const lastUpdate = r.updatedAt && r.updatedAt.length ? r.updatedAt[r.updatedAt.length - 1] : "";
                return `${r.trackingId},"${r.agencyName || ""}",${lastUpdate},DISPATCHED`;
            });
            csv = ["Tracking ID,Destination Agency,Departure Time,Status", ...rows].join("\n");
            filename = "outbound_report.csv";
        } else if (activeTab === "prealert") {
            const rows = outboundData.map((r) => {
                const lastUpdate = r.updatedAt && r.updatedAt.length ? r.updatedAt[r.updatedAt.length - 1] : "";
                return `${r.trackingId},"${r.agencyName || "—"}","${r.agencyName || "—"}",${lastUpdate}`;
            });
            csv = ["Tracking ID,Destination,Agency,Timestamp", ...rows].join("\n");
            filename = "prealert_report.csv";
        } else {
            const rows = inventoryData.map(
                (r) =>
                    `#${r.trackingId},"${r.warehouseId || ""}","${r.hubName || _hubName}",${r.inscanTime || ""}`,
            );
            csv = ["Tracking ID,Origin Hub,Transit Hub,Arrival Time", ...rows].join("\n");
            filename = "inbound_report.csv";
        }
        const a = Object.assign(document.createElement("a"), {
            href: URL.createObjectURL(
                new Blob([csv], {
                    type: "text/csv",
                }),
            ),
            download: filename,
        });
        a.click();
        showToast("✓ CSV exported.");
    });
    el("rep-pdf-btn").addEventListener("click", () => showToast("✓ PDF export triggered (demo)."));

    let _scanTab = "inscan";
    let _scanPage = 1;
    const SCAN_PER_PAGE = 10;
    let _filterVisible = false;

    function renderScanPage() {
        _syncScanTabUI();
        renderScanStats();
        renderScanTable();
    }

    function renderScanStats() {
        const kpi = calcKPIs();
        setText("stat-total", kpi.totalScans.toLocaleString());
        setText("stat-success", kpi.successScans.toLocaleString());
        setText("stat-errors", kpi.flaggedErrors.toLocaleString());
    }

    function _syncScanTabUI() {
        const isIn = _scanTab === "inscan";
        el("tab-inscan").classList.toggle("tab-active", isIn);
        el("tab-outscan-btn").classList.toggle("tab-active", !isIn);
        setText("scan-page-title", isIn ? "In-Scan Operation" : "Out-Scan Operation");
        setText("btn-scan-label", isIn ? "In-Scan Package" : "Out-Scan Package");
        setText("header-title", isIn ? "In-Scan Operations" : "Out-Scan Operations");
    }

    function renderScanTable() {
        const search = (el("scan-search")?.value || "").toLowerCase();
        const fSt = el("filter-scan-status")?.value || "";
        const fAg = el("filter-scan-agency")?.value || "";
        let list;
        if (_scanTab === "inscan") {
            list = scanHistory.filter((s) => s.status === "Scanned In" || s.flagged);
        } else {
            list = scanHistory.filter((s) => s.status === "Outscan");
        }
        list = list.filter((s) => {
            if (search && !(s.trackingId || "").toLowerCase().includes(search)) return false;
            if (fSt === "FLAGGED" && !s.flagged) return false;
            if (fSt === "Scanned In" && s.status !== "Scanned In") return false;
            if (fSt === "Outscan" && s.status !== "Outscan") return false;
            if (fAg && (s.agencyName || "Not assigned") !== fAg) return false;
            return true;
        });
        const total = list.length;
        const start = (_scanPage - 1) * SCAN_PER_PAGE;
        const pg = list.slice(start, start + SCAN_PER_PAGE);
        setText(
            "scan-showing",
            total
                ? `Showing ${start + 1}–${Math.min(start + SCAN_PER_PAGE, total)} of ${total} scans`
                : "No scans found.",
        );
        el("scan-prev").disabled = _scanPage <= 1;
        el("scan-next").disabled = start + SCAN_PER_PAGE >= total;
        const tbody = el("scan-tbody");
        if (!pg.length) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty-msg">
        <i class="fa-solid fa-barcode" style="font-size:24px;color:#e2e8f0;display:block;margin-bottom:8px;"></i>
        No ${_scanTab === "inscan" ? "in" : "out"}-scan records yet.
      </td></tr>`;
            return;
        }
        tbody.innerHTML = pg
            .map((s) => {
                const isFlagged = s.flagged;
                const badgeCls = isFlagged
                    ? "badge-err"
                    : s.status === "Scanned In"
                      ? "badge-in"
                      : "badge-out";
                const flagLabel =
                    s.flagMsg && s.flagMsg.startsWith("Wrong hub") ? "WRONG HUB" : "FLAGGED";
                const lbl = isFlagged
                    ? flagLabel
                    : s.status === "Scanned In"
                      ? "SCANNED IN"
                      : "OUTSCAN";
                const icon = isFlagged
                    ? "fa-triangle-exclamation"
                    : s.status === "Scanned In"
                      ? "fa-circle-check"
                      : "fa-circle-arrow-right";
                const timestampCell =
                    isFlagged && s.flagMsg
                        ? `<span style="color:#dc2626;font-size:11px;font-style:italic;">${s.flagMsg}</span>`
                        : `<span style="color:#94a3b8;font-size:12px;">${fmtDate(s.timestamp)}</span>`;
                return `<tr>
        <td style="font-weight:700;font-size:13px;color:#1e293b;">${s.trackingId}</td>
        <td><span class="status-badge ${badgeCls}">
          <i class="fa-solid ${icon}" style="font-size:9px;"></i> ${lbl}
        </span></td>
        <td style="color:#64748b;font-size:13px;">${s.agencyName || "—"}</td>
        <td>${timestampCell}</td>
      </tr>`;
            })
            .join("");
    }

    el("tab-inscan").addEventListener("click", () => {
        _scanTab = "inscan";
        _scanPage = 1;
        _syncScanTabUI();
        renderScanTable();
    });
    el("tab-outscan-btn").addEventListener("click", () => {
        _scanTab = "outscan";
        _scanPage = 1;
        _syncScanTabUI();
        renderScanTable();
    });
    el("scan-prev").addEventListener("click", () => {
        if (_scanPage > 1) {
            _scanPage--;
            renderScanTable();
        }
    });
    el("scan-next").addEventListener("click", () => {
        _scanPage++;
        renderScanTable();
    });
    el("btn-filter-scan").addEventListener("click", () => {
        _filterVisible = !_filterVisible;
        const row = el("scan-filter-row");
        row.style.display = _filterVisible ? "flex" : "none";
    });
    el("scan-search").addEventListener("input", () => {
        _scanPage = 1;
        renderScanTable();
    });
    el("filter-scan-status").addEventListener("change", () => {
        _scanPage = 1;
        renderScanTable();
    });
    el("filter-scan-agency").addEventListener("change", () => {
        _scanPage = 1;
        renderScanTable();
    });

    async function performScan() {
        const inp = el("scan-input");
        const raw = (inp?.value.trim() || "").replace(/^#/, "").toUpperCase();
        if (!raw) {
            showToast("Please enter a tracking ID.", "error");
            return;
        }

        if (_scanTab === "inscan") {
            try {
                const result = await apiInscan(raw);
                if (result.status === "error") {
                    await fetchScanHistory();
                    inp.value = "";
                    _scanPage = 1;
                    syncAllPages();
                    showToast(`⚠ ${raw}: ${result.flagMsg}`, "error");
                    return;
                }
                await fetchHubInventory();
                await fetchInbound();
                await fetchScanHistory();
                inp.value = "";
                _scanPage = 1;
                syncAllPages();
                showToast(`✓ ${raw} in-scanned successfully — added to inventory.`);
            } catch (e) {
                console.error("Inscan error", e);
                showToast("Backend connection failed.", "error");
            }
        } else {
            try {
                const result = await apiOutscan(raw);
                if (result.status === "error") {
                    showToast(`⚠ ${raw}: ${result.flagMsg}`, "error");
                    inp.value = "";
                    return;
                }
                await fetchHubInventory();
                await fetchOutbound();
                await fetchScanHistory();
                inp.value = "";
                _scanPage = 1;
                syncAllPages();
                showToast(
                    `✓ ${raw} out-scanned → ${result.shipment.agencyName || "agency"}`,
                );
            } catch (e) {
                console.error("Outscan error", e);
                showToast("Backend connection failed.", "error");
            }
        }
    }

    el("btn-scan-action").addEventListener("click", performScan);
    el("scan-input").addEventListener("keydown", (e) => {
        if (e.key === "Enter") performScan();
    });

    function renderSettings() {
        const u = getUser();
        const init = u.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
        const sa = el("settings-avatar");
        if (sa) {
            sa.textContent = init;
        }
        setText("settings-name", u.name);
        setText("settings-role", u.role);
        setText("settings-hub-id", u.hubCode);
        const sEmail = el("s-email");
        if (sEmail) sEmail.textContent = u.email;
        const sPhone = el("s-phone");
        if (sPhone) sPhone.textContent = u.phone;
        const sAddr = el("s-address");
        if (sAddr) sAddr.textContent = u.address;
        setText("s-pwd-changed", "Last changed: " + u.pwdChangedLabel);
        const sNameCls = document.querySelector(".settings-user-name");
        const sRoleCls = document.querySelector(".settings-user-role");
        const sEmailCls = document.querySelector(".settings-email");
        const sPhoneCls = document.querySelector(".settings-phone");
        if (sNameCls) sNameCls.innerHTML = u.name;
        if (sRoleCls) sRoleCls.innerHTML = u.role + " &nbsp;|&nbsp; ID: " + u.hubCode;
        if (sEmailCls) sEmailCls.innerHTML = u.email;
        if (sPhoneCls) sPhoneCls.innerHTML = u.phone;
        const tfa = getTFA();
        const knob = el("tfa-knob");
        const tog = el("tfa-toggle");
        if (knob && tog) {
            knob.style.left = tfa ? "22px" : "2px";
            tog.style.background = tfa ? "#f4a32a" : "#e2e8f0";
        }
    }

    const tfaToggleEl = el("tfa-toggle");
    if (tfaToggleEl) {
        tfaToggleEl.addEventListener("click", () => {
            const knob = el("tfa-knob");
            if (!knob) return;
            const newState = !knob.classList.contains("on");
            knob.classList.toggle("on", newState);
            tfaToggleEl.style.background = newState ? "#f4a32a" : "#e2e8f0";
            knob.style.left = newState ? "22px" : "2px";
            sessionStorage.setItem("w2d_hub_tfa", newState ? "on" : "off");
            showToast(
                newState
                    ? "✓ Two-factor authentication enabled."
                    : "Two-factor authentication disabled.",
            );
        });
    }

    el("open-edit-modal").addEventListener("click", () => {
        const u = getUser();
        el("edit-name").value = u.name;
        el("edit-email").value = u.email;
        el("edit-phone").value = u.phone;
        const init = u.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
        const ma = el("modal-edit-avatar");
        if (ma) ma.textContent = init;
        setText("modal-display-name", u.name);
        setText("modal-display-role", u.role);
        el("edit-modal").classList.add("active");
    });

    function closeEditModal() {
        el("edit-modal").classList.remove("active");
    }
    el("close-edit-modal").addEventListener("click", closeEditModal);
    el("cancel-edit-modal").addEventListener("click", closeEditModal);
    el("edit-modal").addEventListener("click", (e) => {
        if (e.target.id === "edit-modal") closeEditModal();
    });

    el("save-edit-modal").addEventListener("click", async () => {
        const n = el("edit-name").value.trim();
        const em = el("edit-email").value.trim();
        const ph = el("edit-phone").value.trim();
        if (!n && !em && !ph) {
            showToast("Nothing to save.", "error");
            return;
        }
        if (em && (!em.includes("@") || !em.includes("."))) {
            showToast("⚠ Invalid email format.", "error");
            return;
        }
        if (ph && !/^(\+91[\s-]?)?\d{10}$/.test(ph)) {
            showToast("⚠ Phone must be exactly 10 digits.", "error");
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/auth/profile/${_hubId}`, {
                method: "POST",
                headers: hubHeaders(),
                body: JSON.stringify({ name: n, email: em, phone: ph }),
            });
            const data = await res.json();
            if (data.success) {
                if (n) _sessionUser.name = n;
                if (em) _sessionUser.email = em;
                if (ph) _sessionUser.phone = ph;
                const sess = JSON.parse(localStorage.getItem("session")) || {};
                sess.user = { ...sess.user, ..._sessionUser };
                localStorage.setItem("session", JSON.stringify(sess));
                renderUser();
                renderDashboard();
                renderSettings();
                closeEditModal();
                showToast("✓ Profile updated successfully.");
            } else {
                showToast(data.error || "Failed to update profile.", "error");
            }
        } catch (e) {
            console.error("Profile update err", e);
            showToast("Backend connection failed.", "error");
        }
    });

    const changePwdBtn = el("change-pwd-btn");
    if (changePwdBtn) {
        changePwdBtn.addEventListener("click", () => {
            ["pwd-current", "pwd-new", "pwd-confirm"].forEach((id) => {
                const f = el(id);
                if (f) f.value = "";
            });
            const pm = el("pwd-modal");
            if (pm) pm.classList.add("active");
        });
    }

    function closePwdModal() {
        el("pwd-modal").classList.remove("active");
    }
    el("close-pwd-modal").addEventListener("click", closePwdModal);
    el("cancel-pwd-modal").addEventListener("click", closePwdModal);
    el("pwd-modal").addEventListener("click", (e) => {
        if (e.target.id === "pwd-modal") closePwdModal();
    });

    el("save-pwd-modal").addEventListener("click", async () => {
        const cur = el("pwd-current").value;
        const nw = el("pwd-new").value;
        const cnf = el("pwd-confirm").value;
        if (!cur || !nw || !cnf) {
            showToast("Please fill all fields.", "error");
            return;
        }
        if (nw !== cnf) {
            showToast("Passwords do not match.", "error");
            return;
        }
        if (nw.length < 6) {
            showToast("Password must be at least 6 characters.", "error");
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/auth/password/${_hubId}`, {
                method: "POST",
                headers: hubHeaders(),
                body: JSON.stringify({ currentPassword: cur, newPassword: nw }),
            });
            const data = await res.json();
            if (data.success) {
                _sessionUser.passwordUpdatedAt = new Date().toISOString();
                const sess = JSON.parse(localStorage.getItem("session")) || {};
                sess.user = { ...sess.user, passwordUpdatedAt: _sessionUser.passwordUpdatedAt };
                localStorage.setItem("session", JSON.stringify(sess));
                renderSettings();
                closePwdModal();
                showToast("✓ Password updated successfully.");
            } else {
                showToast(data.error || "Failed to update password.", "error");
            }
        } catch (e) {
            console.error("Password update err", e);
            showToast("Backend connection failed.", "error");
        }
    });

    async function initData() {
        await Promise.all([
            fetchAgencies(),
            fetchHubInventory(),
            fetchInbound(),
            fetchOutbound(),
            fetchScanHistory(),
            fetchCapacity(),
        ]);
        renderUser();
        renderSettings();
        showPage("dashboard");
        renderDashboard();
        renderScanStats();
    }

    initData();
});
