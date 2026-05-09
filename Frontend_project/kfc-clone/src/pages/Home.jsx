import { useNavigate } from "react-router-dom";

import Hero from "../components/Hero";
import CategoryScroll from "../components/CategoryScroll";

import burgers from "../assets/burgers.jpg";
import buckets from "../assets/bucktes.jpg";
import snacks from "../assets/snaks.jpg";
import rice from "../assets/Rice Bowlz.jpg";
import desserts from "../assets/Desserts.jpg";

function Home() {
  const navigate = useNavigate();

  return (
    <main className="home-page">
      <Hero />

      <section className="home-signature-section">
        <div className="home-signature-head">
          <p className="section-subtitle">Signature cravings</p>
          <h2>Pick your mood. We will bring the crunch.</h2>
        </div>

        <div className="home-signature-grid">
          <article className="home-signature-card">
            <img src={buckets} alt="KFC bucket meal" />
            <div>
              <span className="food-tag">Shareable</span>
              <h3>Bucket Nights</h3>
              <p>Big portions, classic crunch, and sides made for groups.</p>
            </div>
          </article>
          <article className="home-signature-card">
            <img src={snacks} alt="KFC snacks" />
            <div>
              <span className="food-tag">Crispy</span>
              <h3>Snack Breaks</h3>
              <p>Fries, wings, and quick bites for short hunger windows.</p>
            </div>
          </article>
          <article className="home-signature-card">
            <img src={rice} alt="KFC rice bowl" />
            <div>
              <span className="food-tag">Filling</span>
              <h3>Rice Bowlz</h3>
              <p>Warm rice bowls with bold toppings and saucy flavor.</p>
            </div>
          </article>
          <article className="home-signature-card">
            <img src={desserts} alt="KFC dessert" />
            <div>
              <span className="food-tag">Sweet finish</span>
              <h3>Dessert Treats</h3>
              <p>End your order with a small sweet bite after the spice.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="home-meal-builder">
        <div className="home-meal-copy">
          <p className="section-subtitle">Build your box</p>
          <h2>Make it a full meal with mains, sides, and something sweet.</h2>
          <p>
            Start with crispy chicken or a burger, add fries or rice, then finish
            with dessert. The menu is organized so every order feels quick,
            clear, and complete.
          </p>
          <button className="order-btn" onClick={() => navigate("/menu")}>
            Build My Meal
          </button>
        </div>

        <div className="home-meal-stack">
          <article>
            <img src={burgers} alt="KFC burger meal" />
            <div>
              <span>Main</span>
              <strong>Burgers and crispy chicken</strong>
            </div>
          </article>
          <article>
            <img src={rice} alt="KFC rice bowl side" />
            <div>
              <span>Side</span>
              <strong>Rice bowls and fries</strong>
            </div>
          </article>
          <article>
            <img src={desserts} alt="KFC dessert add on" />
            <div>
              <span>Finish</span>
              <strong>Desserts and cool treats</strong>
            </div>
          </article>
        </div>
      </section>

      <CategoryScroll />

      <section className="home-combo-section">
        <div className="home-combo-card">
          <img src={buckets} alt="KFC combo bucket" />
          <div>
            <p className="section-subtitle">Weekend combo</p>
            <h2>Bring home a bucket made for sharing.</h2>
            <p>
              Perfect for family dinners, movie nights, celebrations, or quick
              group orders. Add multiple items to cart and checkout in one flow.
            </p>
            <button className="order-btn" onClick={() => navigate("/menu")}>
              View Combos
            </button>
          </div>
        </div>
      </section>

      <section className="home-video-section">
        <div className="home-video-head">
          <p className="section-subtitle">Limited time taste</p>
          <h2>KFC Double Down Burger</h2>
        </div>
        <div className="home-video-frame">
          <iframe
            width="951"
            height="535"
            src="https://www.youtube.com/embed/u7itcDK0exM?mute=1&rel=0"
            title="KFC | Double Down Burger | For Limited Time Only"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </section>

      <section className="home-quality-section">
        <div className="home-quality-copy">
          <p className="section-subtitle">Built for real orders</p>
          <h2>A smoother KFC-style experience from first tap to final bite.</h2>
          <p>
            Login securely, manage your cart, place orders, and revisit order history
            from a clean interface that matches the menu and homepage card style.
          </p>
          <div className="home-quality-points">
            <span>Modern menu cards</span>
            <span>Fast cart controls</span>
            <span>Receipt-ready checkout</span>
          </div>
        </div>
        <div className="home-quality-image">
          <img src={buckets} alt="KFC crispy bucket" />
        </div>
      </section>

      <section className="home-cta-band">
        <div>
          <p className="section-subtitle">Ready when you are</p>
          <h2>Start your KFC order now.</h2>
          <p>Choose a category, fill your cart, and checkout in minutes.</p>
        </div>
        <button className="order-btn" onClick={() => navigate("/menu")}>
          Explore Menu
        </button>
      </section>
    </main>
  );
}

export default Home;
