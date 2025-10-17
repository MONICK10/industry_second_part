import React, { useState, useEffect, useCallback } from "react";
import RegistrationModal from "./Registration";
import "./FactoryLayout.css";
import { db } from "./firebase";
import HRDashboard from "./HRD";
import trolleyImg from "./trolley.png";
import {
  collection,
  setDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

// --- Sections and Flow ---
const sectionsData = [
  { id: "raw-materials", name: "Raw Materials", dept: "Intake", type: "endpoint" },
  { id: "welding", name: "Welding Section", dept: "Welding", type: "process" },
  { id: "assembly", name: "Assembly Section", dept: "Assembly", type: "process" },
  { id: "painting", name: "Painting Section", dept: "Painting", type: "process" },
  { id: "quality", name: "Quality Inspection", dept: "Quality", type: "process" },
  { id: "packaging", name: "Packaging Section", dept: "Packaging", type: "process" },
  { id: "training", name: "Training Center", dept: "Training", type: "training" },
  { id: "exporting", name: "Exporting", dept: "Shipping", type: "endpoint" },
];

const productionFlow = {
  "raw-materials": "welding",
  "welding": "assembly",
  "assembly": "painting",
  "painting": "quality",
  "quality": "packaging",
  "packaging": "exporting",
};

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;
const callGeminiAPI = async (prompt) => {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, maxOutputTokens: 250 }),
    });
    const data = await res.json();
    return data?.candidates?.[0]?.content || "Unable to process request.";
  } catch (err) {
    console.error("Gemini API error:", err);
    return "Error connecting to AI service.";
  }
};


const colors = ["#3498db", "#e74c3c", "#9b59b6", "#f1c40f", "#2ecc71", "#1abc9c"];
const trolleyFlow = ["raw-materials","welding","assembly","painting","quality","packaging","exporting"];

// --- Material Animation ---
const Material = ({ fromId, toId, color, onAnimationEnd }) => {
  const [style, setStyle] = useState({});

  useEffect(() => {
    const fromElement = document.getElementById(`section-${fromId}`);
    const toElement = document.getElementById(`section-${toId}`);
    const canvas = document.querySelector(".factory-map-canvas")?.getBoundingClientRect();
    if (!fromElement || !toElement || !canvas) return;

    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();

    const startX = fromRect.left - canvas.left + fromRect.width / 2;
    const startY = fromRect.top - canvas.top + fromRect.height / 2;
    const endX = toRect.left - canvas.left + toRect.width / 2;
    const endY = toRect.top - canvas.top + toRect.height / 2;

    setStyle({
      top: `${startY}px`,
      left: `${startX}px`,
      backgroundColor: color,
      transform: "translate(-50%, -50%)",
      opacity: 1,
    });

    const timeoutId = setTimeout(() => {
      setStyle((prev) => ({
        ...prev,
        transform: `translate(${endX - startX}px, ${endY - startY}px)`,
        transition: "transform 1.5s ease-in-out",
      }));
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [fromId, toId, color]);

  return <div className="material" style={style} onTransitionEnd={onAnimationEnd} />;
};

// --- Worker In Training ---
const WorkerInTraining = ({ worker, onTrainingComplete }) => {
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentSkill, setCurrentSkill] = useState(worker.claimedSkills[0]);
  const [skillProgressTarget] = useState(Math.floor(Math.random() * 21) + 50);

  useEffect(() => {
    if (!worker || currentSkillIndex >= worker.claimedSkills.length) return;

    setCurrentSkill(worker.claimedSkills[currentSkillIndex]);
    setProgress(0);
    const totalTime = Math.random() * 2000 + 3000; // 3-5s

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= skillProgressTarget) {
          clearInterval(interval);
          if (currentSkillIndex + 1 < worker.claimedSkills.length) {
            setCurrentSkillIndex((idx) => idx + 1);
          } else {
            onTrainingComplete(worker);
          }
          return skillProgressTarget;
        }
        return p + 5;
      });
    }, totalTime / 20);

    return () => clearInterval(interval);
  }, [worker, currentSkillIndex, skillProgressTarget, onTrainingComplete]);

  if (!worker) return null;

  return (
    <div className="assigned-worker training">
      <div className="worker-info">
        <div className="worker-name">{worker.name}</div>
        <div className="skill-status">Training {currentSkill}...</div>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

// --- AI Button ---
const AIButton = ({ onClick }) => (
  <button className="ai-btn" onClick={onClick} title="AI Analyze Worker">
    🤖
  </button>
);

// --- Working Worker ---
const WorkingWorker = ({ worker, onTaskComplete, productionRunning, onProblemAssign, onGoHome, aiAnalyzing }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!productionRunning) {
      setProgress(0);
      return;
    }

    const totalTime = 4000 + Math.random() * 2000;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          onTaskComplete(worker);
          return 0;
        }
        return prev + 5;
      });
    }, totalTime / 20);

    return () => clearInterval(interval);
  }, [worker, onTaskComplete, productionRunning]);

  return (
    <div className="assigned-worker skilled">
      <div className="worker-info">
        <div className="worker-name">
          {worker.name} 
          {productionRunning && !aiAnalyzing && <AIButton onClick={() => onProblemAssign(worker)} />}
        </div>
        <div className="skill-status">
          {aiAnalyzing ? "AI Analyzing..." : productionRunning ? "Working..." : "Idle"}
        </div>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      {productionRunning && !aiAnalyzing && (
        <button className="go-home-btn" onClick={() => onGoHome(worker)}>
          Go to Home
        </button>
      )}
      {aiAnalyzing && (
        <div className="ai-analyze-overlay">
          🤖 AI is analyzing...
        </div>
      )}
    </div>
  );
};

