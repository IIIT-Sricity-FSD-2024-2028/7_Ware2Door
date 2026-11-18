import React, { useEffect } from "react";
import Footer from "../components/Footer.jsx";
import logoImg from "../assets/logo.png";
import stackedBoxesImg from "../assets/stacked-boxes.png";
import warehouseIconImg from "../assets/warehouse-icon.png";
import transitIconImg from "../assets/transit-icon.png";
import deliveryIconImg from "../assets/delivery-icon.png";
import customerIconImg from "../assets/customer-icon.png";
import headsetIconImg from "../assets/headset-icon.png";
import smartWarehouseIconImg from "../assets/smart-warehouse-icon.png";
import hubOptIconImg from "../assets/hub-opt-icon.png";
import trackingIconImg from "../assets/tracking-icon.png";
import rtoIconImg from "../assets/rto-icon.png";

export default function LandingPage({ navigate }) {
  useEffect(() => {
    function onScroll() {
      const header = document.querySelector(".main-header");
      if (!header) return;
      if (window.pageYOffset > 50) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    }
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="landing-page">
      <header className="main-header">
        <nav className="navbar">
          <div className="navbar-logo">
            <img src={logoImg} alt="Ware2Door Logo" className="main-logo" />
          </div>
          <div className="navbar-nav">
            <a href="#about-us">About Us</a>
            <a href="#capabilities">Services</a>
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

      <section className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-heading">
            From Storage to Shipping, <span className="script">Seamless</span>
          </h1>
          <p className="hero-sub">
            We handle every step of your logistics, from warehouse management to
            seamless doorstep delivery.
          </p>
          <div className="hero-buttons">
            <a href="#about-us">
              <button className="btn-outline">Know more</button>
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("track");
              }}
            >
              <button className="btn-filled">Track shipment</button>
            </a>
          </div>
        </div>
      </section>

      <section id="about-us" className="about-section">
        <div className="about-content">
          <h2>
            About <span className="accent">Us</span>
          </h2>
          <p>
            Ware2Door is a comprehensive logistics platform designed to
            orchestrate the entire shipment journey. By connecting warehouse
            administrators, transit hubs, and local delivery teams into one
            seamless ecosystem, it ensures efficient movement from dispatch to
            final delivery. Built to improve coordination and visibility, the
            platform helps reduce delays while keeping operations streamlined.
          </p>
        </div>
        <div className="about-image">
          <img src={stackedBoxesImg} alt="Warehouse Storage" />
        </div>
      </section>

      <section id="journey" className="journey-section">
        <span className="section-label">Operational Excellence</span>
        <h2>The Ware2Door Journey</h2>
        <div className="journey-grid">
          <div className="journey-item">
            <img src={warehouseIconImg} alt="Warehouse" />
            <h4>Warehouse</h4>
            <p>Automated picking and secure packaging protocols.</p>
          </div>
          <div className="journey-item">
            <img src={transitIconImg} alt="Transit Hub" />
            <h4>Transit Hub</h4>
            <p>Strategic sorting for optimized route mapping.</p>
          </div>
          <div className="journey-item">
            <img src={deliveryIconImg} alt="Local Delivery" />
            <h4>Local Delivery</h4>
            <p>Real-time dispatched last-mile courier fleet.</p>
          </div>
          <div className="journey-item">
            <img src={customerIconImg} alt="Customer" />
            <h4>Customer</h4>
            <p>Guaranteed on-time delivery with satisfaction proof.</p>
          </div>
        </div>
      </section>

      <section id="capabilities" className="capabilities-section">
        <h2>Our Core Capabilities</h2>
        <p className="cap-sub">
          Comprehensive solutions for modern supply chain management.
        </p>
        <div className="cap-grid">
          <div className="cap-card">
            <div className="cap-icon-box">
              <img src={smartWarehouseIconImg} alt="Icon" />
            </div>
            <h4>Smart Warehouse</h4>
            <p>
              Optimize inventory and storage with AI-driven predictive insights.
            </p>
          </div>
          <div className="cap-card">
            <div className="cap-icon-box">
              <img src={hubOptIconImg} alt="Icon" />
            </div>
            <h4>Hub Optimization</h4>
            <p>
              Efficient routing between transit hubs to drastically reduce lead
              times.
            </p>
          </div>
          <div className="cap-card">
            <div className="cap-icon-box">
              <img src={trackingIconImg} alt="Icon" />
            </div>
            <h4>Real-time Tracking</h4>
            <p>
              End-to-end granular visibility for every parcel in your network.
            </p>
          </div>
          <div className="cap-card">
            <div className="cap-icon-box">
              <img src={rtoIconImg} alt="Icon" />
            </div>
            <h4>Automated RTO</h4>
            <p>
              Streamlined return-to-origin processes to minimize logistical
              losses.
            </p>
          </div>
        </div>
      </section>

      <section id="support" className="support-section">
        <div className="support-card">
          <div className="decor-circle-top"></div>
          <div className="decor-circle-bottom"></div>
          <div className="support-content">
            <div className="support-icon-circle">
              <img src={headsetIconImg} alt="Support Icon" />
            </div>
            <h2>Need Help?</h2>
            <p>
              Our intelligent support agents and logistics specialists are
              available 24/7 to resolve any transit issues.
            </p>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("customer");
              }}
            >
              <button className="btn-orange">Customer Care Support</button>
            </a>
          </div>
        </div>
      </section>

      <Footer navigate={navigate} />
    </div>
  );
}
