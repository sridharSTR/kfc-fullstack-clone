import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import "../styles/auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requestedRole, setRequestedRole] = useState("customer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password, requestedRole);

      if (result.success && result.otpRequired) {
        localStorage.setItem("pending_login_email", email);
        localStorage.setItem("pending_login_role", requestedRole);
        navigate("/verify-otp");
      } else {
        setError(result.error || "Login failed");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <div className="auth-panel">
          <span className="hero-chip">Welcome back</span>
          <h1>Sign in to your KFC account</h1>
          <p>
            Secure OTP verification keeps ordering and admin access protected.
          </p>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <p className="section-subtitle">Account access</p>
          <h2>Login</h2>

          {error && <div className="error-message">{error}</div>}

          <div className="role-block" aria-label="Role selection">
            <span>Role Selection</span>
            <div className="role-options">
              <button
                type="button"
                className={requestedRole === "customer" ? "active" : ""}
                onClick={() => setRequestedRole("customer")}
              >
                User
              </button>
              <button
                type="button"
                className={requestedRole === "admin" ? "active" : ""}
                onClick={() => setRequestedRole("admin")}
              >
                Admin
              </button>
            </div>
          </div>

          <label className="form-group">
            <span>Email</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="form-group">
            <span>Password</span>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button className="submit-btn" disabled={loading}>
            {loading ? "Sending OTP..." : "Continue"}
          </button>

          <div className="auth-footer">
            Don't have an account? <Link to="/register">Register</Link>
          </div>
        </form>
      </section>
    </main>
  );
}
