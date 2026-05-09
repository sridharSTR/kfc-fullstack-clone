import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import AdminNavbar from "../components/AdminNavbar";
import {
  approveAdminRequest,
  getAdminDashboard,
  getAdminSession,
  getAdminUsers,
  rejectAdminRequest,
} from "../api/admin";

const formatMoney = (value) => Number(value || 0).toFixed(2);

const formatStatus = (value) =>
  (value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function AdminDashboard() {
  const session = getAdminSession();
  const isSuperuser = !!session?.user?.is_superuser;
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadDashboard = async () => {
    const response = await getAdminDashboard();
    setDashboard(response.data);
  };

  const loadUsers = async () => {
    if (!isSuperuser) {
      return;
    }

    const response = await getAdminUsers();
    setUsers(response.data.users || []);
  };

  useEffect(() => {
    let ignore = false;

    Promise.all([getAdminDashboard(), isSuperuser ? getAdminUsers() : Promise.resolve(null)])
      .then(([dashboardResponse, usersResponse]) => {
        if (!ignore) {
          setDashboard(dashboardResponse.data);
          setUsers(usersResponse?.data?.users || []);
        }
      })
      .catch((error) => {
        console.error("Admin dashboard error:", error);
        toast.error("Unable to load admin dashboard");
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [isSuperuser]);

  const filteredOrders = useMemo(() => {
    const orders = dashboard?.recent_orders || [];
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        String(order.id).includes(query) ||
        order.customer_name.toLowerCase().includes(query) ||
        order.customer_email.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [dashboard, search, statusFilter]);

  const pendingUsers = users.filter(
    (user) => user.admin_request_status === "pending" && !user.is_staff
  );

  const handleAdminAction = async (userId, action) => {
    try {
      if (action === "approve") {
        await approveAdminRequest(userId);
        toast.success("Admin request approved");
      } else {
        await rejectAdminRequest(userId);
        toast.success("Admin request rejected");
      }

      await Promise.all([loadDashboard(), loadUsers()]);
    } catch (error) {
      toast.error(error.response?.data?.error || "Unable to update request");
    }
  };

  if (loading) {
    return <div className="admin-shell">Loading admin dashboard...</div>;
  }

  const cards = dashboard?.cards || {};
  const payments = dashboard?.payments || {};

  return (
    <div className="admin-shell">
      <AdminNavbar />

      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <p className="section-subtitle">Control center</p>
            <h1>Admin Dashboard</h1>
          </div>
          <div className="admin-topbar-actions">
            <input
              placeholder="Search orders, users, emails"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All Status</option>
              <option value="placed">Placed</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="out_for_delivery">Out for delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <section className="admin-card-grid">
          <article className="admin-metric-card">
            <span>Total Users</span>
            <strong>{cards.total_users || 0}</strong>
          </article>
          <article className="admin-metric-card">
            <span>Total Orders</span>
            <strong>{cards.total_orders || 0}</strong>
          </article>
          <article className="admin-metric-card">
            <span>Total Foods</span>
            <strong>{cards.total_foods || 0}</strong>
          </article>
          <article className="admin-metric-card">
            <span>Total Sales</span>
            <strong>INR {formatMoney(cards.total_sales)}</strong>
          </article>
          <article className="admin-metric-card">
            <span>Pending Requests</span>
            <strong>{isSuperuser ? pendingUsers.length : cards.pending_orders || 0}</strong>
          </article>
        </section>

        {isSuperuser && (
          <section className="admin-panel" id="users">
            <div className="admin-panel-head">
              <h2>Manage Users</h2>
              <span>{pendingUsers.length} pending admin requests</span>
            </div>

            <div className="admin-table admin-user-table">
              {users.map((user) => (
                <div className="admin-table-row admin-user-row" key={user.id}>
                  <div>
                    <strong>{user.username}</strong>
                    <p>{user.email}</p>
                  </div>
                  <span>{user.role}</span>
                  <span>{formatStatus(user.admin_request_status)}</span>
                  <span>{user.is_email_verified ? "Verified" : "Unverified"}</span>
                  <div className="admin-row-actions">
                    {user.admin_request_status === "pending" && !user.is_staff ? (
                      <>
                        <button onClick={() => handleAdminAction(user.id, "approve")}>
                          Approve
                        </button>
                        <button
                          className="danger-btn"
                          onClick={() => handleAdminAction(user.id, "reject")}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span>{user.is_superuser ? "Superuser" : "No action"}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="admin-panel">
          <div className="admin-panel-head">
            <h2>Recent Orders</h2>
            <span>{filteredOrders.length} results</span>
          </div>
          <div className="admin-table">
            {filteredOrders.map((order) => (
              <div className="admin-table-row" key={order.id}>
                <strong>#{order.id}</strong>
                <span>{order.customer_name}</span>
                <span>{order.customer_email}</span>
                <span>{formatStatus(order.status)}</span>
                <span>INR {formatMoney(order.total_price)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel" id="payments">
          <div className="admin-panel-head">
            <h2>Payment Monitoring</h2>
          </div>
          <div className="payment-monitor-grid">
            <span>Paid: {payments.paid || 0}</span>
            <span>Pending: {payments.pending || 0}</span>
            <span>Cash: {payments.cash || 0}</span>
            <span>UPI: {payments.upi || 0}</span>
            <span>Card: {payments.card || 0}</span>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
