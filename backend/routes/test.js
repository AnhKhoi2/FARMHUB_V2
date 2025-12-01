import express from "express";
import { ok, created, noContent } from "../utils/ApiResponse.js";
import { triggerDailyTasksNotification } from "../jobs/dailyTasksNotificationJob.js";
import { triggerObservationNotificationManual } from "../jobs/observationNotificationJob.js";

const router = express.Router();

// Simple healthcheck/test route used by server during development
router.get("/ping", (req, res) => {
  ok(res, { msg: "pong" });
});

// Manual endpoint to trigger daily tasks notification job (for testing)
// POST /test/trigger-daily-tasks-notification
router.post("/trigger-daily-tasks-notification", async (req, res) => {
  const result = await triggerDailyTasksNotification();
  if (result && result.success) {
    return ok(res, null, null, "Manual daily tasks notification triggered");
  }
  return res
    .status(500)
    .json({ success: false, message: result.error || "Failed" });
});

// Manual endpoint to trigger observation notification job (for testing)
// POST /test/trigger-observation-notification
router.post("/trigger-observation-notification", async (req, res) => {
  const result = await triggerObservationNotificationManual();
  if (result && result.success) {
    return ok(res, null, null, "Manual observation notification triggered");
  }
  return res
    .status(500)
    .json({ success: false, message: result.error || "Failed" });
});

export default router;
