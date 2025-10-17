// src/PendingTasksPanel.jsx

import React from 'react';
import './FactoryLayout.css'; // We'll add the styles to the main CSS file

export default function PendingTasksPanel({ tasks }) {
  if (!tasks || tasks.length === 0) {
    return null; // Don't render anything if there are no pending tasks
  }

  return (
    <div className="pending-tasks-panel">
      <h4>Urgent Replacements Needed</h4>
      <div className="tasks-list">
        {tasks.map((task) => (
          <div key={task.id} className="pending-task-item">
            <div className="task-header">
              <span className="department-tag">{task.pendingDept}</span>
            </div>
            <p>
              <strong>{task.workerName}</strong> was removed.
            </p>
            <small>Reason: {task.reason}</small>
          </div>
        ))}
      </div>
    </div>
  );
}