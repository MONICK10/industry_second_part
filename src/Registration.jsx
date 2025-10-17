// src/Registration.js

import React, { useState } from "react";
import "./FactoryLayout.css"; // We can reuse the same CSS

const availableSkills = ["Raw Materials","Welding", "Assembly", "Painting", "Quality", "Packaging","Exporting"];

export default function RegistrationModal({ onRegister, onClose }) {
  const [name, setName] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [error, setError] = useState("");

  const handleSkillChange = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Worker name cannot be empty.");
      return;
    }
    if (selectedSkills.length === 0) {
      setError("Please select at least one skill.");
      return;
    }
    onRegister(name, selectedSkills);
    onClose(); // Close the modal after successful registration
  };

  // This function allows closing the modal by clicking the background
  const handleBackdropClick = (e) => {
    if (e.target.className === "modal-backdrop") {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <h2>Register New Worker</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="worker-name">Worker Name</label>
            <input
              type="text"
              id="worker-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(""); // Clear error on new input
              }}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Claimed Skills</label>
            <div className="skills-checkboxes">
              {availableSkills.map((skill) => (
                <label key={skill} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedSkills.includes(skill)}
                    onChange={() => handleSkillChange(skill)}
                  />
                  {skill}
                </label>
              ))}
            </div>
          </div>

          {error && <p style={{ color: "var(--invalid-red)" }}>{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}