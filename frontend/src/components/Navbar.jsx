import { useNavigate } from "react-router-dom";
import { logout } from "../services/authService";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div>
        <h3>Hospital Infection Control</h3>
        <p>ResistNova Decision Support System</p>
      </div>

      <div className="nav-right">
        <span className="status-dot"></span>
        <span>System Online</span>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;