// Utility functions to format dates in Vietnam timezone (Asia/Ho_Chi_Minh)
export const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

// Return YYYY-MM-DD string representing the date in Vietnam timezone
export const formatVietnamDateISO = (input) => {
  if (!input) return "N/A";
  const date = new Date(input);
  // Convert to a date string in VN timezone by using toLocaleString with timeZone, then parse
  const vnString = date.toLocaleString("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const vnDate = new Date(vnString);
  const y = vnDate.getFullYear();
  const m = pad(vnDate.getMonth() + 1);
  const d = pad(vnDate.getDate());
  return `${y}-${m}-${d}`;
};

// Return localized Vietnam display (e.g., 26/11/2025)
export const formatVietnamLocale = (input) => {
  if (!input) return "N/A";
  try {
    const date = new Date(input);
    return date.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  } catch (e) {
    return "N/A";
  }
};

export default { formatVietnamDateISO, formatVietnamLocale };
