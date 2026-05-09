import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const getAdminAccess = () => localStorage.getItem("admin_access");

adminApi.interceptors.request.use((config) => {
  const token = getAdminAccess();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const requestAdminOtp = (email, password) =>
  adminApi.post("/api/auth/admin/login/", { email, password });

export const verifyAdminOtp = (email, otp) =>
  adminApi.post("/api/auth/admin/verify-otp/", {
    email,
    otp,
    requested_role: "admin",
  });

export const getAdminDashboard = () =>
  adminApi.get("/api/auth/admin/dashboard/");

export const getAdminUsers = () =>
  adminApi.get("/api/auth/admin/users/");

export const approveAdminRequest = (userId) =>
  adminApi.post(`/api/auth/admin/requests/${userId}/approve/`);

export const rejectAdminRequest = (userId) =>
  adminApi.post(`/api/auth/admin/requests/${userId}/reject/`);

export const revokeAdminAccess = (userId) =>
  adminApi.post(`/api/auth/admin/users/${userId}/revoke/`);

export const getAdminFoods = () =>
  adminApi.get("/api/foods/admin/");

export const createAdminFood = (formData) =>
  adminApi.post("/api/foods/admin/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateAdminFood = (foodId, formData) =>
  adminApi.patch(`/api/foods/admin/${foodId}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteAdminFood = (foodId) =>
  adminApi.delete(`/api/foods/admin/${foodId}/`);

export const saveAdminSession = ({ tokens, user }) => {
  localStorage.setItem("admin_access", tokens.access);
  localStorage.setItem("admin_refresh", tokens.refresh);
  localStorage.setItem("admin_user", JSON.stringify(user));
};

export const clearAdminSession = () => {
  localStorage.removeItem("admin_access");
  localStorage.removeItem("admin_refresh");
  localStorage.removeItem("admin_user");
  localStorage.removeItem("pending_admin_email");
};

export const getAdminSession = () => {
  const token = localStorage.getItem("admin_access");
  const storedUser = localStorage.getItem("admin_user");

  if (!token || !storedUser) {
    return null;
  }

  try {
    const user = JSON.parse(storedUser);
    return user?.is_staff ? { token, user } : null;
  } catch {
    clearAdminSession();
    return null;
  }
};

export default adminApi;
