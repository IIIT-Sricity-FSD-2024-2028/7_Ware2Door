import React, { useState } from "react";
import { API_BASE } from "../api/client.js";
import logoImg from "../assets/logo.png";
import { validateEmail } from "../../utils/inputValidation.js";

export default function ForgotPasswordPage({ navigate }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  function showError(msg) {
    setErrorMsg(msg);
    setSuccessMsg("");
  }
  function showSuccess(msg) {
    setSuccessMsg(msg);
    setErrorMsg("");
  }
  function clearMessages() {
    setErrorMsg("");
    setSuccessMsg("");
  }

  async function handleVerify() {
    clearMessages();
    const trimEmail = email.trim();
    if (!trimEmail) {
      showError("Please enter your email address.");
      return;
    }
    const emailError = validateEmail(trimEmail);
    if (emailError) {
      showError(emailError);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimEmail }),
      });
      const data = await res.json();
      if (res.ok && data.exists) {
        setVerifiedEmail(trimEmail);
        setStep(2);
        showSuccess("OTP sent to your email address!");
      } else {
        showError(
          data.error || data.message || "Email not found in our records.",
        );
      }
    } catch (_) {
      showError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    clearMessages();
    if (!verifiedEmail) {
      showError("Please verify your email address first.");
      return;
    }
    if (!otp || !newPwd || !confirmPwd) {
      showError("Please fill out all fields.");
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      showError("OTP must contain exactly 6 digits.");
      return;
    }
    if (otp !== "000000") {
      showError("Invalid OTP. Please enter a valid 6-digit OTP.");
      return;
    }
    if (newPwd !== confirmPwd) {
      showError("Passwords do not match.");
      return;
    }
    if (newPwd.length < 6 || newPwd.length > 128) {
      showError("Password must be between 6 and 128 characters long.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: verifiedEmail,
          otp,
          newPassword: newPwd,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showSuccess("Password reset successfully! Redirecting...");
        setTimeout(() => navigate("login"), 2000);
      } else {
        showError(data.error || data.message || "Failed to reset password.");
      }
    } catch (_) {
      showError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="forgot-page">
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

      <div className="form-element forgot">
        <div className="icon-circle">
          <i className="fa-solid fa-rotate-left"></i>
        </div>
        <h2>Forgot Password?</h2>

        {step === 1 && (
          <div id="step-1">
            <span className="desc-text">
              No worries! Enter your registered email address to reset your
              password.
            </span>
            <div className="input-group">
              <i className="fa-regular fa-envelope"></i>
              <input
                type="email"
                placeholder="name@company.com"
                className="inpt-hldr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              id="verify-btn"
              className="login-btn"
              disabled={loading}
              onClick={handleVerify}
            >
              {loading ? "Verifying..." : "Verify Email →"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div id="step-2">
            <span className="desc-text">
              An OTP has been sent to your email. Please enter the OTP and your
              new password below.
            </span>
            <div className="input-group">
              <i className="fa-solid fa-key"></i>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                className="inpt-hldr"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <div className="input-group" style={{ marginTop: "15px" }}>
              <i className="fa-solid fa-lock"></i>
              <input
                type="password"
                placeholder="New Password"
                className="inpt-hldr"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
              />
            </div>
            <div className="input-group" style={{ marginTop: "15px" }}>
              <i className="fa-solid fa-lock"></i>
              <input
                type="password"
                placeholder="Confirm Password"
                className="inpt-hldr"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
              />
            </div>
            <button
              id="reset-btn"
              className="login-btn"
              disabled={loading}
              onClick={handleReset}
            >
              {loading ? "Resetting..." : "Reset Password ✓"}
            </button>
          </div>
        )}

        {errorMsg && (
          <div
            id="error-msg"
            style={{
              color: "#ff4d4f",
              fontSize: "0.9rem",
              marginTop: "10px",
              textAlign: "center",
            }}
          >
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div
            id="success-msg"
            style={{
              color: "#52c41a",
              fontSize: "0.9rem",
              marginTop: "10px",
              textAlign: "center",
            }}
          >
            {successMsg}
          </div>
        )}

        <button className="back-link" onClick={() => navigate("login")}>
          ← Back to Login
        </button>
      </div>
    </div>
  );
}
