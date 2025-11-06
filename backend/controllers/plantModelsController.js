import PlantModel from "../models/PlantModel.js";
import { ok } from "../utils/ApiResponse.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /plant-models
export const getPlantModels = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const search = req.query.search || "";
  const filter = { deleted: { $ne: true } };
  if (search) {
    const esc = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [{ title: { $regex: esc, $options: "i" } }, { description: { $regex: esc, $options: "i" } }];
  }
  const skip = (page - 1) * limit;
  const [total, raw] = await Promise.all([
    PlantModel.countDocuments(filter),
    PlantModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  const port = process.env.PORT || 5000;
  const prefix = `http://localhost:${port}`;
  const docs = raw.map((m) => {
    const out = { ...m };
    if (!out.images || out.images.length === 0) {
      if (out.steps && out.steps.length && out.steps[0].image) out.images = [out.steps[0].image];
    }
    if (out.images && out.images.length) {
      out.images = out.images.map((im) => (im && !/^https?:\/\//i.test(im) ? (im.startsWith('/') ? `${prefix}${im}` : `${prefix}/uploads/${im}`) : im));
    }
    if (out.steps && Array.isArray(out.steps)) {
      out.steps = out.steps.map((s) => {
        const o = { ...s };
        if (o.image && !/^https?:\/\//i.test(o.image)) {
          o.image = o.image.startsWith('/') ? `${prefix}${o.image}` : `${prefix}/uploads/${o.image}`;
        }
        return o;
      });
    }
    return out;
  });

  const meta = { page, limit, total, pages: Math.ceil(total / limit) };
  return ok(res, docs, meta);
};

// GET /plant-models/:id
export const getPlantModelById = async (req, res) => {
  const id = req.params.id;
  const model = await PlantModel.findOne({ _id: id, deleted: { $ne: true } }).lean();
  if (!model) return res.status(404).json({ success: false, message: "PlantModel not found" });
  const port = process.env.PORT || 5000;
  const prefix = `http://localhost:${port}`;
  if (model.images && model.images.length) model.images = model.images.map(im => (!/^https?:\/\//i.test(im) ? (im.startsWith('/') ? `${prefix}${im}` : `${prefix}/uploads/${im}`) : im));
  if (model.steps && Array.isArray(model.steps)) {
    model.steps = model.steps.map(s => ({ ...s, image: s.image && !/^https?:\/\//i.test(s.image) ? (s.image.startsWith('/') ? `${prefix}${s.image}` : `${prefix}/uploads/${s.image}`) : s.image }));
  }
  return ok(res, model);
};

// POST /plant-models
export const createPlantModel = async (req, res) => {
  const { title, description, plantTags, difficulty, duration, expectedYield, steps } = req.body;
  const data = { title, description };
  if (plantTags !== undefined) {
    try { data.plantTags = typeof plantTags === 'string' ? JSON.parse(plantTags) : plantTags; } catch(e) { data.plantTags = plantTags; }
  }
  if (difficulty) data.difficulty = difficulty;
  if (duration) data.duration = duration;
  if (expectedYield) data.expectedYield = expectedYield;

  // map files
  const filesMap = {};
  if (Array.isArray(req.files)) {
    for (const f of req.files) {
      if (!filesMap[f.fieldname]) filesMap[f.fieldname] = [];
      filesMap[f.fieldname].push(f);
    }
  }

  // main images
  if (filesMap.image && filesMap.image.length) {
    data.images = filesMap.image.map(f => `plantmodels/${f.filename}`);
  }

  // steps
  if (steps) {
    try {
      const incoming = typeof steps === 'string' ? JSON.parse(steps) : steps;
      data.steps = incoming.map((s, idx) => {
        const st = { title: s.title || '', text: s.text || '' };
        const field = `stepImage_${idx}`;
        if (filesMap[field] && filesMap[field].length) st.image = `plantmodels/${filesMap[field][0].filename}`;
        else if (s.image) st.image = s.image;
        return st;
      });
    } catch (e) { /* ignore */ }
  }

  const created = await PlantModel.create(data);
  const out = created.toObject ? created.toObject() : { ...created };
  return ok(res, out);
};

// PUT /plant-models/:id
export const updatePlantModel = async (req, res) => {
  const id = req.params.id;
  const updates = {};
  const { title, description, plantTags, difficulty, duration, expectedYield, steps } = req.body;
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (plantTags !== undefined) {
    try { updates.plantTags = typeof plantTags === 'string' ? JSON.parse(plantTags) : plantTags; } catch(e) { updates.plantTags = plantTags; }
  }
  if (difficulty !== undefined) updates.difficulty = difficulty;
  if (duration !== undefined) updates.duration = duration;
  if (expectedYield !== undefined) updates.expectedYield = expectedYield;

  const filesMap = {};
  if (Array.isArray(req.files)) {
    for (const f of req.files) {
      if (!filesMap[f.fieldname]) filesMap[f.fieldname] = [];
      filesMap[f.fieldname].push(f);
    }
  }

  if (filesMap.image && filesMap.image.length) updates.images = filesMap.image.map(f => `plantmodels/${f.filename}`);

  if (steps) {
    try {
      const incoming = typeof steps === 'string' ? JSON.parse(steps) : steps;
      updates.steps = incoming.map((s, idx) => {
        const st = { title: s.title || '', text: s.text || '' };
        const field = `stepImage_${idx}`;
        if (filesMap[field] && filesMap[field].length) st.image = `plantmodels/${filesMap[field][0].filename}`;
        else if (s.image) st.image = s.image;
        return st;
      });
    } catch (e) { }
  }

  const model = await PlantModel.findByIdAndUpdate(id, updates, { new: true, lean: true });
  if (!model) return res.status(404).json({ success: false, message: 'PlantModel not found' });
  return ok(res, model);
};

// DELETE (soft)
export const deletePlantModel = async (req, res) => {
  const id = req.params.id;
  const doc = await PlantModel.findByIdAndUpdate(id, { $set: { deleted: true, deletedAt: new Date() } }, { new: true, lean: true });
  if (!doc) return res.status(404).json({ success: false, message: 'PlantModel not found' });
  return ok(res, { deletedId: id });
};

// Trash / restore / permanent (similar to guides)
export const getTrashedPlantModels = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;
  const filter = { deleted: true };
  const [total, raw] = await Promise.all([
    PlantModel.countDocuments(filter),
    PlantModel.find(filter).sort({ deletedAt: -1 }).skip(skip).limit(limit).lean(),
  ]);
  const meta = { page, limit, total, pages: Math.ceil(total / limit) };
  return ok(res, raw, meta);
};

export const restorePlantModel = async (req, res) => {
  const id = req.params.id;
  const doc = await PlantModel.findByIdAndUpdate(id, { $set: { deleted: false }, $unset: { deletedAt: 1 } }, { new: true, lean: true });
  if (!doc) return res.status(404).json({ success: false, message: 'PlantModel not found' });
  return ok(res, doc);
};

export const permanentDeletePlantModel = async (req, res) => {
  const id = req.params.id;
  const doc = await PlantModel.findById(id).lean();
  if (!doc) return res.status(404).json({ success: false, message: 'PlantModel not found' });
  try {
    const dir = path.join(__dirname, '..', 'uploads');
    const files = [];
    if (doc.images) files.push(...doc.images);
    if (doc.steps) doc.steps.forEach(s => { if (s.image) files.push(s.image); });
    for (const rel of files) {
      if (!rel) continue;
      const relPath = rel.startsWith('/uploads/') ? rel.replace('/uploads/', '') : (rel.startsWith('uploads/') ? rel.replace('uploads/', '') : rel);
      const fp = path.join(dir, relPath);
      try { if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch (e) { }
    }
  } catch (e) { }
  await PlantModel.deleteOne({ _id: id });
  return ok(res, { deletedId: id });
};
