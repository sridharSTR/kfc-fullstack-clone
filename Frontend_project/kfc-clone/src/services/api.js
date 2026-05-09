import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const getTokens = () => ({
  access: localStorage.getItem("access"),
  refresh: localStorage.getItem("refresh"),
});

export const saveAuth = ({ tokens, user, activeRole = "customer" }) => {
  const isAdminSession = activeRole === "admin" && !!user.is_staff;

  localStorage.setItem("access", tokens.access);
  localStorage.setItem("refresh", tokens.refresh);
  localStorage.setItem("username", user.username);
  localStorage.setItem("email", user.email);
  localStorage.setItem("role", isAdminSession ? "admin" : "customer");
  localStorage.setItem("is_staff", String(isAdminSession));
  localStorage.setItem("is_superuser", String(isAdminSession && !!user.is_superuser));

  if (isAdminSession) {
    localStorage.setItem("admin_access", tokens.access);
    localStorage.setItem("admin_refresh", tokens.refresh);
    localStorage.setItem("admin_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("admin_access");
    localStorage.removeItem("admin_refresh");
    localStorage.removeItem("admin_user");
  }
};

const clearAuth = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("username");
  localStorage.removeItem("email");
  localStorage.removeItem("role");
  localStorage.removeItem("is_staff");
  localStorage.removeItem("is_superuser");
};

api.interceptors.request.use((config) => {
  const { access } = getTokens();

  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const { refresh } = getTokens();

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/api/auth/refresh/")
    ) {
      originalRequest._retry = true;

      try {
        if (!refresh) {
          throw new Error("No refresh token");
        }

        const res = await axios.post(`${API_BASE_URL}/api/auth/refresh/`, {
          refresh,
        });

        const newAccess = res.data.access;
        localStorage.setItem("access", newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        return api(originalRequest);
      } catch {
        clearAuth();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export const apiService = {
  getHealth: () => api.get("/"),

  getMenu: () => api.get("/api/foods/"),

  login: async (email, password, requestedRole = "customer") => {
    const res = await api.post("/api/auth/login/", {
      email,
      password,
      requested_role: requestedRole,
    });

    return res.data;
  },

  verifyLoginOtp: async (email, otp, requestedRole = "customer") => {
    const res = await api.post("/api/auth/admin/verify-otp/", {
      email,
      otp,
      requested_role: requestedRole,
    });

    const sessionUser =
      requestedRole === "admin"
        ? res.data.data.user
        : {
            ...res.data.data.user,
            role: "customer",
            is_staff: false,
            is_superuser: false,
          };

    saveAuth({
      tokens: res.data.data.tokens,
      user: sessionUser,
      activeRole: requestedRole,
    });

    res.data.data.user = sessionUser;

    return res.data;
  },

  verifyRegistrationOtp: async (email, otp) => {
    const res = await api.post("/api/auth/register/verify-otp/", {
      email,
      otp,
    });

    return res.data;
  },

  register: async (data) => {
    const res = await api.post("/api/auth/register/", data);
    return res.data;
  },

  getProfile: () => api.get("/api/auth/profile/"),
  requestAdminAccess: () => api.post("/api/auth/request-admin-access/"),
};

export default api;
