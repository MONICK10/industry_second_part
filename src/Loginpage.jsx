import React, { useState } from "react";
import FactoryLayout from "./FactoryLayout";
import "./App.css";

export default function LoginPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: "", password: "" });

  const handleLogin = (e) => {
    e.preventDefault();
    if (user.name && user.password) setLoggedIn(true);
  };

  return (
    <div className="login-wrapper">
      {!loggedIn ? (
        <div className="login-box">
          <h2>Smart Factory Portal</h2>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Username"
              onChange={(e) => setUser({ ...user, name: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              onChange={(e) => setUser({ ...user, password: e.target.value })}
            />
            <button type="submit">Login</button>
          </form>
        </div>
      ) : (
        <FactoryLayout />
      )}
    </div>
  );
}
