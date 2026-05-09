import { useState } from "react";
import { AuthContext } from "./AuthContext.js";
import { apiService } from "../services/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const username = localStorage.getItem("username");
    const email = localStorage.getItem("email");
    const role = localStorage.getItem("role");
    const isStaff = localStorage.getItem("is_staff") === "true";
    const isSuperuser = localStorage.getItem("is_superuser") === "true";
    const access = localStorage.getItem("access");

    return username && access
      ? { username, email, role, is_staff: isStaff, is_superuser: isSuperuser }
      : null;
  });
  const loading = false;

  const login = async (email, password, requestedRole = "customer") => {
    try {
      const data = await apiService.login(email, password, requestedRole);

      if (data.status === "otp_required") {
        return { success: true, otpRequired: true, data };
      }

      return {
        success: false,
        error: data.error || "Login failed",
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Server error",
      };
    }
  };

  const verifyLoginOtp = async (email, otp, requestedRole = "customer") => {
    try {
      const data = await apiService.verifyLoginOtp(email, otp, requestedRole);

      if (data.status === "success") {
        setUser(data.data.user);
        return { success: true, user: data.data.user };
      }

      return {
        success: false,
        error: data.error || "OTP verification failed",
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Server error",
      };
    }
  };

  const verifyRegistrationOtp = async (email, otp) => {
    try {
      const data = await apiService.verifyRegistrationOtp(email, otp);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Server error",
      };
    }
  };

  const register = async (username, email, password, password2, requestedRole = "customer") => {
    try {
      const data = await apiService.register({
        username,
        email,
        password,
        password2,
        requested_role: requestedRole,
      });

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Server error",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("is_staff");
    localStorage.removeItem("is_superuser");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("admin_access");
    localStorage.removeItem("admin_refresh");
    localStorage.removeItem("admin_user");
    localStorage.removeItem("kfc-cart");

    setUser(null);
    window.dispatchEvent(new Event("auth:logout"));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        verifyLoginOtp,
        verifyRegistrationOtp,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
