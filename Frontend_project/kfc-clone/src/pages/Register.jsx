import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import "../styles/auth.css";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [requestedRole, setRequestedRole] = useState("customer");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");

    if (password !== password2) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const result = await register(username, email, password, password2, requestedRole);

      if (result.success) {
        localStorage.setItem("pending_register_email", email);
        localStorage.setItem("pending_register_role", requestedRole);
        navigate("/register/verify-otp");
      } else {
        setError(result.error || "Register failed");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-shell register-shell">
        <div className="auth-panel">
          <span className="hero-chip">Join the table</span>
          <h1>Create your KFC ordering account</h1>
          <p>
            Choose user access for ordering, or request admin access for superuser review.
          </p>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <p className="section-subtitle">New account</p>
          <h2>Register</h2>

          {error && <div className="error-message">{error}</div>}
          {notice && <div className="success-message">{notice}</div>}

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
            <span>Username</span>
            <input
              placeholder="Letters, numbers, @ . + - _ only"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              pattern="[A-Za-z0-9@.+\-_]+"
              title="Use letters, numbers, and @ . + - _ only. Spaces are not allowed."
              required
            />
          </label>

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
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <label className="form-group">
            <span>Confirm Password</span>
            <input
              type="password"
              placeholder="Repeat your password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
            />
          </label>

          <button className="submit-btn" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </form>
      </section>
    </main>
  );
}
