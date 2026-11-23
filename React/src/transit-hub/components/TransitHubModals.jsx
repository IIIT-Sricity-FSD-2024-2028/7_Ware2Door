import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateAuthUser } from "../../auth/store/actions/authActions.js";
import {
  updateTransitHubPassword,
  updateTransitHubProfile,
} from "../store/actions/transitHubActions.js";
import {
  setTransitHubModal,
  setTransitHubToast,
} from "../store/slices/transitHubUiSlice.js";
import {
  initials,
  validatePassword,
  validateProfile,
} from "../utils/transitHubUtils.js";

const errorMessage = (error) =>
  typeof error === "string" ? error : error?.message;

export default function TransitHubModals() {
  const dispatch = useDispatch();
  const modal = useSelector((state) => state.transitHub.ui.modal);
  const user = useSelector((state) => state.auth.session?.user || {});
  const hubId = user.id;
  const [editName, setEditName] = useState(user.name || "");
  const [editEmail, setEditEmail] = useState(user.email || "");
  const [editPhone, setEditPhone] = useState(user.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const editOpen = modal === "edit-profile";
  const passwordOpen = modal === "change-password";
  const close = () => dispatch(setTransitHubModal(null));

  useEffect(() => {
    if (editOpen) {
      setEditName(user.name || "");
      setEditEmail(user.email || "");
      setEditPhone(user.phone || "");
    }
  }, [editOpen, user.name, user.email, user.phone]);

  useEffect(() => {
    if (!modal) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal]);

  const showToast = (msg, isError = false) =>
    dispatch(setTransitHubToast({ msg, isError }));

  async function saveProfile() {
    const profile = {
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
    };
    const validationError = validateProfile(
      profile.name,
      profile.email,
      profile.phone,
    );
    if (validationError) return showToast(validationError, true);
    try {
      await dispatch(updateTransitHubProfile({ hubId, profile })).unwrap();
      await dispatch(updateAuthUser(profile)).unwrap();
      close();
      showToast("Profile updated");
    } catch (error) {
      showToast(errorMessage(error) || "Unable to update profile.", true);
    }
  }

  async function savePassword() {
    const validationError = validatePassword(
      currentPassword,
      newPassword,
      confirmPassword,
    );
    if (validationError) return showToast(validationError, true);
    try {
      await dispatch(
        updateTransitHubPassword({ hubId, currentPassword, newPassword }),
      ).unwrap();
      close();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password updated");
    } catch (error) {
      showToast(errorMessage(error) || "Unable to update password.", true);
    }
  }

  return (
    <>
      {editOpen && (
        <Modal onClose={close}>
          <div className="modal-header">
            <h3>Edit Profile</h3>
            <button className="modal-close" onClick={close}>
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
            <Field label="Full Name" value={editName} onChange={setEditName} />
            <Field
              label="Email Address"
              type="email"
              value={editEmail}
              onChange={setEditEmail}
            />
            <Field
              label="Phone Number"
              type="tel"
              value={editPhone}
              onChange={setEditPhone}
            />
          </div>
          <div className="modal-footer">
            <button className="modal-cancel" onClick={close}>
              Cancel
            </button>
            <button className="modal-save" onClick={saveProfile}>
              Save Changes
            </button>
          </div>
        </Modal>
      )}
      {passwordOpen && (
        <Modal onClose={close}>
          <div className="modal-header">
            <h3>Change Password</h3>
            <button className="modal-close" onClick={close}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="modal-body">
            <Field
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={setCurrentPassword}
            />
            <Field
              label="New Password"
              type="password"
              value={newPassword}
              onChange={setNewPassword}
            />
            <Field
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
          </div>
          <div className="modal-footer">
            <button className="modal-cancel" onClick={close}>
              Cancel
            </button>
            <button className="modal-save" onClick={savePassword}>
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
