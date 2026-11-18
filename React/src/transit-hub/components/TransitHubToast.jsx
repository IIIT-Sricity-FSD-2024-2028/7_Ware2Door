import React from "react";

export default function TransitHubToast({ toast }) {
  if (!toast) return null;
  return (
    <div
      className={`toast${toast.isError ? " error" : ""}`}
      style={{ display: "block" }}
    >
      {toast.msg}
    </div>
  );
}
