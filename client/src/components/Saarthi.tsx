"use client";
import React, { useState, useEffect, useRef } from "react";
import Nav from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Moon, Sun } from "lucide-react";

type Message = { role: "user" | "bot"; text: string };

export default function Saarthi() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const API_KEY = "AIzaSyCWf3Mns_j2efwzOS5G7JmZU_2FD5eDjk0";

  // Load chat + theme
  useEffect(() => {
    const stored = localStorage.getItem("saarthi-chat");
    if (stored) setMessages(JSON.parse(stored));
    const theme = localStorage.getItem("saarthi-theme");
    if (theme) setDarkMode(theme === "dark");
  }, []);

  // Save chat + theme
  useEffect(() => {
    localStorage.setItem("saarthi-chat", JSON.stringify(messages));
  }, [messages]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("saarthi-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": API_KEY,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: input }] }],
          }),
        }
      );

      const data = await res.json();
      const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "⚠️ No response from Saarthi.";
      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "❌ Failed to connect to Saarthi." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      } min-h-screen flex flex-col`}
    >
      <Nav />

      {/* Chat Container */}
      <div className="flex-1 flex justify-center px-2 sm:px-4 mt-4">
        <div className="w-full max-w-4xl flex flex-col border rounded-lg shadow-md h-[calc(100vh-80px)]">
          {/* Header */}
          <header
            className={`p-3 sm:p-4 border-b flex justify-between items-center ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <h1 className="text-base sm:text-lg font-bold">Saarthi</h1>
            <div className="flex gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setMessages([]);
                  localStorage.removeItem("saarthi-chat");
                }}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </header>

          {/* Chat Window */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-3 py-2 sm:px-4 sm:py-2 rounded-2xl max-w-[85%] sm:max-w-[75%] text-sm sm:text-base shadow ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : darkMode
                      ? "bg-gray-700 text-gray-100 rounded-bl-none"
                      : "bg-gray-200 text-gray-800 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div
                  className={`px-3 py-2 rounded-2xl flex space-x-2 ${
                    darkMode ? "bg-gray-700" : "bg-gray-200"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full animate-bounce bg-gray-500"></span>
                  <span className="w-2 h-2 rounded-full animate-bounce delay-150 bg-gray-500"></span>
                  <span className="w-2 h-2 rounded-full animate-bounce delay-300 bg-gray-500"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </main>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className={`p-2 sm:p-3 border-t flex gap-2 items-center ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <Input
              type="text"
              placeholder="Ask Saarthi..."
              className="flex-1 text-sm sm:text-base"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "..." : "➤"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
