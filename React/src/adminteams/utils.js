export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN") : "—";

export const isExpired = (value) =>
  Boolean(value && new Date(value) < new Date());
