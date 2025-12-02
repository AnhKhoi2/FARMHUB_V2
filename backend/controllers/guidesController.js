import Guide from "../models/Guide.js";
import PlantGroup from "../models/PlantGroup.js";
import { ok } from "../utils/ApiResponse.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic mapping from normalized display labels -> plant_group slug.
// We'll populate this lazily from the PlantGroup collection so it stays in-sync
// with database entries and supports localized names automatically.
let LABEL_TO_SLUG = {};
let LABELS_LOADED = false;
let LABELS_LOADING = null; // promise in-flight to avoid concurrent DB loads

async function ensureLabelToSlugMapping() {
  if (LABELS_LOADED) return;
  if (LABELS_LOADING) return LABELS_LOADING;

  LABELS_LOADING = (async () => {
    try {
      const docs = await PlantGroup.find().lean();
      const map = {};
      for (const d of docs || []) {
        const slug = d?.slug;
        const name = d?.name || '';
        if (!slug) continue;

        // normalized name and slug keys
        const nName = normalizeLabelForMapping(name);
        const nSlug = normalizeLabelForMapping(slug);
        if (nName) map[nName] = slug;
        if (nSlug) map[nSlug] = slug;

        // also include raw lowercase forms
        try {
          if (name) map[String(name).toLowerCase()] = slug;
          if (slug) map[String(slug).toLowerCase()] = slug;
        } catch (e) {
          // ignore
        }

        // include stripped-prefix variants (e.g. remove common Vietnamese prefixes)
        try {
          const stripped = String(name || '').toLowerCase().replace(/^nh[oó]m\s+c[âa]y\s+/i, '').trim();
          if (stripped) map[normalizeLabelForMapping(stripped)] = slug;
        } catch (e) {}

        // include each plant entry name so a plant label can map to its group
        if (Array.isArray(d.plants)) {
          for (const p of d.plants) {
            try {
              const pname = p && p.name ? String(p.name) : null;
              if (pname) {
                map[normalizeLabelForMapping(pname)] = slug;
                map[String(pname).toLowerCase()] = slug;
              }
            } catch (e) {
              // ignore individual plant entry errors
            }
          }
        }
      }

      LABEL_TO_SLUG = map;
      LABELS_LOADED = true;
      if (process.env.NODE_ENV !== 'production') console.log('[update-guide] built LABEL_TO_SLUG mapping from PlantGroup docs, entries=', Object.keys(LABEL_TO_SLUG).length);
    } catch (e) {
      console.warn('[update-guide] failed to build LABEL_TO_SLUG mapping:', e?.message || e);
    } finally {
      LABELS_LOADING = null;
    }
  })();

  return LABELS_LOADING;
}

function normalizeLabelForMapping(s) {
  if (!s) return '';
  try {
    // remove diacritics, collapse whitespace and lowercase
    return String(s)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  } catch (e) {
    return String(s).toLowerCase();
  }
}

