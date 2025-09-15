"use client";

import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import Nav from "@/components/Nav"; // Sidebar

type StudyEntry = {
  id: number;
  date: string;
  day: string;
  hours: number;
  timestamp: number;
};

const StudyTracker: React.FC = () => {
  const [entries, setEntries] = useState<StudyEntry[]>([]);
  const [studyHours, setStudyHours] = useState<string>("");
  const [entriesVisible, setEntriesVisible] = useState(false);

  // Load saved entries
  useEffect(() => {
    const saved = localStorage.getItem("studyTrackerPro");
    if (saved) {
      setEntries(JSON.parse(saved));
    }
  }, []);

  // Save entries when changed
  useEffect(() => {
    localStorage.setItem("studyTrackerPro", JSON.stringify(entries));
  }, [entries]);

  const getCurrentDate = () => {
    const date = new Date();
    return {
      date: date.toISOString().split("T")[0],
      day: date.toLocaleDateString("en-US", { weekday: "long" }),
    };
  };

  const addEntry = () => {
    if (!studyHours || parseFloat(studyHours) <= 0) {
      alert("Please enter valid study hours");
      return;
    }
    const { date, day } = getCurrentDate();
    const entry: StudyEntry = {
      id: Date.now(),
      date,
      day,
      hours: parseFloat(studyHours),
      timestamp: Date.now(),
    };
    setEntries([entry, ...entries]);
    setStudyHours("");
  };

  const isDeletable = (timestamp: number) => {
    return Date.now() - timestamp < 600000; // 10 minutes
  };

  const deleteEntry = (id: number) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const totalStudyHours = entries
    .reduce((acc, curr) => acc + curr.hours, 0)
    .toFixed(1);

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Study Sessions Report", 20, 20);
    doc.setFontSize(12);

    let y = 30;
    entries.forEach((entry) => {
      const text = `${entry.date} - ${entry.hours} hours`;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(text, 20, y);
      y += 10;
    });

    doc.save(`study-report-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Nav />

      {/* Main Content */}
      <main className="md:ml-64 pt-24 md:pt-8 pb-20 md:pb-8 max-w-3xl mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            📚 Study Tracker
          </h1>
        </div>

        {/* Input form */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow mb-6">
          <input
            type="number"
            value={studyHours}
            onChange={(e) => setStudyHours(e.target.value)}
            placeholder="Study Hours (e.g., 2.5)"
            step="0.1"
            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg mb-4 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
          />
          <button
            onClick={addEntry}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 rounded-lg font-semibold shadow hover:opacity-90 transition"
          >
            ➕ Add Session
          </button>
        </div>

        {/* Entries Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow">
          <button
            onClick={() => setEntriesVisible(!entriesVisible)}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg mb-4 font-semibold hover:bg-indigo-700 transition"
          >
            {entriesVisible ? "⬆ Hide History" : "⬇ Show History"}
          </button>

          {entriesVisible && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                  Study Sessions
                </h2>
                <button
                  onClick={downloadPDF}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
                >
                  ⬇ PDF
                </button>
              </div>

              <div className="mb-4 text-gray-700 dark:text-gray-300">
                Total Study Hours: <strong>{totalStudyHours}h</strong>
              </div>

              <div id="studyEntries">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-3 border-l-4 border-indigo-500 shadow-sm"
                  >
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                      {entry.date} • {entry.day}
                      {isDeletable(entry.timestamp) && (
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md text-xs"
                        >
                          🗑 Delete
                        </button>
                      )}
                    </div>
                    <h3 className="mt-2 font-semibold text-gray-800 dark:text-gray-200">
                      📖 Study Session
                    </h3>
                    <div className="text-gray-700 dark:text-gray-300">
                      {entry.hours} hours
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudyTracker;
