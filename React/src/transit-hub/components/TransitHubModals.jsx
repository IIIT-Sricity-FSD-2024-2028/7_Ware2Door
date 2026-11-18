import React, { useEffect } from "react";

export default function TransitHubModals({
  editOpen,
  passwordOpen,
  editName,
  editEmail,
  editPhone,
  currentPassword,
  newPassword,
  confirmPassword,
  onCloseEdit,
  onClosePassword,
  onEditName,
  onEditEmail,
  onEditPhone,
  onCurrentPassword,
  onNewPassword,
  onConfirmPassword,
  onSaveProfile,
  onSavePassword,
  initials,
}) {
  useEffect(() => {
    if (!editOpen && !passwordOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") {
        if (editOpen) onCloseEdit();
        else onClosePassword();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editOpen, passwordOpen, onCloseEdit, onClosePassword]);

  return (
    <>
      {editOpen && (
        <Modal onClose={onCloseEdit}>
          <div className="modal-header">
            <h3>Edit Profile</h3>
            <button className="modal-close" onClick={onCloseEdit}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="modal-avatar-row">
            <div className="modal-avatar">{initials(editName)}</div>
            <div>
              <p className="modal-avatar-name">{editName}</p>
              <p className="modal-avatar-role">Transit Hub Manager</p>
            </div>
          </div>
          <div className="modal-body">
            <Field label="Full Name" value={editName} onChange={onEditName} />
            <Field
              label="Email Address"
              type="email"
              value={editEmail}
              onChange={onEditEmail}
            />
            <Field
              label="Phone Number"
              type="tel"
              value={editPhone}
              onChange={onEditPhone}
            />
          </div>
          <div className="modal-footer">
            <button className="modal-cancel" onClick={onCloseEdit}>
              Cancel
            </button>
            <button className="modal-save" onClick={onSaveProfile}>
              Save Changes
            </button>
          </div>
        </Modal>
      )}
      {passwordOpen && (
        <Modal onClose={onClosePassword}>
          <div className="modal-header">
            <h3>Change Password</h3>
            <button className="modal-close" onClick={onClosePassword}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="modal-body">
            <Field
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={onCurrentPassword}
            />
            <Field
              label="New Password"
              type="password"
              value={newPassword}
              onChange={onNewPassword}
            />
            <Field
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={onConfirmPassword}
            />
          </div>
          <div className="modal-footer">
            <button className="modal-cancel" onClick={onClosePassword}>
              Cancel
            </button>
            <button className="modal-save" onClick={onSavePassword}>
              <i className="fa-solid fa-lock"></i> Update Password
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function Field({ label, type = "text", value, onChange }) {
  return (
    <div className="modal-field">
      <label>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function Modal({ onClose, children }) {
  return (
    <div
      className="modal-overlay"
      style={{ display: "flex" }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal">{children}</div>
    </div>
  );
}
