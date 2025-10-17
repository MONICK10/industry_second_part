// src/App.js
import React, { useState } from "react";
import LoginPage from "./Loginpage";
import FactoryLayout from "./FactoryLayout";
import HRD from "./HRD";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState("virtual"); // "virtual" or "hrd"

  const handleLogin = () => setIsLoggedIn(true);

  return (
    <div className="App">
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <>
          {/* Show the selected view */}
          {currentView === "virtual" && <FactoryLayout onSwitchView={setCurrentView} />}
          {currentView === "hrd" && <HRD />}
        </>
      )}
    </div>
  );
}

export default App;
