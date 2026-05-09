import { useNavigate } from "react-router-dom";
import buckets from "../assets/bucktes.jpg";
import burgers from "../assets/burgers.jpg";
import snacks from "../assets/snaks.jpg";
import rice from "../assets/Rice Bowlz.jpg";
import desserts from "../assets/Desserts.jpg";

function CategoryScroll() {
  const navigate = useNavigate();
  const categories = [
    { name: "Buckets", image: buckets },
    { name: "Burgers", image: burgers },
    { name: "Snacks", image: snacks },
    { name: "Rice Bowls", image: rice },
    { name: "Desserts", image: desserts },
  ];
  const duplicatedCategories = [...categories, ...categories];

  return (
    <section className="category-slider">
      <div className="category-slider-head">
        <p className="section-subtitle">Explore favorites</p>
        <h2>Slide through KFC cravings</h2>
      </div>

      <div className="category-viewport">
        <div className="category-track">
          {duplicatedCategories.map((category, index) => (
            <div
              className="category-card"
              key={index}
              onClick={() => navigate("/menu")}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => event.key === "Enter" && navigate("/menu")}
            >
              <div className="category-card-image">
                <img src={category.image} alt={category.name} />
              </div>
              <span>Order now</span>
              <p>{category.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CategoryScroll;
