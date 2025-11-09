import { Router } from "express";
import * as notebookController from "../controllers/notebookController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = Router();

// Tất cả routes notebook đều cần xác thực
router.use(verifyToken);

// Tìm kiếm và lọc - ĐẶT TRƯỚC route /:id
router.get("/search", notebookController.searchNotebooks);
router.get("/filter", notebookController.filterNotebooks);

// CRUD cơ bản
router.get("/", notebookController.getAllByUser);
router.get("/:id", notebookController.getNotebookById);
router.post("/", notebookController.createNotebook);
router.put("/:id", notebookController.updateNotebook);
router.delete("/:id", notebookController.deleteNotebook);

// Migration endpoint (admin/debug)
router.post("/migrate/completed-tasks", notebookController.migrateNotebooks);

// Quản lý ảnh
router.post("/:id/images", notebookController.addImage);
router.delete("/:id/images", notebookController.removeImage);

// Template Integration
router.get("/:id/template", notebookController.getNotebookTemplate);
router.post("/:id/template", notebookController.assignTemplate);
router.get("/:id/timeline", notebookController.getNotebookTimeline);
router.get("/:id/checklist", notebookController.getDailyChecklist);
router.post("/:id/checklist/complete", notebookController.completeTask);
router.put("/:id/stage", notebookController.updateStage);
router.get("/:id/observations", notebookController.getCurrentObservations);
router.post("/:id/observations", notebookController.updateObservation);
router.get("/:id/calculate-stage", notebookController.calculateStage);
router.post(
  "/:id/recalculate-progress",
  notebookController.recalculateProgress
);

export default router;
