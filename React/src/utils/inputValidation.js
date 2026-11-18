export const TRACKING_ID_PATTERN =
  /^(?:TRK\d{4}|TRK-[A-Z0-9]+(?:-[A-Z0-9]+)*)$/i;
export const RTO_ID_PATTERN =
  /^(?:RTOID-\d{13}-\d{3}|RTO-\d{13})$/i;
export const SHIPMENT_LABEL_PATTERN = /^SHP-\d{4}-\d+$/i;
export const PHONE_PATTERN = /^(\+91[\s-]?)?\d{10}$/;
export const EMAIL_PATTERN =
  /^[A-Z0-9](?:[A-Z0-9._%+-]*[A-Z0-9])?@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z]{2,})+$/i;

export const normalizeIdentifier = (value) =>
  String(value || "")
    .trim()
    .replace(/^#/, "")
    .toUpperCase();

export function validateTrackingId(value, { allowRto = false } = {}) {
  const identifier = normalizeIdentifier(value);
  if (!identifier) return "Enter a tracking ID.";
  if (
    !TRACKING_ID_PATTERN.test(identifier) &&
    !(allowRto && RTO_ID_PATTERN.test(identifier))
  ) {
    return allowRto
      ? "ID format not recognized. Use TRK#### or a valid RTO ID."
      : "Tracking ID format not recognized. Use TRK####.";
  }
  return "";
}

export function validateRtoId(value) {
  const identifier = normalizeIdentifier(value);
  if (!identifier) return "Enter an RTO ID.";
  return RTO_ID_PATTERN.test(identifier)
    ? ""
    : "RTO ID format not recognized. Use RTOID-<13-digit timestamp>-<3-digit number>.";
}

export function validateShipmentLabel(value) {
  const label = String(value || "").trim();
  if (!label) return "Shipment label ID is required.";
  return SHIPMENT_LABEL_PATTERN.test(label)
    ? ""
    : "Shipment label format not recognized. Use SHP-YYYY-number.";
}

export function validateEmail(value) {
  return EMAIL_PATTERN.test(String(value || "").trim())
    ? ""
    : "Enter a valid email address.";
}

export function validatePhone(value) {
  return PHONE_PATTERN.test(String(value || "").trim())
    ? ""
    : "Phone must contain 10 digits, with an optional +91 prefix.";
}

export function validateRequiredText(value, label, { min = 2, max = 120 } = {}) {
  const text = String(value || "").trim();
  if (!text) return `${label} is required.`;
  if (text.length < min) return `${label} must contain at least ${min} characters.`;
  if (text.length > max) return `${label} cannot exceed ${max} characters.`;
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(text)) {
    return `${label} contains unsupported characters.`;
  }
  return "";
}

export function validatePositiveNumber(value, label, { min = 1, max } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min) {
    return `${label} must be at least ${min}.`;
  }
  if (max !== undefined && number > max) {
    return `${label} cannot exceed ${max}.`;
  }
  return "";
}
