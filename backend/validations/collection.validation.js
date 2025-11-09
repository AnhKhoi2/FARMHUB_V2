import Joi from "joi";

// Validation cho tạo collection
export const createCollectionValidation = Joi.object({
  collection_name: Joi.string().required().max(100).trim().messages({
    "string.empty": "Tên bộ sưu tập không được để trống",
    "string.max": "Tên bộ sưu tập không được vượt quá 100 ký tự",
    "any.required": "Tên bộ sưu tập là bắt buộc",
  }),

  description: Joi.string().allow("", null).max(500).messages({
    "string.max": "Mô tả không được vượt quá 500 ký tự",
  }),

  cover_image: Joi.string().allow("", null).uri().messages({
    "string.uri": "URL ảnh bìa không hợp lệ",
  }),

  is_public: Joi.boolean().default(false),

  tags: Joi.array().items(Joi.string().max(50)).max(10).messages({
    "array.max": "Không được vượt quá 10 tags",
  }),
});

// Validation cho cập nhật collection
export const updateCollectionValidation = Joi.object({
  collection_name: Joi.string().max(100).trim().messages({
    "string.max": "Tên bộ sưu tập không được vượt quá 100 ký tự",
  }),

  description: Joi.string().allow("", null).max(500).messages({
    "string.max": "Mô tả không được vượt quá 500 ký tự",
  }),

  cover_image: Joi.string().allow("", null).uri().messages({
    "string.uri": "URL ảnh bìa không hợp lệ",
  }),

  is_public: Joi.boolean(),

  tags: Joi.array().items(Joi.string().max(50)).max(10).messages({
    "array.max": "Không được vượt quá 10 tags",
  }),

  status: Joi.string().valid("active", "archived").messages({
    "any.only": "Trạng thái phải là active hoặc archived",
  }),
})
  .min(1)
  .messages({
    "object.min": "Phải có ít nhất một trường để cập nhật",
  });

// Validation cho thêm notebook vào collection
export const addNotebookValidation = Joi.object({
  notebook_id: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "ID notebook không được để trống",
      "string.pattern.base": "ID notebook không hợp lệ",
      "any.required": "ID notebook là bắt buộc",
    }),
});

// Validation cho thêm nhiều notebooks
export const addMultipleNotebooksValidation = Joi.object({
  notebook_ids: Joi.array()
    .items(
      Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
          "string.pattern.base": "ID notebook không hợp lệ",
        })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "Phải có ít nhất 1 notebook",
      "any.required": "Danh sách notebook_ids là bắt buộc",
    }),
});

// Validation cho xóa notebook khỏi collection
export const removeNotebookValidation = Joi.object({
  notebook_id: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "ID notebook không được để trống",
      "string.pattern.base": "ID notebook không hợp lệ",
      "any.required": "ID notebook là bắt buộc",
    }),
});

// Validation cho tìm kiếm collection
export const searchCollectionValidation = Joi.object({
  keyword: Joi.string().required().min(1).messages({
    "string.empty": "Từ khóa tìm kiếm không được để trống",
    "string.min": "Từ khóa tìm kiếm phải có ít nhất 1 ký tự",
    "any.required": "Từ khóa tìm kiếm là bắt buộc",
  }),
});
