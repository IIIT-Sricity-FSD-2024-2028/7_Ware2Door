import React from "react";

export default function WarehouseToast({ toast }) {
  if (!toast) return null;
  return (
    <div
      className={`toast${toast.isError ? " toast-error" : ""}`}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: toast.isError ? "#ef4444" : "#f4a32a",
        color: "#fff",
        padding: "12px 20px",
        borderRadius: 12,
        fontWeight: 600,
        fontSize: 14,
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      {toast.msg}
    </div>
  );
}
