const mockNetwork = { transitHubs: [], deliveryAgencies: [], warehouseToHub: [] };
let inventoryData = [];
let outboundShipments = [];
let rtoData = [];
let allHubs = [];
let allAgencies = [];
let pendingShipments = [];
let warehouseId = null;
let expandedHub = null;
let recentlyAddedStock = [];
let selectedShipmentIds = new Set();
let currentAcceptingOrderId = null;
let session = JSON.parse(localStorage.getItem("session"));
let role = session.role;
let user = session.user;


function w2dHeaders(extra) {
    return Object.assign({ 'Content-Type': 'application/json', 'x-role': 'WAREHOUSE' }, extra || {});
}
let role_name = user.name;
let email = user.email;
let phone = user.phone;
let address = user.address;
const buttons = document.querySelectorAll(".menu-item, .submenu-item");
const dropdown = document.querySelector(".dropdown");
const stng_btn = document.querySelector(".stng-btn");
const headerTitle = document.querySelector(".header h2");
const dashboard_btn = buttons[0];
const shipment_btn = buttons[1];
const rto_btn = buttons[2];
const inventory_btn = buttons[3];
const prealert_btn = buttons[4];
const outbound_btn = buttons[5];
const overview_btn = buttons[6];
const stock_btn = buttons[7];
const topAvatar = document.getElementById("top-avatar");
let rtoPage = 1;
const RTO_PER_PAGE = 5;
let invPage = 1;
const INV_PER_PAGE = 5;
const tfaToggle = document.getElementById("tfa-toggle");
const tfaKnob = document.getElementById("tfa-knob");
let tfaEnabled = false;
const changePwdBtn = document.getElementById("change-pwd-btn");
const closePwdBtn = document.getElementById("close-pwd-modal");
const cancelPwdBtn = document.getElementById("cancel-pwd-modal");
const pwdModalEl = document.getElementById("pwd-modal");
const savePwdBtn = document.getElementById("save-pwd-modal");
if (role === "WareHouse") warehouseId = user.id;
else if (role === "TransitHub") warehouseId = user.id;
else warehouseId = user.id;
if (topAvatar) {
    topAvatar.addEventListener("click", () => {
        stng_btn.click();
    });
}
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
if (changePwdBtn) {
    changePwdBtn.addEventListener("click", () => {
        ["pwd-current", "pwd-new", "pwd-confirm"].forEach((id) => {
            const f = document.getElementById(id);
            if (f) f.value = "";
        });
        document.getElementById("pwd-modal").classList.add("active");  
    });
}
if (closePwdBtn) closePwdBtn.addEventListener("click", closePwdModal);
if (cancelPwdBtn) cancelPwdBtn.addEventListener("click", closePwdModal);

if (pwdModalEl)
    pwdModalEl.addEventListener("click", (e) => {
        if (e.target === pwdModalEl) closePwdModal();
    });
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
            const res = await fetch(`http://localhost:8000/auth/password/${warehouseId}`, {
                method: "POST",
                headers: w2dHeaders(),
                body: JSON.stringify({ currentPassword: cur, newPassword: nw })
            });
            const data = await res.json();
            if (data.success) {
                user.passwordUpdatedAt = new Date().toISOString();
                localStorage.setItem("session", JSON.stringify({ ...session, user }));
                refreshSettingsUI();
                closePwdModal();
                showToast("✓ Password updated successfully.");
            } else {
                showToast(data.error || "Failed to update password.", true);
            }
        } catch(e) {
            console.error("Password update err", e);
            showToast("Backend connection failed.", true);
        }
    });
}
document.querySelector(".name").innerHTML = role_name;
document.querySelector(".role").innerHTML = role;
refreshSettingsUI();
stng_btn.addEventListener("click", () => {
    clearAllActive();
    hideAllPages();
    stng_btn.classList.add("stng-active");
    dropdown.classList.remove("open");
    document.querySelector(".settings-container").style.display = "block";
    headerTitle.innerHTML = "Settings";
});
dashboard_btn.addEventListener("click", () => {
    clearAllActive();
    hideAllPages();
    dashboard_btn.classList.add("active");
    document.querySelector(".dashboard-page").style.display = "block";
    dropdown.classList.remove("open");
    headerTitle.innerHTML = "Dashboard";
    renderDashboard();
});
shipment_btn.addEventListener("click", () => {
    clearAllActive();
    hideAllPages();
    shipment_btn.classList.add("active");
    document.querySelector(".shipment-page").style.display = "block";
    dropdown.classList.remove("open");
    headerTitle.innerHTML = "Shipment Requests";
    renderShipments();
});
rto_btn.addEventListener("click", () => {
    clearAllActive();
    hideAllPages();
    rto_btn.classList.add("active");
    dropdown.classList.remove("open");
    document.querySelector(".rto-page").style.display = "block";
    headerTitle.innerHTML = "Manage RTO";
    initRTOFilters();
    renderRTO();
});
inventory_btn.addEventListener("click", () => {
    dropdown.classList.toggle("open");
});
prealert_btn.addEventListener("click", () => {
    clearAllActive();
    hideAllPages();
    prealert_btn.classList.add("active-sub");
    inventory_btn.classList.add("active");
    dropdown.classList.add("open");
    document.querySelector(".prealert-page").style.display = "block";
    headerTitle.innerHTML = "Pre-Alert";
    renderPreAlert();
});
outbound_btn.addEventListener("click", () => {
    clearAllActive();
    hideAllPages();
    outbound_btn.classList.add("active-sub");
    inventory_btn.classList.add("active");
    dropdown.classList.add("open");
    document.querySelector(".outbound-page").style.display = "block";
    headerTitle.innerHTML = "Outbound";
    renderOutbound();
});
overview_btn.addEventListener("click", () => {
    clearAllActive();
    hideAllPages();
    overview_btn.classList.add("active-sub");
    inventory_btn.classList.add("active");
    dropdown.classList.add("open");
    document.querySelector(".inventory-overview-page").style.display = "block";
    headerTitle.innerHTML = "Inventory Overview";
    renderInventoryOverview();
});
stock_btn.addEventListener("click", () => {
    clearAllActive();
    hideAllPages();
    stock_btn.classList.add("active-sub");
    inventory_btn.classList.add("active");
    dropdown.classList.add("open");
    document.querySelector(".stock-addition-page").style.display = "block";
    headerTitle.innerHTML = "Stock Addition";
    renderStockTable();
});
document.querySelector(".logout-btn").addEventListener("click", () => {
    localStorage.removeItem("session");
    window.location.href = "../AUTH/home.html";
});
document.querySelector(".dash-new-shipment-btn").addEventListener("click", () => {
    stock_btn.click();
});
document.querySelector(".dash-export-btn").addEventListener("click", () => {
    prealert_btn.click();
});
document.getElementById("select-all-shipments").addEventListener("change", (e) => {
    pendingShipments.forEach((s) => {
        if (e.target.checked) selectedShipmentIds.add(s.orderId);
        else selectedShipmentIds.delete(s.orderId);
    });
    renderShipments(getShipmentFilters());
    updateSelectedCount();
});
document.getElementById("accept-selected-btn").addEventListener("click", () => {
    if (!selectedShipmentIds.size) return;
    openHubModal([...selectedShipmentIds][0]);
});
document
    .getElementById("shipment-search")
    .addEventListener("input", () => renderShipments(getShipmentFilters()));
