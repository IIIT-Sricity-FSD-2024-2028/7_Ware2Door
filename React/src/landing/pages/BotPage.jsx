import React, { useState, useEffect, useRef } from "react";
import logoImg from "../assets/logo.png";
import {
  normalizeIdentifier,
  validateTrackingId,
} from "../../utils/inputValidation.js";

const API = "http://127.0.0.1:8000";

const STANDARD_REPLY = `Thanks for reaching out! 🙏<br>Our AI assistant is currently being set up — a <strong>live support agent</strong> will get back to you shortly.<br>For urgent help, call us at <strong>8977568680</strong> or submit a support ticket.`;

const statusIdxMap = {
  "Order Received": 0,
  "Picked and Packed": 0,
  "Shipment Dispatched": 0,
  "In Scan at Transit Hub": 1,
  "Out Scan at Transit Hub": 1,
  "Outscan at Transit Hub": 1,
  "In Scan at Local Delivery Agency": 2,
  "Out for Delivery": 2,
  Delivered: 3,
};

function getTimelineSteps(status) {
  const currentStage = statusIdxMap[status] ?? 0;
  return [
    {
      title: "Warehouse",
      desc: currentStage > 0 ? "Dispatched" : "Processing",
    },
    {
      title: "Transit Hub",
      desc:
        currentStage > 1
          ? "Departed"
          : currentStage === 1
            ? "In transit"
            : "Pending",
    },
    {
      title: "Local Agency",
      desc:
        currentStage > 2
          ? "Dispatched"
          : currentStage === 2
            ? "Out for delivery"
            : "Pending",
    },
    { title: "Delivered", desc: currentStage === 3 ? "Completed" : "Pending" },
  ].map((step, idx) => {
    let stateClass = "";
    let iconClass = "";
    if (idx < currentStage || (idx === 3 && currentStage === 3)) {
      stateClass = "done";
      iconClass = "fa-solid fa-check";
    } else if (idx === currentStage) {
      stateClass = "active";
      iconClass =
        idx === 0
          ? "fa-solid fa-warehouse"
          : idx === 1
            ? "fa-solid fa-truck-fast"
            : idx === 3
              ? "fa-solid fa-house"
              : "fa-solid fa-location-dot";
    } else {
      iconClass =
        idx === 1
          ? "fa-solid fa-truck-fast"
          : idx === 2
            ? "fa-solid fa-location-dot"
            : "fa-solid fa-house";
    }
    return { ...step, stateClass, iconClass };
  });
}

