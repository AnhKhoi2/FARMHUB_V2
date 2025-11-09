import Collection from "../models/Collection.js";
import Notebook from "../models/Notebook.js";
import { ok, created, noContent } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// 📚 Lấy tất cả collection của user
export const getAllCollections = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = {
    user_id: req.user.id,
    status: { $ne: "deleted" },
  };

  if (status && ["active", "archived"].includes(status)) {
    filter.status = status;
  }

  const collections = await Collection.find(filter)
    .populate({
      path: "notebooks",
      match: { status: { $ne: "deleted" } },
      select: "notebook_name plant_type cover_image progress planted_date",
    })
    .sort({ createdAt: -1 });

  // Thêm thông tin số lượng notebooks
  const collectionsWithCount = collections.map((collection) => ({
    ...collection.toObject(),
    notebook_count: collection.notebooks.length,
  }));

  return ok(
    res,
    collectionsWithCount,
    { count: collections.length },
    "Fetched all collections successfully"
  );
});

// 📖 Lấy chi tiết collection theo ID
export const getCollectionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const collection = await Collection.findOne({
    _id: id,
    user_id: req.user.id,
    status: { $ne: "deleted" },
  }).populate({
    path: "notebooks",
    match: { status: { $ne: "deleted" } },
    select:
      "notebook_name plant_type cover_image progress description createdAt planted_date",
    populate: {
      path: "guide_id",
      select: "title category difficulty",
    },
  });

  if (!collection) {
    return res.status(404).json({
      success: false,
      message: "Collection not found",
    });
  }

  return ok(
    res,
    {
      ...collection.toObject(),
      notebook_count: collection.notebooks.length,
    },
    null,
    "Fetched collection detail successfully"
  );
});

// ➕ Tạo mới collection
export const createCollection = asyncHandler(async (req, res) => {
  const { collection_name, description, cover_image, is_public, tags } =
    req.body;

  const newCollection = await Collection.create({
    user_id: req.user.id,
    collection_name,
    description: description || "",
    cover_image: cover_image || "",
    is_public: is_public || false,
    tags: tags || [],
  });

  return created(res, newCollection, "Collection created successfully");
});

// 🔄 Cập nhật collection
export const updateCollection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { collection_name, description, cover_image, is_public, tags, status } =
    req.body;

  const updateData = {};
  if (collection_name !== undefined)
    updateData.collection_name = collection_name;
  if (description !== undefined) updateData.description = description;
  if (cover_image !== undefined) updateData.cover_image = cover_image;
  if (is_public !== undefined) updateData.is_public = is_public;
  if (tags !== undefined) updateData.tags = tags;
  if (status !== undefined && ["active", "archived"].includes(status)) {
    updateData.status = status;
  }

  const collection = await Collection.findOneAndUpdate(
    { _id: id, user_id: req.user.id, status: { $ne: "deleted" } },
    updateData,
    { new: true }
  ).populate({
    path: "notebooks",
    match: { status: { $ne: "deleted" } },
    select: "notebook_name plant_type cover_image progress",
  });

  if (!collection) {
    return res.status(404).json({
      success: false,
      message: "Collection not found",
    });
  }

  return ok(res, collection, null, "Collection updated successfully");
});

// 🗑️ Xóa collection (soft delete)
export const deleteCollection = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const collection = await Collection.findOneAndUpdate(
    { _id: id, user_id: req.user.id },
    { status: "deleted" },
    { new: true }
  );

  if (!collection) {
    return res.status(404).json({
      success: false,
      message: "Collection not found",
    });
  }

  return noContent(res);
});

// 📓 Thêm notebook vào collection
export const addNotebookToCollection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notebook_id } = req.body;

  // Kiểm tra notebook có tồn tại và thuộc về user không
  const notebook = await Notebook.findOne({
    _id: notebook_id,
    user_id: req.user.id,
    status: { $ne: "deleted" },
  });

  if (!notebook) {
    return res.status(404).json({
      success: false,
      message: "Notebook not found or does not belong to you",
    });
  }

  // Kiểm tra collection
  const collection = await Collection.findOne({
    _id: id,
    user_id: req.user.id,
    status: { $ne: "deleted" },
  });

  if (!collection) {
    return res.status(404).json({
      success: false,
      message: "Collection not found",
    });
  }

  // Kiểm tra notebook đã có trong collection chưa
  if (collection.notebooks.includes(notebook_id)) {
    return res.status(400).json({
      success: false,
      message: "Notebook already exists in this collection",
    });
  }

  // Thêm notebook vào collection
  collection.notebooks.push(notebook_id);
  await collection.save();

  // Populate để trả về thông tin đầy đủ
  await collection.populate({
    path: "notebooks",
    match: { status: { $ne: "deleted" } },
    select: "notebook_name plant_type cover_image progress",
  });

  return ok(
    res,
    {
      collection,
      notebook_count: collection.notebooks.length,
    },
    null,
    "Notebook added to collection successfully"
  );
});

