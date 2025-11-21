/**
 * Timezone utilities for Vietnam (UTC+7)
 */

import moment from "moment-timezone";
const VIETNAM_TZ = "Asia/Ho_Chi_Minh";

/**
 * Get current date/time in Vietnam timezone
 * @returns {Date} Date object adjusted to Vietnam time
 */
export const getVietnamTime = () => {
  return moment().tz(VIETNAM_TZ).toDate();
};

/**
 * Convert any date to Vietnam timezone midnight (00:00:00)
 * @param {Date} date - Date to convert
 * @returns {Date} Date at midnight Vietnam time (as UTC representation)
 */
export const toVietnamMidnight = (date) => {
  return moment.tz(date, VIETNAM_TZ).startOf("day").toDate();
};

/**
 * Get today at midnight in Vietnam timezone
 * @returns {Date} Today at 00:00:00 Vietnam time
 */
export const getVietnamToday = () => {
  return toVietnamMidnight(new Date());
};

/**
 * Calculate difference in days between two dates (Vietnam timezone)
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} Number of days difference
 */
export const getDaysDifferenceVN = (startDate, endDate) => {
  const start = moment.tz(startDate, VIETNAM_TZ).startOf("day");
  const end = moment.tz(endDate, VIETNAM_TZ).startOf("day");
  return end.diff(start, "days");
};

/**
 * Format date to Vietnam timezone string
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
export const formatVietnamDate = (date) => {
  return moment.tz(date, VIETNAM_TZ).format("YYYY-MM-DD");
};