// GET /guides?page=1&limit=10&search=abc&tag=foo
export const getGuides = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  // support returning all guides when client passes `all=true`
  const wantAll = String(req.query.all || '').toLowerCase() === 'true';
  const limit = wantAll ? 0 : Math.max(1, parseInt(req.query.limit) || 10);
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

  // filter by explicit category / plantTag OR plant_group slug
  if (category) {
    // if category matches a plantgroup slug or name, prefer filtering by plant_group
    try {
      const pg = await PlantGroup.findOne({ $or: [{ slug: category }, { name: category }] }).lean();
      if (pg && pg.slug) {
        filter.plant_group = pg.slug;
      } else {
        // allow comma-separated list
        const vals = typeof category === 'string' ? category.split(',').map(s=>s.trim()).filter(Boolean) : category;
        if (Array.isArray(vals)) {
          filter.plantTags = { $in: vals };
        } else {
          filter.plantTags = vals;
        }
      }
    } catch (e) {
      // fallback to plantTags filtering on error
      const vals = typeof category === 'string' ? category.split(',').map(s=>s.trim()).filter(Boolean) : category;
      if (Array.isArray(vals)) filter.plantTags = { $in: vals };
      else filter.plantTags = vals;
    }
  }

  // use lean() to get plain JS objects we can normalize
  let total = await Guide.countDocuments(filter);
  let rawGuides;
  if (wantAll) {
    // return all matching guides (no pagination)
    rawGuides = await Guide.find(filter).sort({ createdAt: -1 }).lean();
    // override page/limit to reflect full set
  } else {
    const skip = (page - 1) * limit;
    rawGuides = await Guide.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  }

  // Normalize image field: if document has `image` use it; otherwise try `images` array (first element)
  // Build a map of plant_group slug -> display name for category labeling
  const slugs = Array.from(new Set(rawGuides.map(r => r.plant_group).filter(Boolean)));
  const pgDocs = slugs.length ? await PlantGroup.find({ slug: { $in: slugs } }).lean() : [];
  const slugToName = {};
  pgDocs.forEach(p => { if (p && p.slug) slugToName[p.slug] = p.name; });

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
    // Note: do not set `category` here — frontend will use `plantTags` / `plant_group`.
    // Provide a convenient `category` display field (human-readable)
    out.category = slugToName[out.plant_group] || (out.plantTags && out.plantTags.length ? out.plantTags[0] : null);
    out.category_slug = out.plant_group || null;
    return out;
  });

  const meta = { page, limit, total, pages: Math.ceil(total / limit) };
  return ok(res, guides, meta);
};

