import Guide from "../models/Guide.js";
import { ok } from "../utils/ApiResponse.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /guides?page=1&limit=10&search=abc&tag=foo
export const getGuides = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const search = req.query.search || ""; // generic text search
  const plant = (req.query.plant || "").trim(); // search by plant name (title or plantTags)
  const category = req.query.category || req.query.tag || req.query.plantTag; // filter by plant type

  const filter = {};
  // exclude soft-deleted guides by default
  filter.deleted = { $ne: true };
  // text search on title and summary
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { summary: { $regex: search, $options: "i" } },
    ];
  }

  // search by plant name: match title or plantTags (partial, case-insensitive)
  if (plant) {
    // escape user input for safe regex
    const esc = plant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const plantRegexOp = { $regex: esc, $options: "i" };
    // match title or any element in plantTags (regex against array elements)
    filter.$or = filter.$or || [];
    filter.$or.push({ title: plantRegexOp }, { plantTags: plantRegexOp });
  }

  // filter by explicit category / plantTag
  if (category) {
    // allow comma-separated list
    const vals = typeof category === 'string' ? category.split(',').map(s=>s.trim()).filter(Boolean) : category;
    if (Array.isArray(vals)) {
      filter.plantTags = { $in: vals };
    } else {
      filter.plantTags = vals;
    }
  }

  const skip = (page - 1) * limit;
  // use lean() to get plain JS objects we can normalize
  const [total, rawGuides] = await Promise.all([
    Guide.countDocuments(filter),
    Guide.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  // Normalize image field: if document has `image` use it; otherwise try `images` array (first element)
  const guides = rawGuides.map((g) => {
    const out = { ...g };
    if (!out.image) {
      if (out.images && out.images.length) {
        const first = out.images[0];
        if (typeof first === "string") out.image = first;
        else if (first && (first.url || first.path)) out.image = first.url || first.path;
      }
    }
    // normalize to full URL if image looks like a filename or relative path
    if (out.image && !/^https?:\/\//i.test(out.image)) {
      const port = process.env.PORT || 5000;
      const prefix = `http://localhost:${port}`;
      if (out.image.startsWith("/")) out.image = `${prefix}${out.image}`;
      else out.image = `${prefix}/uploads/${out.image}`;

      // Verify the file actually exists on disk; if not, fallback to a safe placeholder SVG
      try {
        const urlPath = out.image.replace(prefix, ""); // e.g. /uploads/guides/placeholder.png
        if (urlPath.startsWith("/uploads/")) {
          const rel = urlPath.replace("/uploads/", "");
          const filePath = path.join(__dirname, '..', 'uploads', rel);
          if (!fs.existsSync(filePath)) {
            // prefer svg placeholder in uploads/guides
            const fallback = path.join(__dirname, '..', 'uploads', 'guides', 'placeholder.svg');
            if (fs.existsSync(fallback)) {
              out.image = `${prefix}/uploads/guides/placeholder.svg`;
            }
          }
        }
      } catch (e) {
        // ignore filesystem errors
      }
    }
    return out;
  });

  const meta = { page, limit, total, pages: Math.ceil(total / limit) };
  return ok(res, guides, meta);
};

// Optional: POST /guides to create sample guides (protected in production)
export const createGuide = async (req, res) => {
  // Support multipart/form-data: handle files (image, stepImage_<i>) and steps JSON
  const { title, description, content, tags, plantTags, expert_id } = req.body;
  const guideData = { title, description, content };
  if (tags !== undefined) {
    try { guideData.tags = typeof tags === 'string' ? JSON.parse(tags) : tags; } catch(e) { guideData.tags = tags; }
  }
  if (plantTags !== undefined) {
    try { guideData.plantTags = typeof plantTags === 'string' ? JSON.parse(plantTags) : plantTags; } catch(e) { guideData.plantTags = plantTags; }
  }
  if (expert_id) guideData.expert_id = expert_id;

  // map files array into filesMap by fieldname
  const filesMap = {};
  if (Array.isArray(req.files)) {
    for (const f of req.files) {
      if (!filesMap[f.fieldname]) filesMap[f.fieldname] = [];
      filesMap[f.fieldname].push(f);
    }
  }

  // main image
  if (filesMap.image && filesMap.image.length) {
    const f = filesMap.image[0];
    guideData.image = `guides/${f.filename}`;
    guideData.images = [guideData.image];
  }

  // steps
  if (req.body.steps) {
    try {
      const incoming = typeof req.body.steps === 'string' ? JSON.parse(req.body.steps) : req.body.steps;
      const mapped = incoming.map((s, idx) => {
        const step = { title: s.title || '', text: s.text || '' };
        const fileField = `stepImage_${idx}`;
        if (filesMap[fileField] && filesMap[fileField].length) {
          step.image = `guides/${filesMap[fileField][0].filename}`;
        } else if (s.image) {
          step.image = s.image;
        }
        return step;
      });
      guideData.steps = mapped;
    } catch (e) {
      // ignore parse errors
    }
  }

  const guide = await Guide.create(guideData);

  // normalize image urls for response
  const port = process.env.PORT || 5000;
  const prefix = `http://localhost:${port}`;
  const out = guide.toObject ? guide.toObject() : { ...guide };
  if (out.image && !/^https?:\/\//i.test(out.image)) {
    if (out.image.startsWith('/')) out.image = `${prefix}${out.image}`;
    else out.image = `${prefix}/uploads/${out.image}`;
  }
  if (out.steps && Array.isArray(out.steps)) {
    out.steps = out.steps.map(s => {
      const o = { ...s };
      if (o.image && !/^https?:\/\//i.test(o.image)) {
        if (o.image.startsWith('/')) o.image = `${prefix}${o.image}`;
        else o.image = `${prefix}/uploads/${o.image}`;
      }
      return o;
    });
  }

  return ok(res, out);
};

// GET /guides/:id
export const getGuideById = async (req, res) => {
  const id = req.params.id;
  // populate and lean to normalize
  const guideRaw = await Guide.findOne({ _id: id, deleted: { $ne: true } }).populate("expert_id", "username email").lean();
  if (!guideRaw) return res.status(404).json({ success: false, message: "Guide not found" });

  const guide = { ...guideRaw };
  if (!guide.image) {
    if (guide.images && guide.images.length) {
      const first = guide.images[0];
      if (typeof first === "string") guide.image = first;
      else if (first && (first.url || first.path)) guide.image = first.url || first.path;
    }
  }

  // normalize single guide image to a full URL when necessary
  if (guide.image && !/^https?:\/\//i.test(guide.image)) {
    const port = process.env.PORT || 5000;
    const prefix = `http://localhost:${port}`;
    if (guide.image.startsWith("/")) guide.image = `${prefix}${guide.image}`;
    else guide.image = `${prefix}/uploads/${guide.image}`;
  }

  // normalize step images if present
  if (guide.steps && Array.isArray(guide.steps)) {
    const port = process.env.PORT || 5000;
    const prefix = `http://localhost:${port}`;
    guide.steps = guide.steps.map((s) => {
      const out = { ...s };
      if (out.image && !/^https?:\/\//i.test(out.image)) {
        if (out.image.startsWith('/')) out.image = `${prefix}${out.image}`;
        else out.image = `${prefix}/uploads/${out.image}`;

        // verify file exists and fallback to placeholder if not
        try {
          const urlPath = out.image.replace(prefix, '');
          if (urlPath.startsWith('/uploads/')) {
            const rel = urlPath.replace('/uploads/', '');
            const filePath = path.join(__dirname, '..', 'uploads', rel);
            if (!fs.existsSync(filePath)) {
              const fallback = path.join(__dirname, '..', 'uploads', 'guides', 'placeholder.svg');
              if (fs.existsSync(fallback)) {
                out.image = `${prefix}/uploads/guides/placeholder.svg`;
              }
            }
          }
        } catch (e) {
          // ignore
        }
      }
      return out;
    });
  }

  // verify existence and fallback to SVG placeholder when necessary
  try {
    if (guide.image) {
      const port = process.env.PORT || 5000;
      const prefix = `http://localhost:${port}`;
      const urlPath = guide.image.replace(prefix, "");
      if (urlPath.startsWith("/uploads/")) {
        const rel = urlPath.replace("/uploads/", "");
        const filePath = path.join(__dirname, '..', 'uploads', rel);
        if (!fs.existsSync(filePath)) {
          const fallback = path.join(__dirname, '..', 'uploads', 'guides', 'placeholder.svg');
          if (fs.existsSync(fallback)) {
            guide.image = `${prefix}/uploads/guides/placeholder.svg`;
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }

  // debug log - remove in production
  console.log("[guides] returning guide id=", id, "image=", guide.image);

  return ok(res, guide);
};

// DELETE /guides/:id
export const deleteGuide = async (req, res) => {
  const id = req.params.id;
  // soft delete: mark deleted = true and set deletedAt
  const guide = await Guide.findByIdAndUpdate(id, { $set: { deleted: true, deletedAt: new Date() } }, { new: true, lean: true });
  if (!guide) return res.status(404).json({ success: false, message: "Guide not found" });
  return ok(res, { deletedId: id });
};


// GET /guides/trash - list soft-deleted guides
export const getTrashedGuides = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  // only deleted = true
  const filter = { deleted: true };
  const [total, rawGuides] = await Promise.all([
    Guide.countDocuments(filter),
    Guide.find(filter).sort({ deletedAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  // reuse normalization from getGuides
  const guides = rawGuides.map((g) => {
    const out = { ...g };
    if (!out.image) {
      if (out.images && out.images.length) {
        const first = out.images[0];
        if (typeof first === "string") out.image = first;
        else if (first && (first.url || first.path)) out.image = first.url || first.path;
      }
    }
    if (out.image && !/^https?:\/\//i.test(out.image)) {
      const port = process.env.PORT || 5000;
      const prefix = `http://localhost:${port}`;
      if (out.image.startsWith("/")) out.image = `${prefix}${out.image}`;
      else out.image = `${prefix}/uploads/${out.image}`;
    }
    return out;
  });

  const meta = { page, limit, total, pages: Math.ceil(total / limit) };
  return ok(res, guides, meta);
};

// POST /guides/:id/restore - undo soft-delete
export const restoreGuide = async (req, res) => {
  const id = req.params.id;
  const guide = await Guide.findByIdAndUpdate(id, { $set: { deleted: false }, $unset: { deletedAt: 1 } }, { new: true, lean: true });
  if (!guide) return res.status(404).json({ success: false, message: 'Guide not found' });
  return ok(res, guide);
};

// DELETE /guides/:id/permanent - hard-delete and remove files
export const permanentDeleteGuide = async (req, res) => {
  const id = req.params.id;
  const guide = await Guide.findById(id).lean();
  if (!guide) return res.status(404).json({ success: false, message: 'Guide not found' });

  // delete files referenced by guide (image + steps[].image)
  try {
    const files = [];
    if (guide.image && !/^https?:\/\//i.test(guide.image)) files.push(guide.image.replace(/^\//, '').replace(/^uploads\//, ''));
    if (guide.images && Array.isArray(guide.images)) {
      guide.images.forEach(f => { if (f && !/^https?:\/\//i.test(f)) files.push(f.replace(/^\//, '').replace(/^uploads\//, '')); });
    }
    if (guide.steps && Array.isArray(guide.steps)) {
      guide.steps.forEach(s => { if (s.image && !/^https?:\/\//i.test(s.image)) files.push(s.image.replace(/^\//, '').replace(/^uploads\//, '')); });
    }
    for (const rel of files) {
      try {
        const filePath = path.join(__dirname, '..', 'uploads', rel);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {
        // ignore individual file errors
      }
    }
  } catch (e) {
    // ignore file deletion errors
  }

  await Guide.deleteOne({ _id: id });
  return ok(res, { deletedId: id });
};

// PUT /guides/:id - update guide, accept multipart/form-data with optional file field 'image'
export const updateGuide = async (req, res) => {
  const id = req.params.id;
  const updates = {};
  const { title, summary, content, tags } = req.body;
  if (title !== undefined) updates.title = title;
  // support both 'summary' and 'description' coming from various clients
  if (summary !== undefined) updates.summary = summary;
  if (req.body.description !== undefined) {
    // persist description field and keep summary in sync for search/legacy uses
    updates.description = req.body.description;
    // keep summary updated as well so components/search expecting 'summary' work
    updates.summary = req.body.description;
  }
  if (content !== undefined) updates.content = content;
  if (tags !== undefined) {
    try { updates.tags = typeof tags === 'string' ? JSON.parse(tags) : tags; } catch(e) { updates.tags = tags; }
  }
  // plantTags (array of strings)
  if (req.body.plantTags !== undefined) {
    try { updates.plantTags = typeof req.body.plantTags === 'string' ? JSON.parse(req.body.plantTags) : req.body.plantTags; } catch(e) { updates.plantTags = req.body.plantTags; }
  }

  // normalize req.files into a map by fieldname (supports upload.any())
  const filesMap = {};
  if (Array.isArray(req.files)) {
    for (const f of req.files) {
      if (!filesMap[f.fieldname]) filesMap[f.fieldname] = [];
      filesMap[f.fieldname].push(f);
    }
  } else if (req.files && typeof req.files === 'object') {
    Object.assign(filesMap, req.files);
  }

  // handle uploaded main image (fieldname 'image')
  if (filesMap.image && filesMap.image.length) {
    const f = filesMap.image[0];
    const rel = `guides/${f.filename}`;
    updates.image = rel;
    updates.$push = { images: rel };
  }

  // handle structured steps if provided
  // expect req.body.steps to be a JSON string: [{title,text,image?}]
  if (req.body.steps) {
    try {
      let incoming = typeof req.body.steps === 'string' ? JSON.parse(req.body.steps) : req.body.steps;
      const mapped = incoming.map((s, idx) => {
        const step = { title: s.title || '', text: s.text || '' };
        // support per-step file fields named stepImage_0, stepImage_1, etc.
        const fileField = `stepImage_${idx}`;
        if (filesMap[fileField] && filesMap[fileField].length) {
          step.image = `guides/${filesMap[fileField][0].filename}`;
        } else if (s.image) {
          step.image = s.image;
        }
        return step;
      });
      updates.steps = mapped;
    } catch (e) {
      // ignore parse errors - do not block saving other fields
    }
  }

  // apply update
  const opts = { new: true, runValidators: true, lean: true };
  // If using $push we need to use findByIdAndUpdate with that operator
  let guide;
  if (updates.$push) {
    const push = updates.$push;
    delete updates.$push;
    guide = await Guide.findByIdAndUpdate(id, { $set: updates, $push: push }, opts).populate('expert_id', 'username email');
  } else {
    guide = await Guide.findByIdAndUpdate(id, updates, opts).populate('expert_id', 'username email');
  }
  if (!guide) return res.status(404).json({ success: false, message: 'Guide not found' });

  // normalize image to full URL (reuse logic above)
  if (guide.image && !/^https?:\/\//i.test(guide.image)) {
    const port = process.env.PORT || 5000;
    const prefix = `http://localhost:${port}`;
    if (guide.image.startsWith('/')) guide.image = `${prefix}${guide.image}`;
    else guide.image = `${prefix}/uploads/${guide.image}`;
  }

  return ok(res, guide);
};
