import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useAuth";
import "../styles/auth.css";

function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyLoginOtp, verifyRegistrationOtp } = useAuth();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const isRegistration = location.pathname.includes("/register/");
  const email =
    (isRegistration ? localStorage.getItem("pending_register_email") : "") ||
    localStorage.getItem("pending_login_email") ||
    localStorage.getItem("pending_admin_email") ||
    "";
  const requestedRole =
    (isRegistration ? localStorage.getItem("pending_register_role") : "") ||
    localStorage.getItem("pending_login_role") ||
    (localStorage.getItem("pending_admin_email") ? "admin" : "customer");

  const submitOtp = async (event) => {
    event.preventDefault();

    if (!email) {
      toast.error(isRegistration ? "Start registration again" : "Start login again");
      navigate(isRegistration ? "/register" : "/login");
      return;
    }

    if (otp.length !== 6) {
      toast.error("Enter the 6 digit OTP");
      return;
    }

    setLoading(true);

    try {
      if (isRegistration) {
        const result = await verifyRegistrationOtp(email, otp);

        if (!result.success) {
          toast.error(result.error || "Invalid OTP");
          return;
        }

        localStorage.removeItem("pending_register_email");
        localStorage.removeItem("pending_register_role");
        toast.success(
          requestedRole === "admin"
            ? "Email verified. Admin access is pending approval."
            : "Email verified. You can login now."
        );
        navigate("/login", { replace: true });
        return;
      }

      const result = await verifyLoginOtp(email, otp, requestedRole);

      if (!result.success) {
        toast.error(result.error || "Invalid OTP");
        return;
      }

      localStorage.removeItem("pending_login_email");
      localStorage.removeItem("pending_login_role");
      localStorage.removeItem("pending_admin_email");
      toast.success("Login verified");

      if (result.user?.is_staff && requestedRole === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch {
      toast.error("Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-shell otp-shell">
        <div className="auth-panel">
          <span className="hero-chip">Email verification</span>
          <h1>{isRegistration ? "Verify your registration" : "Enter your 6 digit OTP"}</h1>
          <p>We sent a short-lived code to {email || "your email"}.</p>
        </div>

        <form className="auth-card otp-card" onSubmit={submitOtp}>
          <p className="section-subtitle">
            {isRegistration ? "Registration OTP" : "Secure sign in"}
          </p>
          <h2>Verify OTP</h2>
          <input
            inputMode="numeric"
            maxLength="6"
            placeholder="000000"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
          />
          <button className="submit-btn" disabled={loading} type="submit">
            {loading ? "Verifying..." : "Verify and Continue"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default VerifyOTP;
