// src/WorkerDashboard.jsx

import React from 'react';
import './WD.css'; // We'll create this CSS file next

function formatDuration(startTime, endTime) {
    if (!endTime) return 'N/A';
    const duration = (endTime - startTime) / 1000; // in seconds
    if (duration < 60) return `${duration.toFixed(1)}s`;
    return `${(duration / 60).toFixed(1)}m`;
}

export default function WorkerDashboard({ worker, history, onBack }) {
  return (
    <div className="worker-dashboard">
      <div className="dashboard-header">
        <button onClick={onBack} className="back-button">← Back to Factory</button>
        <h2>Worker Dashboard</h2>
      </div>
      <div className="worker-details-card">
        <h3>{worker.name}</h3>
        <p><strong>ID:</strong> {worker.id}</p>
        <div className="skills-container">
          <strong>Skills:</strong>
          {worker.claimedSkills.map(skill => (
            <span key={skill} className="skill-tag">{skill}</span>
          ))}
        </div>
      </div>
      <div className="history-panel">
        <h3>Task History</h3>
        <div className="history-table">
          <div className="history-table-header">
            <div>Department</div>
            <div>Status</div>
            <div>Time Taken</div>
          </div>
          <div className="history-table-body">
            {history.length > 0 ? history.map(task => (
              <div key={task.id} className="history-row">
                <div>{task.dept}</div>
                <div>
                  <span className={`status-badge ${task.status.toLowerCase()}`}>
                    {task.status}
                  </span>
                </div>
                <div>{formatDuration(task.startTime, task.endTime)}</div>
              </div>
            )) : <p>No task history available.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}