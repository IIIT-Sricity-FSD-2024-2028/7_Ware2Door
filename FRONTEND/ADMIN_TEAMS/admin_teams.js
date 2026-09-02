const API = 'http://127.0.0.1:8000';

function getSession() {
    return JSON.parse(localStorage.getItem('at_session') || 'null');
}
function getToken() {
    return getSession()?.token || '';
}
function requireAuth() {
    if (!getToken()) {
        window.location.href = 'at_login.html';
        return false;
    }
    return true;
}

let allNodes = [];
let allDrivers = [];
let allEscalations = [];
let currentNode = null;
let currentDrvId = null;
let currentEscId = null;
let selectedFiles = [];
let addNodeFiles = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;

    const session = getSession();
    if (session?.user?.name) {
        const el = document.querySelector('.name');
        if (el) el.textContent = session.user.name;
    }

    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    ['node-start', 'drv-start'].forEach(id => { const el = document.getElementById(id); if (el) el.value = today; });
    ['node-end', 'drv-end'].forEach(id => { const el = document.getElementById(id); if (el) el.value = nextMonth; });

    showSection('partners');
    loadNodes();
});

function showSection(name) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    document.getElementById(`section-${name}`).classList.add('active');
    document.getElementById(`nav-${name}`).classList.add('active');
    const titles = { subscriptions: 'Node Partners', fleet: 'Fleet Management', analytics: 'Node Analytics', partners: 'Third Party Partners', escalation: 'Escalation Desk' };
    document.getElementById('header-title').textContent = titles[name] || '';

    if (name === 'fleet') {
        if (allNodes.length === 0) {
            loadNodes().then(() => loadDrivers());
        } else {
            loadDrivers();
        }
    }
    if (name === 'escalation') loadEscalations();
    if (name === 'analytics') loadNodePerformance();
    if (name === 'partners') loadPartners();
}

let perfData = { warehouses: [], hubs: [], agencies: [] };
let perfChartObj = null;

async function loadNodePerformance() {
    try {
        const data = await api('GET', '/admin-teams/node-performance');
        if (!data || data.error) return;
        perfData = data;
        _populatePerfDropdown('perf-select-wh', perfData.warehouses, 'name');
        _populatePerfDropdown('perf-select-hub', perfData.hubs, 'name');
        _populatePerfDropdown('perf-select-ag', perfData.agencies, 'name');
        const currentTab = document.querySelector('.perf-tab.active-tab')?.dataset.target || 'WH';
        renderPerfEntityChart(currentTab, 0);
    } catch (e) {
        console.error('loadNodePerformance error', e);
    }
}

function _populatePerfDropdown(id, items, nameField) {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = items.map((it, idx) => `<option value="${idx}">${it[nameField]}</option>`).join('');
}

function switchPerfTab(type) {
    document.querySelectorAll('.perf-tab').forEach(t => {
        const isActive = t.dataset.target === type;
        t.style.background = isActive ? 'white' : 'transparent';
        t.style.color = isActive ? '#0f172a' : '#64748b';
        t.style.boxShadow = isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none';
        if (isActive) t.classList.add('active-tab'); else t.classList.remove('active-tab');
    });
    ['WH', 'HUB', 'AG'].forEach(t => {
        const p = document.getElementById(`perf-panel-${t}`);
        if (p) p.style.display = t === type ? 'block' : 'none';
    });
    if (type === 'WH') _populatePerfDropdown('perf-select-wh', perfData.warehouses, 'name');
    if (type === 'HUB') _populatePerfDropdown('perf-select-hub', perfData.hubs, 'name');
    if (type === 'AG') _populatePerfDropdown('perf-select-ag', perfData.agencies, 'name');
    renderPerfEntityChart(type, 0);
}

