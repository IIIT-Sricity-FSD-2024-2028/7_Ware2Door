import React from "react";
import logoImg from "../assets/logo.png";

export default function Footer({ navigate }) {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-col">
          <img src={logoImg} alt="Ware2Door" className="footer-logo-img" />
        </div>
        <div className="footer-col">
          <h5>Explore</h5>
          <ul>
            <li>
              <a
                href="#about-us"
                onClick={(e) => {
                  e.preventDefault();
                  navigate && navigate("landing");
                }}
              >
                About Us
              </a>
            </li>
            <li>Our Warehouses</li>
            <li>Blog</li>
            <li>News and Media</li>
          </ul>
        </div>
        <div className="footer-col">
          <h5>Legal</h5>
          <ul>
            <li>Terms</li>
            <li>Privacy</li>
          </ul>
        </div>
        <div className="footer-col">
          <h5>Social Media</h5>
          <div className="social-links">
            <a href="#" className="social-circle">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>
            <a href="#" className="social-circle">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4l11.733 16h4.267l-11.733 -16z M4 20l6.768 -6.768 M13.232 10.768l6.768 -6.768"></path>
              </svg>
            </a>
            <a href="#" className="social-circle">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
