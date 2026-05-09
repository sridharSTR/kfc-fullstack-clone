import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { getAdminOrders } from "../api/order";
import AdminNavbar from "../components/AdminNavbar";

const formatMoney = (value) => Number(value || 0).toFixed(2);

const formatStatus = (value) =>
  (value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function AdminPayments() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    getAdminOrders()
      .then((response) => {
        if (!ignore) {
          setOrders(response.data.orders || []);
        }
      })
      .catch((error) => {
        console.error("Admin payments load error:", error);
        toast.error("Unable to load payments");
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const summary = useMemo(
    () =>
      orders.reduce(
        (totals, order) => {
          const amount = Number(order.total_price || 0);
          totals.revenue += order.payment_status === "paid" ? amount : 0;
          totals.pending += order.payment_status === "pending" ? amount : 0;
          totals[order.payment_method] = (totals[order.payment_method] || 0) + 1;
          return totals;
        },
        { revenue: 0, pending: 0, cash: 0, card: 0, upi: 0 }
      ),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    if (filter === "all") {
      return orders;
    }

    return orders.filter((order) => order.payment_status === filter);
  }, [filter, orders]);

  if (loading) {
    return <div className="admin-shell">Loading payments...</div>;
  }

  return (
    <div className="admin-shell">
      <AdminNavbar />

      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <p className="section-subtitle">Admin</p>
            <h1>Payments</h1>
          </div>
          <div className="admin-topbar-actions single">
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">All payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <section className="admin-card-grid payment-card-grid">
          <article className="admin-metric-card">
            <span>Paid Revenue</span>
            <strong>INR {formatMoney(summary.revenue)}</strong>
          </article>
          <article className="admin-metric-card">
            <span>Pending Cash</span>
            <strong>INR {formatMoney(summary.pending)}</strong>
          </article>
          <article className="admin-metric-card">
            <span>Cash Orders</span>
            <strong>{summary.cash}</strong>
          </article>
          <article className="admin-metric-card">
            <span>UPI Orders</span>
            <strong>{summary.upi}</strong>
          </article>
          <article className="admin-metric-card">
            <span>Card Orders</span>
            <strong>{summary.card}</strong>
          </article>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <h2>Payment History</h2>
            <span>{filteredOrders.length} records</span>
          </div>

          <div className="admin-table payment-history-table">
            {filteredOrders.map((order) => (
              <div className="admin-table-row payment-history-row" key={order.id}>
                <strong>#{order.id}</strong>
                <span>{order.customer_name}</span>
                <span>{formatStatus(order.payment_method)}</span>
                <span>{formatStatus(order.payment_status)}</span>
                <span>INR {formatMoney(order.total_price)}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminPayments;
