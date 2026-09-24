export const login = (email, password) => {
  if (!email || !password) {
    return false;
  }

  localStorage.setItem("logged", "true");

  localStorage.setItem(
    "user",
    JSON.stringify({
      name: "Admin User",
      email: email,
      role: "Admin"
    })
  );

  return true;
};

export const logout = () => {
  localStorage.removeItem("logged");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};