const API = 'http://localhost:8000';

const track_btn = document.querySelector('.tracker');
const input = document.querySelector('.searcher');
let currentTrackingId = null;
let pollingInterval = null;
let lastStatus = null;

window.addEventListener('DOMContentLoaded', () => {
    const storedTID = localStorage.getItem('TID');
    if (storedTID) {
        input.value = storedTID;
        AutoTrack(storedTID);
    }
});

track_btn.addEventListener('click', () => TriggerTrack());
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') TriggerTrack(); });

function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

function startPolling(tracking_id) {
    stopPolling();
    pollingInterval = setInterval(async () => {
        const data = await fetchTrackingData(tracking_id, true);
        if (!data) return;

        if (data.status !== lastStatus) {
            lastStatus = data.status;
            renderResults(tracking_id, data);
            showStatusToast(data.status);
        }
    }, 15000);
}

function showStatusToast(status) {
    let toast = document.getElementById('rt-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'rt-toast';
        toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1a1a2e;color:#f4a32a;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.4);z-index:9999;transition:opacity 0.4s;';
        document.body.appendChild(toast);
    }
    toast.textContent = '🔄 Status updated: ' + status;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 4000);
}

async function TriggerTrack() {
    const tracking_id = input.value.trim();
    if (!tracking_id) { alert('Enter Tracking ID'); return; }
    input.value = '';
    stopPolling();
    const data = await fetchTrackingData(tracking_id);
    if (!data) return;
    currentTrackingId = tracking_id;
    lastStatus = data.status;
    renderResults(tracking_id, data);
    startPolling(tracking_id);
}

async function AutoTrack(tracking_id) {
    const data = await fetchTrackingData(tracking_id);
    if (!data) {
        localStorage.removeItem('TID');
        return;
    }
    currentTrackingId = tracking_id;
    lastStatus = data.status;
    renderResults(tracking_id, data);
    startPolling(tracking_id);
}

async function fetchTrackingData(tracking_id, silent = false) {
    try {
        const res = await fetch(`${API}/track/${tracking_id}?t=${Date.now()}`);
        const data = await res.json();
        if (data.error) {
            if (!silent) alert('Tracking ID not found!');
            return null;
        }
        return data;
    } catch (e) {
        if (!silent) alert('Could not connect to server. Please try again.');
        return null;
    }
}

function renderResults(tracking_id, data) {
    document.querySelector('.empty-state').style.display = 'none';
    document.querySelector('.result-section').style.display = 'block';
    document.querySelector('.footer').style.display = 'block';
    GiveSummary(tracking_id, data);
    GiveTracking(data.lat, data.lng);
    GiveJourney(data.statusSteps, !!data.isRTO);
    GiveLog(data.statusSteps);
}


function GiveTracking(lat, lng) {
    const container = document.querySelector('.live-tracking');
    container.innerHTML = `
        <h2 class="map-title">Live Tracking</h2>
        <iframe src="https://www.google.com/maps?q=${lat},${lng}&z=13&output=embed" width="100%" height="400" style="border:0; border-radius: 9px;" loading="lazy"></iframe>
    `;
}