document
    .getElementById("filter-source")
    .addEventListener("change", () => renderShipments(getShipmentFilters()));
document
    .getElementById("filter-priority")
    .addEventListener("change", () => renderShipments(getShipmentFilters()));
document
    .getElementById("filter-stock")
    .addEventListener("change", () => renderShipments(getShipmentFilters()));
document.getElementById("close-hub-modal").addEventListener("click", closeHubModal);
document.getElementById("cancel-hub-modal").addEventListener("click", closeHubModal);
document.getElementById("hub-modal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("hub-modal")) closeHubModal();
});
document.getElementById("confirm-dispatch-btn").addEventListener("click", async () => {
    const orderId = currentAcceptingOrderId;
    const hubId = document.getElementById("hub-select").value;
    const agencyId = document.getElementById("agency-select").value;
    const shipment = pendingShipments.find((s) => s.orderId === orderId);
    

    const hubSel = document.getElementById("hub-select");
    const agencySel = document.getElementById("agency-select");
    const hubName = hubSel.options[hubSel.selectedIndex]?.text || hubId;
    const agencyName = agencySel.options[agencySel.selectedIndex]?.text || agencyId;

    try {
        const res = await fetch(`http://localhost:8000/${warehouseId}/dispatch`, {
            method: "POST",
            headers: w2dHeaders(),
            body: JSON.stringify({ orderId, hubId, agencyId })
        });
        const data = await res.json();
        if(data.error) throw new Error(data.error);


        await fetchPendingShipments();
        await fetchOutbound();
        await fetchInventory();

        selectedShipmentIds.delete(orderId);
        updateSelectedCount();
        closeHubModal();
        renderShipments(getShipmentFilters());
        showToast(`✓ #${orderId} dispatched as ${data.trackingId} to ${hubName}`);
    } catch(e) {
        console.error("Dispatch err", e);
        showToast("Backend connection failed.", true);
    }
});
document.getElementById("inv-search").addEventListener("input", () => {
    invPage = 1;
    renderInventoryOverview(getInvFilters());
});
document.getElementById("inv-status-filter").addEventListener("change", () => {
    invPage = 1;
    renderInventoryOverview(getInvFilters());
});
document.getElementById("inv-add-stock-btn").addEventListener("click", () => {
    stock_btn.click();
});
document.getElementById("stock-submit-btn").addEventListener("click", async () => {
    const labelId = document.getElementById("stock-label-id").value.trim();
    const itemName = document.getElementById("stock-item-name").value.trim();
    const qty = parseInt(document.getElementById("stock-qty").value);
    if (!labelId || !itemName || !qty || qty < 1) {
        showToast("⚠ Please fill all fields correctly.", true);
        return;
    }
    try {
        const res = await fetch(`http://localhost:8000/${warehouseId}/stockAddition`, {
            method: "POST",
            headers: w2dHeaders(),
            body: JSON.stringify({ labelID: labelId, itemName: itemName, quantity: qty })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
    } catch (e) {
        console.error("Backend error adding stock", e);
        showToast(e.message || "Backend connection failed.", true);
        return;
    }
    const now = new Date();
    const addedAt = now.toLocaleString("en-IN", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit",
    });
    recentlyAddedStock.unshift({ labelId, itemName, qty, addedAt });
    document.getElementById("stock-label-id").value = "";
    document.getElementById("stock-item-name").value = "";
    document.getElementById("stock-qty").value = "";
    await fetchInventory();
    renderStockTable();
    showToast("✓ Stock added to inventory.");
});
document.getElementById("stock-reset-btn").addEventListener("click", () => {
    document.getElementById("stock-label-id").value = "";
    document.getElementById("stock-item-name").value = "";
    document.getElementById("stock-qty").value = "";
});
document.getElementById("open-edit-modal").addEventListener("click", () => {
    document.getElementById("edit-name").value = role_name;
    document.getElementById("edit-email").value = email;
    document.getElementById("edit-phone").value = phone;
    document.getElementById("modal-display-name").innerHTML = role_name;
    document.getElementById("modal-display-role").innerHTML = role + " | ID: " + warehouseId;
    document.getElementById("edit-modal").classList.add("active");
});
document.getElementById("close-edit-modal").addEventListener("click", closeEditModal);
document.getElementById("cancel-edit-modal").addEventListener("click", closeEditModal);
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
        const res = await fetch(`http://localhost:8000/auth/profile/${warehouseId}`, {
            method: "POST",
            headers: w2dHeaders(),
            body: JSON.stringify({ name: n, email: em, phone: ph })
        });
        const data = await res.json();
        if (data.success) {
            if (n) role_name = n;
            if (em) email = em;
            if (ph) phone = ph;
            localStorage.setItem("user", JSON.stringify({ ...user, name: role_name, email: email, phone: phone }));
            document.querySelector(".name").innerHTML = role_name;
            refreshSettingsUI();
            closeEditModal();
            showToast("✓ Profile updated.");
        } else {
            showToast(data.error || "Failed to update profile.", true);
        }
    } catch(e) {
        console.error("Profile update err", e);
        showToast("Backend connection failed.", true);
    }
});
async function fetchInventory() {
    try {
        const res = await fetch(`http://localhost:8000/${warehouseId}/stockInventory`, { headers: w2dHeaders() });
        const data = await res.json();
        if (Array.isArray(data)) {
            inventoryData = data.map(item => ({
                labelId: item.labelId || "",
                itemName: item.itemName,
                qty: item.quantity,
                updatedAt: item.lastUpdated ? new Date(item.lastUpdated).toLocaleString("en-IN") : ""
            }));
        }
    } catch(e) {
        console.error("fetchInventory err", e);
    }
}

