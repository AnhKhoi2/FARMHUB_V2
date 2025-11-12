import PlantTemplate from "../models/PlantTemplate.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, created } from "../utils/ApiResponse.js";
import { AppError } from "../utils/AppError.js";

// ==================== HELPER FUNCTIONS ====================

/**
 * Tạo PlantTemplate mới
 */
const createPlantTemplate = async (templateData, userId) => {
  try {
    // Kiểm tra template_name đã tồn tại chưa
    const existingTemplate = await PlantTemplate.findOne({
      template_name: templateData.template_name,
    });

    if (existingTemplate) {
      throw new AppError(
        "Tên template đã tồn tại",
        400,
        "TEMPLATE_NAME_EXISTS"
      );
    }

    // Validate stages
    if (!templateData.stages || templateData.stages.length < 3) {
      throw new AppError(
        "Template phải có ít nhất 3 giai đoạn",
        400,
        "INVALID_STAGES"
      );
    }

    // Sắp xếp stages theo stage_number
    templateData.stages.sort((a, b) => a.stage_number - b.stage_number);

    // Kiểm tra stage_number liên tục
    for (let i = 0; i < templateData.stages.length; i++) {
      if (templateData.stages[i].stage_number !== i + 1) {
        throw new AppError(
          "Stage number phải liên tục từ 1",
          400,
          "INVALID_STAGE_NUMBER"
        );
      }
    }

    // Tạo template mới
    const newTemplate = new PlantTemplate({
      ...templateData,
      created_by: userId,
    });

    await newTemplate.save();
    return newTemplate;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error creating plant template:", error);
    throw new AppError(
      "Lỗi khi tạo plant template",
      500,
      "CREATE_TEMPLATE_ERROR"
    );
  }
};

/**
 * Lấy tất cả templates với filter
 */
const getAllPlantTemplates = async (filters = {}) => {
  try {
    const query = {};

    if (filters.plant_group) {
      query.plant_group = filters.plant_group;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.created_by) {
      query.created_by = filters.created_by;
    }

    const templates = await PlantTemplate.find(query)
      .populate("created_by", "username email")
      .sort({ createdAt: -1 });

    return templates;
  } catch (error) {
    console.error("Error getting plant templates:", error);
    throw new AppError(
      "Lỗi khi lấy danh sách template",
      500,
      "GET_TEMPLATES_ERROR"
    );
  }
};

/**
 * Lấy template theo ID
 */
const getPlantTemplateById = async (templateId) => {
  try {
    const template = await PlantTemplate.findById(templateId).populate(
      "created_by",
      "username email"
    );

    if (!template) {
      throw new AppError("Template không tồn tại", 404, "TEMPLATE_NOT_FOUND");
    }

    return template;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error getting plant template by id:", error);
    throw new AppError("Lỗi khi lấy template", 500, "GET_TEMPLATE_ERROR");
  }
};

/**
 * Lấy template theo plant_group
 */
const getTemplatesByPlantGroup = async (plantGroup) => {
  try {
    const templates = await PlantTemplate.findByPlantGroup(plantGroup);
    return templates;
  } catch (error) {
    console.error("Error getting templates by plant group:", error);
    throw new AppError(
      "Lỗi khi lấy template theo nhóm cây",
      500,
      "GET_TEMPLATES_BY_GROUP_ERROR"
    );
  }
};

/**
 * Cập nhật template
 */
const updatePlantTemplate = async (templateId, updateData, userId) => {
  try {
    const template = await PlantTemplate.findById(templateId);

    if (!template) {
      throw new AppError("Template không tồn tại", 404, "TEMPLATE_NOT_FOUND");
    }

    // Lấy thông tin user
    const user = await User.findById(userId);

    // Kiểm tra quyền (chỉ người tạo, expert, hoặc admin mới được sửa)
    const isOwner = template.created_by.toString() === userId.toString();
    const isExpert = user.role === "expert";
    const isAdmin = user.role === "admin";

    if (!isOwner && !isExpert && !isAdmin) {
      throw new AppError(
        "Bạn không có quyền sửa template này",
        403,
        "FORBIDDEN"
      );
    }

    // Nếu có cập nhật stages, validate lại
    if (updateData.stages) {
      if (updateData.stages.length < 3) {
        throw new AppError(
          "Template phải có ít nhất 3 giai đoạn",
          400,
          "INVALID_STAGES"
        );
      }

      updateData.stages.sort((a, b) => a.stage_number - b.stage_number);

      for (let i = 0; i < updateData.stages.length; i++) {
        if (updateData.stages[i].stage_number !== i + 1) {
          throw new AppError(
            "Stage number phải liên tục từ 1",
            400,
            "INVALID_STAGE_NUMBER"
          );
        }
      }
    }

    // Tăng version khi cập nhật
    updateData.version = (template.version || 1) + 1;

    Object.assign(template, updateData);
    await template.save();

    return template;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error updating plant template:", error);
    throw new AppError(
      "Lỗi khi cập nhật template",
      500,
      "UPDATE_TEMPLATE_ERROR"
    );
  }
};