// Optional: POST /guides to create sample guides (protected in production)
export const createGuide = async (req, res) => {
  // Support multipart/form-data: handle files (image, stepImage_<i>) and steps JSON
  // Debug: log incoming files/body to help diagnose upload issues
  try {
    console.log('[upload-debug] createGuide req.files =', Array.isArray(req.files) ? req.files.map(f => ({ fieldname: f.fieldname, originalname: f.originalname, filename: f.filename, size: f.size })) : req.files);
    // Don't stringify huge bodies in production
    console.log('[upload-debug] createGuide req.body keys =', Object.keys(req.body || {}));
  } catch (e) {
    console.warn('[upload-debug] failed to log createGuide request', e);
  }
  const { title, description, content, tags, plantTags, expert_id, plant_name, plant_group } = req.body;
  console.log(req.files);
  
  const guideData = { title, description, content };
  if (tags !== undefined) {
    try { guideData.tags = typeof tags === 'string' ? JSON.parse(tags) : tags; } catch(e) { guideData.tags = tags; }
  }
  if (plantTags !== undefined) {
    try { guideData.plantTags = typeof plantTags === 'string' ? JSON.parse(plantTags) : plantTags; } catch(e) { guideData.plantTags = plantTags; }
  }
  if (plant_name) guideData.plant_name = plant_name;
  if (plant_group) guideData.plant_group = plant_group;

  // Prevent duplicate guide entries by plant_name globally (case-insensitive)
  try {
    if (guideData.plant_name) {
      const esc = String(guideData.plant_name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const dup = await Guide.findOne({
        plant_name: { $regex: `^${esc}$`, $options: 'i' },
        deleted: { $ne: true }
      }).lean();
      if (dup) {
        return res.status(409).json({ success: false, message: `Hướng dẫn cho "${guideData.plant_name}" đã tồn tại.` });
      }
    }
  } catch (e) {
    console.warn('Duplicate check failed', e?.message || e);
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
  // Provide a convenient `category` display field when possible
  try {
    let pg = null;
    if (guide.plant_group_id) {
      pg = await PlantGroup.findById(guide.plant_group_id).lean();
    }
    if (!pg && guide.plant_group) {
      pg = await PlantGroup.findOne({ slug: guide.plant_group }).lean();
    }
    guide.category = pg?.name || (guide.plantTags && guide.plantTags.length ? guide.plantTags[0] : null);
    guide.category_slug = pg?.slug || guide.plant_group || null;
  } catch (e) {
    // ignore category lookup errors
  }

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
// router.put('/:id', upload.any(), updateGuide);  // giữ nguyên
export const updateGuide = async (req, res) => {
  try {
    // Debug (rất hữu ích khi dev)
    console.log("Files received:", req.files?.map(f => ({ 
      field: f.fieldname, 
      name: f.originalname, 
      size: f.size 
    })) || "No files");
    console.log("Body keys:", Object.keys(req.body));

    // Write a minimal debug snapshot to backend/tmp/last_upload_debug.json to aid troubleshooting
    try {
      const dbg = {
        ts: new Date().toISOString(),
        route: 'updateGuide',
        id: req.params.id,
        files: Array.isArray(req.files) ? req.files.map(f => ({ field: f.fieldname, originalname: f.originalname, filename: f.filename, size: f.size })) : null,
        bodyKeys: Object.keys(req.body || {}),
        plant_group: req.body?.plant_group || null,
      };
      const dbgPath = path.join(__dirname, '..', 'tmp', 'last_upload_debug.json');
      try { fs.mkdirSync(path.dirname(dbgPath), { recursive: true }); } catch(e) {}
      fs.writeFileSync(dbgPath, JSON.stringify(dbg, null, 2), 'utf8');
      console.log('[upload-debug] wrote debug snapshot to', dbgPath);
    } catch (e) {
      console.warn('[upload-debug] failed to write debug snapshot', e?.message || e);
    }

    const updates = {};

    // validate id early to give clearer error
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid guide id' });
    }

    // Cập nhật các field text
    if (req.body.title) updates.title = req.body.title.trim();
    if (req.body.description !== undefined) updates.description = req.body.description;
    // plant_group and plant_name (if provided)
    if (req.body.plant_group) updates.plant_group = req.body.plant_group;
    if (req.body.plant_name) updates.plant_name = req.body.plant_name;

    // plantTags
    if (req.body.plantTags) {
      try {
        updates.plantTags = typeof req.body.plantTags === "string"
          ? JSON.parse(req.body.plantTags)
          : req.body.plantTags;
      } catch (e) {
        console.warn("plantTags parse error:", e);
      }
    }

    // === ẢNH CHÍNH - CHỈ CẬP NHẬT KHI THỰC SỰ CÓ FILE MỚI ===
    const mainImageFile = req.files?.find(f => f.fieldname === "image");
    if (mainImageFile && mainImageFile.size > 0) {
      updates.image = `/uploads/guides/${mainImageFile.filename}`;
    }
    // Nếu không có file mới → giữ nguyên ảnh cũ (không làm gì cả)

    // If we have a new main image file, persist it immediately so the image
    // is stored on the document even if later parts of the update fail.
    if (updates.image) {
      try {
        await Guide.findByIdAndUpdate(req.params.id, { $set: { image: updates.image, images: [updates.image] } });
        if (process.env.NODE_ENV !== 'production') console.log('[update-guide] persisted main image early:', updates.image);
      } catch (e) {
        console.warn('[update-guide] failed to persist main image early:', e?.message || e);
        // don't abort the request; continue with the normal update flow
      }
    }

    // === CÁC BƯỚC HƯỚNG DẪN ===
    if (req.body.steps) {
      let stepsRaw = req.body.steps;
      let steps = null;
      try {
        steps = typeof stepsRaw === "string" ? JSON.parse(stepsRaw) : stepsRaw;
      } catch (e) {
        console.error("Failed to parse steps JSON:", e?.message || e, "raw:", stepsRaw);
        return res.status(400).json({ success: false, message: "Invalid steps format (JSON parse error)" });
      }

      if (!Array.isArray(steps)) {
        return res.status(400).json({ success: false, message: "Invalid steps format: expected an array" });
      }

      // Map lại từng bước + thay ảnh nếu có file mới
      const mappedSteps = steps.map((step, idx) => {
        const stepFile = req.files?.find(f => f.fieldname === `stepImage_${idx}`);

        return {
          title: (step.title || "").toString().trim(),
          text: (step.text || "").toString().trim(),
          // Nếu có file mới → dùng file mới
          // Nếu không → giữ nguyên URL cũ (nếu có)
          image: stepFile && stepFile.size > 0
            ? `/uploads/guides/${stepFile.filename}`
            : (step.image || null),
        };
      });

      updates.steps = mappedSteps;
    }

    // === Normalize plant_group slug server-side to avoid Mongoose enum errors ===
    if (updates.plant_group) {
      const pgCandidateRaw = String(updates.plant_group || '').trim();
      const normalized = normalizeLabelForMapping(pgCandidateRaw);
      // Ensure mapping is loaded from DB if it's not already
      try {
        console.log('[update-guide] ensureLabelToSlugMapping start for:', pgCandidateRaw);
        await ensureLabelToSlugMapping();
        console.log('[update-guide] ensureLabelToSlugMapping done; entries=', Object.keys(LABEL_TO_SLUG).length);
      } catch (e) {
        console.warn('[update-guide] ensureLabelToSlugMapping error:', e?.message || e);
      }

      // 1) Try direct mapping from known labels
      if (normalized && LABEL_TO_SLUG[normalized]) {
        updates.plant_group = LABEL_TO_SLUG[normalized];
        if (process.env.NODE_ENV !== 'production') console.log('[update-guide] mapped label->slug via LABEL_TO_SLUG:', pgCandidateRaw, '->', updates.plant_group);
      } else {
        // 2) Try quick exact slug/name lookups as a safe fallback wrapped in try/catch
        try {
          console.log('[update-guide] fallback lookup for plant_group:', pgCandidateRaw);
          // prefer exact slug
          let pgDoc = await PlantGroup.findOne({ slug: pgCandidateRaw }).lean();
          if (!pgDoc) {
            const esc = String(pgCandidateRaw).replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
            const exactRe = new RegExp(`^${esc}$`, 'i');
            pgDoc = await PlantGroup.findOne({ $or: [{ slug: exactRe }, { name: exactRe }] }).lean();
          }
          if (pgDoc && pgDoc.slug) updates.plant_group = pgDoc.slug;
          else {
            // final safe heuristic: if normalized contains known keywords
            if (normalized && (normalized.includes('gia vi') || normalized.includes('herb'))) {
              updates.plant_group = 'herb';
            } else {
              // drop field to avoid Mongoose enum errors
              delete updates.plant_group;
              if (process.env.NODE_ENV !== 'production') console.warn('[update-guide] plant_group could not be normalized; dropping field for:', pgCandidateRaw);
            }
          }
        } catch (e) {
          // On unexpected errors, drop the field to avoid crashing the update
          delete updates.plant_group;
          console.warn('[update-guide] plant_group normalization encountered error, dropping field:', e?.message || e);
        }
      }
    }

    // Cập nhật vào DB
    // Before updating, ensure we don't create a duplicate by plant_name globally (exclude self)
    if (updates.plant_name) {
      try {
        const esc = String(updates.plant_name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const conflict = await Guide.findOne({
          _id: { $ne: req.params.id },
          plant_name: { $regex: `^${esc}$`, $options: 'i' },
          deleted: { $ne: true }
        }).lean();
        if (conflict) {
          return res.status(409).json({ success: false, message: `Đã tồn tại hướng dẫn cho "${updates.plant_name}".` });
        }
      } catch (e) {
        console.warn('Duplicate check (update) failed', e?.message || e);
      }
    }

    // Log updates payload for diagnostics (remove or lower in production)
    console.log('[update-guide] updates payload:', JSON.stringify(updates));

    let guide;
    try {
      guide = await Guide.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true }
      ).populate("expert_id", "username fullname avatar");
    } catch (dbErr) {
      console.error('[update-guide] DB update error:', dbErr);
      // Mongoose validation / cast errors should return 400 with details
      if (dbErr.name === 'ValidationError' || dbErr.name === 'CastError') {
        return res.status(400).json({ success: false, message: dbErr.message, details: dbErr.errors || null });
      }
      // otherwise rethrow to outer catch
      throw dbErr;
    }

    if (!guide) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hướng dẫn" });
    }

    return res.json({ success: true, data: guide });

  } catch (error) {
    console.error("Update guide error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Lỗi server", 
      error: error.message 
    });
  }
};