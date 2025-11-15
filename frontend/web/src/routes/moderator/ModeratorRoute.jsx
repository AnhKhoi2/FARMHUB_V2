import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function ModeratorRoute({ children }) {
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
  // allow moderators and admins
  if (user?.role !== "moderator" && user?.role !== "admin") return <Navigate to="/" replace />;
  return children;
}