async function fetchOutbound() {
    try {
        const res = await fetch(`http://localhost:8000/${warehouseId}/outbound`, { headers: w2dHeaders() });
        const data = await res.json();
        if (Array.isArray(data)) {
            outboundShipments = data.map(s => ({
                trackingId: s.trackingId,
                orderId: s.trackingId,
                source: s.productName || 'N/A',
                hub: s.hubName || s.hubId,
                hubId: s.hubId,
                hubName: s.hubName || s.hubId,
                hubAddress: s.hubAddress || '',
                agency: s.agencyName || s.agencyId,
                agencyName: s.agencyName || s.agencyId,
                departureTime: s.createdAt ? new Date(s.createdAt).toLocaleString('en-IN') : '',
                driverName: s.driverName || 'Unassigned',
                vehicleNo: s.vehicleNo || 'N/A'
            }));
        }
    } catch(e) {
        console.error('fetchOutbound err', e);
    }
}

async function fetchPreAlert() {
    try {
        const res = await fetch(`http://localhost:8000/${warehouseId}/preAlert`, { headers: w2dHeaders() });
        const data = await res.json();
        return data; 
    } catch (e) {
        console.error("fetchPreAlert err", e);
        return null;
    }
}

async function fetchPendingShipments() {
    try {
        const res = await fetch(`http://localhost:8000/${warehouseId}/pendingShipments`, { headers: w2dHeaders() });
        const data = await res.json();
        if (Array.isArray(data)) {
            pendingShipments = data.map(s => ({
                orderId: s.orderId,
                source: s.source,
                customerName: s.customerName,
                customerPhone: s.customerPhone,
                city: s.customerAddress,
                productName: s.productName,
                sku: s.sku || '',
                qty: s.qty,
                priority: s.priority,
                time: s.receivedAt ? new Date(s.receivedAt).toLocaleString('en-IN') : ''
            }));
        }
    } catch(e) {
        console.error('fetchPendingShipments err', e);
    }
}

async function fetchRTO() {
    try {
        const res = await fetch(`http://localhost:8000/rto?warehouseId=${warehouseId}`, { headers: w2dHeaders() });
        const data = await res.json();
        if (Array.isArray(data)) {
            rtoData = data.map(r => ({
                rtoId: r.rtoId,
                trackingId: r.trackingId,
                orderId: r.rtoId,
                customer: r.customerName || '—',
                phone: r.customerPhone || '—',
                reason: (r.reason || '').replace('Customer Refused: ', '').replace('OTP verification failed after 3 attempts', '3 OTP Failures'),
                status: r.status || 'RTO Initiated',
                lastScanned: r.status,
                date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '—',
            }));
        }
    } catch(e) {
        console.error('fetchRTO err', e);
    }
}

async function doRtoInscan() {
    const input = document.getElementById('rto-inscan-input');
    const rtoId = (input?.value || '').trim();
    if (!rtoId) { showToast('⚠ Please enter an RTO ID.', true); return; }
    if (!rtoId.startsWith('RTOID-')) { showToast('⚠ Invalid RTO ID format. Must start with RTOID-', true); return; }
    try {
        const res = await fetch(`http://localhost:8000/rto/${rtoId}/warehouse-inscan`, { method: 'POST', headers: w2dHeaders() });
        const data = await res.json();
        if (data.status === 'success') {
            input.value = '';
            await fetchRTO();
            await fetchInventory();
            renderRTO();
            renderDashboard();
            const stockMsg = data.stockRestored ? ' Stock has been restored to inventory.' : '';
            showToast(`✓ RTO ${rtoId} received at warehouse.${stockMsg}`);
        } else {
            showToast(`⚠ ${data.flagMsg || data.message || 'Failed to process RTO inscan.'}`, true);
        }
    } catch(e) {
        console.error('RTO inscan err', e);
        showToast('Backend connection failed.', true);
    }
}

