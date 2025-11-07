// PrivateRoute.jsx
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const reduxToken = useSelector((s) => s.auth.accessToken);
  const token = reduxToken || localStorage.getItem("accessToken"); // 👈 fallback
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}
