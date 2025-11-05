import * as aiService from "../services/aiService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/ApiResponse.js";

export const aiController = {
  diagnose: asyncHandler(async (req, res) => {
    const { description, symptoms, extra } = req.body;
    if (!description || !symptoms) {
      return res.status(400).json({ success: false, message: "description and symptoms are required" });
    }

    try {
      console.log('aiController.diagnose invoked', { userId: req.user?.id, bodyPreview: { description: description?.slice?.(0,100), symptoms: symptoms?.slice?.(0,100) } });
      const result = await aiService.generateDiagnosis({ description, symptoms, extra });
      return ok(res, { result });
    } catch (err) {
      // Log full error so server logs show the stack for debugging
      console.error('aiController.diagnose error', { message: err?.message, stack: err?.stack });
      // rethrow to let asyncHandler / express handle sending 500
      throw err;
    }
  }),
};
