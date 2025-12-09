// src/pages/PesticideAiInfoPage.jsx
import React, { useState, useEffect } from "react";
import pesticideApi from "../api/pesticideApi.js";
import "../css/PesticideAiInfoPage.css";
import Header from "../components/shared/Header";
import Footer from "../components/shared/Footer";

// Helper: decode payload của JWT (không dùng thư viện ngoài)
function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch (e) {
    console.error("decodeJwtPayload error:", e);
    return null;
  }
}

function PesticideAiInfoPage() {
  const [name, setName] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔍 CÁCH 1: kiểm tra token ngay khi mở trang
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");

      if (!token) {
        // Không bắt buộc phải show lỗi, tuỳ bạn
        // setError("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
        return;
      }

      const payload = decodeJwtPayload(token);
      if (!payload || !payload.exp) return;

      const nowSeconds = Date.now() / 1000;
      if (payload.exp < nowSeconds) {
        setError("Token đã hết hạn, vui lòng đăng nhập lại.");
      }
    } catch (e) {
      console.error("Token check on page load error:", e);
      // setError("Token không hợp lệ. Vui lòng đăng nhập lại.");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);

    // Nếu đã biết token hết hạn thì không cần gọi API nữa
    if (error && error.includes("Token đã hết hạn")) {
      return;
    }

    if (!name.trim()) {
      setError("Vui lòng nhập tên thuốc BVTV.");
      return;
    }

    setError("");

    try {
      setLoading(true);

      const res = await pesticideApi.getAiInfoByName(name.trim());
      const payload = res.data;

      if (!payload?.success) {
        throw new Error(
          payload?.message || "Tra cứu thuốc BVTV bằng AI thất bại."
        );
      }

      setResult(payload.data || null);
    } catch (err) {
      console.error(err);

      // ƯU TIÊN: lấy message từ BE (kể cả khi 401 hết token)
      const apiMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.response?.data?.error ||
        (err?.response?.status === 401
          ? "Token đã hết hạn, vui lòng đăng nhập lại."
          : null);

      setError(
        apiMessage || err.message || "Có lỗi xảy ra, vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="pesticide-page">
        <div className="pesticide-card">
          {/* ==== HEADER ==== */}
          <div className="pesticide-header">
            <h2 style={{ fontWeight: 700, fontSize: "26px" }}>Tra Cứu Thuốc BVTV</h2>

            <div className="pesticide-subtitle">
              <div className="subtitle-icon">📄</div>
              <div className="subtitle-text">
                <p>
                  Nhập tên thuốc bảo vệ thực vật (tên thương phẩm) để FarmHub
                  AI hỗ trợ bạn kiểm tra thông tin cơ bản và tạo link tra cứu
                  nhanh.
                </p>
                <ul>
                  <li>AI chỉ mô tả thông tin chung về thuốc.</li>
                  <li>
                    <span className="highlight">Không kê toa thuốc</span> và{" "}
                    <span className="highlight">
                      không hướng dẫn liều lượng cụ thể
                    </span>
                    .
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* ==== FORM ==== */}
          <form onSubmit={handleSubmit} className="pesticide-form">
            <label className="form-label">
              Tên thuốc BVTV
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: Regent 5SC, Antracol 70WP..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            {/* HIỂN THỊ LỖI NGAY DƯỚI INPUT */}
            {error && <div className="error-box form-error">{error}</div>}

            <button
              type="submit"
              className="btn-primary_sb"
              disabled={loading}
            >
              {loading ? "Đang tra cứu..." : "Xem thông tin"}
            </button>
          </form>

          {/* ==== LƯU Ý CHUNG ==== */}
          <div className="disclaimer-box">
            <strong>Lưu ý quan trọng:</strong>
            <ul>
              <li>
                Thông tin do AI cung cấp chỉ mang tính{" "}
                <strong>tham khảo</strong>.
              </li>
              <li>
                Luôn đọc kỹ nhãn thuốc trên bao bì và tuân theo hướng dẫn của
                nhà sản xuất, cán bộ BVTV và quy định pháp luật hiện hành.
              </li>
              <li>
                FarmHub <strong>không</strong> thay thế tư vấn chuyên môn, không
                chịu trách nhiệm cho việc sử dụng thuốc ngoài hướng dẫn chính
                thống.
              </li>
            </ul>
          </div>

          {/* ==== KẾT QUẢ AI + LINK TRA CỨU ==== */}
          {result && (
            <div className="result-card">
              <h3>Kết quả tra cứu sản phẩm</h3>

              <p>
                <strong>Tên bạn nhập:</strong> {result.inputName || name}
              </p>

              {result.name && (
                <p>
                  <strong>Tên thuốc (AI ghi nhận):</strong> {result.name}
                </p>
              )}

              {result.activeIngredient && (
                <p>
                  <strong>Hoạt chất:</strong> {result.activeIngredient}
                </p>
              )}

              {result.usage && (
                <p>
                  <strong>Công dụng:</strong> {result.usage}
                </p>
              )}

              {result.crops && (
                <p>
                  <strong>Cây trồng áp dụng (mô tả chung):</strong>{" "}
                  {result.crops}
                </p>
              )}

              {result.toxicity && (
                <p>
                  <strong>Mức độ độc hại (thông tin chung):</strong>{" "}
                  {result.toxicity}
                </p>
              )}

              {result.safetyGuide && (
                <p>
                  <strong>Hướng dẫn an toàn:</strong> {result.safetyGuide}
                </p>
              )}

              {result.manufacturer && (
                <p>
                  <strong>Hãng sản xuất / phân phối:</strong>{" "}
                  {result.manufacturer}
                </p>
              )}

              {result.formulation && (
                <p>
                  <strong>Dạng thuốc:</strong> {result.formulation}
                </p>
              )}

              {result.priceRange && (
                <p>
                  <strong>Giá tham khảo:</strong> {result.priceRange}
                </p>
              )}

              {result.searchLink && (
                <p>
                  <strong>🔎 Tìm kiếm thêm thông tin về thuốc:</strong>
                  <br />
                  <a
                    href={result.searchLink}
                    target="_blank"
                    rel="noreferrer"
                    className="link-main"
                  >
                    Mở tìm kiếm Google với từ khóa "
                    {result.inputName || name}"
                  </a>
                </p>
              )}

              {result.officialSiteLink && (
                <p>
                  <strong>📘 Cơ quan quản lý chính thức:</strong>
                  <br />
                  <a
                    href={result.officialSiteLink}
                    target="_blank"
                    rel="noreferrer"
                    className="link-main"
                  >
                    Cục Trồng trọt &amp; Bảo vệ thực vật – Bộ NN&PTNT
                    (ppd.gov.vn)
                  </a>
                </p>
              )}

              {result.disclaimer && (
                <p className="result-disclaimer">
                  <strong>Khuyến cáo từ hệ thống:</strong> {result.disclaimer}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default PesticideAiInfoPage;
