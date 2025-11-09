import { Router } from "express";
import { plantTemplateController } from "../controllers/plantTemplateController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = Router();

// Tất cả routes đều yêu cầu authentication
router.use(verifyToken);

/**
 * @route   POST /api/plant-templates
 * @desc    Tạo plant template mới
 * @access  Expert, Admin
 */
router.post("/", plantTemplateController.createTemplate);

/**
 * @route   GET /api/plant-templates
 * @desc    Lấy tất cả plant templates (có thể filter)
 * @access  Expert, Admin
 * @query   plant_group, status, created_by
 */
router.get("/", plantTemplateController.getAllTemplates);

/**
 * @route   GET /api/plant-templates/group/:plantGroup
 * @desc    Lấy templates theo plant_group
 * @access  Expert, Admin, User
 */
router.get("/group/:plantGroup", plantTemplateController.getTemplatesByGroup);

/**
 * @route   GET /api/plant-templates/:id
 * @desc    Lấy template theo ID
 * @access  Expert, Admin, User
 */
router.get("/:id", plantTemplateController.getTemplateById);

/**
 * @route   PUT /api/plant-templates/:id
 * @desc    Cập nhật template
 * @access  Expert (owner), Admin
 */
router.put("/:id", plantTemplateController.updateTemplate);

/**
 * @route   DELETE /api/plant-templates/:id
 * @desc    Xóa template (soft delete)
 * @access  Expert (owner), Admin
 */
router.delete("/:id", plantTemplateController.deleteTemplate);

/**
 * @route   PATCH /api/plant-templates/:id/activate
 * @desc    Kích hoạt template
 * @access  Expert (owner), Admin
 */
router.patch("/:id/activate", plantTemplateController.activateTemplate);

/**
 * @route   GET /api/plant-templates/:id/stage/:day
 * @desc    Lấy stage theo số ngày
 * @access  Expert, Admin, User
 */
router.get("/:id/stage/:day", plantTemplateController.getStageByDay);

export default router;
