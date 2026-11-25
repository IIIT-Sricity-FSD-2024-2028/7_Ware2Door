import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearLocalAgencyToast } from "../store/slices/localAgencyUiSlice.js";

export default function LocalAgencyToast() {
  const dispatch = useDispatch();
  const toast = useSelector((state) => state.localAgency.ui.toast);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(
      () => dispatch(clearLocalAgencyToast()),
      3500,
    );
    return () => window.clearTimeout(timer);
  }, [dispatch, toast]);

  if (!toast) return null;

  return (
    <div
      className={`agency-toast${toast.isError ? " agency-toast-error" : ""}`}
    >
      {toast.msg}
    </div>
  );
}
