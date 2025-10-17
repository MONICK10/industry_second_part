// src/HRDashboard.jsx

import React, { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import "./HRD.css";
import MessagePromptModal from "./MessagePromptModal";

// API Config - Using the same model from your working example
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
// This is the correct line
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;


export default function HRDashboard() {
  const [workers, setWorkers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [hoveredWorker, setHoveredWorker] = useState(null);
  const [modalWorker, setModalWorker] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Chatbot state
  const [messages, setMessages] = useState([
    { from: "ai", text: "Hello! How can I assist you with HR queries today?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // Fetch workers
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "workers"));
        const workerList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setWorkers(workerList);
      } catch (err) {
        console.error("Error fetching workers:", err);
      }
    };
    fetchWorkers();
  }, []);

  const filteredWorkers = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (deptFilter === "" || (w.claimedSkills || []).includes(deptFilter))
  );
  const allDepts = Array.from(new Set(workers.flatMap((w) => w.claimedSkills || [])));

  const getSkillsInfo = (worker) => {
    if (!worker.skillsPercentage || Object.keys(worker.skillsPercentage).length === 0) return [];
    return Object.entries(worker.skillsPercentage).map(([skill, percent]) => {
      const timeSec = ((worker.averageTaskTime?.[skill] || 5)).toFixed(1);
      return { skill, percent, time: timeSec };
    });
  };

  // --- START: NEW AND IMPROVED API FUNCTION ---
  // This function now separates system instructions from the user's query, just like your example.
  const callGeminiAPI = async (promptObject) => {
    if (!API_KEY) {
      console.error("API Key is missing!");
      return "Configuration Error: The API key is not set up correctly.";
    }

    const payload = {
      contents: [{ parts: [{ text: promptObject.userQuery }] }],
      systemInstruction: {
        parts: [{ text: promptObject.systemContext }],
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        return `API Error: ${errorData.error.message}`;
      }

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      return aiText || "The AI returned an empty response. Please try again.";
    } catch (error) {
      console.error("Fetch Error:", error);
      return "Network Error: Could not connect to the AI service.";
    }
  };
  // --- END: NEW AND IMPROVED API FUNCTION ---

  // This function is for the modal, updated to use the new API call structure
  const handleSendToAI = async (worker, message) => {
    setIsProcessing(true);
    try {
      const prompt = {
        systemContext: `You are an HR assistant for a factory. You analyze worker data to make decisions. Prioritize primary skill, efficiency, and task time. Reply with the suggested assignment. Current workers data: ${JSON.stringify(workers)}`,
        userQuery: `Analyze this worker: ${JSON.stringify(worker)}. The HR manager's message is: "${message}". What is your recommendation?`,
      };

      const aiResponse = await callGeminiAPI(prompt);
      console.log("AI Suggestion:", aiResponse);

      await updateDoc(doc(db, "workers", worker.id), {
        status: "assigned",
        lastAIMessage: aiResponse,
      });

      setWorkers((prev) =>
        prev.map((w) =>
          w.id === worker.id ? { ...w, status: "assigned", lastAIMessage: aiResponse } : w
        )
      );
      setModalWorker(null);
    } catch (error) {
      console.error("Error sending to AI:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- START: UPDATED CHATBOT SEND FUNCTION ---
  const handleChatSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { from: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      // We create an object with separated context and query
      const promptObject = {
        systemContext: `You are a helpful HR assistant for a factory. Your knowledge base consists of the following worker data: ${JSON.stringify(workers)}. Use this data to answer questions. Be concise and clear.`,
        userQuery: currentInput,
      };
      
      const aiResponse = await callGeminiAPI(promptObject);
      setMessages((prev) => [...prev, { from: "ai", text: aiResponse }]);
    } catch (error) {
      setMessages((prev) => [...prev, { from: "ai", text: "Sorry, a critical error occurred." }]);
    } finally {
      setIsLoading(false);
    }
  };
  // --- END: UPDATED CHATBOT SEND FUNCTION ---

  return (
    <div className="hr-dashboard">
      <div className="header-container">
        <h2>HR Department Dashboard</h2>
        <div className="filters">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {allDepts.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="hr-dashboard-layout">
        <div className="workers-grid">
          {filteredWorkers.map((w) => (
            <div
              key={w.id}
              className="worker-box"
              onMouseEnter={() => setHoveredWorker(w)}
              onMouseLeave={() => setHoveredWorker(null)}
              onClick={() => setModalWorker(w)}
            >
              {w.name}
            </div>
          ))}
        </div>

        <div className="details-panel">
          {hoveredWorker ? (
            <div className="worker-details">
              <h3>{hoveredWorker.name}</h3>
              <p><strong>Primary Skill:</strong> {hoveredWorker.primarySection || "-"}</p>
              <p><strong>Skills:</strong></p>
              <ul>
                {getSkillsInfo(hoveredWorker).length > 0 ? (
                  getSkillsInfo(hoveredWorker).map(({ skill, percent, time }) => (
                    <li key={skill}>{skill}: {percent}% ({time}s)</li>
                  ))
                ) : (
                  <li>No skills trained</li>
                )}
              </ul>
              <p><strong>Tasks Completed:</strong> {hoveredWorker.tasksCompleted || 0}</p>
              {hoveredWorker.lastAIMessage && (
                <p><strong>Last AI Suggestion:</strong> {hoveredWorker.lastAIMessage}</p>
              )}
            </div>
          ) : (
            <div className="worker-details empty">Hover over a worker to view details</div>
          )}
        </div>

        <div className="chatbot-column">
          <div className="ai-chatbot">
            <div className="chatbot-header">AI HR Assistant</div>
            <div className="chatbot-messages">
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.from}`}>
                  {msg.text}
                </div>
              ))}
              {isLoading && <div className="message ai typing"><span></span><span></span><span></span></div>}
              <div ref={messagesEndRef} />
            </div>
            <div className="chatbot-input-area">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleChatSend()}
                placeholder="Ask an HR-related question..."
                disabled={isLoading}
              />
              <button onClick={handleChatSend} disabled={isLoading}>Send</button>
            </div>
          </div>
        </div>
      </div>

      {modalWorker && (
        <MessagePromptModal
          worker={modalWorker}
          workers={workers}
          onClose={() => setModalWorker(null)}
          onSend={handleSendToAI}
          callGeminiAPI={callGeminiAPI} // Note: This prop might not be needed in the modal anymore
          isLoading={isProcessing}
        />
      )}
    </div>
  );
}