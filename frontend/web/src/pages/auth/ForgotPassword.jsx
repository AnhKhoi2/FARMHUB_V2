import React, { useState } from "react";
import axiosClient from "../../api/shared/axiosClient";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosClient.post("/auth/password/forgot", {
        email,
      });
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response.data.message || "Có lỗi xảy ra!");
    }
  };

  return (
    <div>
      <h2>Quên mật khẩu</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Nhập email của bạn"
          required
        />
        <button type="submit">Gửi yêu cầu</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default ForgotPassword;
