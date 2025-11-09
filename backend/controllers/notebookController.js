import Notebook from "../models/Notebook.js";
import Guide from "../models/Guide.js";
import PlantTemplate from "../models/PlantTemplate.js";
import { ok, created, noContent } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as notebookTemplateService from "../services/notebookTemplateService.js";

// 📘 Lấy tất cả notebook của user
export const getAllByUser = asyncHandler(async (req, res) => {
  const notebooks = await Notebook.find({
    user_id: req.user.id,
    status: { $ne: "deleted" },
  })
    .populate("guide_id", "title category difficulty estimatedTime")
    .populate("template_id", "template_name plant_group status stages")
    .sort({ createdAt: -1 });

  return ok(
    res,
    notebooks,
    { count: notebooks.length },
    "Fetched all notebooks successfully"
  );
});

// 📗 Lấy chi tiết notebook theo ID
export const getNotebookById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notebook = await Notebook.findOne({
    _id: id,
    user_id: req.user.id,
    status: { $ne: "deleted" },
  })
    .populate(
      "guide_id",
      "title category difficulty estimatedTime description steps"
    )
    .populate("template_id");

  if (!notebook) {
    return res
      .status(404)
      .json({ success: false, message: "Notebook not found" });
  }

  // Thêm stage_completion % vào response (now async)
  const notebookData = notebook.toObject();
  notebookData.stage_completion = await notebook.getCurrentStageCompletion();

  return ok(res, notebookData, null, "Fetched notebook detail successfully");
});

// 📝 Tạo mới notebook
export const createNotebook = asyncHandler(async (req, res) => {
  const { notebook_name, guide_id, description, cover_image, planted_date } =
    req.body;

  let plant_type = req.body.plant_type;
  let plant_group = null;
  let autoFoundTemplate = null;

  // ✅ FLOW TỰ ĐỘNG: Guide → plant_group → Template
  if (guide_id) {
    const guide = await Guide.findById(guide_id);
    if (!guide) {
      return res
        .status(404)
        .json({ success: false, message: "Guide not found" });
    }

    // Lấy plant_name và plant_group từ Guide
    plant_type = guide.plant_name || guide.title;
    plant_group = guide.plant_group;

    console.log(`📗 Guide found: ${guide.plant_name} → Group: ${plant_group}`);

    // Tự động tìm template dựa trên plant_group
    if (plant_group && plant_group !== "other") {
      autoFoundTemplate = await PlantTemplate.findOne({
        plant_group: plant_group,
        status: "active",
      }).sort({ usage_count: -1 }); // Lấy template được dùng nhiều nhất

      if (autoFoundTemplate) {
        console.log(
          `✅ Auto-found template: ${autoFoundTemplate.template_name}`
        );
      } else {
        console.log(`⚠️ No active template found for group: ${plant_group}`);
      }
    }
  }

  if (!plant_type) {
    return res.status(400).json({
      success: false,
      message:
        "plant_type is required. Provide either guide_id or plant_type directly.",
    });
  }

  // Tạo notebook với plant_group
  const newNotebook = await Notebook.create({
    user_id: req.user.id,
    notebook_name,
    guide_id: guide_id || undefined,
    plant_type,
    plant_group: plant_group || "other",
    description,
    cover_image,
    planted_date: planted_date || new Date(),
  });

  // ✅ TỰ ĐỘNG GÁN TEMPLATE nếu tìm được
  if (autoFoundTemplate) {
    try {
      const notebookWithTemplate =
        await notebookTemplateService.assignTemplateToNotebook(
          newNotebook._id,
          autoFoundTemplate._id
        );

      console.log(
        `🎉 Template assigned successfully to notebook ${newNotebook._id}`
      );

      return created(
        res,
        notebookWithTemplate,
        `Notebook created with template: ${autoFoundTemplate.template_name}`
      );
    } catch (error) {
      console.error("❌ Error assigning template:", error);
      // Vẫn trả về notebook đã tạo, chỉ không có template
      return created(
        res,
        newNotebook,
        "Notebook created but template assignment failed"
      );
    }
  }

  // Không tìm được template → trả về notebook thường
  return created(
    res,
    newNotebook,
    "Notebook created successfully (no template found)"
  );
});

// 🔄 Cập nhật notebook
export const updateNotebook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notebook = await Notebook.findOneAndUpdate(
    { _id: id, user_id: req.user.id },
    req.body,
    { new: true }
  );

  if (!notebook) {
    return res
      .status(404)
      .json({ success: false, message: "Notebook not found" });
  }

  return ok(res, notebook, null, "Notebook updated successfully");
});

// 🗑️ Xóa mềm notebook (soft delete - đánh dấu deleted)
export const deleteNotebook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notebook = await Notebook.findOneAndUpdate(
    { _id: id, user_id: req.user.id },
    { status: "deleted" },
    { new: true }
  );

  if (!notebook) {
    return res
      .status(404)
      .json({ success: false, message: "Notebook not found" });
  }

  return ok(
    res,
    { id: notebook._id, status: notebook.status },
    null,
    "Notebook deleted successfully"
  );
});

