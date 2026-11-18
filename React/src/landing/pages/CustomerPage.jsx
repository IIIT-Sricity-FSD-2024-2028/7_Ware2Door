import React, { useState, useEffect, useRef } from "react";
import Footer from "../components/Footer.jsx";
import logoImg from "../assets/logo.png";

export default function CustomerPage({ navigate }) {
  const [showContact, setShowContact] = useState(false);
  const dropdownRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    function onScroll() {
      const h = document.getElementById("main-header");
      if (h) h.classList.toggle("scrolled", window.scrollY > 50);
    }
    function onDocClick(e) {
      if (
        showContact &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        e.target !== btnRef.current
      ) {
        setShowContact(false);
      }
    }
    window.addEventListener("scroll", onScroll);
    document.addEventListener("click", onDocClick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onDocClick);
    };
  }, [showContact]);

  return (
    <div className="customer-page">
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

      <div className="body-1">
        <h1>
          How can we <span>help</span> you today?
        </h1>
        <p>
          Real-time logistics support and shipment tracking — always at your
          fingertips.
        </p>
        <div className="cards-container">
          <div className="card">
            <div className="card-icon">
              <i className="fa-regular fa-comment"></i>
            </div>
            <div className="card-content">
              <h3>Chat with AI Assistant</h3>
              <p>
                Get instant help for your orders and shipping queries with our
                24/7 AI.
              </p>
              <button className="link" onClick={() => navigate("bot")}>
                Start Chatting →
              </button>
            </div>
          </div>
          <div className="card">
            <div className="card-icon">
              <i className="fa-solid fa-book"></i>
            </div>
            <div className="card-content">
              <h3>Browse FAQs</h3>
              <p>
                Find answers to common questions in our categorized knowledge
                base.
              </p>
              <button className="link" onClick={() => navigate("faq")}>
                View Knowledge Base →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="body-2">
        <h2>Browse by Category</h2>
        <div className="c2-container">
          <div className="card-2" onClick={() => navigate("faq")}>
            <div className="icon-circle">
              <i className="fa-solid fa-truck"></i>
            </div>
            <h3>Shipping</h3>
            <p>Rates, delivery times, and shipping methods</p>
          </div>
          <div className="card-2" onClick={() => navigate("faq")}>
            <div className="icon-circle">
              <i className="fa-solid fa-rotate-left"></i>
            </div>
            <h3>Returns</h3>
            <p>Refund policies and labels</p>
          </div>
        </div>
      </div>

      <div className="body-3">
        <div className="b3-e01">
          <h2>Still need help?</h2>
          <span>
            Our logistics experts are available 24/7 to assist with complex
            cases.
          </span>
        </div>
        <div className="b3-e02" style={{ position: "relative" }}>
          <button
            id="contactUsBtn"
            ref={btnRef}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowContact((v) => !v);
            }}
          >
            Contact Us
          </button>
          <button onClick={() => navigate("ticket")}>Submit Ticket</button>
          <div
            id="contactDropdown"
            ref={dropdownRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: "calc(100% + 15px)",
              left: 0,
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
              zIndex: 100,
              minWidth: "max-content",
              textAlign: "left",
              opacity: showContact ? 1 : 0,
              visibility: showContact ? "visible" : "hidden",
              pointerEvents: showContact ? "auto" : "none",
              transition: "all 0.3s ease",
              transform: showContact ? "translateY(0)" : "translateY(-10px)",
            }}
          >
            <h4
              style={{
                margin: "0 0 12px 0",
                color: "var(--orange)",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              Contact Support
            </h4>
            <p
              style={{
                margin: "0 0 8px 0",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "rgba(255,255,255,0.9)",
              }}
            >
              <i
                className="fa-solid fa-envelope"
                style={{ color: "var(--orange)" }}
              ></i>{" "}
              support@ware2door.com
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "rgba(255,255,255,0.9)",
              }}
            >
              <i
                className="fa-solid fa-phone"
                style={{ color: "var(--orange)" }}
              ></i>{" "}
              +91 8977568680
            </p>
          </div>
        </div>
      </div>

      <Footer navigate={navigate} />
    </div>
  );
}
