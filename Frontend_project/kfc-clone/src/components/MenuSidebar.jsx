function MenuSidebar({ activeSection }) {
  const menuItems = [
    { id: "boxmeals", label: "Box Meals" },
    { id: "varietybuckets", label: "Variety Buckets" },
    { id: "veg", label: "Veg" },
    { id: "burgers", label: "Burgers" },
  ];

  return (
    <aside className="menu-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-chip">Menu</span>
        <h2>Browse categories</h2>
      </div>

      <nav>
        <ul>
          {menuItems.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={activeSection === item.id ? "active-menu" : ""}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default MenuSidebar;