async function fetchSystemData() {
    try {
        const [hubsRes, agenciesRes] = await Promise.all([
            fetch('http://localhost:8000/system/hubs'),
            fetch('http://localhost:8000/system/agencies')
        ]);
        allHubs = await hubsRes.json();
        allAgencies = await agenciesRes.json();
    } catch(e) {
        console.error('fetchSystemData err', e);
    }
}

async function initData() {
    await fetchSystemData();
    await fetchInventory();
    await fetchOutbound();
    await fetchPendingShipments();
    await fetchRTO();
    renderDashboard();
}


initData();
function refreshSettingsUI() {
    document.querySelector(".settings-user-name").innerHTML = role_name;
    document.querySelector(".settings-user-role").innerHTML =
        role + " &nbsp;|&nbsp; ID: " + warehouseId;
    document.querySelector(".settings-email").innerHTML = email;
    document.querySelector(".settings-phone").innerHTML = phone;
    
    const pwdEl = document.getElementById("s-pwd-changed");
    if (pwdEl) {
        let displayDate = new Date();
        if (user.passwordUpdatedAt) {
            displayDate = new Date(user.passwordUpdatedAt);
        } else if (user.createdAt) {
            displayDate = new Date(user.createdAt);
        }
        
        const formatted = displayDate.toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
            hour: "numeric", minute: "numeric"
        });
        pwdEl.textContent = "Last changed: " + formatted;
    }
}
function hideAllPages() {
    document.querySelector(".dashboard-page").style.display = "none";
    document.querySelector(".shipment-page").style.display = "none";
    document.querySelector(".outbound-page").style.display = "none";
    document.querySelector(".inventory-overview-page").style.display = "none";
    document.querySelector(".stock-addition-page").style.display = "none";
    document.querySelector(".settings-container").style.display = "none";
    document.querySelector(".prealert-page").style.display = "none";
    document.querySelector(".rto-page").style.display = "none";
}
function clearAllActive() {
    buttons.forEach((b) => b.classList.remove("active", "active-sub"));
    stng_btn.classList.remove("stng-active");
}

