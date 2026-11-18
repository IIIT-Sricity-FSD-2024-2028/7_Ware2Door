export const fmtDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    })
    : "—";

export const initials = (name) =>
  (name || "?")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const stockStatus = (quantity) =>
  Number(quantity) === 0
    ? "Critical"
    : Number(quantity) <= 10
      ? "Low Stock"
      : "In Stock";

export const normalizeInventory = (items) =>
  items.map((item) => ({
    ...item,
    labelId: item.labelId || item.labelID || "",
    quantity: Number(item.quantity || 0),
    status: stockStatus(item.quantity),
  }));

export const normalizeShipment = (shipment) => ({
  ...shipment,
  city: shipment.city || shipment.customerAddress || shipment.destination || "",
  qty: shipment.qty ?? shipment.quantity ?? 0,
  priority: shipment.priority || "normal",
  sku: shipment.sku || "",
});

export const shipmentSelectionKey = (shipment, index) =>
  shipment.id ||
  shipment._id ||
  [
    shipment.orderId,
    shipment.customerName,
    shipment.customerAddress || shipment.city || shipment.destination,
    shipment.productName,
    shipment.receivedAt || shipment.createdAt,
    index,
  ]
    .filter(Boolean)
    .join("|");

export const normalizeRto = (rto) => ({
  ...rto,
  customerName: rto.customerName || rto.customer || "—",
  reason: (rto.reason || "")
    .replace("Customer Refused: ", "")
    .replace("OTP verification failed after 3 attempts", "3 OTP Failures"),
  lastScannedAt: Array.isArray(rto.updatedAt)
    ? rto.updatedAt.at(-1)
    : rto.lastScannedAt || rto.updatedAt,
});

export const emailPattern =
  /^[A-Za-z0-9][A-Za-z0-9._%+-]{2,}@[A-Za-z0-9][A-Za-z0-9-]{2,}\.[A-Za-z]{3,}$/;

export const phonePattern = /^(\+91[\s-]?)?\d{10}$/;

export const validateProfile = (name, email, phone) => {
  if (!name.trim())
    return "Full name is required.";
  if (!emailPattern.test(email.trim()))
    return "Enter a valid email address.";
  if (!phonePattern.test(phone.trim()))
    return "Phone must contain exactly 10 digits, with an optional +91 prefix.";
  return "";
};

export const validatePassword = (current, next, confirm) => {
  if (!current || !next || !confirm)
    return "Please fill all password fields.";
  if (next.length < 6)
    return "New password must be at least 6 characters long.";
  if (!/[A-Z]/.test(next))
    return "New password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(next))
    return "New password must contain at least one lowercase letter.";
  if (!/\d/.test(next))
    return "New password must contain at least one number.";
  if (!/[^A-Za-z0-9]/.test(next))
    return "New password must contain at least one special character.";
  if (next !== confirm)
    return "New passwords do not match.";
  return "";
};

