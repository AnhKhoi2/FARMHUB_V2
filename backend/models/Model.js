import mongoose from 'mongoose';

const ModelSchema = new mongoose.Schema({
  // `crop` removed: model now represents an environment/recipe, not tied to a specific crop
  // Diện tích trồng tổng (m2)
  area: { type: Number, required: false },
  // Human-friendly sequential id assigned on creation (1,2,3...)
  displayId: { type: Number, required: false, index: true, unique: true, sparse: true },
  soil: { type: String, required: false },
  climate: { type: String, required: false },
  irrigation: { type: String, required: false },
  // Thời gian có nắng mỗi ngày (giờ) - integer/float
  sunHours: { type: Number, required: false },
  // Cường độ ánh sáng: 'Yếu' | 'Vừa' | 'Nắng gắt'
  sunIntensity: { type: String, enum: ['Yếu', 'Vừa', 'Nắng gắt'], required: false },
  // Mức độ gió / thông thoáng: 'Yếu' | 'Vừa' | 'Mạnh'
  wind: { type: String, enum: ['Yếu', 'Vừa', 'Mạnh'], required: false },
  // Có mái che không (ảnh hưởng tới lượng mưa/tưới và loại cây)
  hasRoof: { type: Boolean, default: false },
  // Chất liệu nền: dùng để xác định khả năng đặt thùng xốp / chậu lớn
  floorMaterial: { type: String, enum: ['Gạch', 'Xi măng', 'Gỗ', 'Chống thấm', 'Khác'], required: false },
  // Selected layout templates (array of layout_id numbers from data/layouts.json)
  layouts: {
    type: [Number],
    default: [],
    validate: {
      validator: function (v) {
        return !v || v.length <= 3;
      },
      message: 'layouts can contain at most 3 items',
    },
  },
  description: { type: String, required: false },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtuals: compute human-friendly classifications and suggestions
// sunCategory: 'Ít' | 'Trung bình' | 'Nhiều' based on sunHours
ModelSchema.virtual('sunCategory').get(function () {
  const h = this.sunHours;
  if (h === null || typeof h === 'undefined') return null;
  if (h < 3) return 'Ít';
  if (h <= 6) return 'Trung bình';
  return 'Nhiều';
});

// sunTimeLabel: more descriptive label mapping ranges to Vietnamese labels
ModelSchema.virtual('sunTimeLabel').get(function () {
  const h = this.sunHours;
  if (h === null || typeof h === 'undefined') return null;
  if (h <= 3) return 'ít (1-3 tiếng/ngày)';
  if (h <= 7) return 'vừa (3-7 tiếng/ngày)';
  return 'nhiều (8-12 tiếng/ngày)';
});

// scaleSuggestion: suggest planting scale based on area
ModelSchema.virtual('scaleSuggestion').get(function () {
  const a = this.area;
  if (a === null || typeof a === 'undefined') return 'Không xác định';
  if (a < 1) return 'Chậu nhỏ';
  if (a < 5) return 'Chậu lớn / vài chậu';
  if (a < 15) return 'Vườn mini';
  return 'Giàn leo / Sân vườn lớn';
});

export default mongoose.model('Model', ModelSchema);
