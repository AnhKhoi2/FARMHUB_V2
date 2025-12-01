import Model from '../models/Model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/ApiResponse.js';
import { NotFound, BadRequest } from '../utils/ApiError.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load layout templates for validation
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let LAYOUTS = [];
try {
  const file = fs.readFileSync(path.join(__dirname, '../data/layouts.json'), 'utf-8');
  LAYOUTS = JSON.parse(file);
} catch (err) {
  LAYOUTS = [];
}

export const modelController = {
  // GET /admin/models
  list: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const skip = (page - 1) * limit;
    // allow including deleted/hidden items when requested by admin UI
    const includeDeleted = String(req.query.includeDeleted || '').toLowerCase() === 'true';
    const filter = includeDeleted ? {} : { isDeleted: false };
    const [items, total] = await Promise.all([
      Model.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Model.countDocuments(filter),
    ]);

    return ok(res, items, { page, limit, total, pages: Math.ceil(total / limit) });
  }),

  // POST /admin/models
  create: asyncHandler(async (req, res) => {
    const payload = req.body || {};
    // Validate numeric fields
    if (payload.sunHours !== undefined) {
      const h = Number(payload.sunHours);
      if (Number.isNaN(h) || h < 0 || h > 24) throw BadRequest('sunHours must be a number between 0 and 24');
      payload.sunHours = h;
    }
    // Validate layouts: must be an array of up to 3 valid layout_id numbers
    if (payload.layouts !== undefined) {
      if (!Array.isArray(payload.layouts)) throw BadRequest('layouts must be an array of layout_id numbers');
      if (payload.layouts.length !== 3) throw BadRequest('layouts must contain exactly 3 layout selections');
      const ids = payload.layouts.map((v) => Number(v));
      for (const id of ids) {
        if (Number.isNaN(id)) throw BadRequest('each layout id must be a number');
        const found = LAYOUTS.find((l) => Number(l.layout_id) === id);
        if (!found) throw BadRequest(`layout id ${id} is not valid`);
      }
      payload.layouts = ids;
    }
    // (balconyArea removed) other validations handled elsewhere

    // assign a persistent displayId (next integer) so IDs don't shift when rows hidden
    const maxDoc = await Model.findOne({}).sort({ displayId: -1 }).select('displayId').lean();
    const nextDisplayId = (maxDoc && Number(maxDoc.displayId)) ? Number(maxDoc.displayId) + 1 : 1;
    payload.displayId = nextDisplayId;

    const m = new Model(payload);
    await m.save();
    return created(res, m);
  }),

  // GET /admin/models/:id
  detail: asyncHandler(async (req, res) => {
    const m = await Model.findById(req.params.id);
    if (!m) throw NotFound('Not found');
    return ok(res, m);
  }),

  // GET /admin/models/trash - return only deleted models
  trash: asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit || '200', 10);
    const items = await Model.find({ isDeleted: true }).limit(limit).sort({ updatedAt: -1 });
    return ok(res, items);
  }),

  // PUT /admin/models/:id
  update: asyncHandler(async (req, res) => {
    const payload = req.body || {};

    // Basic validation for new fields
    if (payload.sunHours !== undefined) {
      const h = Number(payload.sunHours);
      if (Number.isNaN(h) || h < 0 || h > 24) throw BadRequest('sunHours must be a number between 0 and 24');
      payload.sunHours = h;
    }
    // Validate layouts on update as well
    if (payload.layouts !== undefined) {
      if (!Array.isArray(payload.layouts)) throw BadRequest('layouts must be an array of layout_id numbers');
      if (payload.layouts.length !== 3) throw BadRequest('layouts must contain exactly 3 layout selections');
      const ids = payload.layouts.map((v) => Number(v));
      for (const id of ids) {
        if (Number.isNaN(id)) throw BadRequest('each layout id must be a number');
        const found = LAYOUTS.find((l) => Number(l.layout_id) === id);
        if (!found) throw BadRequest(`layout id ${id} is not valid`);
      }
      payload.layouts = ids;
    }
    // (balconyArea removed) other validations handled elsewhere

    const m = await Model.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!m) throw NotFound('Not found');
    return ok(res, m);
  }),

  // DELETE /admin/models/:id (soft delete)
  softDelete: asyncHandler(async (req, res) => {
    const m = await Model.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!m) throw NotFound('Not found');
    return ok(res, { message: 'deleted' });
  }),
  // PATCH /admin/models/:id/hide - mark as hidden (isDeleted = true)
  hide: asyncHandler(async (req, res) => {
    const m = await Model.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!m) throw NotFound('Not found');
    return ok(res, m);
  }),

  // PATCH /admin/models/:id/restore - unhide (isDeleted = false)
  restore: asyncHandler(async (req, res) => {
    const m = await Model.findByIdAndUpdate(req.params.id, { isDeleted: false }, { new: true });
    if (!m) throw NotFound('Not found');
    return ok(res, m);
  }),

  // GET /models/suggestions - return models matching user's selected options
  suggestions: asyncHandler(async (req, res) => {
    // If user info available, try to read profile preferences
    let selectedOptions = {};
    try {
      if (req.user && req.user.id) {
        // lazy require to avoid circular import here
        const Profile = (await import('../models/Profile.js')).default;
        const p = await Profile.findOne({ userId: req.user.id }).lean();
        console.log('User profile for suggestions:', p);
        selectedOptions = (p && p.modelSuggestion && p.modelSuggestion.selectedOptions) || {};
      }
    } catch (e) {
      selectedOptions = {};
    }

    // Build filter based on selectedOptions
    const filter = { isDeleted: false };
    if (selectedOptions && Object.keys(selectedOptions).length > 0) {
      // helper to escape regex special chars
      const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      for (const [k, vRaw] of Object.entries(selectedOptions)) {
        const v = vRaw;
        if (v === null || typeof v === 'undefined' || v === '') continue;

        // boolean strings -> boolean
        if (typeof v === 'string' && (v.toLowerCase() === 'true' || v.toLowerCase() === 'false')) {
          filter[k] = v.toLowerCase() === 'true';
          continue;
        }

        // if value is array -> $in (apply case-insensitive regex for strings)
        if (Array.isArray(v)) {
          filter[k] = { $in: v.map((x) => (typeof x === 'string' ? new RegExp(`^${escapeRegex(x)}$`, 'i') : x)) };
          continue;
        }

        // for booleans / numbers keep as-is
        if (typeof v === 'boolean' || typeof v === 'number') {
          filter[k] = v;
          continue;
        }

        // for strings, use case-insensitive exact-match regex (escape special chars)
        if (typeof v === 'string') {
          filter[k] = { $regex: new RegExp(`^${escapeRegex(v)}$`, 'i') };
          continue;
        }
      }
    } else {
      // if no preferences, return empty list to avoid noise
      return ok(res, []);
    }

    // optional debug: return filter instead of items
    if (String(req.query.debug || '').toLowerCase() === 'true') {
      return ok(res, { filter });
    }

    const items = await Model.find(filter).limit(50).sort({ createdAt: -1 }).lean();
      // If no exact-match items found, try a relaxed scoring-based search
      if ((!items || items.length === 0) && selectedOptions && Object.keys(selectedOptions).length > 0) {
        // Build aggregation to compute how many fields match and return top matches
        const aggMatch = { $match: { isDeleted: false } };

        // Build addFields expression for matchCount
        const addFields = { $addFields: {} };
        const matchExprs = [];

        const escapeForRegexString = (s) => String(s).replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");

        for (const [k, v] of Object.entries(selectedOptions)) {
          if (v === null || typeof v === 'undefined' || v === '') continue;

          // boolean/number -> equality
          if (typeof v === 'boolean' || typeof v === 'number') {
            matchExprs.push({ $cond: [{ $eq: [`$${k}`, v] }, 1, 0] });
            continue;
          }

          // string: use case-insensitive regex match (contains or exact?) -> prefer exact-like match
          if (typeof v === 'string') {
            const pattern = escapeForRegexString(v);
            matchExprs.push({ $cond: [{ $regexMatch: { input: `$${k}`, regex: pattern, options: 'i' } }, 1, 0] });
            continue;
          }
        }

        if (matchExprs.length > 0) {
          addFields.$addFields.matchCount = { $add: matchExprs };

          const pipeline = [aggMatch, addFields, { $match: { matchCount: { $gt: 0 } } }, { $sort: { matchCount: -1, createdAt: -1 } }, { $limit: 50 }];

          const aggRes = await Model.aggregate(pipeline).allowDiskUse(true);
          return ok(res, aggRes);
        }
      }

      return ok(res, items);
  }),
};
