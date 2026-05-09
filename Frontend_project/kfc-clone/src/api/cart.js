import axios from "axios";

const API = "http://127.0.0.1:8000/api/cart";

const getToken = () => localStorage.getItem("access");

const getAuthHeaders = () => {
  const token = getToken();

  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const addToCart = async (productId, quantity = 1) => {
  const response = await axios.post(
    `${API}/add/`,
    {
      product_id: productId,
      quantity,
    },
    {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

export const getCart = async () => {
  const response = await axios.get(`${API}/`, {
    headers: getAuthHeaders(),
  });

  return response.data;
};

export const updateCartItem = async (itemId, quantity) => {
  const response = await axios.patch(
    `${API}/update/${itemId}/`,
    {
      quantity,
    },
    {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

export const removeFromCart = async (itemId) => {
  const response = await axios.delete(`${API}/remove/${itemId}/`, {
    headers: getAuthHeaders(),
  });

  return response.data;
};
