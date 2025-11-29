/**
 * Timezone utilities (canonical UTC day boundaries)
 *
 * This module provides helpers to normalize dates to a canonical day-start
 * boundary using UTC (by default midnight UTC). You can configure a small
 * offset (in minutes) via `UTC_DAY_START_MINUTES` environment variable
 * to shift the day-start (useful for business rules that treat day-start
 * slightly after midnight).
 */

import moment from "moment-timezone";
// Use UTC_DAY_START_MINUTES if provided, fallback to VN_DAY_START_MINUTES for compatibility.
const DAY_START_OFFSET_MINUTES = parseInt(
  process.env.UTC_DAY_START_MINUTES || process.env.VN_DAY_START_MINUTES || "0",
  10
);

/**
 * Get current date/time (UTC instant). Kept as a small convenience wrapper.
 * @returns {Date} Current Date (UTC instant)
 */
export const getVietnamTime = () => {
  // Returns current time as a Date (UTC instant). Named for backward compatibility.
  return moment.utc().toDate();
};

/**
 * Convert any date to canonical UTC day-start (00:00 UTC + optional offset minutes)
 * The returned Date is the UTC instant representing that day-start.
 * @param {Date} date - Date to convert
 * @returns {Date} Date at canonical UTC day-start (as UTC representation)
 */
export const toVietnamMidnight = (date) => {
  // Normalize a date to the project's canonical day-start (UTC midnight + optional offset).
  return moment
    .utc(date)
    .startOf("day")
    .add(DAY_START_OFFSET_MINUTES, "minutes")
    .toDate();
};

/**
 * Get today at canonical UTC day-start (00:00 UTC + offset minutes)
 * @returns {Date} Today at configured UTC day-start
 */
export const getVietnamToday = () => {
  return toVietnamMidnight(new Date());
};

/**
 * Calculate difference in days between two dates using canonical UTC day-start
 * (i.e., both dates are normalized to startOf('day') + offset minutes).
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} Number of days difference
 */
export const getDaysDifferenceVN = (startDate, endDate) => {
  // Compute difference in days using UTC day boundaries (with optional offset).
  const start = moment
    .utc(startDate)
    .startOf("day")
    .add(DAY_START_OFFSET_MINUTES, "minutes");
  const end = moment
    .utc(endDate)
    .startOf("day")
    .add(DAY_START_OFFSET_MINUTES, "minutes");
  return end.diff(start, "days");
};

/**
 * Format date to canonical UTC date string (YYYY-MM-DD)
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
export const formatVietnamDate = (date) => {
  return moment.utc(date).format("YYYY-MM-DD");
};

/**
 * Parse an input (string or Date) into canonical UTC day-start Date.
 * - If input is a date-only string like 'YYYY-MM-DD', parse it in UTC
 *   and normalize to the configured day-start. This keeps behavior
 *   consistent for clients sending date-only values.
 * - Otherwise, fall back to normal toVietnamMidnight(new Date(input)).
 */
export const parseVietnamDate = (input) => {
  if (!input) return null;

  // If it's already a Date, normalize it
  if (input instanceof Date) {
    return toVietnamMidnight(input);
  }

  // If it's a numeric timestamp string or number, coerce to Date
  if (typeof input === "number" || /^\d+$/.test(String(input))) {
    return toVietnamMidnight(new Date(Number(input)));
  }

  // If the input looks like a date-only string YYYY-MM-DD, parse as UTC date-start
  const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(String(input).trim());
  if (dateOnlyMatch) {
    return moment
      .utc(String(input).trim(), "YYYY-MM-DD")
      .startOf("day")
      .add(DAY_START_OFFSET_MINUTES, "minutes")
      .toDate();
  }

  // Fallback: create a Date and normalize to UTC day-start
  return toVietnamMidnight(new Date(input));
};

/**
 * Format a date/time into UTC string with time.
 * Example: '2025-11-26 00:05:00'
 * @param {Date|string|number} date - Date to format
 * @returns {string|null} Formatted datetime string in UTC
 */
export const formatVietnamDatetime = (date) => {
  if (!date) return null;
  return moment.utc(date).format("YYYY-MM-DD HH:mm:ss");
};
