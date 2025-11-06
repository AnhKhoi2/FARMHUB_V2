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
  chat: asyncHandler(async (req, res) => {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'messages array is required' });
    }
    try {
      console.log('aiController.chat invoked', { userId: req.user?.id, msgCount: messages.length });
      const result = await aiService.generateChatResponse({ messages });
      return ok(res, { result });
    } catch (err) {
      console.error('aiController.chat error', { message: err?.message, stack: err?.stack });
      // If AI provider fails, return a helpful mock response instead of 500 so frontend chat still works.
      const mockText = 'Xin lỗi, hiện tại dịch vụ AI bên ngoài không khả dụng. Đây là phản hồi giả để phát triển: hãy kiểm tra cây trồng, giảm độ ẩm, và kiểm tra các triệu chứng điển hình của nấm. Nếu bạn muốn kết quả chính xác hơn, hãy cấu hình đúng GEMINI_API_URL/GEMINI_API_KEY.';
      return ok(res, { result: { text: mockText, structured: null, provider: 'mock' } });
    }
  }),
};
