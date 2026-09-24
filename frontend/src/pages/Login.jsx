import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    const validEmail = "admin@resistnova.com";
    const validPassword = "admin123";

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    if (email !== validEmail || password !== validPassword) {
      setError("Invalid email or password");
      return;
    }

    localStorage.setItem("logged", "true");
    navigate("/dashboard");
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* BRAND */}
        <div className="brand">
          <div className="big-logo">R</div>

          <h1>ResistNova</h1>

          <p>Hospital Infection Control System</p>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin}>
          <label htmlFor="email">Email</label>

          <input
            id="email"
            type="email"
            placeholder="admin@resistnova.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />

          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <button
            className="login-btn"
            type="submit"
          >
            Login
          </button>
        </form>

        {/* FOOTER */}
        <small>
          Secure access for authorized hospital staff
        </small>
      </div>
    </div>
  );
}

export default Login;