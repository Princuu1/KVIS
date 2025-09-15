"use client";

import React, { useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TimetableEntry = {
  id: number;
  day: string;
  subject: string;
  time: string; // stored as HH:MM in 24-hour format
  createdAt: number;
};

const STORAGE_KEY = "myTimetable_v2";
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const dayIndex: Record<string, number> = DAYS.reduce((acc, d, i) => ({ ...acc, [d]: i }), {} as Record<string, number>);

export default function ImprovedTimeTable(): JSX.Element {
  const [day, setDay] = useState("");
  const [subject, setSubject] = useState("");
  const [time, setTime] = useState("");
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterDay, setFilterDay] = useState("");

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setTimetable(JSON.parse(raw));
    } catch (e) {
      console.error("Failed to load timetable:", e);
    }
  }, []);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(timetable));
    } catch (e) {
      console.error("Failed to save timetable:", e);
    }
  }, [timetable]);

  // Derived and sorted list
  const sorted = useMemo(() => {
    return timetable.slice().sort((a, b) => {
      const di = (dayIndex[a.day] ?? 0) - (dayIndex[b.day] ?? 0);
      if (di !== 0) return di;
      return a.time.localeCompare(b.time); // "HH:MM" lexicographic works for 24-hour
    });
  }, [timetable]);

  const shown = filterDay ? sorted.filter((s) => s.day === filterDay) : sorted;

  function openAdd() {
    setEditingId(null);
    setDay("");
    setSubject("");
    setTime("");
    setIsModalOpen(true);
  }

  function openEdit(entry: TimetableEntry) {
    setEditingId(entry.id);
    setDay(entry.day);
    setSubject(entry.subject);
    setTime(entry.time);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
  }

  function normalizeTime(input: string) {
    // if already HH:MM return, else try to parse e.g. 10:00 AM
    if (/^\d{2}:\d{2}$/.test(input)) return input;
    const d = new Date(`1970-01-01T${input}`);
    if (!isNaN(d.getTime())) {
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    }
    return input;
  }

  function handleAddOrUpdate(e?: React.FormEvent) {
    e?.preventDefault();
    if (!day || !subject || !time) return;
    const t = normalizeTime(time);
    // Prevent duplicates (same day+time+subject)
    const duplicate = timetable.some(
      (it) => it.id !== editingId && it.day === day && it.time === t && it.subject.trim().toLowerCase() === subject.trim().toLowerCase()
    );
    if (duplicate) {
      alert("This entry seems to be a duplicate.");
      return;
    }

    if (editingId) {
      setTimetable((prev) => prev.map((p) => (p.id === editingId ? { ...p, day, subject: subject.trim(), time: t } : p)));
    } else {
      const entry: TimetableEntry = { id: Date.now(), day, subject: subject.trim(), time: t, createdAt: Date.now() };
      setTimetable((prev) => [...prev, entry]);
    }

    closeModal();
  }

  function removeEntry(id: number) {
    if (!confirm("Delete this entry?")) return;
    setTimetable((prev) => prev.filter((p) => p.id !== id));
  }

  function resetTable() {
    if (!confirm("Reset entire timetable?")) return;
    setTimetable([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  function move(id: number, dir: "up" | "down") {
    setTimetable((prev) => {
      const arr = prev.slice();
      const idx = arr.findIndex((x) => x.id === id);
      if (idx === -1) return arr;
      const swapWith = dir === "up" ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= arr.length) return arr;
      [arr[idx], arr[swapWith]] = [arr[swapWith], arr[idx]];
      return arr;
    });
  }

  // Export/Import
  async function exportJSON() {
    const data = JSON.stringify(timetable, null, 2);
    try {
      await navigator.clipboard.writeText(data);
      // also trigger download
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "timetable.json";
      a.click();
      URL.revokeObjectURL(url);
      alert("Timetable copied to clipboard and downloaded.");
    } catch (e) {
      alert("Failed to export. Please copy manually.\n" + e);
    }
  }

  function importJSON(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = reader.result as string;
        const arr = JSON.parse(raw) as TimetableEntry[];
        // Basic validation
        if (!Array.isArray(arr)) throw new Error("Invalid format");
        const cleaned = arr
          .map((x) => ({ ...x, id: x.id ?? Date.now() + Math.random(), createdAt: x.createdAt ?? Date.now(), day: x.day ?? "", subject: x.subject ?? "", time: x.time ?? "" }))
          .filter((x) => x.day && x.subject && x.time);
        setTimetable((prev) => [...prev, ...cleaned]);
        alert(`Imported ${cleaned.length} entries.`);
      } catch (err) {
        alert("Failed to import: " + err);
      }
    };
    reader.readAsText(file);
  }

  // Utility to format time for display
  function displayTime(hm: string) {
    if (!hm) return hm;
    const [hh, mm] = hm.split(":");
    const h = Number(hh);
    const ampm = h >= 12 ? "PM" : "AM";
    const hh12 = ((h + 11) % 12) + 1;
    return `${hh12}:${mm} ${ampm}`;
  }

  // Highlight current day
  const today = new Date();
  const todayName = DAYS[today.getDay() - 1] ?? ""; // getDay: 0 Sunday

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Nav />

      <main className="md:ml-64 pt-24 md:pt-8 pb-20 md:pb-8 max-w-5xl mx-auto p-4">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1 text-indigo-600 dark:text-indigo-400">📅 My Timetable</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Responsive timetable — table view on desktop, card view on mobile. Edit, reorder, export/import.</p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)} className="px-3 py-2 rounded border">
              <option value="">All days</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <Button onClick={openAdd}>➕ Add</Button>
            <Button variant="ghost" onClick={exportJSON}>Export</Button>
            <label className="cursor-pointer inline-flex items-center">
              <input
                type="file"
                accept="application/json"
                onChange={(e) => importJSON(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <Button variant="outline">Import</Button>
            </label>
            <Button variant="destructive" onClick={resetTable}>Reset</Button>
          </div>
        </header>

        <section className="mt-6">
          {/* Desktop table view */}
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow border p-4">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-gray-600 dark:text-gray-300">
                  <th className="py-2">Day</th>
                  <th className="py-2">Time</th>
                  <th className="py-2">Subject / Activity</th>
                  <th className="py-2" style={{ width: 160 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">No entries yet.</td>
                  </tr>
                ) : (
                  shown.map((entry, i) => (
                    <tr key={entry.id} className={`${entry.day === todayName ? "bg-indigo-50 dark:bg-indigo-900/30" : i % 2 ? "bg-gray-50 dark:bg-gray-700" : ""} rounded`}> 
                      <td className="py-3">{entry.day}</td>
                      <td className="py-3 font-medium">{displayTime(entry.time)}</td>
                      <td className="py-3">{entry.subject}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => move(entry.id, "up")}>⬆️</Button>
                          <Button size="sm" onClick={() => move(entry.id, "down")}>⬇️</Button>
                          <Button size="sm" onClick={() => openEdit(entry)}>✏️</Button>
                          <Button size="sm" variant="destructive" onClick={() => removeEntry(entry.id)}>🗑️</Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="md:hidden space-y-3">
            {shown.length === 0 ? (
              <div className="text-center text-gray-500 py-6">No entries yet.</div>
            ) : (
              shown.map((entry) => (
                <div key={entry.id} className={`p-3 rounded-lg shadow bg-white dark:bg-gray-800 flex justify-between items-center ${entry.day === todayName ? "ring-2 ring-indigo-300" : ""}`}>
                  <div>
                    <div className="text-sm text-gray-500">{entry.day} • {displayTime(entry.time)}</div>
                    <div className="font-medium">{entry.subject}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-1">
                      <button onClick={() => move(entry.id, "up")} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">⬆️</button>
                      <button onClick={() => move(entry.id, "down")} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">⬇️</button>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(entry)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">✏️</button>
                      <button onClick={() => removeEntry(entry.id)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-700">🗑️</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Floating add button for mobile */}
        <button onClick={openAdd} className="fixed z-40 bottom-6 right-6 md:hidden bg-indigo-600 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center text-xl">+</button>

        {/* Modal for add/edit */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
            <form onSubmit={handleAddOrUpdate} className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{editingId ? "Edit Entry" : "Add Entry"}</h3>

              <div className="grid gap-2">
                <label className="block">
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Day</div>
                  <select value={day} onChange={(e) => setDay(e.target.value)} className="w-full p-2 rounded border">
                    <option value="">Select day</option>
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Time</div>
                  <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </label>

                <label className="block">
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Subject / Activity</div>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Math - Chapter 1" />
                </label>

                <div className="flex justify-end gap-3 mt-3">
                  <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
                  <Button type="submit">{editingId ? "Save" : "Add"}</Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
