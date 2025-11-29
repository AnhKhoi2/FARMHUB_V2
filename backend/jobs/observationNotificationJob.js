import cron from "node-cron";
import Notebook from "../models/Notebook.js";
import { sendObservationRequiredNotification } from "../controllers/notificationController.js";
import { getVietnamToday, toVietnamMidnight } from "../utils/timezone.js";

/**
 * Job kiểm tra các notebook nếu hôm nay là ngày cuối của giai đoạn và còn thiếu quan sát,
 * gửi 'observation_required' notification tới user.
 * Runs daily at 07:00 UTC to align with other daily jobs.
 */
export const startObservationNotificationJob = () => {
  cron.schedule(
    "0 7 * * *",
    async () => {
      console.log(
        "🕐 [CRON] Running observation notification job at 07:00 UTC"
      );
      try {
        const today = getVietnamToday();
        const todayStart = toVietnamMidnight(today);

        const notebooks = await Notebook.find({
          status: "active",
          template_id: { $exists: true, $ne: null },
        }).populate("template_id");

        console.log(
          `📊 Checking ${notebooks.length} notebooks for observation requirements`
        );

        for (const nb of notebooks) {
          try {
            const tpl = nb.template_id;
            const currentDay = nb.current_day || 0;
            const currentStageNumber = nb.current_stage;
            const templateStage =
              tpl && tpl.stages
                ? tpl.stages.find((s) => s.stage_number === currentStageNumber)
                : null;
            if (!templateStage) continue;

            const isLastDayOfStage = currentDay === templateStage.day_end;
            const requiredObs = templateStage.observation_required || [];
            const stageTrack = (nb.stages_tracking || []).find(
              (s) => s.stage_number === currentStageNumber
            ) || { observations: [] };
            const recorded = stageTrack.observations || [];

            const completedCount =
              requiredObs.length > 0
                ? recorded.filter(
                    (r) =>
                      r.value === true &&
                      requiredObs.some((ro) => ro.key === r.key)
                  ).length
                : 0;
            const allCompleted =
              requiredObs.length > 0
                ? completedCount >= requiredObs.length
                : false;

            if (isLastDayOfStage && requiredObs.length > 0 && !allCompleted) {
              const requiredKeys = requiredObs.map((o) => o.key);
              const recordedKeys = recorded.map((r) => r.key);

              await sendObservationRequiredNotification({
                userId: nb.user_id,
                notebookId: nb._id,
                notebookName:
                  nb.notebook_name || nb.notebookName || "(notebook)",
                stageNumber: templateStage.stage_number,
                stageName: templateStage.name,
                requiredKeys,
                recordedKeys,
              });
            }
          } catch (err) {
            console.error(
              `❌ Error processing notebook ${nb._id} in observation job:`,
              err
            );
          }
        }

        console.log("✅ [CRON] Observation notification job completed");
      } catch (err) {
        console.error("❌ [CRON] Error in observation notification job:", err);
      }
    },
    { timezone: "UTC" }
  );

  console.log(
    "✅ Observation notification cron job initialized (runs daily at 07:00 UTC)"
  );
};

export const triggerObservationNotificationManual = async () => {
  console.log("🔧 [MANUAL] Triggering observation notification job (manual)");
  try {
    const today = getVietnamToday();
    const todayStart = toVietnamMidnight(today);

    const notebooks = await Notebook.find({
      status: "active",
      template_id: { $exists: true, $ne: null },
    }).populate("template_id");

    for (const nb of notebooks) {
      try {
        const tpl = nb.template_id;
        const currentDay = nb.current_day || 0;
        const currentStageNumber = nb.current_stage;
        const templateStage =
          tpl && tpl.stages
            ? tpl.stages.find((s) => s.stage_number === currentStageNumber)
            : null;
        if (!templateStage) continue;

        const isLastDayOfStage = currentDay === templateStage.day_end;
        const requiredObs = templateStage.observation_required || [];
        const stageTrack = (nb.stages_tracking || []).find(
          (s) => s.stage_number === currentStageNumber
        ) || { observations: [] };
        const recorded = stageTrack.observations || [];

        const completedCount =
          requiredObs.length > 0
            ? recorded.filter(
                (r) =>
                  r.value === true && requiredObs.some((ro) => ro.key === r.key)
              ).length
            : 0;
        const allCompleted =
          requiredObs.length > 0 ? completedCount >= requiredObs.length : false;

        if (isLastDayOfStage && requiredObs.length > 0 && !allCompleted) {
          const requiredKeys = requiredObs.map((o) => o.key);
          const recordedKeys = recorded.map((r) => r.key);

          await sendObservationRequiredNotification({
            userId: nb.user_id,
            notebookId: nb._id,
            notebookName: nb.notebook_name || nb.notebookName || "(notebook)",
            stageNumber: templateStage.stage_number,
            stageName: templateStage.name,
            requiredKeys,
            recordedKeys,
          });
        }
      } catch (err) {
        console.error(
          `❌ Error processing notebook ${nb._id} in manual observation trigger:`,
          err
        );
      }
    }

    console.log("✅ [MANUAL] Observation notification manual run completed");
    return { success: true };
  } catch (err) {
    console.error("❌ [MANUAL] Error in manual observation notification:", err);
    return { success: false, error: err.message };
  }
};
