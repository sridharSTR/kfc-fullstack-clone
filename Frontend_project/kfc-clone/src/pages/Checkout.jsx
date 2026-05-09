import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createOrder } from "../api/order";
import { useAuth } from "../hooks/useAuth";

function Checkout({ cart, setCart }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart]
  );

  const placeOrder = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error("Your cart is empty.");
      navigate("/menu");
      return;
    }

    if (!name || !email || !phone || !address) {
      toast.error("Please fill all details");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }

    if (phone.length !== 10 || isNaN(phone)) {
      toast.error("Enter valid 10-digit phone number");
      return;
    }

    setLoading(true);

    try {
      const response = await createOrder({
        name,
        email,
        phone,
        address,
        payment_method: paymentMethod,
      });

      if (response.data.email_sent) {
        toast.success(`Order placed! Receipt sent to ${response.data.email}`);
      } else {
        toast.warning(
          response.data.email_error
            ? `Order placed, but email failed: ${response.data.email_error}`
            : "Order placed, but receipt email was not sent."
        );
      }
      setCart([]);
      setName("");
      setEmail(user?.email || "");
      setPhone("");
      setAddress("");
      setPaymentMethod("cash");
      navigate("/orders");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <h2>Checkout</h2>
      <div className="checkout-summary">
        <p>{cart.length} items in your order</p>
        <strong>Total: INR {total}</strong>
      </div>

      <form onSubmit={placeOrder}>
        <input
          placeholder="Enter Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email for PDF Receipt"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="checkout-email">
          PDF bill receipt will be sent to this email address.
        </div>

        <input
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          placeholder="Delivery Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <fieldset className="payment-options">
          <legend>Payment Option</legend>
          <label>
            <input
              type="radio"
              name="payment_method"
              value="cash"
              checked={paymentMethod === "cash"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            Cash on Delivery
          </label>
          <label>
            <input
              type="radio"
              name="payment_method"
              value="upi"
              checked={paymentMethod === "upi"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            UPI
          </label>
          <label>
            <input
              type="radio"
              name="payment_method"
              value="card"
              checked={paymentMethod === "card"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            Card
          </label>
        </fieldset>

        <button type="submit" disabled={loading}>
          {loading ? "Placing Order..." : "Place Order"}
        </button>
      </form>
    </div>
  );
}

export default Checkout;
