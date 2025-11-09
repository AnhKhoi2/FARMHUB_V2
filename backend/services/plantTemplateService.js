import PlantTemplate from "../models/PlantTemplate.js";
import { AppError } from "../utils/AppError.js";
import { ERROR_CODES } from "../utils/errorCode.js";

/**
 * Tạo PlantTemplate mới
 */
export const createPlantTemplate = async (templateData, userId) => {
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
export const getAllPlantTemplates = async (filters = {}) => {
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
export const getPlantTemplateById = async (templateId) => {
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
export const getTemplatesByPlantGroup = async (plantGroup) => {
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
export const updatePlantTemplate = async (templateId, updateData, userId) => {
  try {
    const template = await PlantTemplate.findById(templateId);

    if (!template) {
      throw new AppError("Template không tồn tại", 404, "TEMPLATE_NOT_FOUND");
    }

    // Kiểm tra quyền (chỉ người tạo hoặc admin mới được sửa)
    if (template.created_by.toString() !== userId.toString()) {
      const User = (await import("../models/User.js")).default;
      const user = await User.findById(userId);
      if (user.role !== "admin") {
        throw new AppError(
          "Bạn không có quyền sửa template này",
          403,
          "FORBIDDEN"
        );
      }
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
export const deletePlantTemplate = async (templateId, userId) => {
  try {
    const template = await PlantTemplate.findById(templateId);

    if (!template) {
      throw new AppError("Template không tồn tại", 404, "TEMPLATE_NOT_FOUND");
    }

    // Kiểm tra quyền
    if (template.created_by.toString() !== userId.toString()) {
      const User = (await import("../models/User.js")).default;
      const user = await User.findById(userId);
      if (user.role !== "admin") {
        throw new AppError(
          "Bạn không có quyền xóa template này",
          403,
          "FORBIDDEN"
        );
      }
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
export const activateTemplate = async (templateId, userId) => {
  try {
    const template = await PlantTemplate.findById(templateId);

    if (!template) {
      throw new AppError("Template không tồn tại", 404, "TEMPLATE_NOT_FOUND");
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
export const getStageByDay = async (templateId, dayNumber) => {
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

/**
 * Tăng usage_count khi template được sử dụng
 */
export const incrementUsageCount = async (templateId) => {
  try {
    await PlantTemplate.findByIdAndUpdate(templateId, {
      $inc: { usage_count: 1 },
    });
  } catch (error) {
    console.error("Error incrementing usage count:", error);
    // Không throw error để không ảnh hưởng flow chính
  }
};
