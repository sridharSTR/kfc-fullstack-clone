import { toast } from "react-toastify";
import { addToCart as addToCartAPI } from "../api/cart";

const formatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function FoodCard({ food, setCart }) {
  const addToCart = async () => {
    let isExisting = false;
    let cartItemId = null;

    try {
      const result = await addToCartAPI(food.id, 1);
      cartItemId = result?.item?.id ?? null;
    } catch (error) {
      console.error(error);
      toast.error("Login required to sync cart");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === food.id);

      if (existing) {
        isExisting = true;

        return prev.map((item) => {
          if (item.id !== food.id) {
            return item;
          }

          return {
            ...item,
            cartItemId: cartItemId ?? item.cartItemId,
            qty: item.qty + 1,
          };
        });
      }

      return [...prev, { ...food, cartItemId, qty: 1 }];
    });

    if (isExisting) {
      toast.success(`${food.name} quantity increased`);
    } else {
      toast.success(`${food.name} added to cart`);
    }
  };

  return (
    <article className="food-card">
      <div className="food-card-media">
        <img
          src={food.image}
          alt={food.name}
          className="food-image"
          loading="lazy"
        />
      </div>

      <div className="food-card-body">
        {food.tag && <span className="food-tag">{food.tag}</span>}
        <h3>{food.name}</h3>
        <p className="food-description">{food.description}</p>
        <p className="food-price">{formatter.format(food.price)}</p>

        <button
          className="add-to-cart-btn"
          onClick={addToCart}
          aria-label={`Add ${food.name} to cart`}
        >
          Add to Cart
        </button>
      </div>
    </article>
  );
}

export default FoodCard;
