import * as plantTemplateService from "../services/plantTemplateService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, created } from "../utils/ApiResponse.js";

export const plantTemplateController = {
  /**
   * Tạo template mới
   * POST /api/plant-templates
   */
  createTemplate: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const templateData = req.body;

    const newTemplate = await plantTemplateService.createPlantTemplate(
      templateData,
      userId
    );

    return created(res, {
      message: "Tạo plant template thành công",
      template: newTemplate,
    });
  }),

  /**
   * Lấy tất cả templates
   * GET /api/plant-templates
   * Query params: plant_group, status, created_by
   */
  getAllTemplates: asyncHandler(async (req, res) => {
    const { plant_group, status, created_by } = req.query;

    const filters = {};
    if (plant_group) filters.plant_group = plant_group;
    if (status) filters.status = status;
    if (created_by) filters.created_by = created_by;

    const templates = await plantTemplateService.getAllPlantTemplates(filters);

    return ok(res, {
      message: "Lấy danh sách template thành công",
      templates,
      count: templates.length,
    });
  }),

  /**
   * Lấy template theo ID
   * GET /api/plant-templates/:id
   */
  getTemplateById: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const template = await plantTemplateService.getPlantTemplateById(id);

    return ok(res, {
      message: "Lấy template thành công",
      template,
    });
  }),

  /**
   * Lấy templates theo plant_group
   * GET /api/plant-templates/group/:plantGroup
   */
  getTemplatesByGroup: asyncHandler(async (req, res) => {
    const { plantGroup } = req.params;

    const templates = await plantTemplateService.getTemplatesByPlantGroup(
      plantGroup
    );

    return ok(res, {
      message: "Lấy templates theo nhóm cây thành công",
      templates,
      count: templates.length,
    });
  }),

  /**
   * Cập nhật template
   * PUT /api/plant-templates/:id
   */
  updateTemplate: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const updatedTemplate = await plantTemplateService.updatePlantTemplate(
      id,
      updateData,
      userId
    );

    return ok(res, {
      message: "Cập nhật template thành công",
      template: updatedTemplate,
    });
  }),

  /**
   * Xóa template (soft delete)
   * DELETE /api/plant-templates/:id
   */
  deleteTemplate: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await plantTemplateService.deletePlantTemplate(id, userId);

    return ok(res, result);
  }),

  /**
   * Kích hoạt template
   * PATCH /api/plant-templates/:id/activate
   */
  activateTemplate: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const template = await plantTemplateService.activateTemplate(id, userId);

    return ok(res, {
      message: "Kích hoạt template thành công",
      template,
    });
  }),

  /**
   * Lấy stage theo ngày
   * GET /api/plant-templates/:id/stage/:day
   */
  getStageByDay: asyncHandler(async (req, res) => {
    const { id, day } = req.params;
    const dayNumber = parseInt(day);

    const stage = await plantTemplateService.getStageByDay(id, dayNumber);

    return ok(res, {
      message: "Lấy stage thành công",
      stage,
    });
  }),
};
