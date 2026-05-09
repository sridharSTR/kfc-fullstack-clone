import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Register from "./pages/Register";
import Login from "./pages/Login";
import UserProfile from "./pages/UserProfile";
import OrderHistory from "./pages/OrderHistory";
import AdminOrders from "./pages/AdminOrders";
import AdminDashboard from "./pages/AdminDashboard";
import AdminFoods from "./pages/AdminFoods";
import AdminLogin from "./pages/AdminLogin";
import AdminPayments from "./pages/AdminPayments";
import AdminUsers from "./pages/AdminUsers";
import VerifyOTP from "./pages/VerifyOTP";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import { getCart } from "./api/cart";
import { useAuth } from "./hooks/useAuth";

const API_BASE_URL = "http://127.0.0.1:8000";

const normalizeImageUrl = (image) => {
  if (!image) {
    return "";
  }

  return image.startsWith("http") ? image : `${API_BASE_URL}${image}`;
};

const normalizeCartItem = (item) => ({
  id: item.food,
  cartItemId: item.id,
  name: item.food_name,
  price: Number(item.food_price),
  image: normalizeImageUrl(item.food_image),
  qty: item.quantity,
});

function App() {
  const location = useLocation();
  const { user } = useAuth();
  const isCartRoute = location.pathname === "/cart";
  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem("kfc-cart");
      return stored ? JSON.parse(stored) : [];
    } catch {
      localStorage.removeItem("kfc-cart");
      return [];
    }
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    let ignore = false;

    getCart()
      .then((data) => {
        if (!ignore) {
          setCart((data.items || []).map(normalizeCartItem));
        }
      })
      .catch((error) => {
        console.error("Cart load error:", error);
      });

    return () => {
      ignore = true;
    };
  }, [user]);

  useEffect(() => {
    const clearCart = () => {
      setCart([]);
    };

    window.addEventListener("auth:logout", clearCart);

    return () => {
      window.removeEventListener("auth:logout", clearCart);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("kfc-cart", JSON.stringify(cart));
    } catch {
      console.log("Cart save error");
    }
  }, [cart]);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty, 0),
    [cart]
  );

  return (
    <div className={`app-layout ${isCartRoute ? "cart-layout" : ""}`}>
      <Navbar cartCount={cartCount} />

      <div className="page-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu setCart={setCart} />} />
          <Route path="/cart" element={<Cart cart={cart} setCart={setCart} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/verify-otp" element={<VerifyOTP />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/verify-otp" element={<VerifyOTP />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout cart={cart} setCart={setCart} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrderHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedAdminRoute>
                <AdminUsers />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/foods"
            element={
              <ProtectedAdminRoute>
                <AdminFoods />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedAdminRoute>
                <AdminOrders />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedAdminRoute>
                <AdminPayments />
              </ProtectedAdminRoute>
            }
          />
        </Routes>
      </div>

      <Footer />

      <ToastContainer
        position="top-right"
        autoClose={1500}
        newestOnTop
        theme="light"
      />
    </div>
  );
}

export default App;