// --- AI Worker Assignment ---
const assignWorkerAI = (workerDB, assignedWorkers, sectionDept) => {
  const availableWorkers = Object.values(workerDB).filter(
    w => w.skillStatus === "trained" &&
         !Object.values(assignedWorkers).some(a => a.id === w.id)
  );

  if (availableWorkers.length === 0) return null;

  availableWorkers.sort((a, b) => {
    const aSkill = a.skillsPercentage?.[sectionDept] || 0;
    const bSkill = b.skillsPercentage?.[sectionDept] || 0;
    const aTime = a.averageTaskTime?.[sectionDept] || 5;
    const bTime = b.averageTaskTime?.[sectionDept] || 5;
    return bSkill / bTime - aSkill / aTime;
  });

  return availableWorkers[0];
};

// --- Main Factory Component ---
export default function FactoryLayout() {
  const [workerDB, setWorkerDB] = useState({});
  const [assignedWorkers, setAssignedWorkers] = useState({});
  const [trainingWorker, setTrainingWorker] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeView, setActiveView] = useState("Virtual Industry");
  const [isProductionRunning, setIsProductionRunning] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [trolleys, setTrolleys] = useState([]);
  const [pausedWorker, setPausedWorker] = useState(null);

  // --- Fetch Workers ---
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "workers"));
        const workersList = {};
        snapshot.forEach((docSnap) => {
          workersList[docSnap.id] = { ...docSnap.data(), id: docSnap.id };
        });
        setWorkerDB(workersList);
      } catch (err) {
        console.error("Error fetching workers:", err);
      }
    };
    fetchWorkers();
  }, []);

  // --- Register Worker ---
  const handleRegisterWorker = async (name, skillsArray) => {
    const newWorkerId = Date.now().toString();

    // Generate random percentage and task time for each skill
    const skillsPercentage = skillsArray.reduce((acc, s) => ({ ...acc, [s]: Math.floor(Math.random() * 21) + 50 }), {});
    const averageTaskTime = skillsArray.reduce((acc, s) => ({ ...acc, [s]: Math.floor(Math.random() * 5) + 2 }), {});

    const newWorker = {
      name,
      claimedSkills: skillsArray,
      skillStatus: "untrained",
      tasksCompleted: 0,
      efficiency: 0,
      skillsPercentage,
      averageTaskTime,
      joinedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, "workers", newWorkerId), newWorker);
      const workerWithId = { ...newWorker, id: newWorkerId };
      setWorkerDB((prev) => ({ ...prev, [newWorkerId]: workerWithId }));
      setTrainingWorker(workerWithId);
    } catch (err) {
      console.error("Error adding worker:", err);
    }
  };

  // --- Determine Primary Skill ---
  const determinePrimarySkill = (worker) => {
    let primarySkill = worker.claimedSkills[0];
    let bestScore = 0;
    worker.claimedSkills.forEach(skill => {
      const percentage = worker.skillsPercentage[skill];
      const time = worker.averageTaskTime[skill];
      // Prefer moderate task time (lowest 50th percentile) + high percentage
      const score = percentage / time;
      if (score > bestScore) {
        bestScore = score;
        primarySkill = skill;
      }
    });
    return primarySkill;
  };

  // --- Training Complete ---
  const handleTrainingComplete = async (worker) => {
    const primarySection = determinePrimarySkill(worker);
    const updatedWorkerData = {
      primarySection,
      skillStatus: "trained",
    };
    try {
      await updateDoc(doc(db, "workers", worker.id), updatedWorkerData);
      setWorkerDB((prev) => ({
        ...prev,
        [worker.id]: { ...prev[worker.id], ...updatedWorkerData },
      }));
      setTrainingWorker(null);
    } catch (err) {
      console.error("Error updating worker after training:", err);
    }
  };

  // --- Start Production ---
  const handleStartProduction = () => {
    if (isProductionRunning) return;

    const trainedWorkers = Object.values(workerDB).filter((w) => w.skillStatus === "trained");
    const newAssignments = {};
    const assignedIds = new Set();

    sectionsData.forEach((section) => {
      if (section.type === "process") {
        const workersForDept = trainedWorkers.filter(
          (w) => w.primarySection === section.dept && !assignedIds.has(w.id)
        );

        for (let i = 0; i < 3; i++) {
          if (workersForDept[i]) {
            const machineId = `${section.id}-${i + 1}`;
            newAssignments[machineId] = {
              ...workersForDept[i],
              sectionId: section.id,
              assignmentId: Date.now() + i,
            };
            assignedIds.add(workersForDept[i].id);
          }
        }
      }
    });

    setAssignedWorkers(newAssignments);
    setIsProductionRunning(true);
  };

  // --- Stop Production ---
  const handleStopProduction = () => {
    setIsProductionRunning(false);
    setAssignedWorkers({});
    setMaterials([]);
    setTrolleys([]);
    setPausedWorker(null);
  };

  // --- Assign Problem ---
  const handleProblemAssign = (worker) => {
    alert(`Problem assigned to ${worker.name}. Production paused.`);
    setPausedWorker(worker);
    setIsProductionRunning(false);
  };

  // --- Go Home / AI Reassign ---
  const handleGoHome = (worker) => {
    const updatedAssignments = { ...assignedWorkers };
    Object.keys(updatedAssignments).forEach(key => {
      if (updatedAssignments[key].id === worker.id) {
        updatedAssignments[key].aiAnalyzing = true;
      }
    });
    setAssignedWorkers(updatedAssignments);
    setPausedWorker(worker);
    setIsProductionRunning(false);

    setTimeout(() => {
      const nextWorker = assignWorkerAI(workerDB, updatedAssignments, worker.primarySection);
      if (nextWorker) {
        const machineId = Object.keys(updatedAssignments).find(k => updatedAssignments[k].aiAnalyzing);
        updatedAssignments[machineId] = {
          ...nextWorker,
          sectionId: worker.primarySection,
          assignmentId: Date.now(),
        };
        delete updatedAssignments[machineId].aiAnalyzing;
        setAssignedWorkers(updatedAssignments);
        setPausedWorker(null);
        setIsProductionRunning(true);
      } else {
        alert("No trained worker available. Production continues slowly.");
        Object.keys(updatedAssignments).forEach(k => delete updatedAssignments[k].aiAnalyzing);
        setAssignedWorkers(updatedAssignments);
      }
    }, 2000);
  };

  // --- Task Complete ---
  const handleTaskComplete = useCallback(async (completedWorker) => {
    if (!isProductionRunning) return;

    const newTasksCompleted = (completedWorker.tasksCompleted || 0) + 1;
    let newEfficiency = completedWorker.efficiency || 0;
    if (newTasksCompleted > 0 && newTasksCompleted % 5 === 0) {
      newEfficiency += 1;
    }
    const updatedStats = {
      tasksCompleted: newTasksCompleted,
      efficiency: newEfficiency,
    };

    try {
      await updateDoc(doc(db, "workers", completedWorker.id), updatedStats);
      setWorkerDB((prev) => ({
        ...prev,
        [completedWorker.id]: { ...prev[completedWorker.id], ...updatedStats },
      }));
    } catch (err) {
      console.error("Failed to update worker stats:", err);
    }

    const nextSectionId = productionFlow[completedWorker.sectionId];
    if (nextSectionId) {
      let newColor = completedWorker.color || "#8492a6";
      if (completedWorker.sectionId === "painting") {
        newColor = colors[Math.floor(Math.random() * colors.length)];
      }
      setTimeout(() => {
        setMaterials((prev) => [
          ...prev,
          { id: Date.now(), from: completedWorker.sectionId, to: nextSectionId, color: newColor },
        ]);
      }, 500);
    }
  }, [isProductionRunning]);

  // --- Remove Material ---
  const removeMaterial = useCallback((id) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // --- Spawn Trolley ---
  const spawnTrolley = () => {
    const newTrolley = { id: Date.now(), step: 0 };
    setTrolleys(prev => [...prev, newTrolley]);
  };

  // --- Automatic trolley spawning ---
  useEffect(() => {
    if (!isProductionRunning) return;
    const interval = setInterval(spawnTrolley, 3000);
    return () => clearInterval(interval);
  }, [isProductionRunning]);

  // --- Move trolleys ---
  useEffect(() => {
    if (!isProductionRunning || trolleys.length === 0) return;
    const moveInterval = setInterval(() => {
      setTrolleys(prev =>
        prev
          .map(t => t.step >= trolleyFlow.length - 1 ? null : { ...t, step: t.step + 1 })
          .filter(Boolean)
      );
    }, 1500);
    return () => clearInterval(moveInterval);
  }, [isProductionRunning, trolleys]);

  return (
    <>
      {isModalOpen && (
        <RegistrationModal onRegister={handleRegisterWorker} onClose={() => setIsModalOpen(false)} />
      )}

      <div className="top-level-controls">
        {["Virtual Industry", "HR Department", "Analytics"].map((view) => (
          <button
            key={view}
            className={`btn-primary ${activeView === view ? "active" : ""}`}
            onClick={() => setActiveView(view)}
          >
            {view}
          </button>
        ))}
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          + Register Worker
        </button>
      </div>

      {activeView === "Virtual Industry" && (
        <div className="factory-container">
          <div className="factory-map-viewport">
            <div className="production-controls">
              <button
                className="btn-start"
                onClick={handleStartProduction}
                disabled={isProductionRunning}
              >
                ▶ START PRODUCTION
              </button>
              <button
                className="btn-stop"
                onClick={handleStopProduction}
                disabled={!isProductionRunning}
              >
                ■ STOP PRODUCTION
              </button>
            </div>

            <div className="factory-map-canvas">
              {trolleys.map((t) => {
                const currentSection = trolleyFlow[t.step];
                const el = document.getElementById(`section-${currentSection}`);
                if (!el) return null;
                const rect = el.getBoundingClientRect();
                const canvas = document.querySelector(".factory-map-canvas")?.getBoundingClientRect();
                if (!canvas) return null;
                const left = rect.left - canvas.left + rect.width / 2;
                const top = rect.top - canvas.top + rect.height / 2;
                return <img key={t.id} src={trolleyImg} alt="Trolley" className="trolley" style={{ left, top, transform: "translate(-50%,-50%)", position: "absolute" }} />;
              })}

              {materials.map((mat) => (
                <Material key={mat.id} {...mat} onAnimationEnd={() => removeMaterial(mat.id)} />
              ))}

              {sectionsData.map((sec) => (
                <div key={sec.id} className="section-wrapper" id={`section-${sec.id}`}>
                  <div className="section-header">
                    <div className="section-title-group">
                      <div className="rec-indicator">REC</div>
                      <h2>{sec.name}</h2>
                    </div>
                    <div className="section-controls">
                      <button className="icon-btn">🔊</button>
                      <button className="icon-btn">📷</button>
                    </div>
                  </div>

                  <div className="machines-row">
                    {sec.type === 'training'
                      ? [1, 2, 3].map(m => (
                        <div className="machine-pod" key={`${sec.id}-${m}`}>
                          {m === 1 && trainingWorker && (
                            <WorkerInTraining
                              worker={trainingWorker}
                              onTrainingComplete={handleTrainingComplete}
                            />
                          )}
                          <div className={`machine-box ${m === 1 && trainingWorker ? "vibrating" : ""}`}>
                            <div className="machine-icon"></div>
                            <div className="machine-label">{sec.dept} Machine {m}</div>
                          </div>
                        </div>
                      ))
                      : [1, 2, 3].map(m => {
                        const machineId = `${sec.id}-${m}`;
                        const worker = assignedWorkers[machineId];
                        return (
                          <div className="machine-pod" key={machineId}>
                            {worker && (
                              <WorkingWorker
                                worker={worker}
                                onTaskComplete={handleTaskComplete}
                                productionRunning={isProductionRunning}
                                onProblemAssign={handleProblemAssign}
                                onGoHome={handleGoHome}
                              />
                            )}
                            <div className={`machine-box ${worker ? "vibrating" : ""}`}>
                              <div className="machine-icon"></div>
                              <div className="machine-label">{sec.dept} Machine {m}</div>
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeView === "HR Department" && <HRDashboard workerDB={workerDB} />}
    </>
  );
}
