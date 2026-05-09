import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getOrderHistory } from "../api/order";

const formatMoney = (value) => Number(value || 0).toFixed(2);

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const trackerSteps = [
  { value: "placed", label: "Placed" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
];

const getTrackerIndex = (status) => {
  if (status === "cancelled") {
    return -1;
  }

  return Math.max(
    0,
    trackerSteps.findIndex((step) => step.value === status)
  );
};

const formatStatus = (value) =>
  (value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    getOrderHistory()
      .then((response) => {
        if (!ignore) {
          setOrders(response.data.orders || []);
        }
      })
      .catch((error) => {
        console.error("Order history load error:", error);
        toast.error("Unable to load order history");
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

  if (loading) {
    return <div className="orders-page">Loading order history...</div>;
  }

  return (
    <div className="orders-page">
      <div className="orders-header">
        <div>
          <p className="section-subtitle">Your orders</p>
          <h1>Order History</h1>
        </div>
        <Link to="/menu" className="orders-menu-link">
          Order Again
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <h2>No orders yet</h2>
          <p>Your placed orders and receipt details will appear here.</p>
          <Link to="/menu" className="orders-menu-link">
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="order-card-head">
                <div>
                  <h2>Order #{order.id}</h2>
                  <p>{formatDate(order.created_at)}</p>
                </div>
                <div className="order-head-meta">
                  <span className={`status-pill status-${order.status}`}>
                    {formatStatus(order.status)}
                  </span>
                  <strong>INR {formatMoney(order.total_price)}</strong>
                </div>
              </div>

              <div className="order-details">
                <span>{order.customer_name}</span>
                <span>{order.phone}</span>
                <span>{order.customer_email}</span>
                <span>{order.delivery_address}</span>
                <span>Payment: {formatStatus(order.payment_method)}</span>
                <span>Payment status: {formatStatus(order.payment_status)}</span>
              </div>

              <div className="order-tracker">
                {order.status === "cancelled" ? (
                  <div className="tracker-cancelled">Order Cancelled</div>
                ) : (
                  trackerSteps.map((step, index) => (
                    <div
                      className={`tracker-step ${
                        index <= getTrackerIndex(order.status) ? "active" : ""
                      }`}
                      key={step.value}
                    >
                      <span>{index + 1}</span>
                      <p>{step.label}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="order-items">
                {order.items.map((item) => (
                  <div className="order-item-row" key={item.id}>
                    {item.food_image ? (
                      <img src={item.food_image} alt={item.food_name} />
                    ) : (
                      <div className="order-item-placeholder" />
                    )}
                    <div>
                      <h3>{item.food_name}</h3>
                      <p>
                        Qty {item.quantity} x INR {formatMoney(item.price)}
                      </p>
                    </div>
                    <strong>INR {formatMoney(item.line_total)}</strong>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderHistory;
