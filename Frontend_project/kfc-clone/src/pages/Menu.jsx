import { useEffect, useMemo, useState } from "react";
import MenuSidebar from "../components/MenuSidebar";
import FoodCard from "../components/FoodCard";
import FoodSkeleton from "../components/FoodSkeleton";
import { getFoods } from "../api/food";

const API_BASE_URL = "http://127.0.0.1:8000";

const categories = [
  { id: "boxmeals", label: "Box Meals" },
  { id: "varietybuckets", label: "Variety Buckets" },
  { id: "veg", label: "Veg" },
  { id: "burgers", label: "Burgers" },
];

const normalizeImageUrl = (image) => {
  if (!image) {
    return "";
  }

  return image.startsWith("http") ? image : `${API_BASE_URL}${image}`;
};

function Menu({ setCart }) {
  const [activeSection, setActiveSection] = useState("boxmeals");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [foodData, setFoodData] = useState([]);
  const [error, setError] = useState("");

  const searchTerm = search.trim().toLowerCase();

  useEffect(() => {
    let ignore = false;

    getFoods()
      .then((data) => {
        if (!ignore) {
          setFoodData(Array.isArray(data) ? data : []);
        }
      })
      .catch((apiError) => {
        console.error("API Error:", apiError);

        if (!ignore) {
          setError("Unable to load menu. Please check the backend server.");
        }
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

  const sections = useMemo(() => {
    return categories.map((category) => {
      const sectionItems = foodData.filter(
        (item) => item.category === category.id
      );

      const items = sectionItems.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm) ||
          (item.description || "").toLowerCase().includes(searchTerm)
      );

      return {
        ...category,
        items,
        total: sectionItems.length,
      };
    });
  }, [searchTerm, foodData]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.6 }
    );

    const sectionsDom = document.querySelectorAll(".menu-content section");
    sectionsDom.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
    };
  }, [sections]);

  return (
    <div className="menu-page">
      <MenuSidebar activeSection={activeSection} />

      <div className="menu-content">
        <div className="menu-header">
          <div>
            <p className="section-subtitle">Explore the menu</p>
            <h2>Crave-worthy meals</h2>
          </div>

          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Search for burgers, buckets or rice..."
              className="search-box"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <span className="search-hint">
              Try "Zinger", "Family Bucket", or "Veg"
            </span>
          </div>
        </div>

        {error && <div className="empty-state">{error}</div>}

        {sections.map((section) => (
          <section id={section.id} key={section.id}>
            <div className="section-title-row">
              <div>
                <h2>{section.label}</h2>
                <p className="section-note">{section.total} items available</p>
              </div>
              <span>{section.items.length} visible</span>
            </div>

            <div className="food-grid">
              {loading ? (
                Array(6)
                  .fill()
                  .map((_, index) => <FoodSkeleton key={index} />)
              ) : section.items.length > 0 ? (
                section.items.map((item) => (
                  <FoodCard
                    key={item.id}
                    food={{
                      ...item,
                      image: normalizeImageUrl(item.image),
                    }}
                    setCart={setCart}
                  />
                ))
              ) : (
                <div className="empty-state">
                  No matches found. Try a different keyword.
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default Menu;
