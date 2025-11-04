import { useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";

export default function Home() {
  const dispatch = useDispatch();
  
  return (
    <div>
      <h1>Chào bạn! Bạn đã đăng nhập thành công ✅</h1>
      <button onClick={() => dispatch(logout())}>Đăng xuất</button>
    </div>
  );
}
