import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logoutThunk } from "../redux/authThunks";

export default function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutThunk());               // xóa user/token trong Redux + localStorage
    navigate("/login", { replace: true }); // điều hướng chủ động
  };

  return (
    <div>
      <h1>Chào bạn! Bạn đã đăng nhập thành công ✅</h1>
      <button onClick={handleLogout}>Đăng xuất</button>
    </div>
  );
}
