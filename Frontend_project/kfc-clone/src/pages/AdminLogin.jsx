import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { requestAdminOtp } from "../api/admin";

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submitLogin = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      toast.error("Enter admin email and password");
      return;
    }

    setLoading(true);

    try {
      await requestAdminOtp(email, password);
      localStorage.setItem("pending_admin_email", email);
      toast.success("OTP sent to admin email");
      navigate("/admin/verify-otp");
    } catch (error) {
      toast.error(error.response?.data?.error || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-auth-page">
      <form className="admin-auth-card" onSubmit={submitLogin}>
        <span className="admin-auth-mark">KFC</span>
        <p className="section-subtitle">Secure admin access</p>
        <h1>Admin Login</h1>
        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button disabled={loading} type="submit">
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>
      </form>
    </main>
  );
}

export default AdminLogin;
