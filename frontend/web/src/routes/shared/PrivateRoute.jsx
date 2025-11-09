// PrivateRoute.jsx
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const reduxToken = useSelector((s) => s.auth.accessToken);
  // support both storage keys: older code used `token`, newer code uses `accessToken`
  const token = reduxToken || localStorage.getItem("accessToken") || localStorage.getItem("token"); // 👈 fallback
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}