// 🔍 Tìm kiếm notebook theo từ khóa
export const searchNotebooks = asyncHandler(async (req, res) => {
  const { keyword } = req.query;

  if (!keyword) {
    return res
      .status(400)
      .json({ success: false, message: "Keyword is required" });
  }

  const notebooks = await Notebook.find({
    user_id: req.user.id,
    status: { $ne: "deleted" },
    $or: [
      { notebook_name: { $regex: keyword, $options: "i" } },
      { plant_type: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
    ],
  })
    .populate("guide_id", "title category difficulty")
    .populate("template_id", "template_name plant_group")
    .sort({ createdAt: -1 });

  const meta = { count: notebooks.length, keyword };
  return ok(res, notebooks, meta, "Search results fetched successfully");
});

// 🧩 Lọc notebook theo tiêu chí
export const filterNotebooks = asyncHandler(async (req, res) => {
  const { plant_type, status, min_progress, max_progress, sort_by, order } =
    req.query;

  const filter = {
    user_id: req.user.id,
    status: { $ne: "deleted" },
  };

  if (plant_type) filter.plant_type = { $regex: plant_type, $options: "i" };
  if (status && ["active", "archived"].includes(status)) filter.status = status;
  if (min_progress !== undefined || max_progress !== undefined) {
    filter.progress = {};
    if (min_progress !== undefined)
      filter.progress.$gte = parseInt(min_progress);
    if (max_progress !== undefined)
      filter.progress.$lte = parseInt(max_progress);
  }

  let sortOption = { createdAt: -1 };
  if (sort_by) {
    const sortOrder = order === "asc" ? 1 : -1;
    switch (sort_by) {
      case "name":
        sortOption = { notebook_name: sortOrder };
        break;
      case "progress":
        sortOption = { progress: sortOrder };
        break;
      case "created":
        sortOption = { createdAt: sortOrder };
        break;
      case "updated":
        sortOption = { updatedAt: sortOrder };
        break;
    }
  }

  const notebooks = await Notebook.find(filter)
    .populate("guide_id", "title category difficulty estimatedTime")
    .populate("template_id", "template_name plant_group status")
    .sort(sortOption);

  const meta = {
    count: notebooks.length,
    filter: {
      plant_type: plant_type || "all",
      status: status || "all except deleted",
      progress_range: { min: min_progress || 0, max: max_progress || 100 },
      sort_by: sort_by || "created",
      order: order || "desc",
    },
  };

  return ok(res, notebooks, meta, "Filtered notebooks fetched successfully");
});

// 🖼️ Thêm ảnh vào notebook
export const addImage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { image_url } = req.body;

  if (!image_url) {
    return res
      .status(400)
      .json({ success: false, message: "image_url is required" });
  }

  const notebook = await Notebook.findOne({
    _id: id,
    user_id: req.user.id,
    status: { $ne: "deleted" },
  });

  if (!notebook) {
    return res
      .status(404)
      .json({ success: false, message: "Notebook not found" });
  }

  notebook.images.push(image_url);
  await notebook.save();

  return ok(
    res,
    { images: notebook.images, total: notebook.images.length },
    null,
    "Image added successfully"
  );
});

// 🧹 Xóa ảnh khỏi notebook
export const removeImage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { image_url } = req.body;

  if (!image_url) {
    return res
      .status(400)
      .json({ success: false, message: "image_url is required" });
  }

  const notebook = await Notebook.findOne({
    _id: id,
    user_id: req.user.id,
    status: { $ne: "deleted" },
  });

  if (!notebook) {
    return res
      .status(404)
      .json({ success: false, message: "Notebook not found" });
  }

  notebook.images = notebook.images.filter((img) => img !== image_url);
  await notebook.save();

  return ok(
    res,
    { images: notebook.images, total: notebook.images.length },
    null,
    "Image removed successfully"
  );
});

// 🌱 Lấy template phù hợp cho notebook
export const getNotebookTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const template = await notebookTemplateService.getTemplateForNotebook(id);

  if (!template) {
    return res
      .status(404)
      .json({ success: false, message: "No suitable template found" });
  }

  return ok(res, template, null, "Template fetched successfully");
});

// 📌 Gán template cho notebook
export const assignTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { template_id } = req.body;

  if (!template_id) {
    return res
      .status(400)
      .json({ success: false, message: "template_id is required" });
  }

  const notebook = await notebookTemplateService.assignTemplateToNotebook(
    id,
    template_id
  );

  return ok(res, notebook, null, "Template assigned successfully");
});

