import React from "react";

export default function SettingsPage({
  user,
  initials,
  tfaEnabled,
  onToggleTfa,
  onEditProfile,
  onChangePassword,
  onLogout,
  showToast,
}) {
  return (
    <div className="settings-container page-content">
      <h1 className="settings-title">Account Settings</h1>
      <p className="settings-subtitle">
        Manage your profile and security preferences.
      </p>
      <div className="profile-card">
        <div className="profile-left">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">{initials(user.name)}</div>
            <div className="avatar-badge"></div>
          </div>
          <div>
            <h2 className="user-name settings-user-name">{user.name}</h2>
            <p className="user-meta">
              <span>
                <i className="fa-solid fa-warehouse"></i>{" "}
                <span className="settings-user-role">Warehouse Admin</span>
              </span>
            </p>
          </div>
        </div>
        <button
          className="edit-btn"
          id="open-edit-modal"
          onClick={onEditProfile}
        >
          Edit Profile
        </button>
      </div>
      <div className="info-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="card">
          <h3>
            <i className="fa-solid fa-user"></i> Personal Information
          </h3>
          <p className="field-label">Email Address</p>
          <p className="field-value settings-email">{user.email}</p>
          <p className="field-label">Phone Number</p>
          <p className="field-value settings-phone">{user.phone || "—"}</p>
          <p className="field-label">Password</p>
          <p className="field-value" id="s-pwd-changed">
            Last changed: Never
          </p>
          <button
            className="btn-ghost"
            id="change-pwd-btn"
            style={{ marginTop: 4, padding: "8px 16px", fontSize: 13 }}
            onClick={onChangePassword}
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
                onToggleTfa();
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
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
      <div className="footer-links">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
      </div>
    </div>
  );
}
