import React, { useState, useEffect, useRef } from "react";
import Footer from "../components/Footer.jsx";
import logoImg from "../assets/logo.png";
import trackImg from "../assets/track.png";
import checkImg from "../assets/check.png";
import boxImg from "../assets/box.png";
import truckImg from "../assets/truck.png";
import locationImg from "../assets/location.png";
import vanImg from "../assets/van.png";
import homeImg from "../assets/home.png";
import {
  normalizeIdentifier,
  validateTrackingId,
} from "../../utils/inputValidation.js";

const API = "http://127.0.0.1:8000";

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

const defaultDescriptions = {
  "Order Received": "Your order has been received and confirmed",
  "Picked and Packed":
    "Package has been picked from inventory and packed for shipping",
  "Shipment Dispatched":
    "Package has left the warehouse and is en route to the transit hub",
  "In Scan at Transit Hub":
    "Package arrived at the regional transit hub for sorting",
  "Outscan at Transit Hub":
    "Package has been sorted and dispatched from the transit hub",
  "In Scan at Local Delivery Agency":
    "Package has arrived at the local delivery center near you",
  "Out for Delivery":
    "Package is out for delivery with your local delivery agent",
  Delivered: "Package successfully delivered to destination",
};

const statusIcons = {
  check: checkImg,
  box: boxImg,
  truck: truckImg,
  location: locationImg,
  van: vanImg,
  home: homeImg,
};

