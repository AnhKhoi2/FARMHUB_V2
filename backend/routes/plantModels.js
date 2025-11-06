import express from "express"
import PlantModel from "../models/PlantModel.js"

const router = express.Router()

// GET /plant-models/  -> list (simple)
router.get("/", async (req, res) => {
	try {
		// exclude soft-deleted items by default
		const items = await PlantModel.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).lean()
		res.json(items)
	} catch (err) {
		console.error("GET /plant-models error:", err)
		res.status(500).json({ message: "Lỗi server khi lấy danh sách", error: err.message, stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined })
	}
})

// POST /plant-models/ -> create
router.post("/", async (req, res) => {
	try {
		let { crop, area, soil, climate, irrigation, description } = req.body || {}
		if (!crop || !String(crop).trim()) return res.status(400).json({ message: "Trường 'crop' (cây trồng) là bắt buộc" })
		// coerce area to number when provided
		if (area !== undefined && area !== null && area !== "") {
			const a = Number(area)
			if (Number.isNaN(a)) return res.status(400).json({ message: "Trường 'area' phải là số" })
			area = a
		} else {
			area = undefined
		}
		// generate a simple unique model_id to satisfy any existing unique index on model_id
		const generateModelId = () => {
			return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
		}
		const model_id = generateModelId()
		const doc = await PlantModel.create({ model_id, crop: String(crop).trim(), area, soil, climate, irrigation, description })
		res.status(201).json(doc)
	} catch (err) {
		console.error("POST /plant-models error:", err)
		res.status(500).json({ message: "Lỗi server khi tạo mô hình", error: err.message, stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined })
	}
})

// GET /plant-models/trash -> list soft-deleted items
router.get("/trash", async (req, res) => {
	try {
		const items = await PlantModel.find({ isDeleted: true }).sort({ deletedAt: -1 }).lean()
		res.json(items)
	} catch (err) {
		console.error("GET /plant-models/trash error:", err)
		res.status(500).json({ message: "Lỗi server khi lấy thùng rác", error: err.message, stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined })
	}
})

// POST /plant-models/suggest
router.post("/suggest", (req, res) => {
	const { crop, area, soil, climate, irrigation } = req.body || {}

	if (!crop) {
		return res.status(400).json({ title: "Missing data", details: "Please provide a crop field." })
	}

	const details = []
	details.push(`Crop: ${crop}`)
	if (area) details.push(`Area: ${area} m²`)
	if (soil) details.push(`Soil: ${soil}`)
	if (climate) details.push(`Climate: ${climate}`)
	if (irrigation) details.push(`Irrigation: ${irrigation}`)

	if (soil && soil.toLowerCase().includes("sandy")) {
		details.push("Recommendation: add organic matter and mulch to improve water retention.")
	}

	if (climate && climate.toLowerCase().includes("dry")) {
		details.push("Irrigation: prefer drip or micro-sprinkler systems to save water.")
	}

	let plantingDensity = "standard"
	if (area && Number(area) < 50) plantingDensity = "high-density (small plot)"
	details.push(`Planting density suggestion: ${plantingDensity}`)

	return res.json({ title: `Suggested model for ${crop}`, details })
})

// GET /plant-models/:id -> get single
router.get("/:id", async (req, res) => {
	try {
		const doc = await PlantModel.findById(req.params.id).lean()
		if (!doc) return res.status(404).json({ message: "Not found" })
		res.json(doc)
	} catch (err) {
		console.error("GET /plant-models/:id error:", err)
		res.status(500).json({ message: "Lỗi server", error: err.message, stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined })
	}
})

// PUT /plant-models/:id -> update
router.put("/:id", async (req, res) => {
	try {
		let update = { ...req.body }
		if (update.area !== undefined && update.area !== null && update.area !== "") {
			const a = Number(update.area)
			if (Number.isNaN(a)) return res.status(400).json({ message: "Trường 'area' phải là số" })
			update.area = a
		} else {
			delete update.area
		}
		const updated = await PlantModel.findByIdAndUpdate(req.params.id, update, { new: true }).lean()
		if (!updated) return res.status(404).json({ message: "Không tìm thấy mô hình" })
		res.json(updated)
	} catch (err) {
		console.error("PUT /plant-models/:id error:", err)
		res.status(500).json({ message: "Lỗi server khi cập nhật", error: err.message, stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined })
	}
})

// DELETE /plant-models/:id -> soft-delete (move to trash)
router.delete("/:id", async (req, res) => {
	try {
		const id = req.params.id
		const update = { isDeleted: true, deletedAt: new Date() }
		// if you have auth, set deletedBy from req.user
		const deleted = await PlantModel.findByIdAndUpdate(id, update, { new: true }).lean()
		if (!deleted) return res.status(404).json({ message: "Not found" })
		res.json({ message: "Moved to trash", item: deleted })
	} catch (err) {
		console.error("DELETE /plant-models/:id error:", err)
		res.status(500).json({ message: "Lỗi server khi xóa", error: err.message, stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined })
	}
})
// PUT /plant-models/:id/restore -> restore from trash
router.put("/:id/restore", async (req, res) => {
	try {
		const id = req.params.id
		const restored = await PlantModel.findByIdAndUpdate(id, { isDeleted: false, deletedAt: null }, { new: true }).lean()
		if (!restored) return res.status(404).json({ message: "Không tìm thấy mô hình" })
		res.json({ message: "Đã khôi phục", item: restored })
	} catch (err) {
		console.error("PUT /plant-models/:id/restore error:", err)
		res.status(500).json({ message: "Lỗi server khi khôi phục", error: err.message, stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined })
	}
})

// DELETE /plant-models/:id/permanent -> permanent delete (use with caution)
router.delete("/:id/permanent", async (req, res) => {
	try {
		const removed = await PlantModel.findByIdAndDelete(req.params.id).lean()
		if (!removed) return res.status(404).json({ message: "Not found" })
		res.json({ message: "Deleted permanently" })
	} catch (err) {
		console.error("DELETE /plant-models/:id/permanent error:", err)
		res.status(500).json({ message: "Lỗi server khi xóa vĩnh viễn", error: err.message, stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined })
	}
})

export default router
