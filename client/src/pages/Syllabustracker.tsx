"use client";

import React, { useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

type SyllabusItem = {
  id: number;
  title: string;
  completed: boolean;
  createdAt: number;
};

const STORAGE_KEY = "mySyllabus_v2";

export default function ImprovedSyllabusTracker(): JSX.Element {
  const [syllabus, setSyllabus] = useState<SyllabusItem[]>([]);
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSyllabus(JSON.parse(raw));
    } catch (e) {
      console.error("Failed to load syllabus:", e);
    }
  }, []);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(syllabus));
    } catch (e) {
      console.error("Failed to save syllabus:", e);
    }
  }, [syllabus]);

  // Derived values
  const total = syllabus.length;
  const completed = syllabus.filter((s) => s.completed).length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return syllabus.slice().sort((a, b) => b.createdAt - a.createdAt);
    return syllabus
      .filter((s) => s.title.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [query, syllabus]);

  // CRUD operations
  function openAddModal() {
    setEditingId(null);
    setInputValue("");
    setIsModalOpen(true);
  }
  function openEditModal(item: SyllabusItem) {
    setEditingId(item.id);
    setInputValue(item.title);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setInputValue("");
  }

  function handleAddOrUpdate(e?: React.FormEvent) {
    e?.preventDefault();
    const title = inputValue.trim();
    if (!title) return;

    if (editingId) {
      setSyllabus((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, title } : p))
      );
    } else {
      const item: SyllabusItem = {
        id: Date.now(),
        title,
        completed: false,
        createdAt: Date.now(),
      };
      setSyllabus((prev) => [item, ...prev]);
    }

    closeModal();
  }

  function toggleComplete(id: number) {
    setSyllabus((prev) => prev.map((p) => (p.id === id ? { ...p, completed: !p.completed } : p)));
  }

  function removeItem(id: number) {
    setSyllabus((prev) => prev.filter((p) => p.id !== id));
  }

  function clearCompleted() {
    setSyllabus((prev) => prev.filter((p) => !p.completed));
  }

  function resetAll() {
    setSyllabus([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  function move(id: number, direction: "up" | "down") {
    setSyllabus((prev) => {
      const arr = prev.slice();
      const idx = arr.findIndex((x) => x.id === id);
      if (idx === -1) return arr;
      const swapWith = direction === "up" ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= arr.length) return arr;
      [arr[idx], arr[swapWith]] = [arr[swapWith], arr[idx]];
      return arr;
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Nav />

      <main className="md:ml-64 pt-24 md:pt-8 pb-20 md:pb-8 max-w-4xl mx-auto p-4">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1 text-indigo-600 dark:text-indigo-400">📘 Syllabus Tracker</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Track chapters, topics and mark progress. Works on mobile & desktop.</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Input
              placeholder="Search topics..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 md:flex-none"
            />

            {/* Primary Add button (desktop) */}
            <Button onClick={openAddModal} className="hidden md:inline-flex">
              ➕ Add Topic
            </Button>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Controls & Summary */}
          <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold text-gray-800 dark:text-gray-200">Summary</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{completed} / {total} completed</p>
              </div>
              <div className="text-sm font-medium">{progress}%</div>
            </div>

            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden mb-3">
              <div className="h-3 rounded-full bg-indigo-600 dark:bg-indigo-400" style={{ width: `${progress}%` }} />
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={clearCompleted} variant="ghost">🧹 Clear Completed</Button>
              <Button onClick={resetAll} variant="destructive">🔄 Reset All</Button>
            </div>

            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">Tip: on mobile use the floating + button to add topics quickly.</div>
          </div>

          {/* Middle & Right combined: List */}
          <div className="md:col-span-2 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800 dark:text-gray-200">My Syllabus</h2>
              <div className="text-sm text-gray-500">{filtered.length} shown</div>
            </div>

            {filtered.length === 0 ? (
              <div className="py-6 text-center text-gray-500 dark:text-gray-400">No topics. Add your first topic.</div>
            ) : (
              <div className="space-y-2">
                {filtered.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={item.completed} onCheckedChange={() => toggleComplete(item.id)} />

                      <div>
                        <div className={`font-medium ${item.completed ? "line-through text-gray-500" : "text-gray-900 dark:text-gray-100"}`}>{item.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Added: {new Date(item.createdAt).toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button aria-label="move up" onClick={() => move(item.id, "up")} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600">⬆️</button>
                      <button aria-label="move down" onClick={() => move(item.id, "down")} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600">⬇️</button>
                      <button aria-label="edit" onClick={() => openEditModal(item)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600">✏️</button>
                      <button aria-label="delete" onClick={() => removeItem(item.id)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-700">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Floating Add button for mobile (and always useful) */}
        <button
          onClick={openAddModal}
          className="fixed z-40 bottom-6 right-6 md:hidden bg-indigo-600 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center text-xl"
          aria-label="Add topic"
        >
          +
        </button>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40" onClick={closeModal} />

            <form onSubmit={handleAddOrUpdate} className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{editingId ? "Edit Topic" : "Add Topic"}</h3>

              <label className="block mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-300">Topic title</span>
                <Input
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="e.g. Chapter 1 - Algebra"
                  className="mt-1"
                />
              </label>

              <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
                <Button type="submit">{editingId ? "Save" : "Add"}</Button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