export default function TrackPage({ navigate }) {
  const [inputVal, setInputVal] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const pollingRef = useRef(null);
  const lastStatusRef = useRef(null);
  const lastLookupErrorRef = useRef(null);
  const autoTrackStartedRef = useRef(false);

  useEffect(() => {
    function onScroll() {
      const h = document.getElementById("main-header");
      if (h) h.classList.toggle("scrolled", window.scrollY > 50);
    }
    window.addEventListener("scroll", onScroll);

    const stored = localStorage.getItem("TID");
    if (stored && !autoTrackStartedRef.current) {
      autoTrackStartedRef.current = true;
      setInputVal(stored);
      autoTrack(stored);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      stopPolling();
    };
  }, []);

  function stopPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  function startPolling(tid) {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      const data = await fetchTrackingData(tid, true);
      if (!data) return;
      if (data.status !== lastStatusRef.current) {
        lastStatusRef.current = data.status;
        setResult({ tid, data });
        showStatusToast(data.status);
      }
    }, 15000);
  }

  function showStatusToast(status) {
    let toast = document.getElementById("rt-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "rt-toast";
      toast.style.cssText =
        "position:fixed;bottom:24px;right:24px;background:#1a1a2e;color:#f4a32a;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.4);z-index:9999;transition:opacity 0.4s;";
      document.body.appendChild(toast);
    }
    toast.textContent = "🔄 Status updated: " + status;
    toast.style.opacity = "1";
    setTimeout(() => {
      toast.style.opacity = "0";
    }, 4000);
  }

  async function fetchTrackingData(tid, silent = false) {
    lastLookupErrorRef.current = null;
    try {
      const res = await fetch(`${API}/track/${tid}?t=${Date.now()}`);
      if (!res.ok) {
        if (res.status === 429) {
          lastLookupErrorRef.current = "temporary";
          if (!silent)
            alert(
              "Tracking service is temporarily rate-limited. Please wait a few minutes and try again.",
            );
        } else if (res.status === 404) {
          lastLookupErrorRef.current = "not-found";
          if (!silent)
            alert(
              `No shipment found for Tracking ID "${tid}". Please verify and try again.`,
            );
        } else if (!silent) {
          lastLookupErrorRef.current = "temporary";
          alert(
            "Tracking service is temporarily unavailable. Please try again.",
          );
        }
        return null;
      }
      const data = await res.json();
      if (!data || data.error || !data.trackingId) {
        lastLookupErrorRef.current = "not-found";
        if (!silent)
          alert(
            data?.message ||
              `No shipment found for Tracking ID "${tid}". Please verify and try again.`,
          );
        return null;
      }
      return data;
    } catch (_) {
      lastLookupErrorRef.current = "temporary";
      if (!silent)
        alert(
          "Could not connect to tracking server. Please check your network connection.",
        );
      return null;
    }
  }

  async function triggerTrack() {
    const tid = normalizeIdentifier(inputVal);
    const validationError = validateTrackingId(tid, { allowRto: true });
    if (validationError) {
      alert(validationError);
      return;
    }
    setInputVal("");
    stopPolling();
    setLoading(true);
    const data = await fetchTrackingData(tid);
    setLoading(false);
    if (!data) return;
    lastStatusRef.current = data.status;
    setResult({ tid, data });
    startPolling(tid);
  }

  async function autoTrack(tid) {
    const normalizedId = normalizeIdentifier(tid);
    if (validateTrackingId(normalizedId, { allowRto: true })) {
      localStorage.removeItem("TID");
      return;
    }
    const data = await fetchTrackingData(normalizedId);
    if (!data) {
      if (lastLookupErrorRef.current === "not-found")
        localStorage.removeItem("TID");
      return;
    }
    lastStatusRef.current = data.status;
    setResult({ tid: normalizedId, data });
    startPolling(normalizedId);
  }

  function renderSummary(tid, data) {
    const currentStep = data.statusSteps?.find((s) => s.current);
    const status = currentStep ? currentStep.label : data.status;
    if (data.isRTO) {
      return (
        <div>
          <div className="summary-top">
            <div className="details">
              <h2>Tracking ID: {tid}</h2>
              <p>
                RTO ID: <strong>{data.rtoId}</strong>
              </p>
              <p>Product: {data.productName || "—"}</p>
              <p
                style={{ color: "#ef4444", fontSize: "13px", marginTop: "4px" }}
              >
                Reason: {data.reason || "—"}
              </p>
            </div>
            <div className="status-pill" style={{ background: "#ef4444" }}>
              {status}
            </div>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-bottom">
            <div className="box">
              <span>Return Status</span>
              <h3>{data.status}</h3>
            </div>
            <div className="box">
              <span>Customer</span>
              <h3>{data.customerName || "—"}</h3>
            </div>
            <div className="box">
              <span>Return Type</span>
              <h3>RTO</h3>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div>
        <div className="summary-top">
          <div className="details">
            <h2>Tracking ID: {tid}</h2>
            <p>Product: {data.productName}</p>
          </div>
          <div className="status-pill">{status}</div>
        </div>
        <div className="summary-divider"></div>
        <div className="summary-bottom">
          <div className="box">
            <span>Origin</span>
            <h3>{data.warehouseName || data.warehouseId}</h3>
          </div>
          <div className="box">
            <span>Transit Hub</span>
            <h3>{data.hubName || data.hubId}</h3>
          </div>
          <div className="box">
            <span>Destination</span>
            <h3>{data.agencyName || data.agencyId}</h3>
          </div>
        </div>
      </div>
    );
  }

  function renderJourney(statusSteps, isRTO) {
    return (
      <div className="shipment-journey">
        <h1>{isRTO ? "Return Journey" : "Shipment Journey"}</h1>
        {(statusSteps || []).map((step, i) => {
          const statusClass = step.current
            ? "current"
            : step.done
              ? "done"
              : "pending";
          const desc = step.desc || defaultDescriptions[step.label] || "";
          return (
            <div key={i} className="timeline-item">
              <div className={`timeline-icon ${statusClass}`}>
                <img src={statusIcons[step.icon] || statusIcons.check} alt="" />
              </div>
              <div className="timeline-content">
                <h3>{step.label}</h3>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "#94a3b8",
                    margin: "4px 0",
                  }}
                >
                  {desc}
                </p>
                {step.refundNote && step.done && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "10px 14px",
                      background: "linear-gradient(135deg,#fef3c7,#fde68a)",
                      borderRadius: "8px",
                      borderLeft: "3px solid #f59e0b",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "12px",
                        color: "#92400e",
                        fontWeight: 600,
                      }}
                    >
                      💳 Prepaid Refund Info
                    </p>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: "12px",
                        color: "#78350f",
                      }}
                    >
                      For prepaid orders, your refund will be credited within{" "}
                      <strong>5–7 business working days</strong> to your
                      original payment method.
                    </p>
                  </div>
                )}
                <span>{step.time ? fmtDate(step.time) : ""}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderLog(statusSteps) {
    const done = (statusSteps || []).filter((s) => s.done);
    return (
      <div className="event-log">
        <h1 className="log-title">Detailed Event Log</h1>
        <div className="log-table">
          <div className="log-header">
            <div>Date &amp; Time</div>
            <div>Event</div>
          </div>
          <div className="log-body">
            {done.length === 0 ? (
              <div style={{ padding: "16px", color: "#94a3b8" }}>
                No events logged yet.
              </div>
            ) : (
              done.map((s, i) => (
                <div key={i} className="log-row">
                  <div>{s.time ? fmtDate(s.time) : "—"}</div>
                  <div>{s.label}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`track-page${result ? " has-result" : ""}`}>
      <header className="main-header" id="main-header">
        <nav className="navbar">
          <div className="navbar-logo">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("landing");
              }}
            >
              <img src={logoImg} alt="Ware2Door Logo" className="main-logo" />
            </a>
          </div>
          <div className="navbar-nav">
            <a
              href="#"
              className="nav-active"
              onClick={(e) => e.preventDefault()}
            >
              Track Order
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("customer");
              }}
            >
              Customer Service
            </a>
          </div>
          <div className="navbar-login">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("login");
              }}
            >
              Login
            </a>
          </div>
        </nav>
      </header>

      <section className="track-hero">
        <div className="track-hero-content">
          <h1 className="body-1">
            Track your <span className="accent">Shipment</span>
          </h1>
          <p className="track-sub">
            Enter your tracking ID below to get real-time updates on your
            package's location and delivery status.
          </p>
          <div className="body-2">
            <input
              type="search"
              placeholder="e.g. TRK4001"
              className="searcher"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") triggerTrack();
              }}
            />
            <button
              className="tracker"
              onClick={triggerTrack}
              disabled={loading}
            >
              {loading ? "Tracking…" : "Track"}
            </button>
          </div>
          <div className="track-hint">
            Try:
            <span onClick={() => setInputVal("TRK4001")}>TRK4001</span>
            <span onClick={() => setInputVal("TRK4006")}>TRK4006</span>
            <span onClick={() => setInputVal("TRK4011")}>TRK4011</span>
          </div>
        </div>
      </section>

      <div className="results-outer">
        <div className="body-3">
          {!result && (
            <div className="empty-state">
              <img src={trackImg} alt="" />
              <p className="empty-msg">
                Your tracking results will appear here.
              </p>
            </div>
          )}
          {result && (
            <div className="result-section" style={{ display: "block" }}>
              <div className="tracking-summary">
                {renderSummary(result.tid, result.data)}
              </div>
              <div className="live-tracking">
                <h2 className="map-title">Live Tracking</h2>
                <iframe
                  src={`https://www.google.com/maps?q=${result.data.lat},${result.data.lng}&z=13&output=embed`}
                  width="100%"
                  height="400"
                  style={{ border: 0, borderRadius: "9px" }}
                  loading="lazy"
                  title="Live Tracking Map"
                ></iframe>
              </div>
              {renderJourney(result.data.statusSteps, !!result.data.isRTO)}
              {renderLog(result.data.statusSteps)}
            </div>
          )}
        </div>
      </div>

      <Footer navigate={navigate} />
    </div>
  );
}