export default function BotPage({ navigate }) {
  const [step, setStep] = useState("modal");
  const [modalInput, setModalInput] = useState("");
  const [modalError, setModalError] = useState("");
  const [shake, setShake] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [shipmentInfo, setShipmentInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current)
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, isTyping]);

  function setModalErrorWithShake(msg) {
    setModalError(msg);
    if (msg) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }

  async function attemptStart() {
    const val = normalizeIdentifier(modalInput);
    const formatError = validateTrackingId(val);
    if (formatError) {
      setModalErrorWithShake(formatError);
      return;
    }
    setModalError("Validating...");
    try {
      const res = await fetch(
        `${API}/tickets/validate/${encodeURIComponent(val)}?t=${Date.now()}`,
      );
      const result = await res.json();
      if (!result.valid) {
        setModalErrorWithShake(
          "Tracking ID not found. Please check and try again.",
        );
        return;
      }
      setModalError("");
      setTrackingId(val);
      setShipmentInfo({
        productName: result.productName,
        status: result.status,
      });
      setStep("chat");
      setTimeout(() => {
        addAiMessage(
          `Hello! 👋 I'm your <strong>LogisticsAI Assistant</strong>.<br>I can see you're tracking shipment <strong>#${val}</strong>.<br>Product: <strong>${result.productName}</strong> — Status: <strong>${result.status}</strong><br>How can I help you today?`,
        );
      }, 300);
    } catch (_) {
      setModalErrorWithShake("Could not connect to server. Please try again.");
    }
  }

  function addAiMessage(html) {
    const ts = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages((prev) => [
      ...prev,
      { html, who: "ai", ts: "LogisticsAI · " + ts },
    ]);
  }

  function addUserMessage(text) {
    const ts = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages((prev) => [
      ...prev,
      { html: text, who: "user", ts: "You · " + ts },
    ]);
  }

  function sendMessage() {
    const text = userInput.trim();
    if (!text) return;
    setUserInput("");
    addUserMessage(text);
    setIsTyping(true);
    setTimeout(
      () => {
        setIsTyping(false);
        addAiMessage(STANDARD_REPLY);
      },
      1000 + Math.random() * 500,
    );
  }

  function sendQuickReply(msg) {
    addUserMessage(msg);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addAiMessage(STANDARD_REPLY);
    }, 1000);
  }

  function clearChat() {
    setMessages([]);
    setTimeout(
      () =>
        addAiMessage(
          `Chat cleared. Still here for <strong>#${trackingId}</strong> — ask me anything!`,
        ),
      200,
    );
  }

  const timelineSteps = shipmentInfo
    ? getTimelineSteps(shipmentInfo.status)
    : [];

  if (step === "modal") {
    return (
      <div className="modal-backdrop" id="modal-backdrop">
        <div className="modal-card" id="modal-card">
          <div className="modal-orb modal-orb-1"></div>
          <div className="modal-orb modal-orb-2"></div>
          <div className="modal-logo">
            <img src={logoImg} alt="Ware2Door" />
          </div>
          <div className="modal-icon">
            <i className="fa-solid fa-truck-fast"></i>
          </div>
          <h2>Track your shipment</h2>
          <p>
            Enter your Tracking ID to start a personalized support session with
            our AI assistant.
          </p>
          <div
            className={`modal-input-wrap${shake ? " shake" : ""}`}
            id="modal-input-wrap"
          >
            <i className="fa-solid fa-barcode"></i>
            <input
              type="text"
              id="modal-tracking-input"
              placeholder="e.g. TRK4001"
              autoComplete="off"
              spellCheck={false}
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") attemptStart();
              }}
            />
          </div>
          <p className="modal-error" id="modal-error">
            {modalError}
          </p>
          <div className="modal-hint">
            <span className="hint-label">Try these IDs:</span>
            {["TRK4001", "TRK4006", "TRK4011"].map((id) => (
              <span
                key={id}
                className="hint-chip"
                onClick={() => {
                  setModalInput(id);
                  setModalError("");
                }}
              >
                {id}
              </span>
            ))}
          </div>
          <button className="modal-btn" id="modal-btn" onClick={attemptStart}>
            <i className="fa-solid fa-arrow-right"></i> Start Chat
          </button>
          <a
            href="#"
            className="modal-back"
            onClick={(e) => {
              e.preventDefault();
              navigate("customer");
            }}
          >
            ← Back to Support
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-app" id="chat-app" style={{ display: "flex" }}>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("landing");
            }}
          >
            <img src={logoImg} alt="Ware2Door Logo" id="logo" />
          </a>
        </div>
        <div className="shipment-panel">
          <div className="shipment-panel-header">
            <i className="fa-solid fa-box"></i>
            <span>Active Shipment</span>
          </div>
          <div className="trk-badge" id="sidebar-trk">
            #{trackingId}
          </div>
          <div className="info-row">
            <div className="info-icon">
              <i className="fa-regular fa-calendar"></i>
            </div>
            <div className="info-text">
              <span className="info-label">Est. Delivery</span>
              <span className="info-val t1">
                {shipmentInfo?.productName || "—"}
              </span>
              <span className="info-sub t2">{shipmentInfo?.status || "—"}</span>
            </div>
          </div>
          <div className="info-row">
            <div className="info-icon">
              <i className="fa-solid fa-building"></i>
            </div>
            <div className="info-text">
              <span className="info-label">Shipper</span>
              <span className="info-val t3">{trackingId}</span>
            </div>
          </div>
        </div>
        <div className="status-timeline">
          {timelineSteps.map((s, i) => (
            <div key={i} className={`step ${s.stateClass}`}>
              <div className="step-dot">
                <i className={s.iconClass}></i>
              </div>
              <div className="step-text">
                <strong>{s.title}</strong>
                <span>{s.desc}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
          <a
            href="#"
            className="sidebar-action"
            onClick={(e) => {
              e.preventDefault();
              navigate("ticket");
            }}
          >
            <i className="fa-solid fa-ticket"></i> Submit a Ticket
          </a>
          <a
            href="#"
            className="sidebar-action"
            onClick={(e) => {
              e.preventDefault();
              navigate("faq");
            }}
          >
            <i className="fa-solid fa-circle-question"></i> Browse FAQs
          </a>
        </div>
      </aside>

      <main className="chat-area">
        <div className="chat-header">
          <a
            href="#"
            className="header-back"
            onClick={(e) => {
              e.preventDefault();
              navigate("customer");
            }}
          >
            <i className="fa-solid fa-arrow-left"></i>
          </a>
          <div className="header-bot-info">
            <div className="bot-avatar-sm">
              <i className="fa-solid fa-robot"></i>
            </div>
            <div>
              <h1>LogisticsAI Assistant</h1>
              <p className="online-status">
                <span className="dot"></span> Online — responds instantly
              </p>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="icon-btn"
              title="Clear chat"
              id="clearBtn"
              onClick={clearChat}
            >
              <i className="fa-solid fa-rotate-right"></i>
            </button>
          </div>
        </div>

        <div className="messages" id="messages" ref={messagesRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`msg-row ${msg.who}`}>
              <div className={`avatar ${msg.who === "ai" ? "ai" : "user-av"}`}>
                {msg.who === "ai" ? <i className="fa-solid fa-robot"></i> : "U"}
              </div>
              <div className="bubble-wrap">
                <div
                  className="bubble"
                  dangerouslySetInnerHTML={{ __html: msg.html }}
                ></div>
                <div className="ts">{msg.ts}</div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="msg-row ai typing-row" id="typing-indicator">
              <div className="avatar ai">
                <i className="fa-solid fa-robot"></i>
              </div>
              <div className="bubble-wrap">
                <div className="typing-bubble">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="quick-replies" id="quick-replies">
          <span className="qr-label">Quick questions:</span>
          {[
            { msg: "Where is my package right now?", label: "📍 Location" },
            {
              msg: "When will my order be delivered?",
              label: "📅 Delivery time",
            },
            {
              msg: "I want to reschedule my delivery.",
              label: "🔄 Reschedule",
            },
            { msg: "My package might be damaged.", label: "📦 Damage report" },
            { msg: "How do I initiate a return?", label: "↩️ Return" },
          ].map((q, i) => (
            <button
              key={i}
              className="qr-chip"
              onClick={() => sendQuickReply(q.msg)}
            >
              {q.label}
            </button>
          ))}
        </div>

        <div className="input-bar">
          <div className="input-wrap">
            <input
              id="userInput"
              type="text"
              placeholder="Type your message…"
              autoComplete="off"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <button className="attach-btn" title="Attach file">
              <i className="fa-solid fa-paperclip"></i>
            </button>
          </div>
          <button id="sendBtn" onClick={sendMessage}>
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </main>
    </div>
  );
}
