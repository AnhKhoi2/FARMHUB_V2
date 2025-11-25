/**
 * Timezone utilities for Vietnam (UTC+7)
 */

import moment from "moment-timezone";
const VIETNAM_TZ = "Asia/Ho_Chi_Minh";

// Number of minutes past midnight to consider as the "start of day" in Vietnam timezone.
// Default to 5 minutes (00:05) per new requirement. Can be overridden by env var `VN_DAY_START_MINUTES`.
const DAY_START_OFFSET_MINUTES = parseInt(
  process.env.VN_DAY_START_MINUTES || "5",
  10
);

/**
 * Get current date/time in Vietnam timezone
 * @returns {Date} Date object adjusted to Vietnam time
 */
export const getVietnamTime = () => {
  return moment().tz(VIETNAM_TZ).toDate();
};

/**
 * Convert any date to Vietnam timezone day-start (00:00 + offset minutes)
 * This replaces the previous "midnight" concept so that a new day may start
 * at a small offset past midnight (e.g., 00:05).
 * @param {Date} date - Date to convert
 * @returns {Date} Date at Vietnam day-start (as UTC representation)
 */
export const toVietnamMidnight = (date) => {
  return moment
    .tz(date, VIETNAM_TZ)
    .startOf("day")
    .add(DAY_START_OFFSET_MINUTES, "minutes")
    .toDate();
};

/**
 * Get today at Vietnam day-start (00:00 + offset minutes)
 * @returns {Date} Today at configured Vietnam day-start
 */
export const getVietnamToday = () => {
  return toVietnamMidnight(new Date());
};

/**
 * Calculate difference in days between two dates using Vietnam day-start
 * (i.e., both dates are normalized to startOf('day') + offset minutes).
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} Number of days difference
 */
export const getDaysDifferenceVN = (startDate, endDate) => {
  const start = moment
    .tz(startDate, VIETNAM_TZ)
    .startOf("day")
    .add(DAY_START_OFFSET_MINUTES, "minutes");
  const end = moment
    .tz(endDate, VIETNAM_TZ)
    .startOf("day")
    .add(DAY_START_OFFSET_MINUTES, "minutes");
  return end.diff(start, "days");
};

/**
 * Format date to Vietnam timezone string (YYYY-MM-DD)
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
export const formatVietnamDate = (date) => {
  return moment.tz(date, VIETNAM_TZ).format("YYYY-MM-DD");
};

/**
 * Parse an input (string or Date) into a Vietnam-day-start Date.
 * - If input is a date-only string like 'YYYY-MM-DD', parse it as a
 *   Vietnam local date (not UTC) so clients sending date-only values
 *   are interpreted correctly in VN timezone.
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

  // If the input looks like a date-only string YYYY-MM-DD, parse in VN tz
  const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(String(input).trim());
  if (dateOnlyMatch) {
    return moment
      .tz(String(input).trim(), "YYYY-MM-DD", VIETNAM_TZ)
      .startOf("day")
      .add(DAY_START_OFFSET_MINUTES, "minutes")
      .toDate();
  }

  // Fallback: create a Date and normalize to VN day-start
  return toVietnamMidnight(new Date(input));
};
