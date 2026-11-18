import React from "react";
import { shipmentStatusClass } from "../utils/helpers.js";

export default function LocalAgencyStatusBadge({ status, cls }) {
  return (
    <span className={`status-badge ${cls || shipmentStatusClass(status)}`}>
      {status || "—"}
    </span>
  );
}
