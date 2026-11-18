import { useEffect, useMemo, useState } from "react";
import { warehouseApi } from "../api/warehouseApi.js";

export default function useWarehouseUi({
  page,
  setPage,
  user,
  data,
  notify,
  warehouseId,
}) {
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [shipSearch, setShipSearch] = useState("");
  const [shipSource, setShipSource] = useState("");
  const [shipPriority, setShipPriority] = useState("");
  const [shipStock, setShipStock] = useState("");
  const [rtoSearch, setRtoSearch] = useState("");
  const [rtoStatus, setRtoStatus] = useState("");
  const [rtoReason, setRtoReason] = useState("");
  const [rtoScan, setRtoScan] = useState("");
  const [rtoPage, setRtoPage] = useState(1);
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryStatus, setInventoryStatus] = useState("");
  const [inventoryPage, setInventoryPage] = useState(1);
  const [expandedHub, setExpandedHub] = useState(null);
  const [stockLabel, setStockLabel] = useState("");
  const [stockName, setStockName] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [hubModal, setHubModal] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [dispatchOrderIds, setDispatchOrderIds] = useState([]);
  const [bulkDispatch, setBulkDispatch] = useState(false);
  const [hubId, setHubId] = useState("");
  const [agencyId, setAgencyId] = useState("");
  const [editModal, setEditModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [editName, setEditName] = useState(user.name || "");
  const [editEmail, setEditEmail] = useState(user.email || "");
  const [editPhone, setEditPhone] = useState(user.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tfaEnabled, setTfaEnabled] = useState(false);

  useEffect(() => {
    if (
      ![
        "prealert",
        "outbound",
        "inventory-overview",
        "stock-addition",
      ].includes(page)
    ) {
      setInventoryOpen(false);
    }
  }, [page]);

  const navigate = (nextPage) => {
    setPage(nextPage);
    if (nextPage === "prealert") data.loadPreAlert();
  };

  const shipments = useMemo(
    () =>
      data.pending.filter((item) => {
        const query = shipSearch.toLowerCase();
        return (
          (!query ||
            `${item.orderId} ${item.productName} ${item.sku}`
              .toLowerCase()
              .includes(query)) &&
          (!shipSource || item.source === shipSource) &&
          (!shipPriority || item.priority === shipPriority) &&
          (!shipStock || data.availability(item.productName).key === shipStock)
        );
      }),
    [
      data.pending,
      data.availability,
      shipSearch,
      shipSource,
      shipPriority,
      shipStock,
    ],
  );

  const openDispatch = (orderIds, isBulk = false) => {
    const ids = Array.isArray(orderIds) ? orderIds : [orderIds];
    setDispatchOrderIds(ids);
    setBulkDispatch(isBulk);
    setOrderId(ids[0] || "");
    setHubId(data.hubs[0]?.id || "");
    setAgencyId(data.agencies[0]?.id || "");
    setHubModal(true);
  };

  const dispatch = async () => {
    const completedOrderIds = [];
    const failedOrderIds = [];
    const orderIds = bulkDispatch ? dispatchOrderIds : [orderId];

    for (const id of orderIds) {
      if (await data.dispatch(id, hubId, agencyId)) completedOrderIds.push(id);
      else failedOrderIds.push(id);
    }

    if (bulkDispatch) {
      setDispatchOrderIds(failedOrderIds);
      setSelected(new Set(failedOrderIds));
      if (!failedOrderIds.length) {
        setHubModal(false);
        notify(
          `${completedOrderIds.length} shipment${completedOrderIds.length === 1 ? "" : "s"} accepted.`,
        );
      } else {
        setOrderId(failedOrderIds[0]);
        notify(
          `${completedOrderIds.length} accepted; ${failedOrderIds.length} failed. Failed shipments remain selected for retry.`,
          true,
        );
      }
      return;
    }

    if (completedOrderIds.length) setHubModal(false);
  };

  const inscan = async () => {
    if (await data.inscan(rtoScan)) setRtoScan("");
  };

  const saveProfile = async (validateProfile) => {
    const error = validateProfile(editName, editEmail, editPhone);
    if (error) return notify(error, true);
    try {
      await warehouseApi.updateProfile(warehouseId, {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
      });
      const stored = JSON.parse(localStorage.getItem("session") || "null");
      if (stored?.user) {
        localStorage.setItem(
          "session",
          JSON.stringify({
            ...stored,
            user: {
              ...stored.user,
              name: editName.trim(),
              email: editEmail.trim(),
              phone: editPhone.trim(),
            },
          }),
        );
      }
      setEditModal(false);
      notify("Profile updated");
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
      await warehouseApi.updatePassword(warehouseId, {
        currentPassword,
        newPassword,
      });
      setPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      notify("Password updated");
    } catch (error) {
      notify(error.message || "Unable to update password.", true);
    }
  };

  return {
    inventoryOpen,
    setInventoryOpen,
    selected,
    setSelected,
    shipments,
    shipSearch,
    setShipSearch,
    shipSource,
    setShipSource,
    shipPriority,
    setShipPriority,
    shipStock,
    setShipStock,
    rtoSearch,
    setRtoSearch,
    rtoStatus,
    setRtoStatus,
    rtoReason,
    setRtoReason,
    rtoScan,
    setRtoScan,
    rtoPage,
    setRtoPage,
    inventorySearch,
    setInventorySearch,
    inventoryStatus,
    setInventoryStatus,
    inventoryPage,
    setInventoryPage,
    expandedHub,
    setExpandedHub,
    stockLabel,
    setStockLabel,
    stockName,
    setStockName,
    stockQuantity,
    setStockQuantity,
    setRecentStock: data.setRecentStock,
    hubModal,
    setHubModal,
    orderId,
    dispatchOrderIds,
    hubId,
    setHubId,
    agencyId,
    setAgencyId,
    editModal,
    setEditModal,
    passwordModal,
    setPasswordModal,
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
    tfaEnabled,
    setTfaEnabled,
    navigate,
    openDispatch,
    dispatch,
    inscan,
    saveProfile,
    savePassword,
  };
}
