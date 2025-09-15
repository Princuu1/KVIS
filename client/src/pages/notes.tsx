"use client";

import React, { useState, useEffect } from "react";
import Nav from "@/components/Nav"; // Sidebar

type Note = {
  id: number;
  title: string;
  content: string;
};

type Folder = {
  id: number;
  name: string;
  notes: Note[];
};

const NotesApp: React.FC = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("folders");
    if (stored) {
      const parsed: Folder[] = JSON.parse(stored);
      setFolders(parsed);
      setSelectedFolderId(parsed[0]?.id || null);
    } else {
      const defaultFolder = {
        id: Date.now(),
        name: "My Notes",
        notes: [],
      };
      setFolders([defaultFolder]);
      setSelectedFolderId(defaultFolder.id);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (folders.length > 0) {
      localStorage.setItem("folders", JSON.stringify(folders));
    }
  }, [folders]);

  const getCurrentFolder = () =>
    folders.find((f) => f.id === selectedFolderId) || folders[0];

  const createFolder = () => {
    const name = prompt("Enter folder name:");
    if (name) {
      const newFolder = { id: Date.now(), name, notes: [] };
      setFolders((prev) => [...prev, newFolder]);
      setSelectedFolderId(newFolder.id);
    }
  };

  const deleteFolder = (id: number) => {
    if (folders.length === 1) {
      alert("You must have at least one folder.");
      return;
    }
    const newFolders = folders.filter((f) => f.id !== id);
    setFolders(newFolders);
    if (selectedFolderId === id) {
      setSelectedFolderId(newFolders[0]?.id || null);
    }
  };

  const createNote = () => {
    const newNote: Note = {
      id: Date.now(),
      title: "New Note",
      content: "Start writing...",
    };
    setFolders((prev) =>
      prev.map((f) =>
        f.id === selectedFolderId
          ? { ...f, notes: [newNote, ...f.notes] }
          : f
      )
    );
  };

  const deleteNote = (noteId: number) => {
    setFolders((prev) =>
      prev.map((f) =>
        f.id === selectedFolderId
          ? { ...f, notes: f.notes.filter((n) => n.id !== noteId) }
          : f
      )
    );
  };

  const updateNote = (
    noteId: number,
    field: "title" | "content",
    value: string
  ) => {
    setFolders((prev) =>
      prev.map((f) =>
        f.id === selectedFolderId
          ? {
              ...f,
              notes: f.notes.map((n) =>
                n.id === noteId ? { ...n, [field]: value } : n
              ),
            }
          : f
      )
    );
  };

  const currentFolder = getCurrentFolder();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Nav />

      {/* Main Content */}
      <main className="md:ml-64 pt-24 md:pt-8 pb-20 md:pb-8 max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            📝 Notes
          </h1>
          <div className="space-x-2">
            <button
              onClick={createFolder}
              className="bg-indigo-500 text-white py-2 px-4 rounded-lg hover:bg-indigo-600 transition"
            >
              New Folder +
            </button>
            <button
              onClick={createNote}
              className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition"
            >
              New Note +
            </button>
          </div>
        </div>

        {/* Folder Selector */}
        <div className="mb-6 flex flex-wrap gap-2">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
                folder.id === selectedFolderId
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
              }`}
              onClick={() => setSelectedFolderId(folder.id)}
            >
              <span>{folder.name}</span>
              {folders.length > 1 && (
                <button
                  className="text-red-500 hover:text-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFolder(folder.id);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentFolder?.notes.map((note) => (
            <div
              key={note.id}
              className="relative bg-white dark:bg-gray-800 p-4 rounded-xl shadow hover:shadow-md transition"
            >
              <input
                className="w-full font-semibold text-lg mb-2 focus:outline-none bg-transparent"
                value={note.title}
                onChange={(e) =>
                  updateNote(note.id, "title", e.target.value || "Untitled")
                }
              />
              <textarea
                className="w-full flex-1 resize-none focus:outline-none bg-transparent text-sm"
                rows={5}
                value={note.content}
                onChange={(e) =>
                  updateNote(note.id, "content", e.target.value)
                }
              />
              <button
                onClick={() => deleteNote(note.id)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded px-2"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {currentFolder?.notes.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 mt-6">
            No notes in this folder. Create one to get started!
          </p>
        )}
      </main>
    </div>
  );
};

export default NotesApp;