function GiveSummary(tracking_id, data) {
    const container = document.querySelector('.tracking-summary');
    container.innerHTML = '';
    const currentStep = data.statusSteps.find(s => s.current);
    const status = currentStep ? currentStep.label : data.status;
    const div = document.createElement('div');

    if (data.isRTO) {
        div.innerHTML = `
            <div class="summary-top">
                <div class="details">
                    <h2>Tracking ID: ${tracking_id}</h2>
                    <p>RTO ID: <strong>${data.rtoId}</strong></p>
                    <p>Product: ${data.productName || '—'}</p>
                    <p style="color:#ef4444;font-size:13px;margin-top:4px;">Reason: ${data.reason || '—'}</p>
                </div>
                <div class="status-pill" style="background:#ef4444;">${status}</div>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-bottom">
                <div class="box">
                    <span>Return Status</span>
                    <h3>${data.status}</h3>
                </div>
                <div class="box">
                    <span>Customer</span>
                    <h3>${data.customerName || '—'}</h3>
                </div>
                <div class="box">
                    <span>Return Type</span>
                    <h3>RTO</h3>
                </div>
            </div>
        `;
    } else {
        div.innerHTML = `
            <div class="summary-top">
                <div class="details">
                    <h2>Tracking ID: ${tracking_id}</h2>
                    <p>Product: ${data.productName}</p>
                </div>
                <div class="status-pill">${status}</div>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-bottom">
                <div class="box">
                    <span>Origin</span>
                    <h3>${data.warehouseName || data.warehouseId}</h3>
                </div>
                <div class="box">
                    <span>Transit Hub</span>
                    <h3>${data.hubName || data.hubId}</h3>
                </div>
                <div class="box">
                    <span>Destination</span>
                    <h3>${data.agencyName || data.agencyId}</h3>
                </div>
            </div>
        `;
    }
    container.appendChild(div);
}

function GiveJourney(statusSteps, isRTO = false) {
    const container = document.querySelector('.shipment-journey');
    container.innerHTML = isRTO ? '<h1>Return Journey</h1>' : '<h1>Shipment Journey</h1>';

    const defaultDescriptions = {
        'Order Received': 'Your order has been received and confirmed',
        'Picked and Packed': 'Package has been picked from inventory and packed for shipping',
        'Shipment Dispatched': 'Package has left the warehouse and is en route to the transit hub',
        'In Scan at Transit Hub': 'Package arrived at the regional transit hub for sorting',
        'Outscan at Transit Hub': 'Package has been sorted and dispatched from the transit hub',
        'In Scan at Local Delivery Agency': 'Package has arrived at the local delivery center near you',
        'Out for Delivery': 'Package is out for delivery with your local delivery agent',
        'Delivered': 'Package successfully delivered to destination'
    };

    statusSteps.forEach((step) => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        const statusClass = step.current ? 'current' : step.done ? 'done' : 'pending';
        const desc = step.desc || defaultDescriptions[step.label] || '';
        let refundHtml = '';
        if (step.refundNote && step.done) {
            refundHtml = `
                <div style="margin-top:10px;padding:10px 14px;background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:8px;border-left:3px solid #f59e0b;">
                    <p style="margin:0;font-size:12px;color:#92400e;font-weight:600;">💳 Prepaid Refund Info</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#78350f;">For prepaid orders, your refund will be credited within <strong>5–7 business working days</strong> to your original payment method.</p>
                </div>`;
        }
        div.innerHTML = `
            <div class="timeline-icon ${statusClass}">
                <img src="${step.icon}.png"/>
            </div>
            <div class="timeline-content">
                <h3>${step.label}</h3>
                <p style="font-size: 0.85rem; color: #94a3b8; margin: 4px 0;">${desc}</p>
                ${refundHtml}
                <span>${step.time ? fmtDate(step.time) : ''}</span>
            </div>
        `;
        container.appendChild(div);
    });
}


function GiveLog(statusSteps) {
    const container = document.querySelector('.event-log');
    let rows = '';
    statusSteps.forEach((step) => {
        if (step.done) {

            const time = step.time ? fmtDate(step.time) : '—';
            rows += `
                <div class="log-row">
                    <div>${time}</div>
                    <div>${step.label}</div>
                </div>
            `;
        }
    });
    container.innerHTML = `
        <h1 class="log-title">Detailed Event Log</h1>
        <div class="log-table">
            <div class="log-header">
                <div>Date &amp; Time</div>
                <div>Event</div>
            </div>
            <div class="log-body">${rows || '<div style="padding:16px;color:#94a3b8;">No events logged yet.</div>'}</div>
        </div>
    `;
}

function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}