// 🗑️ Xóa notebook khỏi collection
export const removeNotebookFromCollection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notebook_id } = req.body;

  const collection = await Collection.findOne({
    _id: id,
    user_id: req.user.id,
    status: { $ne: "deleted" },
  });

  if (!collection) {
    return res.status(404).json({
      success: false,
      message: "Collection not found",
    });
  }

  // Kiểm tra notebook có trong collection không
  if (!collection.notebooks.includes(notebook_id)) {
    return res.status(400).json({
      success: false,
      message: "Notebook not found in this collection",
    });
  }

  // Xóa notebook khỏi collection
  collection.notebooks = collection.notebooks.filter(
    (id) => id.toString() !== notebook_id
  );
  await collection.save();

  // Populate để trả về thông tin đầy đủ
  await collection.populate({
    path: "notebooks",
    match: { status: { $ne: "deleted" } },
    select: "notebook_name plant_type cover_image progress",
  });

  return ok(
    res,
    {
      collection,
      notebook_count: collection.notebooks.length,
    },
    null,
    "Notebook removed from collection successfully"
  );
});

// 🔍 Tìm kiếm collection
export const searchCollections = asyncHandler(async (req, res) => {
  const { keyword } = req.query;

  const collections = await Collection.find({
    user_id: req.user.id,
    status: { $ne: "deleted" },
    $or: [
      { collection_name: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
      { tags: { $regex: keyword, $options: "i" } },
    ],
  })
    .populate({
      path: "notebooks",
      match: { status: { $ne: "deleted" } },
      select: "notebook_name plant_type cover_image progress",
    })
    .sort({ createdAt: -1 });

  const collectionsWithCount = collections.map((collection) => ({
    ...collection.toObject(),
    notebook_count: collection.notebooks.length,
  }));

  return ok(
    res,
    collectionsWithCount,
    { count: collections.length, keyword },
    "Search results fetched successfully"
  );
});

// 📋 Lấy danh sách notebooks trong collection
export const getNotebooksInCollection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sort_by, order } = req.query;

  const collection = await Collection.findOne({
    _id: id,
    user_id: req.user.id,
    status: { $ne: "deleted" },
  });

  if (!collection) {
    return res.status(404).json({
      success: false,
      message: "Collection not found",
    });
  }

  // Xây dựng sort option
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

  // Lấy notebooks
  const notebooks = await Notebook.find({
    _id: { $in: collection.notebooks },
    status: { $ne: "deleted" },
  })
    .populate("guide_id", "title category difficulty")
    .sort(sortOption);

  return ok(
    res,
    notebooks,
    {
      collection_id: collection._id,
      collection_name: collection.collection_name,
      count: notebooks.length,
    },
    "Fetched notebooks in collection successfully"
  );
});

// 📦 Thêm nhiều notebooks vào collection
export const addMultipleNotebooks = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notebook_ids } = req.body;

  // Kiểm tra collection
  const collection = await Collection.findOne({
    _id: id,
    user_id: req.user.id,
    status: { $ne: "deleted" },
  });

  if (!collection) {
    return res.status(404).json({
      success: false,
      message: "Collection not found",
    });
  }

  // Kiểm tra tất cả notebooks có tồn tại và thuộc về user không
  const notebooks = await Notebook.find({
    _id: { $in: notebook_ids },
    user_id: req.user.id,
    status: { $ne: "deleted" },
  });

  if (notebooks.length !== notebook_ids.length) {
    return res.status(400).json({
      success: false,
      message: "Some notebooks not found or do not belong to you",
    });
  }

  // Lọc ra những notebook chưa có trong collection
  const existingNotebookIds = collection.notebooks.map((id) => id.toString());
  const newNotebookIds = notebook_ids.filter(
    (id) => !existingNotebookIds.includes(id)
  );

  if (newNotebookIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "All notebooks already exist in this collection",
    });
  }

  // Thêm notebooks vào collection
  collection.notebooks.push(...newNotebookIds);
  await collection.save();

  // Populate để trả về thông tin đầy đủ
  await collection.populate({
    path: "notebooks",
    match: { status: { $ne: "deleted" } },
    select: "notebook_name plant_type cover_image progress",
  });

  return ok(
    res,
    {
      collection,
      notebook_count: collection.notebooks.length,
      added_count: newNotebookIds.length,
    },
    null,
    `${newNotebookIds.length} notebook(s) added to collection successfully`
  );
});
