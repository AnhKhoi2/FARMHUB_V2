/**
 * Timezone utilities for Vietnam (UTC+7)
 */

import moment from "moment-timezone";
// This project now uses UTC as the canonical timezone for internal logic.
// Keep an optional minute offset for the day-start boundary; default 0 (midnight UTC).
const DAY_START_OFFSET_MINUTES = parseInt(
  process.env.UTC_DAY_START_MINUTES || process.env.VN_DAY_START_MINUTES || "0",
  10
);

/**
 * Get current date/time in Vietnam timezone
 * @returns {Date} Date object adjusted to Vietnam time
 */
export const getVietnamTime = () => {
  // Returns current time as a Date (UTC instant). Named for backward compatibility.
  return moment.utc().toDate();
};

/**
 * Convert any date to Vietnam timezone day-start (00:00 + offset minutes)
 * This replaces the previous "midnight" concept so that a new day may start
 * at a small offset past midnight (e.g., 00:05).
 * @param {Date} date - Date to convert
 * @returns {Date} Date at Vietnam day-start (as UTC representation)
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
 * Format date to Vietnam timezone string (YYYY-MM-DD)
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
export const formatVietnamDate = (date) => {
  return moment.utc(date).format("YYYY-MM-DD");
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
 * Format a date/time into Vietnam timezone string with time.
 * Example: '2025-11-26 00:05:00'
 * @param {Date|string|number} date - Date to format
 * @returns {string|null} Formatted datetime string in VN timezone
 */
export const formatVietnamDatetime = (date) => {
  if (!date) return null;
  return moment.utc(date).format("YYYY-MM-DD HH:mm:ss");
};
