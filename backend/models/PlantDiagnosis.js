// be/models/PlantDiagnosis.js
import mongoose from 'mongoose';

const PlantDiagnosisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    plantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plant',
      required: false,
    },

    provider: {
      type: String,
      default: 'plant.id',
    },

    inputImageUrl: String,
    storedImageUrl: String,

    plantName: String,
    plantCommonName: String,
    plantProbability: Number,

    isHealthy: Boolean,
    isHealthyProbability: Number,

    issues: [
      {
        name: String,
        probability: Number,
      },
    ],

    raw: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const PlantDiagnosis = mongoose.model('PlantDiagnosis', PlantDiagnosisSchema);
export default PlantDiagnosis;
