import React, { useState } from "react";
import { localAgencyApi } from "../api/localAgencyApi.js";
import { initials } from "../utils/helpers.js";
import LocalAgencyModal from "../components/LocalAgencyModal.jsx";
import {
  validateEmail,
  validatePhone,
  validateRequiredText,
} from "../../utils/inputValidation.js";

function validateProfile(name, email, phone) {
  return (
    validateRequiredText(name, "Full name", { min: 1, max: 100 }) ||
    validateEmail(email) ||
    validatePhone(phone)
  );
}

function validatePassword(current, next, confirm) {
  if (!current || !next || !confirm) return "Please fill all password fields.";
  if (next.length < 6)
    return "New password must be at least 6 characters long.";
  if (!/[A-Z]/.test(next))
    return "New password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(next))
    return "New password must contain at least one lowercase letter.";
  if (!/\d/.test(next)) return "New password must contain at least one number.";
  if (!/[^A-Za-z0-9]/.test(next))
    return "New password must contain at least one special character.";
  if (next !== confirm) return "New passwords do not match.";
  return "";
}

export default function Settings({ user, agencyId, logout, showToast }) {
  const [tfaEnabled, setTfaEnabled] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [pwdModal, setPwdModal] = useState(false);
  const [profile, setProfile] = useState({
    name: user.name || "LB Nagar Agency",
    email: user.email || "lbagency@logix.com",
    phone: user.phone || "8977568680",
  });
  const [editForm, setEditForm] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
  });
  const [pwdForm, setPwdForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const setEdit = (k, v) => setEditForm((f) => ({ ...f, [k]: v }));
  const setPwd = (k, v) => setPwdForm((f) => ({ ...f, [k]: v }));

  async function saveProfile() {
    const n = editForm.name.trim();
    const em = editForm.email.trim();
    const ph = editForm.phone.trim();
    const validationError = validateProfile(n, em, ph);
    if (validationError) return showToast(`⚠ ${validationError}`, true);
    try {
      const res = await localAgencyApi.updateProfile(agencyId, {
        name: n,
        email: em,
        phone: ph,
      });
      if (res && res.success === false) {
        showToast(res.error || "Failed to update profile.", true);
        return;
      }
      setProfile((p) => ({
        name: n || p.name,
        email: em || p.email,
        phone: ph || p.phone,
      }));
      try {
        const raw = localStorage.getItem("session");
        if (raw) {
          const sess = JSON.parse(raw);
          sess.user = {
            ...sess.user,
            name: n || profile.name,
            email: em || profile.email,
            phone: ph || profile.phone,
          };
          localStorage.setItem("session", JSON.stringify(sess));
        }
      } catch (error) {
        console.error("Unable to update stored session profile", error);
      }
      showToast("✓ Profile updated.");
      setEditModal(false);
    } catch (e) {
      showToast(e.message || "Backend connection failed.", true);
    }
  }

  async function changePassword() {
    const validationError = validatePassword(
      pwdForm.current,
      pwdForm.next,
      pwdForm.confirm,
    );
    if (validationError) return showToast(`⚠ ${validationError}`, true);
    try {
      const res = await localAgencyApi.updatePassword(agencyId, {
        currentPassword: pwdForm.current,
        newPassword: pwdForm.next,
      });
      if (res && res.success === false) {
        showToast(res.error || "Failed to update password", true);
        return;
      }
      showToast("Password updated");
      setPwdModal(false);
      setPwdForm({ current: "", next: "", confirm: "" });
    } catch (e) {
      showToast(e.message, true);
    }
  }

  return (
    <div className="settings-container page-content">
      <h1 className="settings-title">Account Settings</h1>
      <p className="settings-subtitle">
        Manage your profile and security preferences.
      </p>

      <div className="profile-card">
        <div className="profile-left">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar"></div>
            <div className="avatar-badge"></div>
          </div>
          <div>
            <h2 className="user-name settings-user-name">{profile.name}</h2>
            <p className="user-meta">
              <span>
                <i className="fa-solid fa-truck-fast"></i>{" "}
                <span className="settings-user-role">
                  Local Delivery Agency &nbsp;|&nbsp; ID:{" "}
                  {agencyId || user.agencyId || user.id || "agency-001"}
                </span>
              </span>
            </p>
          </div>
        </div>
        <button
          className="edit-btn"
          id="open-edit-modal"
          onClick={() => {
            setEditForm({
              name: profile.name,
              email: profile.email,
              phone: profile.phone,
            });
            setEditModal(true);
          }}
        >
          Edit Profile
        </button>
      </div>

      <div
        className="info-row"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          width: "100%",
          marginBottom: 20,
        }}
      >
        <div className="card">
          <h3>
            <i className="fa-solid fa-user"></i> Personal Information
          </h3>
          <p className="field-label">Email Address</p>
          <p className="field-value settings-email">{profile.email}</p>
          <p className="field-label">Phone Number</p>
          <p className="field-value settings-phone">{profile.phone}</p>
          <p className="field-label">Password</p>
          <p className="field-value" id="s-pwd-changed">
            Last changed: Never
          </p>
          <button
            className="btn-ghost"
            id="change-pwd-btn"
            style={{ marginTop: 4, padding: "8px 16px", fontSize: 13 }}
            onClick={() => setPwdModal(true)}
          >
            <i className="fa-solid fa-lock" style={{ marginRight: 6 }}></i>
            Change Password
          </button>
        </div>
        <div className="card">
          <h3>
            <i className="fa-solid fa-shield-halved"></i> Security
          </h3>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 8,
            }}
          >
            <div>
              <p className="field-label" style={{ marginBottom: 2 }}>
                Two-Factor Authentication
              </p>
              <p style={{ fontSize: 12, color: "#94a3b8" }}>
                Add an extra layer of security
              </p>
            </div>
            <div
              id="tfa-toggle"
              style={{
                cursor: "pointer",
                width: 44,
                height: 24,
                borderRadius: 12,
                background: tfaEnabled ? "#f4a32a" : "#e2e8f0",
                position: "relative",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
              onClick={() => {
                setTfaEnabled((v) => !v);
                showToast(
                  tfaEnabled
                    ? "Two-factor authentication disabled."
                    : "✓ Two-factor authentication enabled.",
                );
              }}
            >
              <div
                id="tfa-knob"
                style={{
                  position: "absolute",
                  top: 2,
                  left: tfaEnabled ? 22 : 2,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "white",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="session-card">
        <div className="session-info">
          <div className="session-icon">
            <i className="fa-solid fa-display"></i>
          </div>
          <div>
            <p className="session-title">Active Sessions</p>
            <p className="session-subtitle">
              You are currently logged in on this device.
            </p>
          </div>
        </div>
        <button className="logout-btn" id="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="footer-links">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
      </div>

      <LocalAgencyModal
        id="edit-modal"
        open={editModal}
        onClose={() => setEditModal(false)}
      >
        <div className="modal-header">
          <h3>Edit Profile</h3>
          <button
            className="modal-close"
            id="close-edit-modal"
            onClick={() => setEditModal(false)}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="modal-avatar-row">
          <div className="modal-avatar">{initials(editForm.name)}</div>
          <div>
            <p className="modal-avatar-name">{editForm.name}</p>
            <p className="modal-avatar-role">Local Delivery Agency</p>
          </div>
        </div>
        <div className="modal-body">
          <div className="modal-field">
            <label>Full Name</label>
            <input
              type="text"
              id="edit-name"
              placeholder="Your full name"
              required
              value={editForm.name}
              onChange={(e) => setEdit("name", e.target.value)}
            />
          </div>
          <div className="modal-field">
            <label>Email Address</label>
            <input
              type="email"
              id="edit-email"
              placeholder="your@email.com"
              required
              pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
              value={editForm.email}
              onChange={(e) => setEdit("email", e.target.value)}
            />
          </div>
          <div className="modal-field">
            <label>Phone Number</label>
            <input
              type="tel"
              id="edit-phone"
              placeholder="+91 XXXXXXXXXX"
              required
              pattern="(\+91[\s-]?)?\d{10}"
              value={editForm.phone}
              onChange={(e) => setEdit("phone", e.target.value)}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button
            className="modal-cancel"
            id="cancel-edit-modal"
            onClick={() => setEditModal(false)}
          >
            Cancel
          </button>
          <button
            className="modal-save"
            id="save-edit-modal"
            onClick={saveProfile}
          >
            Save Changes
          </button>
        </div>
      </LocalAgencyModal>

      <LocalAgencyModal
        id="pwd-modal"
        open={pwdModal}
        onClose={() => setPwdModal(false)}
      >
        <div className="modal-header">
          <h3>Change Password</h3>
          <button
            className="modal-close"
            id="close-pwd-modal"
            onClick={() => setPwdModal(false)}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-field">
            <label>Current Password</label>
            <input
              type="password"
              id="pwd-current"
              placeholder="••••••••"
              required
              value={pwdForm.current}
              onChange={(e) => setPwd("current", e.target.value)}
            />
          </div>
          <div className="modal-field">
            <label>New Password</label>
            <input
              type="password"
              id="pwd-new"
              placeholder="••••••••"
              required
              minLength={6}
              value={pwdForm.next}
              onChange={(e) => setPwd("next", e.target.value)}
            />
          </div>
          <div className="modal-field">
            <label>Confirm New Password</label>
            <input
              type="password"
              id="pwd-confirm"
              placeholder="••••••••"
              required
              minLength={6}
              value={pwdForm.confirm}
              onChange={(e) => setPwd("confirm", e.target.value)}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button
            className="modal-cancel"
            id="cancel-pwd-modal"
            onClick={() => setPwdModal(false)}
          >
            Cancel
          </button>
          <button
            className="modal-save"
            id="save-pwd-modal"
            onClick={changePassword}
          >
            <i className="fa-solid fa-lock"></i> Update Password
          </button>
        </div>
      </LocalAgencyModal>
    </div>
  );
}
