import React, { useState, useEffect } from "react";
import Footer from "../components/Footer.jsx";
import logoImg from "../assets/logo.png";
import { API_BASE } from "../api/client.js";
import {
  normalizeIdentifier,
  validateRequiredText,
  validateTrackingId as validateTrackingIdFormat,
} from "../../utils/inputValidation.js";

export default function TicketPage({ navigate }) {
  const [trackingId, setTrackingId] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastError, setToastError] = useState(false);
  const [trackingValidation, setTrackingValidation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    function onScroll() {
      const h = document.getElementById("main-header");
      if (h) h.classList.toggle("scrolled", window.scrollY > 50);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function showToast(msg, isError = false) {
    setToastMsg(msg);
    setToastError(isError);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), isError ? 4000 : 6000);
  }

  async function validateTrackingId(value) {
    const val = normalizeIdentifier(value);
    const formatError = validateTrackingIdFormat(val);
    if (formatError) {
      const message = formatError;
      setTrackingValidation(message);
      return { valid: false, message };
    }

    setTrackingValidation("Checking Tracking ID...");
    try {
      const res = await fetch(
        `${API_BASE}/tickets/validate/${encodeURIComponent(val)}`,
      );
      const result = await res.json();
      if (!res.ok) {
        throw new Error(
          result.message || result.error || "Unable to validate Tracking ID.",
        );
      }
      if (!result.valid) {
        const message = "Tracking ID not found. Please check and try again.";
        setTrackingValidation(message);
        return { valid: false, message };
      }
      setTrackingValidation(
        `Verified${result.productName ? `: ${result.productName}` : ""}`,
      );
      return { valid: true };
    } catch (error) {
      const message =
        error.message || "Unable to validate Tracking ID. Please try again.";
      setTrackingValidation(message);
      return { valid: false, message };
    }
  }

  async function handleSubmit() {
    const val = normalizeIdentifier(trackingId);
    const desc = description.trim();
    const trackingError = validateTrackingIdFormat(val);
    if (trackingError) {
      showToast(trackingError, true);
      return;
    }
    const descriptionError = validateRequiredText(desc, "Issue description", {
      min: 10,
      max: 2000,
    });
    if (descriptionError) {
      showToast(descriptionError, true);
      return;
    }
    if (!category) {
      showToast("Please select an issue category.", true);
      return;
    }

    setIsSubmitting(true);
    try {
      const validation = await validateTrackingId(val);
      if (!validation.valid) {
        showToast(validation.message, true);
        return;
      }
      const res = await fetch(`${API_BASE}/tickets/raise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingId: val,
          category,
          description: desc,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success || !result.ticket) {
        throw new Error(
          result.message ||
            result.error ||
            "Unable to submit support ticket. Please try again.",
        );
      }
      showToast(
        `✓ Ticket for ${val} (${category}) has been raised. We'll update you within 4 hours.`,
        false,
      );
      setTrackingId("");
      setDescription("");
      setCategory("");
      setTrackingValidation("");
    } catch (error) {
      showToast(error.message || "Could not connect to server. Please try again.", true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
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
              onClick={(e) => {
                e.preventDefault();
                navigate("track");
              }}
            >
              Track Order
            </a>
            <a
              href="#"
              className="nav-active"
              onClick={(e) => e.preventDefault()}
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

      <section className="ticket-hero">
        <div className="ticket-hero-overlay"></div>
        <div className="ticket-hero-content">
          <a
            href="#"
            className="back-link"
            onClick={(e) => {
              e.preventDefault();
              navigate("customer");
            }}
          >
            <i className="fa-solid fa-arrow-left"></i> Back to Support
          </a>
          <h1>
            Submit a <span className="accent">Support Ticket</span>
          </h1>
          <p>
            Have an issue with a shipment? Fill out the details below and our
            logistics team will get back to you within 2–4 hours.
          </p>
        </div>
      </section>

      <section className="ticket-section">
        <div className="ticket-wrapper">
          <div className="ticket-form-wrap">
            <div className="form-card">
              <div className="form-card-header">
                <div className="form-card-icon">
                  <i className="fa-solid fa-ticket"></i>
                </div>
                <div>
                  <h2>New Support Ticket</h2>
                  <p>We'll get back to you within 2–4 hours.</p>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="tracking-id">
                    <i className="fa-solid fa-barcode"></i> Tracking ID
                  </label>
                  <input
                    type="text"
                    id="tracking-id"
                    className="searcher"
                    placeholder="e.g. TRK4001"
                    value={trackingId}
                    onChange={(e) => {
                      setTrackingId(e.target.value);
                      setTrackingValidation("");
                    }}
                    onBlur={() => {
                      if (trackingId.trim()) validateTrackingId(trackingId);
                    }}
                  />
                  {trackingValidation && (
                    <span
                      role="status"
                      style={{
                        display: "block",
                        marginTop: 6,
                        fontSize: 12,
                        color:
                          trackingValidation === "Checking Tracking ID..."
                            ? "#64748b"
                            : trackingValidation.startsWith("Verified")
                              ? "#16a34a"
                              : "#ef4444",
                      }}
                    >
                      {trackingValidation}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="issue-cat">
                    <i className="fa-solid fa-tag"></i> Issue Category
                  </label>
                  <select
                    id="issue-cat"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Select category</option>
                    <option>Delayed Shipment</option>
                    <option>Damaged Package</option>
                    <option>Billing &amp; Invoices</option>
                    <option>Return to Origin</option>
                    <option>Address Change</option>
                    <option>Other Issues</option>
                  </select>
                </div>
              </div>
              <div className="form-group full-width">
                <label htmlFor="description">
                  <i className="fa-solid fa-pen-to-square"></i> Description
                </label>
                <textarea
                  id="description"
                  placeholder="Please provide as much detail as possible about your issue…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>
              <button
                className="submit-btn"
                id="submit-btn"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                <i className="fa-solid fa-paper-plane"></i>{" "}
                {isSubmitting ? "Submitting..." : "Submit Ticket"}
              </button>
            </div>
            <div
              className={`success-toast${toastVisible ? " show" : ""}${toastError ? " error" : ""}`}
              id="success-toast"
            >
              <i className="fa-solid fa-circle-check"></i>
              <div id="success-text">{toastMsg}</div>
            </div>
          </div>

          <aside className="quick-ref">
            <div className="ref-header">
              <h3>Quick Reference</h3>
              <p>Helpful information before you submit.</p>
            </div>
            <div className="ref-item">
              <div className="ref-icon">
                <i className="fa-regular fa-clock"></i>
              </div>
              <div className="ref-text">
                <strong>Average Response</strong>
                <span>92% of tickets resolved within 4 hours.</span>
              </div>
            </div>
            <div className="ref-item">
              <div className="ref-icon">
                <i className="fa-regular fa-circle-question"></i>
              </div>
              <div className="ref-text">
                <strong>Help Center</strong>
                <span>
                  <a
                    href="#"
                    className="ref-link"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("faq");
                    }}
                  >
                    Browse our FAQs
                  </a>{" "}
                  for instant answers.
                </span>
              </div>
            </div>
            <div className="ref-item">
              <div className="ref-icon">
                <i className="fa-solid fa-phone"></i>
              </div>
              <div className="ref-text">
                <strong>Emergency Support</strong>
                <span>
                  Call us at <strong>8977568680</strong>. Available 24/7.
                </span>
              </div>
            </div>
            <div className="ref-item">
              <div className="ref-icon">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <div className="ref-text">
                <strong>Secure &amp; Private</strong>
                <span>All your data is encrypted and handled securely.</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <Footer navigate={navigate} />
    </>
  );
}
