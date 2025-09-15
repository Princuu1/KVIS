"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import Nav from "@/components/Nav"; // Sidebar

type Goal = {
  id: number;
  text: string;
  completed: boolean;
};

export default function TodaysGoal() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState("");

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("todaysGoals");
    if (saved) {
      setGoals(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("todaysGoals", JSON.stringify(goals));
  }, [goals]);

  const addGoal = () => {
    if (!newGoal.trim()) return;
    setGoals([...goals, { id: Date.now(), text: newGoal, completed: false }]);
    setNewGoal("");
  };

  const toggleComplete = (id: number) => {
    setGoals(
      goals.map((goal) =>
        goal.id === id ? { ...goal, completed: !goal.completed } : goal
      )
    );
  };

  const resetGoals = () => {
    setGoals([]);
    localStorage.removeItem("todaysGoals");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Nav />

      {/* Main Content */}
      <main className="md:ml-64 pt-24 md:pt-8 pb-20 md:pb-8 max-w-3xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-indigo-600 dark:text-indigo-400">
          🎯 Today&apos;s Goals
        </h1>

        {/* Input to add goal */}
        <div className="flex gap-2 mb-6">
          <Input
            placeholder="Enter your goal (e.g. Finish homework)"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
          />
          <Button onClick={addGoal}>Add</Button>
        </div>

        {/* Goals list */}
        {goals.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No goals added yet.
          </p>
        ) : (
          <div className="space-y-2 mb-6">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-800"
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={goal.completed}
                    onCheckedChange={() => toggleComplete(goal.id)}
                  />
                  <span
                    className={`${
                      goal.completed
                        ? "line-through text-gray-500 dark:text-gray-400"
                        : "text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {goal.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reset button */}
        <Button variant="destructive" onClick={resetGoals}>
          Reset Goals
        </Button>
      </main>
    </div>
  );
}