function renderPerfEntityChart(type, idx) {
    const canvasId = `perfChart-${type}`;
    setTimeout(() => {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        if (perfChartObj) { perfChartObj.destroy(); perfChartObj = null; }
        let metricCards = '', labels = [], dataset1 = [], label1 = '', color1 = '', entity = null;

        if (type === 'WH') {
            entity = perfData.warehouses[idx];
            if (!entity) return;
            labels = ['Inventory', 'Pending Orders', 'RTO'];
            dataset1 = [entity.inventory, entity.pending, entity.rto];
            label1 = 'Count'; color1 = '#14b8a6';
            metricCards = `<div style="display:flex;gap:12px;margin-bottom:20px">
                <div style="flex:1;background:#f0fdfa;border:1px solid #99f6e4;padding:14px;border-radius:10px;text-align:center"><div style="font-size:11px;color:#14b8a6;font-weight:700">INVENTORY</div><div style="font-size:28px;font-weight:800;color:#0f172a">${(entity.inventory || 0).toLocaleString()}</div></div>
                <div style="flex:1;background:#fffbeb;border:1px solid #fde68a;padding:14px;border-radius:10px;text-align:center"><div style="font-size:11px;color:#f59e0b;font-weight:700">PENDING ORDERS</div><div style="font-size:28px;font-weight:800;color:#0f172a">${(entity.pending || 0).toLocaleString()}</div></div>
                <div style="flex:1;background:#fff1f2;border:1px solid #fecdd3;padding:14px;border-radius:10px;text-align:center"><div style="font-size:11px;color:#ef4444;font-weight:700">RTO</div><div style="font-size:28px;font-weight:800;color:#0f172a">${entity.rto || 0}</div></div>
            </div>`;
        } else if (type === 'HUB') {
            entity = perfData.hubs[idx];
            if (!entity) return;
            labels = ['In-Scanned', 'Out-Scanned', 'Capacity%'];
            dataset1 = [entity.inScanned, entity.outScanned, entity.capacity];
            label1 = 'Packages'; color1 = '#3b82f6';
            metricCards = `<div style="display:flex;gap:12px;margin-bottom:20px">
                <div style="flex:1;background:#eff6ff;border:1px solid #bfdbfe;padding:14px;border-radius:10px;text-align:center"><div style="font-size:11px;color:#3b82f6;font-weight:700">IN-SCANNED</div><div style="font-size:28px;font-weight:800;color:#0f172a">${(entity.inScanned || 0).toLocaleString()}</div></div>
                <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;padding:14px;border-radius:10px;text-align:center"><div style="font-size:11px;color:#22c55e;font-weight:700">OUT-SCANNED</div><div style="font-size:28px;font-weight:800;color:#0f172a">${(entity.outScanned || 0).toLocaleString()}</div></div>
                <div style="flex:1;background:#f8fafc;border:1px solid #e2e8f0;padding:14px;border-radius:10px;text-align:center"><div style="font-size:11px;color:#64748b;font-weight:700">CAPACITY</div><div style="font-size:28px;font-weight:800;color:#0f172a">${entity.capacity || 0}%</div></div>
            </div>`;
        } else if (type === 'AG') {
            entity = perfData.agencies[idx];
            if (!entity) return;
            labels = ['Delivered Today', 'RTO Raised', 'Active Agents'];
            dataset1 = [entity.deliveredToday, entity.rtoRaised, entity.agents];
            label1 = 'Count'; color1 = '#22c55e';
            metricCards = `<div style="display:flex;gap:12px;margin-bottom:20px">
                <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;padding:14px;border-radius:10px;text-align:center"><div style="font-size:11px;color:#22c55e;font-weight:700">DELIVERED TODAY</div><div style="font-size:28px;font-weight:800;color:#0f172a">${(entity.deliveredToday || 0).toLocaleString()}</div></div>
                <div style="flex:1;background:#fff1f2;border:1px solid #fecdd3;padding:14px;border-radius:10px;text-align:center"><div style="font-size:11px;color:#ef4444;font-weight:700">RTO RAISED</div><div style="font-size:28px;font-weight:800;color:#0f172a">${entity.rtoRaised || 0}</div></div>
                <div style="flex:1;background:#eff6ff;border:1px solid #bfdbfe;padding:14px;border-radius:10px;text-align:center"><div style="font-size:11px;color:#3b82f6;font-weight:700">ACTIVE AGENTS</div><div style="font-size:28px;font-weight:800;color:#0f172a">${entity.agents || 0}</div></div>
            </div>`;
        }

        const cardContainer = document.getElementById(`perf-metric-cards-${type}`);
        if (cardContainer) cardContainer.innerHTML = metricCards;

        perfChartObj = new Chart(ctx, {
            type: 'bar',
            data: { labels, datasets: [{ label: label1, data: dataset1, backgroundColor: color1, borderRadius: 6 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } },
        });
    }, 80);
}



function doLogout() {
    if (!confirm('Logout from Admin Teams portal?')) return;
    localStorage.removeItem('at_session');
    window.location.href = 'at_login.html';
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.addEventListener('click', e => { if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open'); });

function toast(msg, type = 'success') {
    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${msg}</span><button class="toast-close" onclick="this.parentElement.remove()">&times;</button>`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 4500);
}

async function api(method, path, body = null, isForm = false) {
    const token = JSON.parse(localStorage.getItem('at_session') || 'null')?.token || '';
    const opts = {
        method,
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${token}` },
    };
    if (body && !isForm) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
    }
    if (isForm) opts.body = body;
    const res = await fetch(API + path, opts);
    if (res.status === 401) {
        localStorage.removeItem('at_session');
        window.location.href = 'at_login.html';
        return {};
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || `Request failed (${res.status})`);
    return data;
}


async function loadNodes() {
    document.getElementById('node-grid').innerHTML =
        '<div class="loading-placeholder"><i class="fa-solid fa-spinner fa-spin"></i> Loading nodes…</div>';
    try {
        const data = await api('GET', '/admin-teams/nodes');
        allNodes = Array.isArray(data) ? data : [];
        renderNodeGrid(allNodes);
        updateNodeStats();
        updateBadge('badge-sub', allNodes.length);
        populateNodeSelectors();
    } catch (e) {
        document.getElementById('node-grid').innerHTML =
            `<div class="loading-placeholder"><i class="fa-solid fa-triangle-exclamation" style="color:var(--red)"></i> ${e.message}<br><small>Make sure the backend is running on port 8000</small></div>`;
        toast(e.message, 'error');
    }
}

function updateNodeStats() {
    const wh = allNodes.filter(n => n._type === 'WAREHOUSE').length;
    const hub = allNodes.filter(n => n._type === 'TRANSIT_HUB').length;
    const ag = allNodes.filter(n => n._type === 'LOCAL_AGENCY').length;
    const inactive = allNodes.filter(n => n.isActive === false).length;
    const expired = allNodes.filter(n => isExpired(n.subscription?.endDate)).length;
    document.getElementById('stat-wh').textContent = wh;
    document.getElementById('stat-hub').textContent = hub;
    document.getElementById('stat-agency').textContent = ag;
    document.getElementById('stat-inactive').textContent = inactive;
    document.getElementById('stat-expired').textContent = expired;
}

function isExpired(endDate) {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
}

function filterNodes() {
    const q = document.getElementById('sub-search').value.toLowerCase();
    const type = document.getElementById('sub-type-filter').value;
    const status = document.getElementById('sub-status-filter').value;
    const filtered = allNodes.filter(n => {
        const matchQ = !q || (n.name || '').toLowerCase().includes(q) || (n.city || '').toLowerCase().includes(q) || (n.email || '').toLowerCase().includes(q);
        const matchT = !type || n._type === type;
        let matchS = true;
        if (status === 'active') matchS = n.isActive !== false && !isExpired(n.subscription?.endDate);
        if (status === 'inactive') matchS = n.isActive === false;
        if (status === 'expired') matchS = isExpired(n.subscription?.endDate);
        return matchQ && matchT && matchS;
    });
    renderNodeGrid(filtered);
}

function renderNodeGrid(nodes) {
    const grid = document.getElementById('node-grid');
    if (!nodes.length) {
        grid.innerHTML = '<div class="loading-placeholder"><i class="fa-solid fa-circle-info"></i> No nodes found.</div>';
        return;
    }

    grid.innerHTML = nodes.map(n => {
        const sub = n.subscription || {};
        const expired = isExpired(sub.endDate);
        const active = n.isActive !== false;

        const iconCls = { WAREHOUSE: 'fa-warehouse node-card-icon--wh', TRANSIT_HUB: 'fa-building node-card-icon--hub', LOCAL_AGENCY: 'fa-truck-fast node-card-icon--ag' };
        const ic = iconCls[n._type] || 'fa-circle';
        const stripe = !active ? '' : (expired ? '<div class="nc-expired-stripe"></div>' : '<div class="nc-active-stripe"></div>');

        let statusHtml = '';
        if (!active) statusHtml = '<span class="sub-status sub-expired"><i class="fa-solid fa-ban"></i> Inactive</span>';
        else if (expired) statusHtml = '<span class="sub-status sub-expired"><i class="fa-solid fa-circle-xmark"></i> Expired</span>';
        else statusHtml = '<span class="sub-status sub-active"><i class="fa-solid fa-circle-check"></i> Active</span>';

        const typeLabel = { WAREHOUSE: 'Warehouse', TRANSIT_HUB: 'Transit Hub', LOCAL_AGENCY: 'Local Agency' }[n._type] || n._type;
        const typeCls = { WAREHOUSE: 'type--warehouse', TRANSIT_HUB: 'type--hub', LOCAL_AGENCY: 'type--agency' }[n._type] || '';
        const docs = n.legalDocs?.length || 0;

        return `<div class="node-card${active ? '' : ' inactive'}" onclick="openNodeDetail('${n.id}')">
            ${stripe}
            <div class="node-card-top">
                <div class="node-card-icon fa-solid ${ic}"></div>
                <div class="node-card-badges">
                    <span class="type-badge ${typeCls}">${typeLabel}</span>
                    ${statusHtml}
                </div>
            </div>
            <p class="node-card-name">${n.name}</p>
            <p class="node-card-city"><i class="fa-solid fa-location-dot" style="color:var(--text-light);margin-right:4px"></i>${n.city || '—'}</p>
            <div class="node-card-divider"></div>
            <div class="node-card-meta">
                <div class="node-card-rate">₹${(sub.monthlyRate || 0).toLocaleString()}<small>/mo</small></div>
                <div class="node-card-end">
                    <div style="font-size:10px;color:var(--text-light)">UNTIL</div>
                    <div>${sub.endDate ? formatDate(sub.endDate) : '—'}</div>
                    <div style="margin-top:4px;font-size:10px;color:var(--text-light)">${docs} doc${docs !== 1 ? 's' : ''}</div>
                </div>
            </div>
        </div>`;
    }).join('');
}

function openNodeDetail(nodeId) {
    currentNode = allNodes.find(n => n.id === nodeId);
    if (!currentNode) return;
    const n = currentNode;
    const sub = n.subscription || {};

    document.getElementById('nd-title').textContent = n.name;
    document.getElementById('nd-id-label').textContent = `ID: ${n.id}`;

    const typeLabel = { WAREHOUSE: 'Warehouse', TRANSIT_HUB: 'Transit Hub', LOCAL_AGENCY: 'Local Agency' }[n._type] || n._type;
    const typeCls = { WAREHOUSE: 'type--warehouse', TRANSIT_HUB: 'type--hub', LOCAL_AGENCY: 'type--agency' }[n._type] || '';
    document.getElementById('nd-type-badge').className = `type-badge ${typeCls}`;
    document.getElementById('nd-type-badge').textContent = typeLabel;

    const active = n.isActive !== false;
    const expired = isExpired(sub.endDate);
    const ab = document.getElementById('nd-active-badge');
    ab.className = `sub-status ${active ? 'sub-active' : 'sub-expired'}`;
    ab.innerHTML = active ? '<i class="fa-solid fa-circle-check"></i> Active' : '<i class="fa-solid fa-ban"></i> Inactive';

    const sb = document.getElementById('nd-sub-status-badge');
    if (!sub.endDate) { sb.className = 'sub-status sub-expiring'; sb.innerHTML = '<i class="fa-solid fa-clock"></i> No Subscription'; }
    else if (expired) { sb.className = 'sub-status sub-expired'; sb.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Subscription Expired'; }
    else { sb.className = 'sub-status sub-active'; sb.innerHTML = '<i class="fa-solid fa-circle-check"></i> Subscription Valid'; }

    document.getElementById('nd-name').textContent = n.name;
    document.getElementById('nd-email').textContent = n.email || '—';
    document.getElementById('nd-phone').textContent = n.phone || '—';
    document.getElementById('nd-city').textContent = n.city || '—';
    document.getElementById('nd-address').textContent = n.address || '—';
    document.getElementById('nd-sub-start').textContent = formatDate(sub.startDate);
    document.getElementById('nd-sub-end').textContent = formatDate(sub.endDate);
    document.getElementById('nd-rate').textContent = sub.monthlyRate ? `₹${Number(sub.monthlyRate).toLocaleString()}/month` : '—';
    const docs = n.legalDocs || [];
    document.getElementById('nd-docs-count').textContent = docs.length ? `${docs.length} file(s)` : 'No documents uploaded';

    const gal = document.getElementById('nd-docs-gallery');
    if (docs.length) {
        gal.innerHTML = docs.map(d => `
            <div class="doc-chip">
                <i class="fa-solid fa-file-pdf"></i>
                <div><span>${d.name}</span><br><small>${formatDate(d.uploadedAt)}</small></div>
            </div>`).join('');
    } else {
        gal.innerHTML = '<span style="font-size:12px;color:var(--text-light)">No documents yet.</span>';
    }

    const toggleBtn = document.getElementById('btn-toggle-active');
    if (active) {
        toggleBtn.className = 'btn-toggle deactivate';
        toggleBtn.innerHTML = '<i class="fa-solid fa-ban"></i> Deactivate Node';
    } else {
        toggleBtn.className = 'btn-toggle activate';
        toggleBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Reactivate Node';
    }

    openModal('modal-node-detail');
}

function openExtendSub() {
    if (!currentNode) return;
    document.getElementById('ext-sub-node-name').textContent = `Node: ${currentNode.name}`;
    const sub = currentNode.subscription || {};
    const defaultEnd = sub.endDate
        ? new Date(new Date(sub.endDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    document.getElementById('ext-end-date').value = defaultEnd;
    document.getElementById('ext-rate').value = sub.monthlyRate || '';
    openModal('modal-extend-sub');
}

async function submitExtendSub() {
    const endDate = document.getElementById('ext-end-date').value;
    const monthlyRate = +document.getElementById('ext-rate').value;
    if (!endDate) { toast('Please select an end date.', 'warning'); return; }
    try {
        await api('PUT', `/admin-teams/nodes/${currentNode.id}/subscription`, { endDate, monthlyRate });
        toast('Subscription extended!', 'success');
        closeModal('modal-extend-sub');
        await loadNodes();
        if (currentNode) openNodeDetail(currentNode.id);
    } catch (e) { toast(e.message, 'error'); }
}

async function toggleActive() {
    if (!currentNode) return;
    const wasActive = currentNode.isActive !== false;
    const newState = !wasActive;
    const action = newState ? 'Reactivate' : 'Deactivate';
    if (!confirm(`${action} "${currentNode.name}"?`)) return;
    try {
        await api('PUT', `/admin-teams/nodes/${currentNode.id}/status`, { isActive: newState });
        toast(`Node ${newState ? 'reactivated' : 'deactivated'} successfully.`, newState ? 'success' : 'warning');
        await loadNodes();
        currentNode = allNodes.find(n => n.id === currentNode.id);
        if (currentNode) openNodeDetail(currentNode.id);
    } catch (e) { toast(e.message, 'error'); }
}

function handleAddNodeFileSelect(files) { addNodeFiles = [...addNodeFiles, ...Array.from(files)]; renderAddNodeFileList(); }
function handleAddNodeDrop(e) { e.preventDefault(); e.currentTarget.classList.remove('dragover'); handleAddNodeFileSelect(e.dataTransfer.files); }
function removeAddNodeFile(idx) { addNodeFiles.splice(idx, 1); renderAddNodeFileList(); }

function renderAddNodeFileList() {
    document.getElementById('add-node-file-list').innerHTML = addNodeFiles.map((f, i) => `
        <div class="file-item">
            <i class="fa-solid fa-file"></i>
            <span>${f.name}</span>
            <small style="color:var(--text-light)">${(f.size / 1024).toFixed(1)} KB</small>
            <button type="button" class="rm" onclick="removeAddNodeFile(${i})">&times;</button>
        </div>`).join('');
}

async function submitAddNode(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-add-node-submit');
    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating…';
    const body = {
        role: document.getElementById('node-type').value,
        name: document.getElementById('node-name').value,
        email: document.getElementById('node-email').value,
        password: document.getElementById('node-password').value,
        phone: document.getElementById('node-phone').value,
        address: document.getElementById('node-address').value,
        city: document.getElementById('node-city').value,
        lat: document.getElementById('node-lat').value || null,
        lng: document.getElementById('node-lng').value || null,
        subscription: {
            tier: 'Starter',
            monthlyRate: +document.getElementById('node-rate').value,
            startDate: document.getElementById('node-start').value,
            endDate: document.getElementById('node-end').value,
        },
    };
    try {
        const createRes = await api('POST', '/admin-teams/nodes', body);

        if (addNodeFiles.length > 0 && createRes.node && createRes.node.id) {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading Docs…';
            const form = new FormData();
            addNodeFiles.forEach(f => form.append('files', f));
            await api('POST', `/admin-teams/nodes/${createRes.node.id}/legal-docs`, form, true);
        }

        toast('Node created successfully!', 'success');
        closeModal('modal-add-node');
        document.getElementById('form-add-node').reset();
        addNodeFiles = [];
        renderAddNodeFileList();
        await loadNodes();
    } catch (e) { toast(e.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check"></i> Create Node'; }
}

function openUploadDocs() {
    if (!currentNode) return;
    selectedFiles = [];
    document.getElementById('upload-docs-node-name').textContent = `Node: ${currentNode.name}`;
    document.getElementById('selected-file-list').innerHTML = '';
    document.getElementById('legal-file-input').value = '';

    const docs = currentNode.legalDocs || [];
    const sec = document.getElementById('existing-docs-section');
    const gal = document.getElementById('existing-docs-gallery');
    if (docs.length > 0) {
        sec.style.display = 'block';
        gal.innerHTML = docs.map(d => `
            <div class="doc-chip">
                <i class="fa-solid fa-file-pdf"></i>
                <div><span>${d.name}</span><br><small>${formatDate(d.uploadedAt)}</small></div>
            </div>`).join('');
    } else {
        sec.style.display = 'none';
    }
    openModal('modal-upload-docs');
}

function handleFileSelect(files) { selectedFiles = [...selectedFiles, ...Array.from(files)]; renderFileList(); }
function handleDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('dragover'); }
function handleDrop(e) { e.preventDefault(); e.currentTarget.classList.remove('dragover'); handleFileSelect(e.dataTransfer.files); }
function removeFile(idx) { selectedFiles.splice(idx, 1); renderFileList(); }

function renderFileList() {
    document.getElementById('selected-file-list').innerHTML = selectedFiles.map((f, i) => `
        <div class="file-item">
            <i class="fa-solid fa-file"></i>
            <span>${f.name}</span>
            <small style="color:var(--text-light)">${(f.size / 1024).toFixed(1)} KB</small>
            <button class="rm" onclick="removeFile(${i})">&times;</button>
        </div>`).join('');
}

async function submitUploadDocs() {
    if (!selectedFiles.length) { toast('Please select at least one file.', 'warning'); return; }
    if (!currentNode) return;
    const btn = document.getElementById('btn-upload-submit');
    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading…';
    const form = new FormData();
    selectedFiles.forEach(f => form.append('files', f));
    try {
        await api('POST', `/admin-teams/nodes/${currentNode.id}/legal-docs`, form, true);
        toast(`${selectedFiles.length} file(s) uploaded!`, 'success');
        closeModal('modal-upload-docs');
        selectedFiles = [];
        await loadNodes();
        currentNode = allNodes.find(n => n.id === currentNode.id);
        if (currentNode) openNodeDetail(currentNode.id);
    } catch (e) { toast(e.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-upload"></i> Upload Files'; }
}


async function loadDrivers() {
    try {
        const data = await api('GET', '/admin-teams/drivers');
        allDrivers = Array.isArray(data) ? data : [];
        renderDriverTable(allDrivers);
        updateDriverStats();
        updateBadge('badge-fleet', allDrivers.length);
    } catch (e) {
        document.getElementById('fleet-table-body').innerHTML =
            `<tr><td colspan="9" class="empty-msg"><i class="fa-solid fa-triangle-exclamation" style="color:var(--red)"></i> ${e.message}</td></tr>`;
        toast(e.message, 'error');
    }
}

function updateDriverStats() {
    const total = allDrivers.length;
    const active = allDrivers.filter(d => d.subscription?.endDate && new Date(d.subscription.endDate) > new Date()).length;
    const whHub = allDrivers.filter(d => d.fromNodeType === 'WAREHOUSE').length;
    const hubAg = allDrivers.filter(d => d.fromNodeType === 'TRANSIT_HUB').length;
    document.getElementById('stat-drivers').textContent = total;
    document.getElementById('stat-active-drv').textContent = active;
    document.getElementById('stat-drv-wh-hub').textContent = whHub;
    document.getElementById('stat-drv-hub-agency').textContent = hubAg;
}

function filterDrivers() {
    const q = document.getElementById('fleet-search').value.toLowerCase();
    const vehicle = document.getElementById('fleet-vehicle-filter').value;
    const filtered = allDrivers.filter(d => {
        const matchQ = !q || (d.name || '').toLowerCase().includes(q) || (d.phone || '').includes(q) || (d.licenseNo || '').toLowerCase().includes(q);
        const matchV = !vehicle || d.vehicleType === vehicle;
        return matchQ && matchV;
    });
    renderDriverTable(filtered);
}

function renderDriverTable(drivers) {
    document.getElementById('fleet-count-label').textContent = `(${drivers.length})`;
    const tbody = document.getElementById('fleet-table-body');
    if (!drivers.length) { tbody.innerHTML = '<tr><td colspan="9" class="empty-msg">No drivers found.</td></tr>'; return; }
    tbody.innerHTML = drivers.map(d => {
        const sub = d.subscription || {};
        const isActive = sub.endDate && new Date(sub.endDate) > new Date();
        const statusHtml = isActive
            ? '<span class="sub-status sub-active"><i class="fa-solid fa-circle-check"></i> Active</span>'
            : '<span class="sub-status sub-expired"><i class="fa-solid fa-circle-xmark"></i> Expired</span>';
        const vIcon = { Bike: 'fa-motorcycle', Van: 'fa-van-shuttle', Truck: 'fa-truck', Auto: 'fa-car-side' }[d.vehicleType] || 'fa-car';
        return `<tr>
            <td><strong>${d.name}</strong><br><span style="font-size:11px;color:var(--text-light)">${d.id}</span></td>
            <td>${d.phone}</td>
            <td><code style="font-size:12px;background:#f1f5f9;padding:2px 6px;border-radius:4px">${d.licenseNo}</code></td>
            <td><i class="fa-solid ${vIcon}" style="color:var(--purple);margin-right:4px"></i>${d.vehicleType}</td>
            <td>
                <div class="route-display">
                    <span class="node-chip">${d.fromNodeName || d.fromNodeId}</span>
                    <i class="fa-solid fa-arrow-right"></i>
                    <span class="node-chip">${d.toNodeName || d.toNodeId}</span>
                </div>
            </td>
            <td><strong>₹${(sub.monthlyFee || 0).toLocaleString()}/mo</strong></td>
            <td>${formatDate(sub.endDate)}</td>
            <td>${statusHtml}</td>
            <td>
                <button class="action-btn edit" onclick="openEditDriver('${d.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn delete" onclick="deleteDriver('${d.id}','${d.name}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('');
}

function populateNodeSelectors() {
    const warehouses = allNodes.filter(n => n._type === 'WAREHOUSE');
    const hubs = allNodes.filter(n => n._type === 'TRANSIT_HUB');
    const agencies = allNodes.filter(n => n._type === 'LOCAL_AGENCY');
    const fromSel = document.getElementById('drv-from-node');
    fromSel.innerHTML = '<option value="">Select origin node…</option>'
        + '<optgroup label="Warehouses">' + warehouses.map(n => `<option value="${n.id}" data-type="WAREHOUSE" data-name="${n.name}">${n.name} — ${n.city}</option>`).join('') + '</optgroup>'
        + '<optgroup label="Transit Hubs">' + hubs.map(n => `<option value="${n.id}" data-type="TRANSIT_HUB" data-name="${n.name}">${n.name} — ${n.city}</option>`).join('') + '</optgroup>';
    updateToNodeOptions();
}

function updateToNodeOptions() {
    const fromSel = document.getElementById('drv-from-node');
    const fromType = fromSel.options[fromSel.selectedIndex]?.dataset?.type || '';
    const hubs = allNodes.filter(n => n._type === 'TRANSIT_HUB');
    const agencies = allNodes.filter(n => n._type === 'LOCAL_AGENCY');
    const toSel = document.getElementById('drv-to-node');
    toSel.innerHTML = '<option value="">Select destination node…</option>';
    if (fromType === 'WAREHOUSE') {
        toSel.innerHTML += '<optgroup label="Transit Hubs">' + hubs.map(n => `<option value="${n.id}" data-type="TRANSIT_HUB">${n.name} — ${n.city}</option>`).join('') + '</optgroup>';
    } else {
        toSel.innerHTML += '<optgroup label="Local Agencies">' + agencies.map(n => `<option value="${n.id}" data-type="LOCAL_AGENCY">${n.name} — ${n.city}</option>`).join('') + '</optgroup>';
    }
}

async function submitAddDriver(e) {
    e.preventDefault();
    const fromSel = document.getElementById('drv-from-node');
    const toSel = document.getElementById('drv-to-node');
    const fromOpt = fromSel.options[fromSel.selectedIndex];
    const toOpt = toSel.options[toSel.selectedIndex];
    const body = {
        name: document.getElementById('drv-name').value,
        phone: document.getElementById('drv-phone').value,
        licenseNo: document.getElementById('drv-license').value,
        vehicleType: document.getElementById('drv-vehicle').value,
        fromNodeId: fromSel.value,
        fromNodeType: fromOpt?.dataset?.type || 'WAREHOUSE',
        toNodeId: toSel.value,
        toNodeType: toOpt?.dataset?.type || 'TRANSIT_HUB',
        startDate: document.getElementById('drv-start').value,
        endDate: document.getElementById('drv-end').value,
        monthlyFee: +document.getElementById('drv-fee').value,
    };
    try {
        await api('POST', '/admin-teams/drivers', body);
        toast('Driver registered!', 'success');
        closeModal('modal-add-driver');
        document.getElementById('form-add-driver').reset();
        await loadDrivers();
    } catch (e) { toast(e.message, 'error'); }
}

function openEditDriver(id) {
    currentDrvId = id;
    const d = allDrivers.find(x => x.id === id);
    if (!d) return;
    document.getElementById('edit-drv-id-label').textContent = `Driver ID: ${d.id}`;
    document.getElementById('edit-drv-name').value = d.name;
    document.getElementById('edit-drv-phone').value = d.phone;
    document.getElementById('edit-drv-license').value = d.licenseNo;
    document.getElementById('edit-drv-vehicle').value = d.vehicleType;
    document.getElementById('edit-drv-fee').value = d.subscription?.monthlyFee || '';
    document.getElementById('edit-drv-end').value = d.subscription?.endDate?.split('T')[0] || '';
    openModal('modal-edit-driver');
}

async function submitEditDriver() {
    const body = {
        name: document.getElementById('edit-drv-name').value,
        phone: document.getElementById('edit-drv-phone').value,
        licenseNo: document.getElementById('edit-drv-license').value,
        vehicleType: document.getElementById('edit-drv-vehicle').value,
        monthlyFee: +document.getElementById('edit-drv-fee').value,
        endDate: document.getElementById('edit-drv-end').value,
    };
    try {
        await api('PUT', `/admin-teams/drivers/${currentDrvId}`, body);
        toast('Driver updated!', 'success');
        closeModal('modal-edit-driver');
        await loadDrivers();
    } catch (e) { toast(e.message, 'error'); }
}

async function deleteDriver(id, name) {
    if (!confirm(`Remove driver "${name}" from fleet?`)) return;
    try {
        await api('DELETE', `/admin-teams/drivers/${id}`);
        toast(`Driver "${name}" removed.`, 'success');
        await loadDrivers();
    } catch (e) { toast(e.message, 'error'); }
}


async function loadEscalations() {
    try {
        const data = await api('GET', '/admin-teams/escalations');
        allEscalations = Array.isArray(data) ? data : [];
        renderEscTable(allEscalations);
        updateEscStats();
        updateBadge('badge-esc', allEscalations.filter(t => t.escalationStatus !== 'Resolved').length);
    } catch (e) {
        document.getElementById('esc-table-body').innerHTML =
            `<tr><td colspan="9" class="empty-msg"><i class="fa-solid fa-triangle-exclamation" style="color:var(--red)"></i> ${e.message}</td></tr>`;
        toast(e.message, 'error');
    }
}

function updateEscStats() {
    document.getElementById('stat-esc-total').textContent = allEscalations.length;
    document.getElementById('stat-esc-reviewing').textContent = allEscalations.filter(t => t.escalationStatus === 'Reviewing').length;
    document.getElementById('stat-esc-resolved').textContent = allEscalations.filter(t => t.escalationStatus === 'Resolved').length;
    document.getElementById('stat-esc-high').textContent = allEscalations.filter(t => t.priority === 'High').length;
}

function filterEscalations() {
    const q = document.getElementById('esc-search').value.toLowerCase();
    const priority = document.getElementById('esc-priority-filter').value;
    const status = document.getElementById('esc-status-filter').value;
    const filtered = allEscalations.filter(t => {
        const matchQ = !q || (t.ticketId || '').toLowerCase().includes(q) || (t.trackingId || '').toLowerCase().includes(q) || (t.agencyId || '').toLowerCase().includes(q) || (t.subject || '').toLowerCase().includes(q);
        return matchQ && (!priority || t.priority === priority) && (!status || t.escalationStatus === status);
    });
    renderEscTable(filtered);
}

function renderEscTable(tickets) {
    document.getElementById('esc-count-label').textContent = `(${tickets.length})`;
    const tbody = document.getElementById('esc-table-body');
    if (!tickets.length) { tbody.innerHTML = '<tr><td colspan="9" class="empty-msg"><i class="fa-solid fa-circle-check" style="color:var(--green)"></i> All clear — no escalated tickets!</td></tr>'; return; }
    tbody.innerHTML = tickets.map(t => {
        const pCls = { High: 'priority-high', Medium: 'priority-medium', Low: 'priority-low' }[t.priority] || 'priority-low';
        const eCls = { Pending: 'esc-pending', Reviewing: 'esc-reviewing', Resolved: 'esc-resolved' }[t.escalationStatus] || 'esc-pending';
        return `<tr>
            <td><strong>${t.ticketId}</strong></td>
            <td><code style="font-size:11px;background:#f1f5f9;padding:2px 5px;border-radius:4px">${t.trackingId}</code></td>
            <td><span class="agency-tag"><i class="fa-solid fa-truck-fast"></i> ${t.agencyId || '—'}</span></td>
            <td style="max-width:180px;font-size:12px">${t.subject}</td>
            <td><span class="priority-badge ${pCls}">${t.priority}</span></td>
            <td style="font-size:12px">${formatDate(t.escalatedAt || t.raisedAt)}</td>
            <td><span class="esc-status ${eCls}">${t.escalationStatus || 'Pending'}</span></td>
            <td style="max-width:160px;font-size:11px;color:var(--text-muted)">${t.escalationNote || '—'}</td>
            <td>
                <button class="action-btn edit" onclick="openUpdateEsc('${t.ticketId}')"><i class="fa-solid fa-pen"></i></button>
                ${t.escalationStatus !== 'Resolved' ? `<button class="action-btn resolve" onclick="quickResolveEsc('${t.ticketId}')"><i class="fa-solid fa-check-double"></i></button>` : ''}
            </td>
        </tr>`;
    }).join('');
}

function openUpdateEsc(ticketId) {
    currentEscId = ticketId;
    document.getElementById('esc-ticket-id-label').textContent = `Ticket: ${ticketId}`;
    const t = allEscalations.find(x => x.ticketId === ticketId);
    if (t) {
        document.getElementById('esc-new-status').value = t.escalationStatus || 'Pending';
        document.getElementById('esc-assign').value = t.escalationAssignedTo || '';
        document.getElementById('esc-resolution-note').value = t.resolutionNote || '';
    }
    openModal('modal-update-esc');
}

async function submitUpdateEsc() {
    const escStatus = document.getElementById('esc-new-status').value;
    try {
        await api('PUT', `/admin-teams/escalations/${currentEscId}`, {
            escalationStatus: escStatus,
            escalationAssignedTo: document.getElementById('esc-assign').value,
            resolutionNote: document.getElementById('esc-resolution-note').value,
            status: escStatus === 'Resolved' ? 'Resolved' : 'Escalated',
        });
        toast('Escalation updated!', 'success');
        closeModal('modal-update-esc');
        await loadEscalations();
    } catch (e) { toast(e.message, 'error'); }
}

async function quickResolveEsc(ticketId) {
    if (!confirm(`Mark ticket ${ticketId} as Resolved?`)) return;
    try {
        await api('PUT', `/admin-teams/escalations/${ticketId}`, { escalationStatus: 'Resolved', status: 'Resolved' });
        toast(`Ticket ${ticketId} resolved!`, 'success');
        await loadEscalations();
    } catch (e) { toast(e.message, 'error'); }
}

function formatDate(str) {
    if (!str) return '—';
    try { return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return str; }
}

function updateBadge(id, count) {
    const el = document.getElementById(id);
    if (el) el.textContent = count;
}

/* ─── THIRD PARTY PARTNERS ─── */
let allPartners = [];

async function loadPartners() {
    try {
        const data = await api('GET', '/admin-teams/partners');
        if (!data || data.error) return;
        allPartners = Array.isArray(data) ? data : data.partners || [];
        updatePartnersStats();
        filterPartners();
    } catch (e) {
        console.error('Failed to load partners', e);
        document.getElementById('tp-table-body').innerHTML = `<tr><td colspan="8" class="empty-msg"><i class="fa-solid fa-triangle-exclamation"></i> Error loading partners</td></tr>`;
    }
}

function updatePartnersStats() {
    let active = 0, inactive = 0, usage = 0;
    allPartners.forEach(p => {
        if (p.isActive) active++; else inactive++;
        usage += p.currentMonthUsage || 0;
    });
    document.getElementById('stat-tp-total').textContent = allPartners.length;
    document.getElementById('stat-tp-active').textContent = active;
    document.getElementById('stat-tp-inactive').textContent = inactive;
    document.getElementById('stat-tp-usage').textContent = usage.toLocaleString();
}

function filterPartners() {
    const tbody = document.getElementById('tp-table-body');
    const term = document.getElementById('tp-search').value.toLowerCase();
    const tier = document.getElementById('tp-tier-filter').value;
    const status = document.getElementById('tp-status-filter').value;

    const filtered = allPartners.filter(p => {
        const matchTerm = !term || p.name.toLowerCase().includes(term) || p.email.toLowerCase().includes(term);
        const matchTier = !tier || p.tier === tier;
        const matchStatus = !status || (status === 'active' ? p.isActive : !p.isActive);
        return matchTerm && matchTier && matchStatus;
    });

    document.getElementById('tp-count-label').textContent = `(Showing ${filtered.length})`;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-msg">No partners found</td></tr>`;
        return;
    }

    const tierColors = {
        Starter: { bg: '#f1f5f9', color: '#475569' },
        Growth: { bg: '#e0e7ff', color: '#4338ca' },
        Business: { bg: '#fef3c7', color: '#b45309' },
        Enterprise: { bg: '#fee2e2', color: '#b91c1c' }
    };

    tbody.innerHTML = filtered.map(p => {
        const tColor = tierColors[p.tier] || tierColors.Starter;
        const tierBadge = `<span style="background:${tColor.bg};color:${tColor.color};padding:4px 8px;border-radius:4px;font-size:12px;font-weight:600">${p.tier}</span>`;
        const activeBadge = p.isActive
            ? `<span style="background:#dcfce7;color:#166534;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:600"><i class="fa-solid fa-circle-check" style="margin-right:4px"></i>Active</span>`
            : `<span style="background:#fee2e2;color:#991b1b;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:600"><i class="fa-solid fa-circle-pause" style="margin-right:4px"></i>Inactive</span>`;

        const limit = p.tierLimits?.maxShipmentsPerMonth || 100;
        const usagePct = Math.min(100, Math.round(((p.currentMonthUsage || 0) / limit) * 100));
        const usageBarColor = usagePct > 90 ? '#ef4444' : usagePct > 70 ? '#f59e0b' : '#3b82f6';

        const apiKeyPreview = p.apiKey ? `${p.apiKey.slice(0, 10)}...${p.apiKey.slice(-4)}` : 'N/A';

        return `
        <tr>
            <td>
                <div style="font-weight:600;color:#0f172a">${p.name}</div>
                <div style="font-size:12px;color:#64748b">${p.email}</div>
            </td>
            <td>${tierBadge}</td>
            <td>
                <div style="display:flex;align-items:center;gap:6px">
                    <span style="font-family:monospace;background:#f1f5f9;padding:2px 6px;border-radius:4px;color:#475569;font-size:12px">${apiKeyPreview}</span>
                    <button title="View API Key" onclick="showApiKey('${p.apiKey}')" style="background:transparent;border:none;cursor:pointer;color:#6366f1"><i class="fa-solid fa-eye"></i></button>
                    <button title="Regenerate Key" onclick="regenerateApiKey('${p.id}')" style="background:transparent;border:none;cursor:pointer;color:#ef4444"><i class="fa-solid fa-rotate-right"></i></button>
                </div>
            </td>
            <td>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;font-size:12px;font-weight:500">
                    <span>${(p.currentMonthUsage || 0).toLocaleString()} / ${limit.toLocaleString()}</span>
                    <span>${usagePct}%</span>
                </div>
                <div style="width:100%;height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden">
                    <div style="height:100%;width:${usagePct}%;background:${usageBarColor}"></div>
                </div>
            </td>
            <td>
                <div style="font-size:13px">${p.contact?.name || 'N/A'}</div>
                <div style="font-size:12px;color:#64748b">${p.contact?.phone || 'N/A'}</div>
            </td>
            <td style="font-size:13px">${new Date(p.createdAt).toLocaleDateString()}</td>
            <td>${activeBadge}</td>
            <td>
                <div class="action-btn-group">
                    <button class="btn-ghost" onclick="togglePartnerStatus('${p.id}', ${!p.isActive})" title="${p.isActive ? 'Deactivate' : 'Activate'}"><i class="fa-solid ${p.isActive ? 'fa-ban' : 'fa-check'}"></i></button>
                    <button class="btn-ghost" onclick="deletePartner('${p.id}')" style="color:#ef4444" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

async function submitAddPartner() {
    const err = document.getElementById('tp-add-error');
    err.style.display = 'none';

    const payload = {
        name: document.getElementById('tp-name').value.trim(),
        email: document.getElementById('tp-email').value.trim(),
        address: document.getElementById('tp-address').value.trim(),
        contactName: document.getElementById('tp-contact-name').value.trim(),
        contactPhone: document.getElementById('tp-contact-phone').value.trim(),
        tier: document.getElementById('tp-tier').value
    };

    if (!payload.name || !payload.email || !payload.tier) {
        err.textContent = 'Please fill all required fields.';
        err.style.display = 'block';
        return;
    }

    try {
        const res = await api('POST', '/admin-teams/partners', payload);
        if (res.error) throw new Error(res.error);

        closeModal('modal-add-partner');

        // Reset form
        document.getElementById('tp-name').value = '';
        document.getElementById('tp-email').value = '';
        document.getElementById('tp-address').value = '';
        document.getElementById('tp-contact-name').value = '';
        document.getElementById('tp-contact-phone').value = '';
        document.getElementById('tp-tier').value = 'Starter';

        showToast('success', 'Partner added successfully.');
        loadPartners();

        if (res.partner && res.partner.apiKey) {
            showApiKey(res.partner.apiKey);
        }
    } catch (e) {
        err.textContent = e.message;
        err.style.display = 'block';
    }
}

async function togglePartnerStatus(id, isActive) {
    if (!confirm(`Are you sure you want to ${isActive ? 'activate' : 'deactivate'} this partner?`)) return;
    try {
        const res = await api('PUT', `/admin-teams/partners/${id}/status`, { isActive });
        if (res.error) throw new Error(res.error);
        showToast('success', `Partner ${isActive ? 'activated' : 'deactivated'} successfully.`);
        loadPartners();
    } catch (e) {
        showToast('error', e.message);
    }
}

async function deletePartner(id) {
    if (!confirm('Are you sure you want to completely remove this partner? This action cannot be undone.')) return;
    try {
        const res = await api('DELETE', `/admin-teams/partners/${id}`);
        if (res.error) throw new Error(res.error);
        showToast('success', 'Partner deleted successfully.');
        loadPartners();
    } catch (e) {
        showToast('error', e.message);
    }
}

async function regenerateApiKey(id) {
    if (!confirm('Regenerating the API key will invalidate the current one immediately. Are you sure?')) return;
    try {
        const res = await api('PUT', `/admin-teams/partners/${id}/regenerate-key`);
        if (res.error) throw new Error(res.error);
        showToast('success', 'API key regenerated successfully.');
        loadPartners();
        showApiKey(res.apiKey);
    } catch (e) {
        showToast('error', e.message);
    }
}

function showApiKey(key) {
    document.getElementById('modal-api-key-value').textContent = key;
    openModal('modal-api-key');
}

function copyApiKey() {
    const key = document.getElementById('modal-api-key-value').textContent;
    navigator.clipboard.writeText(key).then(() => {
        showToast('success', 'API Key copied to clipboard');
    }).catch(() => {
        showToast('error', 'Failed to copy API key');
    });
}