// 📊 Lấy timeline của notebook
export const getNotebookTimeline = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ID
  if (!id || id === "undefined" || id === "null") {
    return res.status(400).json({
      success: false,
      message: "Invalid notebook ID",
    });
  }

  const timeline = await notebookTemplateService.getNotebookTimeline(id);

  if (!timeline) {
    return res
      .status(404)
      .json({ success: false, message: "Timeline not available" });
  }

  return ok(res, timeline, null, "Timeline fetched successfully");
});

// ✅ Lấy daily checklist
export const getDailyChecklist = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ID
  if (!id || id === "undefined" || id === "null") {
    return res.status(400).json({
      success: false,
      message: "Invalid notebook ID",
    });
  }

  const checklist = await notebookTemplateService.generateDailyChecklist(id);

  if (!checklist) {
    return res
      .status(404)
      .json({ success: false, message: "No checklist available" });
  }

  return ok(res, checklist, null, "Daily checklist fetched successfully");
});

// ✔️ Đánh dấu hoàn thành task
export const completeTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { task_name } = req.body;

  if (!task_name) {
    return res
      .status(400)
      .json({ success: false, message: "task_name is required" });
  }

  const notebook = await notebookTemplateService.completeChecklistTask(
    id,
    task_name
  );

  return ok(res, notebook.daily_checklist, null, "Task completed successfully");
});

// 🔄 Cập nhật stage hiện tại
export const updateStage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { stage_number } = req.body;

  if (!stage_number) {
    return res
      .status(400)
      .json({ success: false, message: "stage_number is required" });
  }

  const notebook = await notebookTemplateService.updateCurrentStage(
    id,
    stage_number
  );

  return ok(res, notebook, null, "Stage updated successfully");
});

// 👁️ Lấy observations của stage hiện tại
export const getCurrentObservations = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const observations =
    await notebookTemplateService.getCurrentStageObservations(id);

  return ok(
    res,
    observations,
    null,
    "Current stage observations fetched successfully"
  );
});

// 📝 Cập nhật observation
export const updateObservation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { observation_key, value } = req.body;

  if (!observation_key || value === undefined) {
    return res.status(400).json({
      success: false,
      message: "observation_key and value are required",
    });
  }

  const notebook = await notebookTemplateService.updateStageObservation(
    id,
    observation_key,
    value
  );

  // Kiểm tra xem có cần tự động chuyển stage không
  await notebookTemplateService.checkAutoStageTransition(id);

  return ok(res, notebook, null, "Observation updated successfully");
});

// 🔍 Tính stage hiện tại dựa trên số ngày
export const calculateStage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const stageInfo = await notebookTemplateService.calculateCurrentStage(id);

  if (!stageInfo) {
    return res
      .status(404)
      .json({ success: false, message: "Cannot calculate stage" });
  }

  return ok(res, stageInfo, null, "Stage calculated successfully");
});

// 🔄 Recalculate progress (debug endpoint)
export const recalculateProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notebook = await Notebook.findOne({
    _id: id,
    user_id: req.user.id,
  }).populate("template_id");

  if (!notebook || !notebook.template_id) {
    return res.status(404).json({
      success: false,
      message: "Notebook not found or no template assigned",
    });
  }

  // Recalculate progress
  await notebook.updateProgress(notebook.template_id.stages);
  await notebook.save();

  const stageCompletion = await notebook.getCurrentStageCompletion();

  return ok(
    res,
    {
      progress: notebook.progress,
      stage_completion: stageCompletion,
      template_stages: notebook.template_id.stages.map((s) => ({
        stage_number: s.stage_number,
        name: s.name,
        weight:
          s.weight || Math.round(100 / notebook.template_id.stages.length),
      })),
      stages_tracking: notebook.stages_tracking.map((s) => ({
        stage_number: s.stage_number,
        stage_name: s.stage_name,
        is_current: s.is_current,
        completed: !!s.completed_at,
      })),
    },
    null,
    "Progress recalculated successfully"
  );
});

// 🔧 Migrate old notebooks to add completed_tasks field
export const migrateNotebooks = asyncHandler(async (req, res) => {
  const notebooks = await Notebook.find({
    user_id: req.user.id,
  }).populate("template_id");

  let migratedCount = 0;

  for (const notebook of notebooks) {
    let needsSave = false;

    // Check each stage_tracking
    for (const stageTracking of notebook.stages_tracking) {
      // If no completed_tasks, initialize empty array
      if (!stageTracking.completed_tasks) {
        stageTracking.completed_tasks = [];
        needsSave = true;
      }
    }

    if (needsSave) {
      await notebook.save();
      migratedCount++;
      console.log(`✅ Migrated notebook: ${notebook.notebook_name} (${notebook._id})`);
    }
  }

  return ok(
    res,
    {
      total: notebooks.length,
      migrated: migratedCount,
      already_updated: notebooks.length - migratedCount,
    },
    null,
    `Migration complete! ${migratedCount} notebook(s) updated`
  );
});
