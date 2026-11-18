import React, { useState, useEffect } from "react";
import Footer from "../components/Footer.jsx";
import logoImg from "../assets/logo.png";

const FAQ_DATA = [
  {
    cat: "shipping",
    badge: { icon: "fa-solid fa-truck", label: "Shipping & Tracking" },
    items: [
      {
        q: "How do I track my shipment in real-time?",
        a: "Visit the Track Order page and enter your Tracking ID (e.g. BLR78291XQ). You'll see a live status timeline covering Warehouse → Transit Hub → Local Delivery → Delivered.",
      },
      {
        q: "What are the estimated delivery times?",
        a: "Standard delivery takes 3–5 business days. Express shipments are delivered within 24–48 hours. Timelines may vary based on your pin code and product category.",
      },
      {
        q: "Can I change the delivery address?",
        a: "Address changes are only possible before the shipment leaves the warehouse. Please submit a support ticket immediately with your Tracking ID and new address details.",
      },
    ],
  },
  {
    cat: "delivery",
    badge: { icon: "fa-solid fa-circle-exclamation", label: "Delivery Issues" },
    items: [
      {
        q: "What if my package is delayed?",
        a: "If your package is delayed beyond the estimated date, first check the live tracker for status updates. If the status hasn't changed in 48 hours, raise a support ticket and our team will investigate within 4 hours.",
      },
      {
        q: "What happens if delivery fails?",
        a: "Our courier will attempt delivery up to 3 times. After each failed attempt, you'll receive a notification. If all attempts fail, the parcel is held at the local agency for 5 days before being returned to origin (RTO).",
      },
      {
        q: "Can I reschedule my delivery?",
        a: "Yes. Submit a support ticket with your Tracking ID and preferred delivery date/time window. Our team will coordinate with the local agency to accommodate the request.",
      },
    ],
  },
  {
    cat: "returns",
    badge: { icon: "fa-solid fa-rotate-left", label: "Returns & RTO" },
    items: [
      {
        q: "What is the return policy?",
        a: 'Returns are accepted within 7 days of delivery for damaged or incorrect items. Initiate a return by submitting a ticket under the "Return to Origin" category with photos of the issue.',
      },
      {
        q: "How to initiate an RTO request?",
        a: "A Return-to-Origin (RTO) is automatically triggered after 3 failed delivery attempts. To manually request an RTO, raise a support ticket with your Tracking ID before the shipment is out for delivery again.",
      },
      {
        q: "Are there charges for failed deliveries?",
        a: "There are no charges for the first failed delivery attempt. Subsequent re-attempt fees depend on your shipment plan. RTO processing may attract a nominal handling fee as per your service agreement.",
      },
    ],
  },
  {
    cat: "account",
    badge: { icon: "fa-solid fa-headset", label: "Account & Support" },
    items: [
      {
        q: "How can I partner as a Warehouse, Transit Hub, or Delivery Agency?",
        a: 'Partner onboarding is managed by the Ware2Door operations team. Contact us via the support ticket system under "Other Issues" with your business details, location, and capacity information. Our team will reach out within 2 business days.',
      },
      {
        q: "How can I contact customer support?",
        a: "You can reach us via our Support Ticket system (response within 2–4 hours), or call our emergency helpline at 8977568680. Our agents are available 24/7.",
      },
      {
        q: "How to raise a support ticket?",
        a: "Navigate to the Submit a Ticket page, enter your Tracking ID, choose an issue category, and describe your problem. We'll respond within 2–4 hours with a resolution or update.",
      },
    ],
  },
];

function FaqCard({ card, navigate, openKey, setOpenKey, cardIndex }) {
  return (
    <div className="faq-card" data-cat={card.cat}>
      <div className="card-category-badge">
        <i className={card.badge.icon}></i> {card.badge.label}
      </div>
      <div className="faq-list">
        {card.items.map((item, itemIndex) => {
          const key = `${cardIndex}-${itemIndex}`;
          const isOpen = openKey === key;
          return (
            <div key={itemIndex} className={`faq-item${isOpen ? " open" : ""}`}>
              <button
                className="faq-question"
                aria-expanded={isOpen}
                onClick={() => setOpenKey(isOpen ? null : key)}
              >
                <span>{item.q}</span>
                <span className="faq-icon">
                  <i className="fa-solid fa-chevron-down"></i>
                </span>
              </button>
              <div
                className="faq-answer"
                style={{ maxHeight: isOpen ? "500px" : undefined }}
              >
                <p>{item.a}</p>
              </div>
            </div>
          );
        })}
      </div>
      <a
        href="#"
        className="view-all-link"
        onClick={(e) => {
          e.preventDefault();
          navigate("ticket");
        }}
      >
        View all articles <i className="fa-solid fa-arrow-right"></i>
      </a>
    </div>
  );
}

export default function FaqPage({ navigate }) {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [openKey, setOpenKey] = useState(null);

  useEffect(() => {
    function onScroll() {
      const h = document.getElementById("main-header");
      if (h) h.classList.toggle("scrolled", window.scrollY > 50);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filteredData = FAQ_DATA.filter(
    (card) => activeTab === "all" || card.cat === activeTab,
  )
    .map((card) => ({
      ...card,
      items: search.trim()
        ? card.items.filter((item) =>
            item.q.toLowerCase().includes(search.toLowerCase()),
          )
        : card.items,
    }))
    .filter((card) => card.items.length > 0);

  return (
    <div className="faq-page">
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

      <section className="faq-hero">
        <div className="faq-hero-overlay"></div>
        <div className="faq-hero-content">
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
            Frequently Asked <span className="accent">Questions</span>
          </h1>
          <p>
            Find answers to common questions about Ware2Door logistics and
            services.
          </p>
          <div className="search-bar">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              id="faq-search"
              placeholder="Search a question…"
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="faq-section">
        <div className="faq-tabs">
          {[
            { cat: "all", label: "All" },
            { cat: "shipping", label: "Shipping & Tracking" },
            { cat: "delivery", label: "Delivery Issues" },
            { cat: "returns", label: "Returns & RTO" },
            { cat: "account", label: "Account & Support" },
          ].map((tab) => (
            <button
              key={tab.cat}
              className={`tab-btn${activeTab === tab.cat ? " active" : ""}`}
              data-cat={tab.cat}
              onClick={() => setActiveTab(tab.cat)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="faq-grid">
          {filteredData.map((card, i) => (
            <FaqCard
              key={card.cat}
              card={card}
              navigate={navigate}
              openKey={openKey}
              setOpenKey={setOpenKey}
              cardIndex={FAQ_DATA.indexOf(card)}
            />
          ))}
        </div>
      </section>

      <section className="faq-cta">
        <div className="cta-card">
          <div className="cta-decor-1"></div>
          <div className="cta-decor-2"></div>
          <div className="cta-inner">
            <div className="cta-icon">
              <i className="fa-solid fa-headset"></i>
            </div>
            <h2>Still Need Help?</h2>
            <p>
              Our logistics experts are available 24/7 to assist with complex
              cases.
            </p>
            <div className="cta-buttons">
              <button className="btn-teal" onClick={() => navigate("ticket")}>
                Submit a Ticket
              </button>
              <button
                className="btn-outline-w"
                onClick={() => navigate("customer")}
              >
                Back to Support
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer navigate={navigate} />
    </div>
  );
}
