import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { updateCartItem, removeFromCart } from "../api/cart";

function Cart({ cart, setCart }) {
  const navigate = useNavigate();

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart]
  );

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty, 0),
    [cart]
  );

  const increaseQty = async (id) => {
    const item = cart.find((cartItem) => cartItem.id === id);

    if (!item) {
      return;
    }

    const newQuantity = item.qty + 1;

    setCart((prev) =>
      prev.map((cartItem) =>
        cartItem.id === id ? { ...cartItem, qty: newQuantity } : cartItem
      )
    );

    try {
      await updateCartItem(item.cartItemId ?? id, newQuantity);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update item");

      setCart((prev) =>
        prev.map((cartItem) =>
          cartItem.id === id ? { ...cartItem, qty: item.qty } : cartItem
        )
      );
    }
  };

  const decreaseQty = async (id) => {
    const item = cart.find((cartItem) => cartItem.id === id);

    if (!item) {
      return;
    }

    const newQuantity = item.qty - 1;

    setCart((prev) =>
      prev
        .map((cartItem) =>
          cartItem.id === id ? { ...cartItem, qty: newQuantity } : cartItem
        )
        .filter((cartItem) => cartItem.qty > 0)
    );

    try {
      await updateCartItem(item.cartItemId ?? id, newQuantity);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update item");

      setCart((prev) => {
        const itemStillExists = prev.some((cartItem) => cartItem.id === id);

        if (itemStillExists) {
          return prev.map((cartItem) =>
            cartItem.id === id ? { ...cartItem, qty: item.qty } : cartItem
          );
        }

        return [...prev, item];
      });
    }
  };

  const removeItem = async (id) => {
    const removed = cart.find((item) => item.id === id);

    setCart((prev) => prev.filter((item) => item.id !== id));

    try {
      await removeFromCart(removed?.cartItemId ?? id);
      toast.success("Item removed");
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove item");

      if (removed) {
        setCart((prev) => [...prev, removed]);
      }
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }

    navigate("/checkout");
  };

  return (
    <main className="cart-page">
      <section className="cart-hero-card">
        <div>
          <p className="section-subtitle">Your order</p>
          <h1>Shopping cart</h1>
          <p>Review your favorites, adjust quantities, and checkout when the bucket is ready.</p>
        </div>
        <div className="cart-hero-stats">
          <span>{totalItems} items</span>
          <strong>INR {total}</strong>
        </div>
      </section>

      <div className="cart-container">
        <div className="cart-items">
        {cart.length === 0 ? (
          <div className="empty-state">
            <h2>Your cart is waiting</h2>
            <p>Your cart is empty.</p>
            <button className="checkout-btn" onClick={() => navigate("/menu")}>
              Browse Menu
            </button>
          </div>
        ) : (
          <>
            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-media">
                  <img src={item.image} alt={item.name} width="70" />
                </div>

                <div className="item-info">
                  <span className="food-tag">KFC pick</span>
                  <h3 className="item-name">{item.name}</h3>
                  <p>INR {item.price}</p>
                </div>

                <div className="qty-controls">
                  <button onClick={() => decreaseQty(item.id)}>-</button>
                  <span>{item.qty}</span>
                  <button onClick={() => increaseQty(item.id)}>+</button>
                </div>

                <button
                  className="delete-btn"
                  onClick={() => removeItem(item.id)}
                >
                  Remove
                </button>
              </div>
            ))}

            <div className="cart-total-card">
              <span>Total</span>
              <strong>INR {total}</strong>
            </div>
          </>
        )}
      </div>

      <aside className="cart-summary">
        <p className="section-subtitle">Bill summary</p>
        <h2>Bill Details</h2>
        <div className="line"></div>

        <div className="bill-row">
          <span>Total items</span>
          <strong>{totalItems}</strong>
        </div>
        <div className="bill-row">
          <span>Total price</span>
          <strong>INR {total}</strong>
        </div>

        <button className="checkout-btn" onClick={handleCheckout}>
          Proceed to checkout
        </button>
      </aside>
      </div>
    </main>
  );
}

export default Cart;
