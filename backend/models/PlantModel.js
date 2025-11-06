import mongoose from "mongoose"

const PlantModelSchema = new mongoose.Schema(
	{
		// model_id exists in DB as an indexed field in some deployments.
		// Ensure we include it and fill with a default to avoid duplicate-null index errors.
		model_id: { type: String, index: true },
		// Soft-delete fields
		isDeleted: { type: Boolean, default: false, index: true },
		deletedAt: { type: Date },
		deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		crop: { type: String, required: true },
		area: { type: Number },
		soil: { type: String },
		climate: { type: String },
		irrigation: { type: String },
		description: { type: String },
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
	},
	{ timestamps: true }
)

const PlantModel = mongoose.models.PlantModel || mongoose.model("PlantModel", PlantModelSchema)

export default PlantModel
