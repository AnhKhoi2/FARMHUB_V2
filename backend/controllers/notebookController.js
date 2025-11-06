import Notebook from "../models/Notebook.js";
import Guide from "../models/Guide.js";
import { ok, created, noContent } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// 📘 Lấy tất cả notebook của user
export const getAllByUser = asyncHandler(async (req, res) => {
  const notebooks = await Notebook.find({
    user_id: req.user.id,
    status: { $ne: "deleted" },
  })
    .populate("guide_id", "title category difficulty estimatedTime")
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
  }).populate(
    "guide_id",
    "title category difficulty estimatedTime description steps"
  );

  if (!notebook) {
    return res
      .status(404)
      .json({ success: false, message: "Notebook not found" });
  }

  return ok(res, notebook, null, "Fetched notebook detail successfully");
});

// 📝 Tạo mới notebook
export const createNotebook = asyncHandler(async (req, res) => {
  const { notebook_name, guide_id, description, cover_image } = req.body;
  let plant_type = req.body.plant_type;

  // Nếu có guide_id → lấy category làm plant_type
  if (guide_id) {
    const guide = await Guide.findById(guide_id);
    if (!guide) {
      return res
        .status(404)
        .json({ success: false, message: "Guide not found" });
    }
    plant_type = guide.category;
  }

  if (!plant_type) {
    return res.status(400).json({
      success: false,
      message:
        "plant_type is required. Provide either guide_id or plant_type directly.",
    });
  }

  const newNotebook = await Notebook.create({
    user_id: req.user.id,
    notebook_name,
    guide_id: guide_id || undefined,
    plant_type,
    description,
    cover_image,
  });

  return created(res, newNotebook, "Notebook created successfully");
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

// 🗑️ Xóa notebook (đánh dấu deleted)
export const deleteNotebook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notebook = await Notebook.findOneAndUpdate(
    { _id: id, user_id: req.user.id },
    { status: "deleted" }
  );

  if (!notebook) {
    return res
      .status(404)
      .json({ success: false, message: "Notebook not found" });
  }

  return noContent(res);
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