/**
 * Xóa template (soft delete bằng cách chuyển status sang archived)
 */
const deletePlantTemplate = async (templateId, userId) => {
  try {
    const template = await PlantTemplate.findById(templateId);

    if (!template) {
      throw new AppError("Template không tồn tại", 404, "TEMPLATE_NOT_FOUND");
    }

    // Lấy thông tin user
    const user = await User.findById(userId);

    // Kiểm tra quyền (người tạo, expert, hoặc admin)
    const isOwner = template.created_by.toString() === userId.toString();
    const isExpert = user.role === "expert";
    const isAdmin = user.role === "admin";

    if (!isOwner && !isExpert && !isAdmin) {
      throw new AppError(
        "Bạn không có quyền xóa template này",
        403,
        "FORBIDDEN"
      );
    }

    // Soft delete
    template.status = "archived";
    await template.save();

    return { message: "Template đã được xóa (archived)" };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error deleting plant template:", error);
    throw new AppError("Lỗi khi xóa template", 500, "DELETE_TEMPLATE_ERROR");
  }
};

/**
 * Kích hoạt template
 */
const activateTemplate = async (templateId, userId) => {
  try {
    const template = await PlantTemplate.findById(templateId);

    if (!template) {
      throw new AppError("Template không tồn tại", 404, "TEMPLATE_NOT_FOUND");
    }

    // Lấy thông tin user
    const user = await User.findById(userId);

    // Kiểm tra quyền (người tạo, expert, hoặc admin)
    const isOwner = template.created_by.toString() === userId.toString();
    const isExpert = user.role === "expert";
    const isAdmin = user.role === "admin";

    if (!isOwner && !isExpert && !isAdmin) {
      throw new AppError(
        "Bạn không có quyền kích hoạt template này",
        403,
        "FORBIDDEN"
      );
    }

    template.status = "active";
    await template.save();

    return template;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error activating template:", error);
    throw new AppError(
      "Lỗi khi kích hoạt template",
      500,
      "ACTIVATE_TEMPLATE_ERROR"
    );
  }
};

/**
 * Lấy stage theo ngày của một template
 */
const getStageByDay = async (templateId, dayNumber) => {
  try {
    const template = await PlantTemplate.findById(templateId);

    if (!template) {
      throw new AppError("Template không tồn tại", 404, "TEMPLATE_NOT_FOUND");
    }

    const stage = template.getStageByDay(dayNumber);

    if (!stage) {
      throw new AppError(
        `Không tìm thấy stage cho ngày ${dayNumber}`,
        404,
        "STAGE_NOT_FOUND"
      );
    }

    return stage;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error getting stage by day:", error);
    throw new AppError("Lỗi khi lấy stage theo ngày", 500, "GET_STAGE_ERROR");
  }
};

// ==================== EXPORTED CONTROLLER FUNCTIONS ====================

export const plantTemplateController = {
  /**
   * Tạo template mới
   * POST /api/plant-templates
   */
  createTemplate: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const templateData = req.body;

    const newTemplate = await createPlantTemplate(templateData, userId);

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

    const templates = await getAllPlantTemplates(filters);

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

    const template = await getPlantTemplateById(id);

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

    const templates = await getTemplatesByPlantGroup(plantGroup);

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

    const updatedTemplate = await updatePlantTemplate(id, updateData, userId);

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

    const result = await deletePlantTemplate(id, userId);

    return ok(res, result);
  }),

  /**
   * Kích hoạt template
   * PATCH /api/plant-templates/:id/activate
   */
  activateTemplate: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const template = await activateTemplate(id, userId);

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

    const stage = await getStageByDay(id, dayNumber);

    return ok(res, {
      message: "Lấy stage thành công",
      stage,
    });
  }),
};
