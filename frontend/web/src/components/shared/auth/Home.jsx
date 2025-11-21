import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { logoutThunk } from "../redux/authThunks";

// ✅ Import ChatWidget
import ChatWidget from "../expert/ChatWidget";

export default function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logoutThunk());
    navigate("/login", { replace: true });
  };

  return (
    <div>
      <h1>Chào bạn! Bạn đã đăng nhập thành công ✅</h1>
      <button onClick={handleLogout}>Đăng xuất</button>

      {/* ✅ Gắn ChatWidget ở đây */}
      <ChatWidget
        open={chatOpen}
        onClose={(v) => setChatOpen(Boolean(v))}
        initialOpenPayload={null} // Mặc định chưa mở với ai
      />
    </div>
  );
}
