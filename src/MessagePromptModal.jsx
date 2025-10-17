// src/MessagePromptModal.jsx

import React, { useState } from 'react';
import './FactoryLayout.css';

export default function MessagePromptModal({ worker, workers, onClose, onSend, callGeminiAPI, isLoading }) {
  const [message, setMessage] = useState('');
  const [aiResponse, setAIResponse] = useState('');

  // Determine placeholder based on worker status
  const isWorkerActive = !worker.status || worker.status !== 'idle';
  const placeholderText = isWorkerActive
    ? `e.g., "Worker is feeling unwell and needs to leave."`
    : `e.g., "Assign this worker to the most urgent task."`;

  const handleSendClick = async () => {
    const userMessage = message.trim() === '' ? placeholderText : message;

    onSend(worker, userMessage); // Optional: local log or immediate update

    // Build prompt for AI
    const prompt = `
You are an HR assistant AI for a factory.
Worker snapshot: ${JSON.stringify(workers)}
Target worker: ${JSON.stringify(worker)}
HR instruction: "${userMessage}"
Rules:
- Suggest the best assignment for the worker if it's an emergency or urgent task
- Prioritize based on primary skill, efficiency, and lowest task time
- Be concise and professional
`;

    try {
      setAIResponse(''); // Reset previous AI response
      const response = await callGeminiAPI(prompt);
      setAIResponse(response);
    } catch (error) {
      console.error('Error calling AI:', error);
      setAIResponse('AI encountered an error. Please try again.');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content ai-prompt-modal">
        <h3>AI Assistant</h3>
        <p>
          Sending instruction for worker: <strong>{worker.name}</strong>
        </p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholderText}
          disabled={isLoading}
        />
        <div className="modal-actions">
          <button onClick={onClose} disabled={isLoading} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSendClick} disabled={isLoading} className="btn-primary">
            {isLoading ? 'Processing...' : 'Send to AI'}
          </button>
        </div>

        {/* AI Response Section */}
        {aiResponse && (
          <div className="ai-response">
            <h4>AI Suggestion:</h4>
            <p>{aiResponse}</p>
          </div>
        )}
      </div>
    </div>
  );
}
