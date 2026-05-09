import { useNavigate } from "react-router-dom";
import heroVideo from "../assets/chickennuggets.mp4";

function Hero() {
  const navigate = useNavigate();

  return (
    <section className="hero-section">
      <div className="hero">
        <video autoPlay muted loop playsInline className="hero-video">
          <source src={heroVideo} type="video/mp4" />
        </video>

        <div className="hero-copy">
          <span className="hero-chip">Limited time only</span>
          <h1>Bold chicken, crisp bites, fast delivery.</h1>
          <p>
            Discover a premium KFC-inspired experience with sizzling buckets,
            hot wings, and flavour-forward combos built for every craving.
          </p>

          <div className="hero-actions">
            <button className="order-btn" onClick={() => navigate("/menu")}>Start Your Order</button>
            <button className="secondary-btn" onClick={() => navigate("/menu")}>View the Menu</button>
          </div>

          <div className="hero-stats">
            <div>
              <strong>100K+</strong>
              <span>Happy orders</span>
            </div>
            <div>
              <strong>15 min</strong>
              <span>Average delivery</span>
            </div>
            <div>
              <strong>4.9</strong>
              <span>Rating</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export default Hero;
