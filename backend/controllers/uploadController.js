import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, error } from "../utils/ApiResponse.js";

// Upload single image
export const uploadImage = asyncHandler(async (req, res) => {
  // Debugging helpers: print request summary to help diagnose 400 errors
  try {
    console.log('[upload-debug] headers:', {
      authorization: req.headers.authorization,
      'content-type': req.headers['content-type'],
      host: req.headers.host,
    });
    console.log('[upload-debug] body keys:', Object.keys(req.body || {}));
    console.log('[upload-debug] file present:', !!req.file);
    if (req.file) {
      console.log('[upload-debug] req.file:', {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        filename: req.file.filename,
      });
    }
  } catch (e) {
    console.warn('[upload-debug] failed to log request info', e);
  }

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
