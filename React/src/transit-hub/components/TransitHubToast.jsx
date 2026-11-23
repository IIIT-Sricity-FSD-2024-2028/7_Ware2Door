import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearTransitHubToast } from "../store/slices/transitHubUiSlice.js";

export default function TransitHubToast() {
  const dispatch = useDispatch();
  const toast = useSelector((state) => state.transitHub.ui.toast);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(
      () => dispatch(clearTransitHubToast()),
      3500,
    );
    return () => window.clearTimeout(timer);
  }, [dispatch, toast]);

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
