import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function AdminRoute() {
  const { session } = useAuth();
  return session?.role === "ADMIN" ? <Outlet /> : <Navigate to="/" replace />;
}