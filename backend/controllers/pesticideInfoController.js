import { describePesticideByName } from "../services/aiGemini.js";

export async function getPesticideInfoByAi(req, res) {
  try {
    const { name } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Vui lòng nhập tên thuốc BVTV.",
      });
    }

    const aiResult = await describePesticideByName(name.trim());

    return res.status(200).json({
      success: true,
      data: aiResult,
    });
  } catch (err) {
    console.error("[PesticideInfo] getPesticideInfoByAi error:", err);

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Hệ thống đang gặp lỗi khi tra cứu thuốc BVTV bằng AI. Vui lòng thử lại sau.",
    });
  }
}
