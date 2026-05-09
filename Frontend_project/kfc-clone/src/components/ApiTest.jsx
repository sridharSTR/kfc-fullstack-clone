import { useState, useEffect } from "react";
import { apiService } from "../services/api";

export default function ApiTest() {
  const [data, setData] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // =========================
  // 🔍 TEST HEALTH
  // =========================
  const testHealth = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getHealth();

      // ✅ SAFE ACCESS
      setData(response?.data || response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 🍔 FETCH MENU
  // =========================
  const fetchMenu = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getMenu();

      // ✅ HANDLE ALL CASES
      const menuData =
        response?.data?.data ||   // if nested
        response?.data ||         // axios style
        response ||               // fetch style
        [];

      setMenu(menuData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 🚀 AUTO TEST
  // =========================
  useEffect(() => {
    testHealth();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>Django-React API Test</h2>

      <div style={{ marginBottom: "20px" }}>
        <button onClick={testHealth} style={{ marginRight: "10px" }}>
          Test Health
        </button>

        <button onClick={fetchMenu}>
          Fetch Menu
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {error && (
        <p style={{ color: "red" }}>
          Error: {error}
        </p>
      )}

      {/* ========================= */}
      {/* HEALTH RESPONSE */}
      {/* ========================= */}
      {data && (
        <div style={{ marginBottom: "20px", padding: "10px", background: "#eee" }}>
          <h3>Health Check:</h3>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}

      {/* ========================= */}
      {/* MENU */}
      {/* ========================= */}
      {menu.length > 0 && (
        <div style={{ padding: "10px", background: "#eee" }}>
          <h3>Menu Items:</h3>

          <ul>
            {menu.map((item) => (
              <li key={item.id}>
                {item.name} - ₹{item.price}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}