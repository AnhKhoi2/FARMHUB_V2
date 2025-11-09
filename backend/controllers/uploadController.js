import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, error } from "../utils/ApiResponse.js";

// Upload single image
export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return error(res, "Không có file được upload", 400);
  }

  // Generate image URL
  const imageUrl = `/uploads/notebooks/${req.file.filename}`;

  return ok(
    res,
    {
      url: imageUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
    "Upload ảnh thành công"
  );
});

// Upload multiple images
export const uploadMultipleImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return error(res, "Không có file được upload", 400);
  }

  const imageUrls = req.files.map((file) => ({
    url: `/uploads/notebooks/${file.filename}`,
    filename: file.filename,
    size: file.size,
    mimetype: file.mimetype,
  }));

  return ok(res, imageUrls, "Upload ảnh thành công");
});
