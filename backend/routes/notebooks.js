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

// Quản lý ảnh
router.post("/:id/images", notebookController.addImage);
router.delete("/:id/images", notebookController.removeImage);

export default router;
