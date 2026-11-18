export const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
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

export const emailPattern =
  /^[A-Za-z0-9][A-Za-z0-9._%+-]{2,}@[A-Za-z0-9][A-Za-z0-9-]{2,}\.[A-Za-z]{3,}$/;
export const phonePattern = /^(\+91[\s-]?)?\d{10}$/;

export const validateProfile = (name, email, phone) => {
  if (!name.trim()) return "Full name is required.";
  if (!emailPattern.test(email.trim())) return "Enter a valid email address.";
  if (!phonePattern.test(phone.trim()))
    return "Phone must contain exactly 10 digits, with an optional +91 prefix.";
  return "";
};

export const validatePassword = (current, next, confirm) => {
  if (!current || !next || !confirm) return "Please fill all password fields.";
  if (next.length < 6)
    return "New password must be at least 6 characters long.";
  if (!/[A-Z]/.test(next))
    return "New password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(next))
    return "New password must contain at least one lowercase letter.";
  if (!/\d/.test(next)) return "New password must contain at least one number.";
  if (!/[^A-Za-z0-9]/.test(next))
    return "New password must contain at least one special character.";
  if (next !== confirm) return "New passwords do not match.";
  return "";
};
