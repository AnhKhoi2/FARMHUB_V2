import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Đang xác thực tài khoản...");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await axiosClient.get(`/auth/verify/${token}`);
        setMessage(res.data.message || "Xác thực thành công!");
        setTimeout(() => navigate("/login"), 2000);
      } catch (err) {
        setMessage(err.response?.data?.message || "Liên kết không hợp lệ hoặc đã hết hạn!");
      }
    };
    verifyEmail();
  }, [token,navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>{message}</h2>
    </div>
  );
};

export default VerifyEmail;
