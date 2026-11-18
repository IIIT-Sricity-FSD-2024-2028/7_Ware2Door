import { useState } from "react";
import { transitHubApi } from "../api/transitHubApi.js";

export default function useTransitHubUi({ user, hubId, data, notify }) {
  const [page, setPage] = useState("dashboard");
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [scanMode, setScanMode] = useState("inscan");
  const [inventorySearch, setInventorySearch] = useState("");
  const [inscanValue, setInscanValue] = useState("");
  const [outscanValue, setOutscanValue] = useState("");
  const [inscanResult, setInscanResult] = useState(null);
  const [outscanResult, setOutscanResult] = useState(null);
  const [tfaEnabled, setTfaEnabled] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [editName, setEditName] = useState(user.name || "");
  const [editEmail, setEditEmail] = useState(user.email || "");
  const [editPhone, setEditPhone] = useState(user.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = (nextPage) => {
    setPage(nextPage);
    setInventoryOpen(["hub-inv", "reports"].includes(nextPage));
    if (nextPage === "reports") data.loadReports();
  };

  const inscan = async () => {
    const result = await data.inscan(inscanValue);
    if (result) {
      setInscanResult(result);
      setInscanValue("");
      if (result.status === "success") {
        notify(
          result.rto?.rtoId
            ? `RTO ${result.rto.rtoId} added to hub inventory`
            : "In-Scan successful",
        );
      } else {
        notify(result.flagMsg || "In-scan failed.", true);
      }
    }
  };

  const outscan = async () => {
    const result = await data.outscan(outscanValue);
    if (result) {
      setOutscanResult(result);
      setOutscanValue("");
      if (result.status === "success") {
        notify("Out-Scan successful");
      } else {
        notify(result.flagMsg || "Out-scan failed.", true);
      }
    }
  };

  const saveProfile = async (validateProfile) => {
    const name = editName.trim();
    const email = editEmail.trim();
    const phone = editPhone.trim();
    const error = validateProfile(name, email, phone);
    if (error) return notify(error, true);
    try {
      await transitHubApi.updateProfile(hubId, { name, email, phone });
      const stored = JSON.parse(localStorage.getItem("session") || "null");
      if (stored?.user) {
        localStorage.setItem(
          "session",
          JSON.stringify({
            ...stored,
            user: { ...stored.user, name, email, phone },
          }),
        );
      }
      notify("Profile updated");
      setEditOpen(false);
    } catch (error) {
      notify(error.message || "Unable to update profile.", true);
    }
  };

  const savePassword = async (validatePassword) => {
    const error = validatePassword(
      currentPassword,
      newPassword,
      confirmPassword,
    );
    if (error) return notify(error, true);
    try {
      await transitHubApi.updatePassword(hubId, {
        currentPassword,
        newPassword,
      });
      notify("Password updated");
      setPasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      notify(error.message || "Unable to update password.", true);
    }
  };

  return {
    page,
    setPage,
    inventoryOpen,
    setInventoryOpen,
    scanMode,
    setScanMode,
    inventorySearch,
    setInventorySearch,
    inscanValue,
    setInscanValue,
    outscanValue,
    setOutscanValue,
    inscanResult,
    outscanResult,
    tfaEnabled,
    setTfaEnabled,
    editOpen,
    setEditOpen,
    passwordOpen,
    setPasswordOpen,
    editName,
    setEditName,
    editEmail,
    setEditEmail,
    editPhone,
    setEditPhone,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    navigate,
    inscan,
    outscan,
    saveProfile,
    savePassword,
  };
}