function renderDashboard() {
    document.querySelector(".welcome-name-dynamic").innerHTML = role_name;
    const now = new Date();
    document.querySelector(".welcome-date").innerHTML =
        "— " +
        now.toLocaleDateString("en-IN", {
            weekday: "long",
            month: "short",
            day: "numeric",
        });
    const pendingCount = pendingShipments.length;
    document.querySelector(".alert-count").innerHTML =
        `<span style="color:#f4a32a;font-weight:600;">${pendingCount} critical alert${pendingCount !== 1 ? "s" : ""}</span>`;
    const totalQty = inventoryData.reduce((s, i) => s + i.qty, 0);
    document.getElementById("dash-inventory").innerHTML = totalQty.toLocaleString();
    document.querySelector(".stat-badge--green").innerHTML = "+2.4%";
    document.getElementById("dash-shipments").innerHTML = pendingCount;
    document.getElementById("dash-shipment-badge").innerHTML =
        pendingCount > 0 ? "HIGH PRIORITY" : "ALL CLEAR";
    document.getElementById("dash-outbound").innerHTML = outboundShipments.length;
    document.getElementById("dash-outbound-badge").innerHTML = outboundShipments.length;
    document.getElementById("dash-rto").innerHTML = rtoData.length;
    const tbody = document.getElementById("activity-tbody");
    const activityRows = recentlyAddedStock.slice(0, 5).map((item) => ({
        id: item.labelId,
        time: item.addedAt,
        status: "ADDED",
        cls: "status-delivered",
    }));
    tbody.innerHTML = activityRows
        .map(
            (r) => `
        <tr>
            <td class="trk-id">${r.id}</td>
            <td>${r.time}</td>
            <td><span class="status-badge ${r.cls}">${r.status}</span></td>
        </tr>
    `,
        )
        .join("");
}
async function renderPreAlert() {
    const preAlertData = await fetchPreAlert();
    if (!preAlertData) return;

    document.getElementById("pa-active-hubs").innerHTML = preAlertData.active_hubs;
    document.getElementById("pa-total-shipments").innerHTML = preAlertData.total_out_scanned;
    const grid = document.getElementById("pa-hub-grid");

    if (!preAlertData.hubs || preAlertData.hubs.length === 0) {
        grid.innerHTML = '<p style="color:#94a3b8; padding: 20px;">No active hubs.</p>';
        return;
    }

    grid.innerHTML = preAlertData.hubs
        .map((hubData) => {
            const hubId = hubData.hubId;
            const hubName = hubData.hubName || hubId;
            const hubAddress = hubData.hubAddress || '';
            const driverName = hubData.driverName || '—';
            const vehicleNo = hubData.vehicleNo || '—';
            const ships = hubData.shipments || [];

            const mappedShips = ships.map(s => ({
                trackingId: s.trackingId,
                orderId: s.trackingId,
                source: s.productName || 'N/A',
                agency: s.agencyName || s.agencyId || 'N/A'
            }));

            const isExpanded = expandedHub === hubId;
            const hasShips = mappedShips.length > 0;
            return `
        <div class="pa-hub-card ${isExpanded ? "pa-hub-card--expanded" : ""} ${hasShips ? "" : "pa-hub-card--empty"}">
            <div class="pa-hub-header" onclick="toggleHub('${hubId}')">
                <div class="pa-hub-left">
                    <div class="pa-hub-icon ${hasShips ? "" : "pa-hub-icon--grey"}">
                        <i class="fa-solid fa-building"></i>
                    </div>
                    <div>
                        <p class="pa-hub-name">${hubName}</p>
                        <p class="pa-hub-addr">${hubAddress}</p>
                    </div>
                </div>
                <i class="fa-solid fa-chevron-down pa-hub-arrow ${isExpanded ? "pa-hub-arrow--open" : ""}"></i>
            </div>
            <div class="pa-hub-stats">
                <div class="pa-hub-stat">
                    <p class="pa-stat-label">OUT-SCANNED</p>
                    <p class="pa-stat-val">${mappedShips.length}</p>
                </div>
                <div class="pa-hub-stat">
                    <p class="pa-stat-label">DRIVER</p>
                    <p class="pa-stat-val" style="font-size:13px;">${driverName}</p>
                </div>
                <div class="pa-hub-stat">
                    <p class="pa-stat-label">VEHICLE</p>
                    <p class="pa-stat-val" style="font-size:13px;">${vehicleNo}</p>
                </div>
            </div>
            ${isExpanded ? renderHubShipmentRows(mappedShips) : ""}
            <button class="pa-send-btn ${!hasShips ? "pa-send-btn--disabled" : ""}"
                onclick="sendPreAlert('${hubId}', '${hubName}', event)"
                ${!hasShips ? "disabled" : ""}>
                <i class="fa-solid fa-paper-plane"></i>
                ${hasShips ? `Send Pre-Alert (${mappedShips.length} shipment${mappedShips.length !== 1 ? "s" : ""})` : "No Shipments"}
            </button>
        </div>`;
        })
        .join("");
}
function renderHubShipmentRows(ships) {
    if (!ships.length)
        return `<div class="pa-shipments-section"><p style="font-size:13px;color:#94a3b8;text-align:center;padding:16px 0;">No outbound shipments for this hub yet.</p></div>`;
    return `
    <div class="pa-shipments-section">
        <p class="pa-shipments-title"><i class="fa-solid fa-boxes-stacked"></i> Outbound Shipments to this Hub</p>
        <table class="pa-ship-table">
            <thead><tr><th>TRACKING ID</th><th>ORDER ID</th><th>SOURCE</th><th>AGENCY</th><th>STATUS</th></tr></thead>
            <tbody>
                ${ships
                    .map(
                        (s) => `
                <tr>
                    <td style="font-weight:600;color:#1e293b;">${s.trackingId}</td>
                    <td style="color:#64748b;font-size:12px;">${s.orderId}</td>
                    <td>${srcBadge(s.source)}</td>
                    <td style="font-size:12px;">${s.agency}</td>
                    <td><span class="pa-status-badge"><i class="fa-solid fa-circle-check" style="color:#16a34a;font-size:10px;"></i> Out-Scanned</span></td>
                </tr>`,
                    )
                    .join("")}
            </tbody>
        </table>
    </div>`;
}
function toggleHub(hubId) {
    expandedHub = expandedHub === hubId ? null : hubId;
    renderPreAlert();
}
function sendPreAlert(hubId, hubName, e) {
    e.stopPropagation();
    const count = outboundShipments.filter(s => s.hubId === hubId).length;
    if (!count) return;
    showToast(`✓ Pre-alert sent to ${hubName} — ${count} shipment${count !== 1 ? "s" : ""} en route`);
}
function renderRTO(filter = {}, page = rtoPage) {
    rtoPage = page;
    const totalRTO = rtoData.length;
    const inTransit = rtoData.filter((r) => !['Returned to Warehouse'].includes(r.status)).length;
    const receivedStock = rtoData.filter((r) => r.status === 'Returned to Warehouse').length;

    document.getElementById("rto-total").innerHTML = totalRTO;
    document.getElementById("rto-transit").innerHTML = inTransit;
    document.getElementById("rto-received").innerHTML = receivedStock;
    let list = rtoData.filter((r) => {
        if (
            filter.search &&
            !r.trackingId.toLowerCase().includes(filter.search) &&
            !r.customer.toLowerCase().includes(filter.search) &&
            !r.orderId.toLowerCase().includes(filter.search)
        )
            return false;
        if (filter.status && r.status !== filter.status) return false;
        if (filter.reason && r.reason !== filter.reason) return false;
        return true;
    });
    const totalPages = Math.max(1, Math.ceil(list.length / RTO_PER_PAGE));
    if (rtoPage > totalPages) rtoPage = totalPages;
    const start = (rtoPage - 1) * RTO_PER_PAGE;
    const paged = list.slice(start, start + RTO_PER_PAGE);
    const tbody = document.getElementById("rto-tbody");
    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-msg">No RTO records match your filters.</td></tr>`;
        renderRTOPagination(0, 1, filter);
        return;
    }
    tbody.innerHTML = paged
        .map((r) => {
            const statusMap = {
                'RTO Initiated':               { cls: 'rto-status-transit', icon: 'fa-ban' },
                'RTO At Hub':                  { cls: 'rto-status-transit', icon: 'fa-location-dot' },
                'RTO In Transit to Warehouse': { cls: 'rto-status-transit', icon: 'fa-truck' },
                'Returned to Warehouse':       { cls: 'rto-status-received', icon: 'fa-box-archive' },
            };
            const sm = statusMap[r.status] || { cls: 'rto-status-transit', icon: 'fa-truck' };
            return `
        <tr>
            <td><strong style="color:#1e293b;">${r.trackingId}</strong><br><span style="font-size:11px;color:#94a3b8;">${r.rtoId || r.orderId}</span></td>
            <td><div style="font-weight:500;color:#1e293b;">${r.customer}</div><div style="font-size:11px;color:#94a3b8;">${r.phone}</div></td>
            <td><span class="rto-reason-badge">${r.reason}</span></td>
            <td><span class="rto-status-badge ${sm.cls}"><i class="fa-solid ${sm.icon}"></i> ${r.status}</span></td>
            <td><i class="fa-solid fa-location-dot" style="color:#94a3b8;font-size:11px;margin-right:4px;"></i>${r.lastScanned}</td>
            <td style="color:#64748b;font-size:12px;">${r.date}</td>
        </tr>`;
        })
        .join("");
    renderRTOPagination(totalPages, rtoPage, filter);

}
function renderRTOPagination(totalPages, currentPage, filter) {
    const bar = document.getElementById("rto-pagination");
    if (totalPages <= 1) {
        bar.innerHTML = "";
        return;
    }
    let html = `<span class="pg-info">Page ${currentPage} of ${totalPages}</span>`;
    html += `<button class="pg-btn" ${currentPage === 1 ? "disabled" : ""} onclick="renderRTO(${JSON.stringify(filter)}, ${currentPage - 1})"><i class="fa-solid fa-chevron-left"></i></button>`;
    for (let p = 1; p <= totalPages; p++) {
        html += `<button class="pg-btn ${p === currentPage ? "active" : ""}" onclick="renderRTO(${JSON.stringify(filter)}, ${p})">${p}</button>`;
    }
    html += `<button class="pg-btn" ${currentPage === totalPages ? "disabled" : ""} onclick="renderRTO(${JSON.stringify(filter)}, ${currentPage + 1})"><i class="fa-solid fa-chevron-right"></i></button>`;
    bar.innerHTML = html;
}
function getRTOFilters() {
    return {
        search: document.getElementById("rto-search").value.toLowerCase(),
        status: document.getElementById("rto-status-filter").value,
        reason: document.getElementById("rto-reason-filter").value,
    };
}
function initRTOFilters() {
    const s = document.getElementById("rto-search");
    if (s._rtoInit) return;
    s._rtoInit = true;
    s.addEventListener("input", () => {
        rtoPage = 1;
        renderRTO(getRTOFilters());
    });
    document.getElementById("rto-status-filter").addEventListener("change", () => {
        rtoPage = 1;
        renderRTO(getRTOFilters());
    });
    document.getElementById("rto-reason-filter").addEventListener("change", () => {
        rtoPage = 1;
        renderRTO(getRTOFilters());
    });
}
function getAvailability(productName) {
    if (!productName) return { label: "Unknown", cls: "avail-unknown", qty: null };
    const match = inventoryData.find((i) => i.itemName.trim().toLowerCase() === productName.trim().toLowerCase());
    if (!match)
        return {
            label: "Unknown",
            cls: "avail-unknown",
            qty: null,
        };
    if (match.qty === 0)
        return {
            label: "Out of Stock",
            cls: "avail-out",
            qty: 0,
        };
    if (match.qty <= 10)
        return {
            label: "Low Stock",
            cls: "avail-low",
            qty: match.qty,
        };
    return {
        label: "In Stock",
        cls: "avail-in",
        qty: match.qty,
    };
}
function srcBadge(source) {
    const map = {
        Amazon: "A",
        Shopsy: "S",
        Flipkart: "F",
        Meesho: "M",
    };
    const cls = {
        Amazon: "src-amazon",
        Shopsy: "src-shopsy",
        Flipkart: "src-flipkart",
        Meesho: "src-meesho",
    };
    return `<span class="src-badge ${cls[source] || "src-amazon"}">${map[source] || source[0]}</span>`;
}
function renderShipments(filter = {}) {
    const tbody = document.getElementById("shipment-tbody");
    let list = pendingShipments.filter((s) => {
        if (
            filter.search &&
            !s.orderId.toLowerCase().includes(filter.search) &&
            !(s.productName || '').toLowerCase().includes(filter.search) &&
            !(s.sku || '').toLowerCase().includes(filter.search) &&
            !(s.customerName || '').toLowerCase().includes(filter.search)
        )
            return false;
        if (filter.source && s.source !== filter.source) return false;
        if (filter.priority && s.priority !== filter.priority) return false;
        if (filter.stock) {
            const av = getAvailability(s.productName);
            if (filter.stock === "in" && av.label !== "In Stock") return false;
            if (filter.stock === "low" && av.label !== "Low Stock") return false;
            if (filter.stock === "out" && av.label !== "Out of Stock") return false;
        }
        return true;
    });
    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="11" class="empty-msg">No shipment requests found.</td></tr>`;
        return;
    }
    tbody.innerHTML = list
        .map((s) => {
            const avail = getAvailability(s.productName);
            const canAccept = avail.label !== "Out of Stock";
            return `
        <tr>
            <td><input type="checkbox" class="ship-checkbox" data-id="${s.orderId}" ${selectedShipmentIds.has(s.orderId) ? "checked" : ""}></td>
            <td><strong style="color:#1e293b;">#${s.orderId}</strong></td>
            <td>${srcBadge(s.source)}</td>
            <td>
                <div style="font-weight:600;color:#1e293b;font-size:13px;">${s.customerName || '—'}</div>
                <div style="font-size:11px;color:#94a3b8;">${s.customerPhone || ''}</div>
            </td>
            <td>
                <div style="font-weight:600;color:#1e293b;font-size:13px;">${s.productName}</div>
                <div style="font-size:11px;color:#94a3b8;">SKU: ${s.sku || '—'}</div>
            </td>
            <td style="font-weight:600;text-align:center;color:#334155;">${s.qty}</td>
            <td>
                <span class="avail-badge ${avail.cls}">${avail.label}</span>
                ${avail.qty !== null ? `<span style="font-size:11px;color:#94a3b8;margin-left:4px;">(${avail.qty} units)</span>` : ""}
            </td>
            <td style="color:#334155;font-size:13px;">${s.city || '—'}</td>
            <td><span class="priority-badge priority-${s.priority}">${s.priority.toUpperCase()}</span></td>
            <td style="color:#94a3b8;font-size:12px;white-space:nowrap;">${s.time}</td>
            <td>
                <button class="action-btn reject" onclick="rejectShipment('${s.orderId}')" title="Reject"><i class="fa-solid fa-xmark"></i></button>
                <button class="action-btn accept ${canAccept ? "" : "action-btn--faded"}"
                    onclick="${canAccept ? `openHubModal('${s.orderId}')` : `showToast('Cannot accept — ${s.productName} is Out of Stock.', true)`}"
                    title="${canAccept ? "Accept" : "Out of Stock — cannot accept"}">
                    <i class="fa-solid fa-check"></i>
                </button>
            </td>
        </tr>`;
        })
        .join("");
    document.querySelectorAll(".ship-checkbox").forEach((cb) => {
        cb.addEventListener("change", (e) => {
            if (e.target.checked) selectedShipmentIds.add(e.target.dataset.id);
            else selectedShipmentIds.delete(e.target.dataset.id);
            updateSelectedCount();
        });
    });
}
function updateSelectedCount() {
    const n = selectedShipmentIds.size;
    document.getElementById("selected-count").innerHTML = n;
    document.getElementById("accept-selected-btn").disabled = n === 0;
}
function getShipmentFilters() {
    return {
        search: document.getElementById("shipment-search").value.toLowerCase(),
        source: document.getElementById("filter-source").value,
        priority: document.getElementById("filter-priority").value,
        stock: document.getElementById("filter-stock").value,
    };
}
async function rejectShipment(orderId) {
    try {
        const res = await fetch(`http://localhost:8000/${warehouseId}/pendingShipments/${orderId}`, {
            method: 'DELETE',
            headers: w2dHeaders()
        });
        if (res.ok) {
            pendingShipments = pendingShipments.filter((s) => s.orderId !== orderId);
            selectedShipmentIds.delete(orderId);
            updateSelectedCount();
            renderShipments(getShipmentFilters());
            showToast(`✓ Shipment #${orderId} rejected.`);
        } else {
            showToast("Failed to reject shipment on backend.", true);
        }
    } catch(e) {
        console.error("Reject shipment err", e);
        showToast("Backend connection failed.", true);
    }
}
function openHubModal(orderId) {
    currentAcceptingOrderId = orderId;
    document.getElementById("hub-modal-order-id").innerHTML = orderId;
    document.getElementById("hub-select").innerHTML = allHubs.length 
        ? allHubs.map(h => `<option value="${h.id}">${h.name}</option>`).join('')
        : `<option value="">No hubs available</option>`;
        
    document.getElementById("agency-select").innerHTML = allAgencies.length
        ? allAgencies.map(a => `<option value="${a.id}">${a.name}</option>`).join('')
        : `<option value="">No agencies available</option>`;
        
    document.getElementById("hub-modal").classList.add("active");
}
function closeHubModal() {
    document.getElementById("hub-modal").classList.remove("active");
}
function renderOutbound() {
    const tbody = document.getElementById("outbound-tbody");
    if (!outboundShipments.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-msg">No outbound shipments yet.</td></tr>`;
        return;
    }
    tbody.innerHTML = outboundShipments
        .map((o) => {
            const driverDisplay = o.driverName || 'Unassigned';
            const initials = driverDisplay.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
            const hubDisplay = o.hubName || o.hub || o.hubId || '—';
            const agencyDisplay = o.agency || o.agencyId || '—';
            return `
        <tr>
            <td><div style="font-weight:600;color:#1e293b;">${o.trackingId}</div><div style="font-size:11px;color:#94a3b8;">${agencyDisplay}</div></td>
            <td><i class="fa-solid fa-location-dot" style="color:#94a3b8;margin-right:6px;font-size:12px;"></i>${hubDisplay}</td>
            <td>${agencyDisplay}</td>
            <td><div style="font-size:13px;color:#1e293b;">${o.departureTime}</div></td>
            <td>
                <div class="driver-cell">
                    <span class="driver-avatar">${initials}</span>
                    <div><div class="driver-name">${driverDisplay}</div><div class="driver-vehicle">${o.vehicleNo || 'N/A'}</div></div>
                </div>
            </td>
        </tr>`;
        })
        .join("");
}
function getInvStatus(qty) {
    if (qty === 0)
        return {
            label: "Critical",
            cls: "stock-crit",
        };
    if (qty <= 10)
        return {
            label: "Low Stock",
            cls: "stock-low",
        };
    return {
        label: "In Stock",
        cls: "stock-in",
    };
}
function renderInventoryOverview(filter = {}, page = invPage) {
    invPage = page;
    const all = inventoryData.filter((item) => {
        if (
            filter.search &&
            !item.itemName.toLowerCase().includes(filter.search) &&
            !item.labelId.toLowerCase().includes(filter.search)
        )
            return false;
        const s = getInvStatus(item.qty);
        if (filter.status && s.label !== filter.status) return false;
        return true;
    });
    const totalQty = inventoryData.reduce((s, i) => s + i.qty, 0);
    document.getElementById("inv-total-shipments").innerHTML = inventoryData.length;
    document.getElementById("inv-total-qty").innerHTML = totalQty.toLocaleString();
    document.getElementById("inv-low-stock").innerHTML = inventoryData.filter(
        (i) => getInvStatus(i.qty).label === "Low Stock",
    ).length;
    document.getElementById("inv-critical").innerHTML = inventoryData.filter(
        (i) => getInvStatus(i.qty).label === "Critical",
    ).length;
    const totalPages = Math.max(1, Math.ceil(all.length / INV_PER_PAGE));
    if (invPage > totalPages) invPage = totalPages;
    const start = (invPage - 1) * INV_PER_PAGE;
    const paged = all.slice(start, start + INV_PER_PAGE);
    document.getElementById("inv-showing").innerHTML = all.length
        ? `Showing ${start + 1}–${Math.min(start + INV_PER_PAGE, all.length)} of ${all.length} items`
        : "0 items";
    const maxQty = Math.max(...inventoryData.map((i) => i.qty), 1);
    const tbody = document.getElementById("inv-tbody");
    if (!all.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-msg">No items match your filter.</td></tr>`;
        renderInvPagination(0, 1, filter);
        return;
    }
    tbody.innerHTML = paged
        .map((item) => {
            const st = getInvStatus(item.qty);
            const pct = Math.min(100, Math.round((item.qty / maxQty) * 100));
            const fillCl =
                st.label === "In Stock"
                    ? "fill-green"
                    : st.label === "Low Stock"
                      ? "fill-orange"
                      : "fill-red";
            return `
        <tr>
            <td style="font-weight:500;color:#0b3c44;">${item.labelId}</td>
            <td>${item.itemName}</td>
            <td><div class="qty-bar-wrap"><strong>${item.qty}</strong><div class="qty-bar"><div class="qty-bar-fill ${fillCl}" style="width:${pct}%"></div></div></div></td>
            <td><span class="status-badge ${st.cls}">${st.label}</span></td>
            <td style="color:#94a3b8;font-size:12px;">${item.updatedAt}</td>
        </tr>`;
        })
        .join("");
    renderInvPagination(totalPages, invPage, filter);
}
function renderInvPagination(totalPages, currentPage, filter) {
    const bar = document.getElementById("inv-pagination");
    if (totalPages <= 1) {
        bar.innerHTML = "";
        return;
    }
    let html = `<span class="pg-info">Page ${currentPage} of ${totalPages}</span>`;
    html += `<button class="pg-btn" ${currentPage === 1 ? "disabled" : ""} onclick="renderInventoryOverview(${JSON.stringify(filter)}, ${currentPage - 1})"><i class="fa-solid fa-chevron-left"></i></button>`;
    for (let p = 1; p <= totalPages; p++) {
        html += `<button class="pg-btn ${p === currentPage ? "active" : ""}" onclick="renderInventoryOverview(${JSON.stringify(filter)}, ${p})">${p}</button>`;
    }
    html += `<button class="pg-btn" ${currentPage === totalPages ? "disabled" : ""} onclick="renderInventoryOverview(${JSON.stringify(filter)}, ${currentPage + 1})"><i class="fa-solid fa-chevron-right"></i></button>`;
    bar.innerHTML = html;
}
function getInvFilters() {
    return {
        search: document.getElementById("inv-search").value.toLowerCase(),
        status: document.getElementById("inv-status-filter").value,
    };
}
function renderStockTable() {
    const tbody = document.getElementById("stock-tbody");
    document.getElementById("stock-count-label").innerHTML = recentlyAddedStock.length + " items";
    if (!recentlyAddedStock.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-msg">No stock added this session yet.</td></tr>`;
        return;
    }
    tbody.innerHTML = recentlyAddedStock
        .map(
            (item, idx) => `
        <tr>
            <td style="font-weight:500;color:#0b3c44;">${item.labelId}</td>
            <td>${item.itemName}</td>
            <td><strong>${item.qty}</strong></td>
            <td style="color:#94a3b8;font-size:12px;">${item.addedAt}</td>
            <td>
                <button class="action-btn edit"   onclick="editStockItem(${idx})" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn delete" onclick="deleteStockItem(${idx})" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>`,
        )
        .join("");
}
function deleteStockItem(idx) {
    const item = recentlyAddedStock[idx];
    recentlyAddedStock.splice(idx, 1);
    inventoryData = inventoryData.filter((i) => i.labelId !== item.labelId);
    renderStockTable();
}
function editStockItem(idx) {
    const item = recentlyAddedStock[idx];
    document.getElementById("stock-label-id").value = item.labelId;
    document.getElementById("stock-item-name").value = item.itemName;
    document.getElementById("stock-qty").value = item.qty;
    deleteStockItem(idx);
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
        t.style.cssText = `position:fixed;bottom:30px;right:30px;z-index:999;background:#0b3c44;color:white;padding:12px 20px;border-radius:10px;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,0.18);transition:opacity 0.4s;font-family:'Poppins',sans-serif;`;
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
