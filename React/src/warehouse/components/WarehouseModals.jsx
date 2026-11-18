import React from "react";

export default function WarehouseModals({
  hubOpen,
  editOpen,
  passwordOpen,
  currentOrderId,
  selectedCount,
  hubs,
  agencies,
  hubId,
  agencyId,
  onHubChange,
  onAgencyChange,
  onCloseHub,
  onConfirmDispatch,
  editName,
  editEmail,
  editPhone,
  onEditName,
  onEditEmail,
  onEditPhone,
  onCloseEdit,
  onSaveProfile,
  currentPassword,
  newPassword,
  confirmPassword,
  onCurrentPassword,
  onNewPassword,
  onConfirmPassword,
  onClosePassword,
  onSavePassword,
  initials,
}) {
  return (
    <>
      {hubOpen && (
        <div
          className="modal-overlay"
          id="hub-modal"
          style={{ display: "flex" }}
          onClick={(event) => {
            if (event.target.id === "hub-modal") onCloseHub();
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <h3>Assign Transit Hub &amp; Agency</h3>
              <button
                className="modal-close"
                id="close-hub-modal"
                onClick={onCloseHub}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 18px" }}>
                {selectedCount > 1 ? (
                  <>
                    <strong id="hub-modal-order-id">
                      {selectedCount} selected shipments
                    </strong>{" "}
                    — select the next transit hub and local delivery agency.
                  </>
                ) : (
                  <>
                    Order{" "}
                    <strong id="hub-modal-order-id">{currentOrderId}</strong> —
                    select the next transit hub and local delivery agency.
                  </>
                )}
              </p>
              <div className="modal-field">
                <label>Transit Hub</label>
                <select
                  id="hub-select"
                  value={hubId}
                  onChange={(event) => onHubChange(event.target.value)}
                >
                  {hubs.map((hub) => (
                    <option key={hub.id} value={hub.id}>
                      {hub.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-field" style={{ marginTop: 14 }}>
                <label>Local Delivery Agency</label>
                <select
                  id="agency-select"
                  value={agencyId}
                  onChange={(event) => onAgencyChange(event.target.value)}
                >
                  {agencies.map((agency) => (
                    <option key={agency.id} value={agency.id}>
                      {agency.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-cancel"
                id="cancel-hub-modal"
                onClick={onCloseHub}
              >
                Cancel
              </button>
              <button
                className="modal-save"
                id="confirm-dispatch-btn"
                onClick={onConfirmDispatch}
              >
                Confirm Dispatch{selectedCount > 1 ? ` (${selectedCount})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <div
          className="modal-overlay"
          id="edit-modal"
          style={{ display: "flex" }}
          onClick={(event) => {
            if (event.target.id === "edit-modal") onCloseEdit();
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button
                className="modal-close"
                id="close-edit-modal"
                onClick={onCloseEdit}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="modal-avatar-row">
              <div className="modal-avatar">{initials(editName)}</div>
              <div>
                <p className="modal-avatar-name" id="modal-display-name">
                  {editName}
                </p>
                <p className="modal-avatar-role" id="modal-display-role">
                  Warehouse Admin
                </p>
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
                  value={editName}
                  onChange={(event) => onEditName(event.target.value)}
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
                  value={editEmail}
                  onChange={(event) => onEditEmail(event.target.value)}
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
                  value={editPhone}
                  onChange={(event) => onEditPhone(event.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-cancel"
                id="cancel-edit-modal"
                onClick={onCloseEdit}
              >
                Cancel
              </button>
              <button
                className="modal-save"
                id="save-edit-modal"
                onClick={onSaveProfile}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {passwordOpen && (
        <div
          className="modal-overlay"
          id="pwd-modal"
          style={{ display: "flex" }}
          onClick={(event) => {
            if (event.target.id === "pwd-modal") onClosePassword();
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <h3>Change Password</h3>
              <button
                className="modal-close"
                id="close-pwd-modal"
                onClick={onClosePassword}
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
                  value={currentPassword}
                  onChange={(event) => onCurrentPassword(event.target.value)}
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
                  value={newPassword}
                  onChange={(event) => onNewPassword(event.target.value)}
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
                  value={confirmPassword}
                  onChange={(event) => onConfirmPassword(event.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-cancel"
                id="cancel-pwd-modal"
                onClick={onClosePassword}
              >
                Cancel
              </button>
              <button
                className="modal-save"
                id="save-pwd-modal"
                onClick={onSavePassword}
              >
                <i className="fa-solid fa-lock"></i> Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
