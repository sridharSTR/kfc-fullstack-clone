import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import AdminNavbar from "../components/AdminNavbar";
import {
  createAdminFood,
  deleteAdminFood,
  getAdminFoods,
  updateAdminFood,
} from "../api/admin";

const emptyFoodForm = {
  name: "",
  description: "",
  price: "",
  category: "burgers",
  image: null,
};

const categories = [
  { value: "boxmeals", label: "Box Meals" },
  { value: "varietybuckets", label: "Variety Buckets" },
  { value: "veg", label: "Veg" },
  { value: "burgers", label: "Burgers" },
];

const formatMoney = (value) => Number(value || 0).toFixed(2);
const imageUrl = (image) =>
  image && image.startsWith("http") ? image : image ? `http://127.0.0.1:8000${image}` : "";

const toFoodFormData = (foodForm) => {
  const formData = new FormData();
  formData.append("name", foodForm.name);
  formData.append("description", foodForm.description);
  formData.append("price", foodForm.price);
  formData.append("category", foodForm.category);

  if (foodForm.image) {
    formData.append("image", foodForm.image);
  }

  return formData;
};

function AdminFoods() {
  const [foods, setFoods] = useState([]);
  const [foodForm, setFoodForm] = useState(emptyFoodForm);
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingFood, setSavingFood] = useState(false);

  const loadFoods = async () => {
    const response = await getAdminFoods();
    setFoods(response.data || []);
  };

  useEffect(() => {
    let ignore = false;

    getAdminFoods()
      .then((response) => {
        if (!ignore) {
          setFoods(response.data || []);
        }
      })
      .catch((error) => {
        console.error("Admin foods load error:", error);
        toast.error("Unable to load food items");
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const updateFoodForm = (field, value) => {
    setFoodForm((current) => ({ ...current, [field]: value }));
  };

  const startEditFood = (food) => {
    setEditingFoodId(food.id);
    setFoodForm({
      name: food.name,
      description: food.description || "",
      price: food.price,
      category: food.category,
      image: null,
    });
  };

  const resetFoodForm = () => {
    setEditingFoodId(null);
    setFoodForm(emptyFoodForm);
  };

  const submitFood = async (event) => {
    event.preventDefault();
    setSavingFood(true);

    try {
      if (editingFoodId) {
        await updateAdminFood(editingFoodId, toFoodFormData(foodForm));
        toast.success("Food item updated");
      } else {
        await createAdminFood(toFoodFormData(foodForm));
        toast.success("Food item added");
      }

      resetFoodForm();
      await loadFoods();
    } catch (error) {
      toast.error(error.response?.data?.error || "Unable to save food item");
    } finally {
      setSavingFood(false);
    }
  };

  const removeFood = async (foodId) => {
    try {
      await deleteAdminFood(foodId);
      toast.success("Food item deleted");
      await loadFoods();
    } catch (error) {
      toast.error(error.response?.data?.error || "Unable to delete food item");
    }
  };

  if (loading) {
    return <div className="admin-shell">Loading food items...</div>;
  }

  return (
    <div className="admin-shell">
      <AdminNavbar />

      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <p className="section-subtitle">Admin</p>
            <h1>Foods</h1>
          </div>
        </div>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <h2>{editingFoodId ? "Edit Food Item" : "Add Food Item"}</h2>
            <span>Menu-style CRUD</span>
          </div>

          <form className="admin-food-form" onSubmit={submitFood}>
            <input
              placeholder="Food name"
              value={foodForm.name}
              onChange={(event) => updateFoodForm("name", event.target.value)}
              required
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Price"
              value={foodForm.price}
              onChange={(event) => updateFoodForm("price", event.target.value)}
              required
            />
            <select
              value={foodForm.category}
              onChange={(event) => updateFoodForm("category", event.target.value)}
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <input
              type="file"
              accept="image/*"
              required={!editingFoodId}
              onChange={(event) => updateFoodForm("image", event.target.files?.[0] || null)}
            />
            <textarea
              placeholder="Description"
              value={foodForm.description}
              onChange={(event) => updateFoodForm("description", event.target.value)}
            />
            <div className="admin-food-form-actions">
              <button disabled={savingFood} type="submit">
                {savingFood ? "Saving..." : editingFoodId ? "Update Food" : "Add Food"}
              </button>
              {editingFoodId && (
                <button type="button" onClick={resetFoodForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <h2>Menu Items</h2>
            <span>{foods.length} foods</span>
          </div>

          <div className="food-grid admin-menu-grid">
            {foods.map((food) => (
              <article className="food-card" key={food.id}>
                <div className="food-card-media">
                  {imageUrl(food.image) && (
                    <img className="food-image" src={imageUrl(food.image)} alt={food.name} />
                  )}
                </div>
                <div className="food-card-body">
                  <span className="food-tag">{food.category}</span>
                  <h3>{food.name}</h3>
                  <p className="food-description">{food.description}</p>
                  <p className="food-price">INR {formatMoney(food.price)}</p>
                  <div className="admin-row-actions">
                    <button onClick={() => startEditFood(food)}>Edit</button>
                    <button className="danger-btn" onClick={() => removeFood(food.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminFoods;
