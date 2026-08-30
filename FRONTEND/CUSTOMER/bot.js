"use strict";

const API = 'http://localhost:8000';

let trackingId = "";
let shipmentInfo = null;
const backdrop = document.getElementById("modal-backdrop");
const modalInput = document.getElementById("modal-tracking-input");
const modalBtn = document.getElementById("modal-btn");
const modalError = document.getElementById("modal-error");
const modalWrap = document.getElementById("modal-input-wrap");
const chatApp = document.getElementById("chat-app");
const STANDARD_REPLY = `Thanks for reaching out! 🙏<br>
   Our AI assistant is currently being set up — a <strong>live support agent</strong> will get back to you shortly.<br>
   For urgent help, call us at <strong>8977568680</strong> or <a href="ticket.html">submit a support ticket</a>.`;
const messagesEl = document.getElementById("messages");

document.querySelectorAll(".hint-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
        modalInput.value = chip.dataset.id;
        modalInput.focus();
        setModalError("");
    });
});
document.querySelectorAll(".qr-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
        addMessage(chip.dataset.msg, "user");
        showTyping();
        setTimeout(() => {
            hideTyping();
            addMessage(STANDARD_REPLY, "ai");
        }, 1000);
    });
});
modalInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") attemptStart();
});
modalBtn.addEventListener("click", attemptStart);
document.getElementById("sendBtn").addEventListener("click", sendMessage);
document.getElementById("userInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
});
document.getElementById("clearBtn").addEventListener("click", () => {
    messagesEl.innerHTML = "";
    setTimeout(
        () =>
            addMessage(
                `Chat cleared. Still here for <strong>#${trackingId}</strong> — ask me anything!`,
                "ai",
            ),
        200,
    );
});

function setModalError(msg) {
    modalError.textContent = msg;
    if (msg) {
        modalWrap.classList.add("shake");
        modalWrap.addEventListener("animationend", () => modalWrap.classList.remove("shake"), {
            once: true,
        });
    }
}

async function attemptStart() {
    const val = modalInput.value.trim().toUpperCase();
    if (!val) {
        setModalError("Please enter your Tracking ID to continue.");
        return;
    }


    setModalError("Validating...");

    try {
        const res = await fetch(`${API}/tickets/validate/${val}?t=${Date.now()}`);
        const result = await res.json();

        if (!result.valid) {
            setModalError("Tracking ID not found. Please check and try again.");
            modalInput.select();
            return;
        }

        setModalError("");
        trackingId = val;
        shipmentInfo = {
            productName: result.productName,
            status: result.status,
        };

        backdrop.style.transition = "opacity 0.4s ease";
        backdrop.style.opacity = "0";
        setTimeout(() => {
            backdrop.style.display = "none";
            chatApp.style.display = "flex";
            initChat();
        }, 400);
    } catch (e) {
        setModalError("Could not connect to server. Please try again.");
    }
}

function initChat() {
    document.getElementById("sidebar-trk").textContent = "#" + trackingId;
    
    const t1 = document.querySelector(".t1");
    const t2 = document.querySelector(".t2");
    const t3 = document.querySelector(".t3");
    if (t1) t1.textContent = shipmentInfo.productName;
    if (t2) t2.textContent = shipmentInfo.status;
    if (t3) t3.textContent = trackingId;


    const statusIdxMap = {
        'Order Received': 0,
        'Picked and Packed': 0,
        'Shipment Dispatched': 0,
        'In Scan at Transit Hub': 1,
        'Out Scan at Transit Hub': 1,
        'Outscan at Transit Hub': 1,
        'In Scan at Local Delivery Agency': 2,
        'Out for Delivery': 2,
        'Delivered': 3
    };
    const currentStage = statusIdxMap[shipmentInfo.status] ?? 0;
    
    const timelineHtml = [
        { title: 'Warehouse', desc: currentStage > 0 ? 'Dispatched' : 'Processing' },
        { title: 'Transit Hub', desc: currentStage > 1 ? 'Departed' : (currentStage === 1 ? 'In transit' : 'Pending') },
        { title: 'Local Agency', desc: currentStage > 2 ? 'Dispatched' : (currentStage === 2 ? 'Out for delivery' : 'Pending') },
        { title: 'Delivered', desc: currentStage === 3 ? 'Completed' : 'Pending' }
    ].map((step, idx) => {
        let stateClass = '';
        let icon = '';
        if (idx < currentStage || (idx === 3 && currentStage === 3)) {
            stateClass = 'done';
            icon = '<i class="fa-solid fa-check"></i>';
        } else if (idx === currentStage) {
            stateClass = 'active';
            icon = idx === 0 ? '<i class="fa-solid fa-warehouse"></i>' : 
                   idx === 1 ? '<i class="fa-solid fa-truck-fast"></i>' :
                   '<i class="fa-solid fa-location-dot"></i>';
        } else {
            icon = idx === 1 ? '<i class="fa-solid fa-truck-fast"></i>' : 
                   idx === 2 ? '<i class="fa-solid fa-location-dot"></i>' :
                   '<i class="fa-solid fa-house"></i>';
        }
        return `
          <div class="step ${stateClass}">
            <div class="step-dot">${icon}</div>
            <div class="step-text">
              <strong>${step.title}</strong>
              <span>${step.desc}</span>
            </div>
          </div>
        `;
    }).join('');

    const timelineContainer = document.querySelector('.status-timeline');
    if (timelineContainer) timelineContainer.innerHTML = timelineHtml;

    setTimeout(() => {
        addMessage(
            `Hello! 👋 I'm your <strong>LogisticsAI Assistant</strong>.<br>
       I can see you're tracking shipment <strong>#${trackingId}</strong>.<br>
       Product: <strong>${shipmentInfo.productName}</strong> — Status: <strong>${shipmentInfo.status}</strong><br>
       How can I help you today?`,
            "ai",
        );
    }, 300);
}

function addMessage(html, who) {
    const row = document.createElement("div");
    row.className = `msg-row ${who}`;
    const av = document.createElement("div");
    av.className = `avatar ${who === "ai" ? "ai" : "user-av"}`;
    av.innerHTML = who === "ai" ? '<i class="fa-solid fa-robot"></i>' : "U";
    const wrap = document.createElement("div");
    wrap.className = "bubble-wrap";
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = html;
    const ts = document.createElement("div");
    ts.className = "ts";
    const now = new Date();
    ts.textContent =
        (who === "ai" ? "LogisticsAI · " : "You · ") +
        now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    wrap.appendChild(bubble);
    wrap.appendChild(ts);
    row.appendChild(av);
    row.appendChild(wrap);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function showTyping() {
    const row = document.createElement("div");
    row.className = "msg-row ai typing-row";
    row.id = "typing-indicator";
    const av = document.createElement("div");
    av.className = "avatar ai";
    av.innerHTML = '<i class="fa-solid fa-robot"></i>';
    const bw = document.createElement("div");
    bw.className = "bubble-wrap";
    const tb = document.createElement("div");
    tb.className = "typing-bubble";
    for (let i = 0; i < 3; i++) {
        const d = document.createElement("div");
        d.className = "typing-dot";
        tb.appendChild(d);
    }
    bw.appendChild(tb);
    row.appendChild(av);
    row.appendChild(bw);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function hideTyping() {
    const el = document.getElementById("typing-indicator");
    if (el) el.remove();
}

function sendMessage() {
    const input = document.getElementById("userInput");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    addMessage(text, "user");
    showTyping();
    setTimeout(
        () => {
            hideTyping();
            addMessage(STANDARD_REPLY, "ai");
        },
        1000 + Math.random() * 500,
    );
}
