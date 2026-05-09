import { Navigate, useLocation } from "react-router-dom";
import { getAdminSession } from "../api/admin";

function ProtectedAdminRoute({ children }) {
  const location = useLocation();
  const session = getAdminSession();

  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedAdminRoute;
