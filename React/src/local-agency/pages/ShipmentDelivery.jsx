import React, { useEffect, useRef, useState } from "react";
import { localAgencyApi } from "../api/localAgencyApi.js";
import LocalAgencyStatusBadge from "../components/LocalAgencyStatusBadge.jsx";
import LocalAgencyModal from "../components/LocalAgencyModal.jsx";
import { validateRequiredText } from "../../utils/inputValidation.js";

export default function ShipmentDelivery({
  agencyId,
  showToast,
  deliveries: deliveryList,
  loadDeliveries,
  loadRto,
  onNavigateRto,
}) {
  const [updateModal, setUpdateModal] = useState(false);
  const [current, setCurrent] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [notes, setNotes] = useState("");
  const [otpModal, setOtpModal] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpMessage, setOtpMessage] = useState("");
  const [otpInvalid, setOtpInvalid] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const otpInputs = useRef([]);

  useEffect(() => {
    if (otpModal) otpInputs.current[0]?.focus();
  }, [otpModal]);

  function openUpdate(d) {
    setCurrent(d);
    setSelectedStatus(null);
    setNotes("");
    setUpdateModal(true);
  }

  function openOtpVerification(delivery) {
    setCurrent(delivery);
    setOtp(["", "", "", "", "", ""]);
    setOtpAttempts(0);
    setOtpMessage("");
    setOtpInvalid(false);
    setUpdateModal(false);
    setOtpModal(true);
  }

  function updateOtpDigit(index, value) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtp((previous) =>
      previous.map((currentDigit, digitIndex) =>
        digitIndex === index ? digit : currentDigit,
      ),
    );
    if (digit && index < otpInputs.current.length - 1) {
      otpInputs.current[index + 1]?.focus();
    }
  }

  function pasteOtp(event) {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    event.preventDefault();
    setOtp(Array.from({ length: 6 }, (_, index) => digits[index] || ""));
    otpInputs.current[Math.min(digits.length, 5)]?.focus();
  }

  async function refreshDeliveryData() {
    await Promise.all([loadDeliveries(), loadShipments(), loadRto()]);
  }

  async function verifyDeliveryOtp() {
    if (otpVerifying) return;
    const enteredOtp = otp.join("");
    if (!/^\d{6}$/.test(enteredOtp)) {
      setOtpMessage("Please enter all 6 digits.");
      return;
    }

    setOtpVerifying(true);
    setOtpMessage("");
    try {
      if (enteredOtp === "000000") {
        const result = await localAgencyApi.confirmDelivery(
          agencyId,
          current.trackingId.replace(/^#/, ""),
        );
        if (result?.status !== "success") {
          throw new Error(result?.flagMsg || "Unable to confirm delivery.");
        }
        setOtpModal(false);
        setCurrent(null);
        setSelectedStatus(null);
        showToast(`${current.trackingId} successfully delivered!`);
        await refreshDeliveryData();
        return;
      }

      const failedAttempts = otpAttempts + 1;
      setOtpAttempts(failedAttempts);
      setOtpInvalid(true);
      window.setTimeout(() => setOtpInvalid(false), 600);
      if (failedAttempts < 3) {
        const remaining = 3 - failedAttempts;
        setOtpMessage(
          `Incorrect OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
        );
        setOtp(["", "", "", "", "", ""]);
        window.setTimeout(() => otpInputs.current[0]?.focus(), 0);
        return;
      }

      setOtpMessage("3 failed OTP attempts. Raising RTO automatically...");
      const rtoResult = await localAgencyApi.initiateRto(agencyId, {
        trackingId: current.trackingId.replace(/^#/, ""),
        customerName: current.customerName,
        agentId: current.agentId,
        agentName: current.agentName,
        reason: "OTP verification failed after 3 attempts",
      });
      if (rtoResult?.status !== "success") {
        throw new Error(rtoResult?.message || "Unable to raise an RTO.");
      }
      setOtpModal(false);
      setCurrent(null);
      setSelectedStatus(null);
      showToast(`${current.trackingId} raised to RTO after failed OTP.`, true);
      await refreshDeliveryData();
      onNavigateRto();
    } catch (error) {
      setOtpMessage(error.message || "Unable to verify delivery OTP.");
    } finally {
      setOtpVerifying(false);
    }
  }

  async function submitUpdate() {
    if (!current || !selectedStatus) {
      showToast("Select a status", true);
      return;
    }
    if (selectedStatus === "Customer Refused") {
      const noteError = validateRequiredText(notes, "Internal delivery notes", {
        min: 1,
        max: 1000,
      });
      if (noteError) {
        showToast(
          noteError === "Internal delivery notes is required."
            ? "Internal Delivery Notes are mandatory when a customer refuses the package."
            : noteError,
          true,
        );
        return;
      }
    } else if (notes.trim()) {
      const noteError = validateRequiredText(notes, "Internal delivery notes", {
        min: 1,
        max: 1000,
      });
      if (noteError) {
        showToast(noteError, true);
        return;
      }
    }
    try {
      let result;
      if (selectedStatus === "Delivered") {
        openOtpVerification(current);
        return;
      } else if (selectedStatus === "Customer Refused") {
        result = await localAgencyApi.initiateRto(agencyId, {
          trackingId: current.trackingId,
          customerName: current.customerName,
          agentId: current.agentId,
          agentName: current.agentName,
          reason: "Customer Refused",
          notes: notes.trim(),
        });
        if (result?.status !== "success")
          throw new Error(result?.message || "Unable to initiate RTO.");
        showToast("Customer refusal recorded. Shipment moved to RTO.");
      } else {
        result = await localAgencyApi.recordDeliveryAttempt(
          agencyId,
          current.trackingId,
          {
            failStatus: selectedStatus,
            notes: notes.trim(),
          },
        );
        if (result?.status !== "success")
          throw new Error(result?.flagMsg || "Unable to record delivery attempt.");
        showToast(
          result.autoRTO
            ? "Delivery attempt threshold reached. Shipment moved to RTO."
            : "Attempt recorded",
        );
      }
      setUpdateModal(false);
      await refreshDeliveryData();
      if (
        selectedStatus === "Customer Refused" ||
        (selectedStatus !== "Delivered" && result?.autoRTO)
      ) {
        onNavigateRto();
      }
    } catch (e) {
      showToast(e.message, true);
    }
  }

  const statusCards = [
    {
      id: "dsc-delivered",
      status: "Delivered",
      icon: "fa-circle-check",
      label: "Delivered",
      sub: "Package handed to customer",
    },
    {
      id: "dsc-notavail",
      status: "Not Available",
      icon: "fa-user-slash",
      label: "Not Available",
      sub: "Customer not reachable",
    },
    {
      id: "dsc-address",
      status: "Address Not Found",
      icon: "fa-location-dot",
      label: "Address Not Found",
      sub: "Incorrect or incomplete address",
    },
    {
      id: "dsc-refused",
      status: "Customer Refused",
      icon: "fa-hand",
      label: "Customer Refused",
      sub: "Customer refused to accept",
    },
  ];

  return (
    <div className="delivery-page page-content">
      <div className="page-title-row">
        <div>
          <h2 className="page-title">Shipment Delivery</h2>
          <p className="page-subtitle">
            Update delivery status and manage last-mile delivery operations.
          </p>
        </div>
      </div>
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>TRACKING ID</th>
              <th>CUSTOMER</th>
              <th>ADDRESS</th>
              <th>AGENT</th>
              <th>STATUS</th>
              <th>ATTEMPTS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody id="delivery-tbody">
            {deliveryList.map((d, i) => {
              const attCls = `attempts-${Math.min(d.attemptCount || 0, 3)}`;
              return (
                <tr key={i}>
                  <td>
                    <strong style={{ color: "#1e293b" }}>{d.trackingId}</strong>
                  </td>
                  <td>{d.customerName}</td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>
                    {d.customerAddress || "—"}
                  </td>
                  <td>{d.agentName || "—"}</td>
                  <td>
                    <LocalAgencyStatusBadge status={d.status} />
                  </td>
                  <td>
                    <span className={`attempts-badge ${attCls}`}>
                      {d.attemptCount || 0} attempt
                      {(d.attemptCount || 0) !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-primary"
                      style={{ padding: "6px 14px", fontSize: 12 }}
                      onClick={() => openUpdate(d)}
                    >
                      <i className="fa-solid fa-clipboard-check"></i> Update
                    </button>
                  </td>
                </tr>
              );
            })}
            {deliveryList.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-msg">
                  No active deliveries. Out-scan packages first.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <LocalAgencyModal
        id="delivery-status-modal"
        open={updateModal}
        onClose={() => setUpdateModal(false)}
      >
        <div className="modal-header modal-header--dark">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <i
              className="fa-solid fa-clipboard-check"
              style={{ color: "white", fontSize: 16 }}
            ></i>
            <div>
              <h3 style={{ color: "white" }}>Update Delivery Status</h3>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.65)",
                }}
              >
                {current?.trackingId} — {current?.customerName}
              </p>
            </div>
          </div>
          <button
            className="modal-close modal-close--light"
            onClick={() => setUpdateModal(false)}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="modal-body">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 18,
            }}
          >
            {statusCards.map((card) => (
              <div
                key={card.id}
                id={card.id}
                className={`delivery-status-card${selectedStatus === card.status ? " dsc-selected" : ""}`}
                style={{
                  cursor: "pointer",
                  border: `2px solid ${selectedStatus === card.status ? "#f4a32a" : "#e2e8f0"}`,
                  borderRadius: 12,
                  padding: 16,
                  transition: "border-color 0.2s",
                }}
                onClick={() => setSelectedStatus(card.status)}
              >
                <div
                  className={`dsc-icon ${selectedStatus === card.status && card.status !== "Delivered" ? "" : card.status === "Delivered" ? "dsc-green" : "dsc-grey"}`}
                  style={
                    selectedStatus === card.status &&
                    card.status !== "Delivered"
                      ? { background: "#f4a32a", color: "white" }
                      : {}
                  }
                >
                  <i className={`fa-solid ${card.icon}`}></i>
                </div>
                <div
                  style={{
                    marginTop: 10,
                    fontWeight: 600,
                    fontSize: 13,
                    color: "#1e293b",
                  }}
                >
                  {card.label}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                  {card.sub}
                </div>
              </div>
            ))}
          </div>
          <div className="modal-field">
            <label>
              Notes {selectedStatus === "Customer Refused" ? "(required)" : "(optional)"}
            </label>
            <textarea
              id="delivery-notes"
              rows={3}
              placeholder={
                selectedStatus === "Customer Refused"
                  ? "Enter the reason for customer refusal..."
                  : "Add any notes about this delivery attempt..."
              }
              required={selectedStatus === "Customer Refused"}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontFamily: "'Poppins',sans-serif",
                fontSize: 13,
                resize: "vertical",
                outline: "none",
              }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button
            className="modal-cancel"
            onClick={() => setUpdateModal(false)}
          >
            Cancel
          </button>
          <button
            className="modal-save modal-save--orange"
            onClick={submitUpdate}
          >
            <i className="fa-solid fa-circle-check"></i> Confirm Update
          </button>
        </div>
      </LocalAgencyModal>
      <LocalAgencyModal
        id="delivery-otp-modal"
        open={otpModal}
        onClose={() => setOtpModal(false)}
        modalClassName="otp-modal-inner"
      >
        <div className="otp-header-bar"></div>
        <button
          className="modal-close"
          style={{
            position: "absolute",
            right: 16,
            top: 16,
            color: "#64748b",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: 18,
          }}
          onClick={() => setOtpModal(false)}
          aria-label="Close OTP verification"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
        <div className="otp-modal-body">
          <div className="otp-avatar-wrap">
            <div className="otp-avatar-icon">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
          </div>
          <h2 className="otp-title">Verify Delivery</h2>
          <p className="otp-subtitle">
            Please enter the 6-digit code provided by the customer
          </p>
          <div className="otp-info-row">
            <div className="otp-info-cell">
              <span className="otp-info-label">TRACKING ID</span>
              <span className="otp-info-val">{current?.trackingId || "—"}</span>
            </div>
            <div className="otp-info-cell">
              <span className="otp-info-label">CUSTOMER</span>
              <span className="otp-info-val">
                {current?.customerName || "—"}
              </span>
            </div>
            <div className="otp-info-cell">
              <span className="otp-info-label">AGENT</span>
              <span className="otp-info-val">{current?.agentName || "—"}</span>
            </div>
          </div>
          <p className="otp-code-label">6-Digit OTP Code</p>
          <div className="otp-boxes">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  otpInputs.current[index] = element;
                }}
                className={`otp-box${otpInvalid ? " otp-error" : ""}`}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={1}
                value={digit}
                aria-label={`OTP digit ${index + 1}`}
                onChange={(event) => updateOtpDigit(index, event.target.value)}
                onPaste={pasteOtp}
                onKeyDown={(event) => {
                  if (
                    event.key === "Backspace" &&
                    !digit &&
                    index > 0
                  ) {
                    otpInputs.current[index - 1]?.focus();
                  }
                }}
              />
            ))}
          </div>
          <p className="otp-attempts-msg" role="alert">
            {otpMessage}
          </p>
          <p className="otp-resend" aria-disabled="true">
            Resend OTP Code
          </p>
          <button
            className="otp-verify-btn"
            onClick={verifyDeliveryOtp}
            disabled={otpVerifying}
          >
            {otpVerifying ? "Verifying..." : "Verify OTP"}
          </button>
          <div className="otp-footer-row">
            <span className="otp-location">
              <i
                className="fa-solid fa-location-dot"
                style={{ color: "#f4a32a", marginRight: 4 }}
              ></i>
              Chennai, IN
            </span>
            <span className="otp-last-attempt">
              Last OTP attempt: just now
            </span>
          </div>
        </div>
      </LocalAgencyModal>
    </div>
  );
}
