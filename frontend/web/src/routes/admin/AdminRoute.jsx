import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  // Read token from redux, fallback to localStorage (support legacy key 'token')
  const reduxToken = useSelector((state) => state.auth.accessToken);
  const reduxUser = useSelector((state) => state.auth.user);
  const token = reduxToken || localStorage.getItem("accessToken") || localStorage.getItem("token");
  const user = reduxUser || (() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  })();

  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return children;
}
