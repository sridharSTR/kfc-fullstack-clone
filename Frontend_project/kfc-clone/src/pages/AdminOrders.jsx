import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getAdminOrders, updateOrderStatus } from "../api/order";
import AdminNavbar from "../components/AdminNavbar";
import { getAdminSession } from "../api/admin";

const formatMoney = (value) => Number(value || 0).toFixed(2);

const formatStatus = (value) =>
  (value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function AdminOrders() {
  const hasAdminSession = !!getAdminSession();
  const [orders, setOrders] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    let ignore = false;

    if (!hasAdminSession) {
      setLoading(false);
      return () => {
        ignore = true;
      };
    }

    getAdminOrders()
      .then((response) => {
        if (!ignore) {
          setOrders(response.data.orders || []);
          setStatuses(response.data.statuses || []);
        }
      })
      .catch((error) => {
        console.error("Admin orders load error:", error);
        toast.error("Unable to load admin orders");
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [hasAdminSession]);

  const handleStatusChange = async (orderId, status) => {
    setSavingId(orderId);

    try {
      const response = await updateOrderStatus(orderId, status);
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? response.data : order))
      );
      toast.success(`Order #${orderId} updated`);
    } catch (error) {
      console.error("Order status update error:", error);
      toast.error(error.response?.data?.error || "Unable to update order");
    } finally {
      setSavingId(null);
    }
  };

  if (!hasAdminSession) {
    return <Navigate to="/admin/login" replace />;
  }

  if (loading) {
    return <div className="admin-shell">Loading admin orders...</div>;
  }

  return (
    <div className="admin-shell">
      <AdminNavbar />
      <main className="admin-main">
        <div className="orders-header">
          <div>
            <p className="section-subtitle">Admin</p>
            <h1>Manage Orders</h1>
          </div>
        </div>

        <div className="admin-order-table">
          {orders.map((order) => (
            <article className="admin-order-row" key={order.id}>
              <div>
                <strong>#{order.id}</strong>
                <p>{order.customer_name}</p>
              </div>
              <div>
                <span>{order.customer_email}</span>
                <p>{order.phone}</p>
              </div>
              <div>
                <span>INR {formatMoney(order.total_price)}</span>
                <p>
                  {formatStatus(order.payment_method)} -{" "}
                  {formatStatus(order.payment_status)}
                </p>
              </div>
              <select
                value={order.status}
                disabled={savingId === order.id}
                onChange={(event) =>
                  handleStatusChange(order.id, event.target.value)
                }
              >
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </article>
          ))}

          {orders.length === 0 && (
            <div className="empty-state">
              <h2>No orders yet</h2>
              <p>Customer orders will appear here for admin tracking.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminOrders;
