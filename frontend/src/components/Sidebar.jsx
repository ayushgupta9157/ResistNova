import { NavLink, useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("logged");
    navigate("/login");
  };

  const menuItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: "📊",
    },
    {
      path: "/reception",
      label: "Reception",
      icon: "👤",
    },
    {
      path: "/patients",
      label: "Patients",
      icon: "🧑",
    },
    {
      path: "/location-qr",
      label: "Room QR Codes",
      icon: "🏥",
    },
    {
      path: "/staff",
      label: "Staff",
      icon: "👨‍⚕️",
    },
    {
      path: "/movements",
      label: "Movement Logs",
      icon: "📋",
    },
    {
      path: "/contacts",
      label: "Contacts",
      icon: "🔗",
    },
    {
      path: "/graph",
      label: "Contact Graph",
      icon: "🕸️",
    },
    {
      path: "/profile",
      label: "Profile",
      icon: "👤",
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>ResistNova</h2>
        <span>Hospital Surveillance</span>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            <span className="sidebar-icon">
              {item.icon}
            </span>

            <span className="sidebar-label">
              {item.label}
            </span>
          </NavLink>
        ))}

        <button
          type="button"
          className="sidebar-link logout-btn"
          onClick={logout}
        >
          <span className="sidebar-icon">🚪</span>

          <span className="sidebar-label">
            Logout
          </span>
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;