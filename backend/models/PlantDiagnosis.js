import mongoose from 'mongoose';

const { Schema } = mongoose;

const IssueSchema = new Schema(
  {
    name: { type: String },
    probability: { type: Number }, // 0–1
    treatment: {
      type: Schema.Types.Mixed, // lưu nguyên object treatment từ Plant.id
      default: null,
    },
  },
  { _id: false }
);

const PlantDiagnosisSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', default: null },

    provider: { type: String, default: 'plant.id' },

    inputImageUrl: { type: String, default: null },
    storedImageUrl: { type: String, default: null },

    plantName: { type: String, default: null },        // tên khoa học
    plantCommonName: { type: String, default: null },  // tên thường gọi
    plantProbability: { type: Number, default: null }, // 0–1

    isHealthy: { type: Boolean, default: null },
    isHealthyProbability: { type: Number, default: null },

    issues: {
      type: [IssueSchema],
      default: [],
    },

    raw: {
      type: Schema.Types.Mixed, // lưu full response Plant.id
      default: null,
    },
  },
  { timestamps: true }
);

// ⭐ DEFAULT EXPORT để phù hợp với import PlantDiagnosis from '...'
const PlantDiagnosis = mongoose.model('PlantDiagnosis', PlantDiagnosisSchema);
export default PlantDiagnosis;
