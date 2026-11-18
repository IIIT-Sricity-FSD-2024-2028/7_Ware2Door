import React from "react";

export default function LocalAgencyToast({ toast }) {
  if (!toast) return null;

  return (
    <div
      className={`agency-toast${toast.isError ? " agency-toast-error" : ""}`}
    >
      {toast.msg}
    </div>
  );
}
