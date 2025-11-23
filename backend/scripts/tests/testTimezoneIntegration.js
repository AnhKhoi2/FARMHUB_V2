// Test timezone utility for Vietnam
import {
  getVietnamTime,
  toVietnamMidnight,
  formatVietnamDate,
} from "../utils/timezone.js";
import moment from "moment-timezone";

console.log("--- Vietnam Timezone Test ---");

const now = new Date();
console.log("Current UTC time:", now.toISOString());

const vietnamTime = getVietnamTime();
console.log("Vietnam time (ISO):", vietnamTime.toISOString());
console.log(
  "Vietnam time (wall-clock):",
  vietnamTime.getHours(),
  ":",
  vietnamTime.getMinutes()
);

// Verify wall-clock hour corresponds to UTC+7
const expectedHour = (now.getUTCHours() + 7) % 24;
console.log("Expected Vietnam hour (UTC+7):", expectedHour);

if (vietnamTime.getHours() === expectedHour) {
  console.log("✅ Vietnam wall-clock hour is correct (UTC+7)");
} else {
  console.log("❌ Vietnam wall-clock hour is incorrect");
}

const midnightVN = toVietnamMidnight(now);
console.log("Vietnam midnight (ISO):", midnightVN.toISOString());
// midnight in VN corresponds to 17:00:00 UTC of previous day
const midnightUTCString = midnightVN.toISOString().split("T")[1].split(".")[0];
console.log("Vietnam midnight (UTC time portion):", midnightUTCString);

const formatted = formatVietnamDate(now);
console.log("Formatted Vietnam date (YYYY-MM-DD):", formatted);

// Cross-check with moment-timezone
const mt = moment.tz(now, "Asia/Ho_Chi_Minh");
console.log("Moment VN time:", mt.format());

console.log("\nChecks summary:");
console.log(
  "- Wall-clock hour equality:",
  vietnamTime.getHours() === expectedHour ? "OK" : "FAIL"
);
console.log(
  "- Midnight UTC portion should be 17:00:00 ->",
  midnightUTCString === "17:00:00" ? "OK" : "FAIL"
);
console.log(
  "- Format matches moment:",
  formatted === mt.format("YYYY-MM-DD") ? "OK" : "FAIL"
);
