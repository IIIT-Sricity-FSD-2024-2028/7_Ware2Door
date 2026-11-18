export const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};

export const initials = (name) =>
  (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const emailPattern =
  /^[A-Za-z0-9][A-Za-z0-9._%+-]{2,}@[A-Za-z0-9][A-Za-z0-9-]{2,}\.[A-Za-z]{3,}$/;

export const shipmentStatusClass = (s) => {
  if (s === "Delivered") return "status-delivered";
  if (s === "Out for Delivery") return "status-out";
  if (s === "Failed") return "status-failed";
  if (s?.includes("RTO")) return "status-rto";
  if (s === "Resolved" || s === "Returned to Warehouse")
    return "status-resolved";
  if (s === "In Progress") return "status-progress";
  if (s === "Escalated") return "status-escalated";
  if (s === "Open") return "status-open";
  return "status-pending";
};

export const agentStatusClass = (s) =>
  s === "Active"
    ? "agent-active"
    : s === "Busy"
      ? "agent-busy"
      : "agent-offline";

export const agentDotClass = (s) =>
  s === "Active" ? "dot-green" : s === "Busy" ? "dot-orange" : "dot-grey";

export const statBadgeClass = (s) => {
  if (s === "Active" || s === "Delivered" || s === "Resolved")
    return "stat-badge--green";
  if (
    s === "Busy" ||
    s === "Out for Delivery" ||
    s === "Open" ||
    s === "Failed"
  )
    return "stat-badge--orange";
  return "stat-badge--blue";
};
