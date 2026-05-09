import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function Navbar({ cartCount }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
  };

  return (
    <header className="navbar">
      <Link to="/" className="nav-brand" onClick={closeMenu}>
        <div className="brand-mark">KFC</div>
      </Link>

      <button
        type="button"
        className="nav-menu-toggle"
        aria-label="Toggle navigation menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>

      <nav className={`nav-links ${open ? "is-open" : ""}`}>
        <Link to="/" onClick={closeMenu}>Home</Link>
        <Link to="/menu" onClick={closeMenu}>Menu</Link>

        <Link to="/cart" className="cart-link" onClick={closeMenu}>
          Cart <span className="cart-count">{cartCount}</span>
        </Link>

        {user ? (
          <>
            <span className="nav-user">Hi, {user.username}</span>
            <Link to="/profile" onClick={closeMenu}>Profile</Link>
            <Link to="/orders" onClick={closeMenu}>Orders</Link>
            {user.role === "admin" && user.is_staff && (
              <Link to="/admin/dashboard" onClick={closeMenu}>Admin Panel</Link>
            )}
            <button onClick={handleLogout} className="logout-nav-btn">
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" onClick={closeMenu}>Login</Link>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
