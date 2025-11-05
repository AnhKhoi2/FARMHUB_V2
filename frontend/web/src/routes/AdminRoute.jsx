import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  if (!token) return <Navigate to="/login" />;
  if (user?.role !== "admin") return <Navigate to="/" />;
  return children;
}
