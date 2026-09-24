import { useNavigate } from "react-router-dom";
import { logout } from "../services/authService";

function Profile() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div>
      <div className="page-title">
        <div>
          <h1>Profile</h1>
          <p>User account information</p>
        </div>
      </div>

      <section className="panel profile-card">
        <div className="avatar">
          {user.name?.charAt(0) || "A"}
        </div>

        <h2>{user.name || "Admin User"}</h2>

        <p>{user.email || "admin@hospital.com"}</p>

        <span className="role">
          {user.role || "Admin"}
        </span>

        <button
          className="logout-large"
          onClick={handleLogout}
        >
          Logout
        </button>
      </section>
    </div>
  );
}

export default Profile;