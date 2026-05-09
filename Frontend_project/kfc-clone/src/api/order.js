import axios from "axios";

const API = "http://127.0.0.1:8000/api/orders";

const getToken = () => localStorage.getItem("access");
const getAdminToken = () => localStorage.getItem("admin_access");

export const createOrder = (details) => {
  const token = getToken();

  return axios.post(
    `${API}/checkout/`,
    details,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );
};

export const getOrderHistory = () => {
  const token = getToken();

  return axios.get(`${API}/history/`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

export const getAdminOrders = () => {
  const token = getAdminToken();

  return axios.get(`${API}/admin/`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

export const updateOrderStatus = (orderId, status) => {
  const token = getAdminToken();

  return axios.patch(
    `${API}/admin/${orderId}/status/`,
    { status },
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );
};
