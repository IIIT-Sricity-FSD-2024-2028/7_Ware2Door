import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateAuthUser } from "../../auth/store/actions/authActions.js";
import {
  dispatchWarehouseShipment,
  fetchWarehouseInventory,
  fetchWarehouseOutbound,
  fetchWarehousePendingShipments,
  updateWarehousePassword,
  updateWarehouseProfile,
} from "../store/actions/warehouseActions.js";
import {
  closeWarehouseModal,
  openWarehouseDispatch,
  setSelectedWarehouseOrders,
  setWarehouseToast,
} from "../store/slices/warehouseUiSlice.js";
import {
  initials,
  validatePassword,
  validateProfile,
} from "../utils/warehouseUtils.js";

const errorMessage = (error) =>
  typeof error === "string" ? error : error?.message;

export default function WarehouseModals() {
  const dispatch = useDispatch();
  const modal = useSelector((state) => state.warehouse.ui.modal);
  const orderIds = useSelector(
    (state) => state.warehouse.ui.dispatchOrderIds,
  );
  const bulkDispatch = useSelector(
    (state) => state.warehouse.ui.bulkDispatch,
  );
  const { hubs, agencies, pending } = useSelector(
    (state) => state.warehouse.data,
  );
  const user = useSelector((state) => state.auth.session?.user || {});
  const warehouseId = user.id;
  const [hubId, setHubId] = useState("");
  const [agencyId, setAgencyId] = useState("");
  const [editName, setEditName] = useState(user.name || "");
  const [editEmail, setEditEmail] = useState(user.email || "");
  const [editPhone, setEditPhone] = useState(user.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (modal === "dispatch") {
      setHubId((current) => current || hubs[0]?.id || "");
      setAgencyId((current) => current || agencies[0]?.id || "");
    } else if (modal === "edit-profile") {
      setEditName(user.name || "");
      setEditEmail(user.email || "");
      setEditPhone(user.phone || "");
    }
  }, [modal, hubs, agencies, user.name, user.email, user.phone]);

  const showToast = (msg, isError = false) =>
    dispatch(setWarehouseToast({ msg, isError }));

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
      await dispatch(
        updateWarehouseProfile({ warehouseId, profile }),
      ).unwrap();
      await dispatch(updateAuthUser(profile)).unwrap();
      dispatch(closeWarehouseModal());
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
        updateWarehousePassword({
          warehouseId,
          currentPassword,
          newPassword,
        }),
      ).unwrap();
      dispatch(closeWarehouseModal());
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password updated");
    } catch (error) {
      showToast(errorMessage(error) || "Unable to update password.", true);
    }
  }

  async function refreshDispatchData() {
    const results = await Promise.all([
      dispatch(fetchWarehousePendingShipments(warehouseId)),
      dispatch(fetchWarehouseOutbound(warehouseId)),
      dispatch(fetchWarehouseInventory(warehouseId)),
    ]);
    return results.find((result) => result.error);
  }

  async function confirmDispatch() {
    if (!orderIds.length) return showToast("Select a pending shipment.", true);
    if (orderIds.some((id) => !pending.some((shipment) => shipment.orderId === id))) {
      return showToast(
        "Select a valid pending shipment before dispatching.",
        true,
      );
    }
    if (!hubs.some((hub) => hub.id === hubId)) {
      return showToast("Select a valid transit hub.", true);
    }
    if (!agencies.some((agency) => agency.id === agencyId)) {
      return showToast("Select a valid local agency.", true);
    }

    const completed = [];
    const failed = [];
    let firstError = "";
    for (const orderId of orderIds) {
      try {
        await dispatch(
          dispatchWarehouseShipment({
            warehouseId,
            orderId,
            hubId,
            agencyId,
          }),
        ).unwrap();
        completed.push(orderId);
      } catch (error) {
        failed.push(orderId);
        firstError ||= errorMessage(error) || "Unable to dispatch shipment.";
      }
    }

    if (completed.length) {
      const refreshError = await refreshDispatchData();
      if (refreshError) {
        showToast(
          refreshError.payload ||
          refreshError.error?.message ||
          "Shipment sent, but warehouse data could not be refreshed.",
          true,
        );
      }
    }

    if (bulkDispatch) {
      if (!failed.length) {
        dispatch(setSelectedWarehouseOrders([]));
        dispatch(closeWarehouseModal());
        showToast(
          `${completed.length} shipment${completed.length === 1 ? "" : "s"} accepted.`,
        );
      } else {
        dispatch(setSelectedWarehouseOrders(failed));
        dispatch(openWarehouseDispatch({ orderIds: failed, bulk: true }));
        showToast(
          `${completed.length} accepted; ${failed.length} failed. Failed shipments remain selected for retry. ${firstError}`,
          true,
        );
      }
    } else if (completed.length) {
      dispatch(closeWarehouseModal());
      showToast("Shipment dispatched successfully");
    } else if (firstError) {
      showToast(firstError, true);
    }
  }

  if (!modal) return null;

  return (
    <>
      {modal === "dispatch" && (
        <div
          className="modal-overlay"
          id="hub-modal"
          style={{ display: "flex" }}
          onClick={(event) => {
            if (event.target.id === "hub-modal") {
              dispatch(closeWarehouseModal());
            }
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <h3>Assign Transit Hub &amp; Agency</h3>
              <button
                className="modal-close"
                id="close-hub-modal"
                onClick={() => dispatch(closeWarehouseModal())}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 18px" }}>
                {orderIds.length > 1 ? (
                  <>
                    <strong id="hub-modal-order-id">
                      {orderIds.length} selected shipments
                    </strong>{" "}
                    — select the next transit hub and local delivery agency.
                  </>
                ) : (
                  <>
                    Order{" "}
                    <strong id="hub-modal-order-id">{orderIds[0]}</strong> —
                    select the next transit hub and local delivery agency.
                  </>
                )}
              </p>
              <div className="modal-field">
                <label>Transit Hub</label>
                <select
                  id="hub-select"
                  value={hubId}
                  onChange={(event) => setHubId(event.target.value)}
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
                  onChange={(event) => setAgencyId(event.target.value)}
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
                onClick={() => dispatch(closeWarehouseModal())}
              >
                Cancel
              </button>
              <button
                className="modal-save"
                id="confirm-dispatch-btn"
                onClick={confirmDispatch}
              >
                Confirm Dispatch{orderIds.length > 1 ? ` (${orderIds.length})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "edit-profile" && (
        <div
          className="modal-overlay"
          id="edit-modal"
          style={{ display: "flex" }}
          onClick={(event) => {
            if (event.target.id === "edit-modal") {
              dispatch(closeWarehouseModal());
            }
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button
                className="modal-close"
                id="close-edit-modal"
                onClick={() => dispatch(closeWarehouseModal())}
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
                  onChange={(event) => setEditName(event.target.value)}
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
                  onChange={(event) => setEditEmail(event.target.value)}
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
                  onChange={(event) => setEditPhone(event.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-cancel"
                id="cancel-edit-modal"
                onClick={() => dispatch(closeWarehouseModal())}
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
          </div>
        </div>
      )}

      {modal === "change-password" && (
        <div
          className="modal-overlay"
          id="pwd-modal"
          style={{ display: "flex" }}
          onClick={(event) => {
            if (event.target.id === "pwd-modal") {
              dispatch(closeWarehouseModal());
            }
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <h3>Change Password</h3>
              <button
                className="modal-close"
                id="close-pwd-modal"
                onClick={() => dispatch(closeWarehouseModal())}
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
                  onChange={(event) => setCurrentPassword(event.target.value)}
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
                  onChange={(event) => setNewPassword(event.target.value)}
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
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-cancel"
                id="cancel-pwd-modal"
                onClick={() => dispatch(closeWarehouseModal())}
              >
                Cancel
              </button>
              <button
                className="modal-save"
                id="save-pwd-modal"
                onClick={savePassword}
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
