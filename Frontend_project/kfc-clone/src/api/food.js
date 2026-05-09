const API = "http://127.0.0.1:8000/api/foods";

// =======================
// 🔐 TOKEN
// =======================
const getToken = () => {
  return localStorage.getItem("access");
};

// =======================
// 📦 HEADERS (SAFE + CONSISTENT)
// =======================
const getHeaders = () => {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// =======================
// ⚙️ RESPONSE HANDLER
// =======================
const handleResponse = async (res) => {
  let data = {};

  try {
    data = await res.json();
  } catch {
    console.warn("Empty response body");
  }

  if (!res.ok) {
    if (res.status === 401) {
      console.error("❌ Unauthorized - Token expired or missing");
    }

    throw new Error(data.detail || data.error || "Failed to fetch foods");
  }

  return data;
};

// =======================
// 🍔 GET ALL FOODS
// =======================
export const getFoods = async () => {
  const res = await fetch(`${API}/`, {
    method: "GET",
    headers: getHeaders(),
  });

  return handleResponse(res);
};

// =======================
// 🍕 GET FOOD BY ID
// =======================
export const getFoodById = async (id) => {
  const res = await fetch(`${API}/${id}/`, {
    method: "GET",
    headers: getHeaders(),
  });

  return handleResponse(res);
};
