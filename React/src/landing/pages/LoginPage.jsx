import React, { useState } from "react";
import { useAuth } from "../../auth/AuthContext.jsx";
import logoImg from "../assets/logo.png";
import backgroundImg from "../assets/back.png";
import { validateEmail } from "../../utils/inputValidation.js";

export default function LoginPage({ navigate }) {
  const { authError, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const visibleError = error || authError;

  async function handleLogin() {
    if (!email && !password) {
      setError("Email and Password are required");
      return;
    }
    if (!email) {
      setError("Please enter Email");
      return;
    }
    if (!password) {
      setError("Please enter Password");
      return;
    }
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      setError(
        message === "Email not found" || message === "Incorrect password"
          ? "Invalid email or password. Please try again."
          : message || "Unable to sign in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleLogin();
  }

  return (
    <div
      className="login-page"
      style={{
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
      }}
    >
      <div className="logo-img">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("landing");
          }}
        >
          <img src={logoImg} alt="Ware2Door Logo" />
        </a>
      </div>

      <div className="form-element">
        <h2>Welcome Back</h2>
        <span className="sub-title">Logistics Management Portal Access</span>
        <span className="sp-txt">Email Address</span>
        <div className="input-group">
          <i className="fa-regular fa-envelope"></i>
          <input
            type="email"
            placeholder="name@company.com"
            className="email-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <span className="sp-txt">Password</span>
        <div className="input-group">
          <i className="fa-solid fa-lock"></i>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter password"
            className="password-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <i
            className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"} toggle-password`}
            onClick={() => setShowPassword((v) => !v)}
          ></i>
        </div>
        <button className="frgt-btn" onClick={() => navigate("forgot")}>
          Forgot Password?
        </button>
        {visibleError && (
          <div
            style={{
              color: "#ff4d4f",
              fontSize: "0.9rem",
              marginTop: "8px",
              textAlign: "center",
            }}
          >
            {visibleError}
          </div>
        )}
        <button className="login-btn" disabled={loading} onClick={handleLogin}>
          {loading ? "Logging in…" : "Login to Portal"}
        </button>
      </div>

      <div className="footer-note">
        <span>
          For collaborations or support, contact us at{" "}
          <a href="mailto:support@ware2door.com">support@ware2door.com</a>
        </span>
      </div>
    </div>
  );
}
