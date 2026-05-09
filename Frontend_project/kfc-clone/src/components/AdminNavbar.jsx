import { NavLink, useNavigate } from "react-router-dom";
import { clearAdminSession, getAdminSession } from "../api/admin";

function AdminNavbar() {
  const navigate = useNavigate();
  const session = getAdminSession();

  const logout = () => {
    clearAdminSession();
    navigate("/admin/login", { replace: true });
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <span>KFC</span>
        <div>
          <strong>Admin Panel</strong>
          <p>{session?.user?.email}</p>
        </div>
      </div>

      <nav className="admin-sidebar-links">
        <NavLink to="/admin/dashboard">Dashboard</NavLink>
        {session?.user?.is_superuser && <NavLink to="/admin/users">Users</NavLink>}
        <NavLink to="/admin/foods">Foods</NavLink>
        <NavLink to="/admin/orders">Orders</NavLink>
        <NavLink to="/admin/payments">Payments</NavLink>
      </nav>

      <button className="admin-sidebar-logout" onClick={logout}>
        Logout
      </button>
    </aside>
  );
}

export default AdminNavbar;
