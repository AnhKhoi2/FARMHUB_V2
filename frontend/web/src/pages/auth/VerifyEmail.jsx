import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/shared/axiosClient.js";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Đang xác thực tài khoản...");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await axiosClient.get(`/auth/verify/${token}`);

        const msg =
          res.data?.message ||
          "Xác thực email thành công! Bạn có thể đăng nhập.";

        setMessage(msg);

        // ✅ Thành công → chờ 2s rồi về trang đăng nhập
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } catch (err) {
        const status = err.response?.status;
        const data = err.response?.data || {};
        const backendMsg = data.message;
        const code = data.code || data.error?.code;

        // ✅ Case: token xác thực đã hết hạn
        if (status === 410 || code === "VERIFY_TOKEN_EXPIRED") {
          setMessage("Phiên đăng kí đã hết hạn, vui lòng đăng kí lại.");

          // Cho user đọc message rồi tự chuyển về /register
          setTimeout(() => {
            navigate("/register");
          }, 3000);
        } else {
          // Các lỗi khác: token sai, user không tồn tại, đã xác thực rồi, v.v.
          setMessage(
            backendMsg || "Liên kết không hợp lệ hoặc đã hết hạn!"
          );
        }
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>{message}</h2>
    </div>
  );
};

export default VerifyEmail;
