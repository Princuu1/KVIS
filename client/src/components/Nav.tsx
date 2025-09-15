"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import {
  Home,
  Calendar,
  History,
  MessageCircle,
  FileText,
  CalendarCheck,
  Moon,
  Sun,
  Bot,
  Bell,
  LogOut,
  Clock,
  Users,
  BookOpen,
  MessageSquare,
} from "lucide-react";

type NavItem = {
  id: string;
  path: string;
  label: string;
  icon: React.ComponentType<any>;
  mobileLabel?: string;
};

const navItems: NavItem[] = [
  { id: "home", path: "/", label: "Home", icon: Home, mobileLabel: "Home" },
  { id: "attendance", path: "/attendance", label: "Mark Attendance", icon: CalendarCheck, mobileLabel: "Attend" },
  { id: "history", path: "/history", label: "Attendance History", icon: History, mobileLabel: "History" },
  { id: "chat", path: "/chat", label: "Chat Room", icon: MessageCircle, mobileLabel: "Chat" },
  { id: "saarthi", path: "/saarthi", label: "Saarthi", icon: Bot, mobileLabel: "Saarthi" },
  { id: "calendar", path: "/calendar", label: "Calendar", icon: Calendar, mobileLabel: "Calendar" },
  { id: "exams", path: "/exams", label: "Exam Schedule", icon: FileText, mobileLabel: "Exams" },
  { id: "student-corner", path: "/studentcorner", label: "Student Corner", icon: Users, mobileLabel: "Corner" },
  { id: "syllabus", path: "/syllabus", label: "Syllabus", icon: BookOpen, mobileLabel: "Syllabus" },
  { id: "upcoming", path: "/upcoming", label: "Upcoming", icon: Clock, mobileLabel: "Upcoming" },
  { id: "escalation", path: "/escalationmatrix", label: "Escalation Matrix", icon: Users, mobileLabel: "Matrix" },
  { id: "developers", path: "/devlopers", label: "Developers", icon: Users, mobileLabel: "Devs" },
  { id: "feedback", path: "/feedback", label: "Feedback", icon: MessageSquare, mobileLabel: "Feedback" },
];

export default function Nav() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .trim()
      .split(/\s+/)
      .map((n) => n[0]?.toUpperCase())
      .join("");
  };

  const initials = getInitials(
    user?.fullName || user?.collegeRollNo || user?.email
  );

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo + App Name */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img
                src="/photos/kvislogo.jpeg"
                alt="KVIS"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-lg font-semibold text-foreground dark:text-white">
              KVIS
            </h1>
          </div>

          {/* Right Buttons */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-accent rounded-lg"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-yellow-400" />
              ) : (
                <Moon className="w-4 h-4 text-gray-700 dark:text-gray-200" />
              )}
            </button>

            {/* Notifications */}
            <button className="p-2 hover:bg-accent rounded-lg" aria-label="Notifications">
              <Bell className="w-4 h-4 text-gray-700 dark:text-gray-200" />
            </button>

            {/* Logout */}
            <button
              onClick={() => logout()}
              className="p-2 hover:bg-accent rounded-lg"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4 text-gray-700 dark:text-gray-200" />
            </button>

            {/* Avatar */}
            <div
              onClick={() => setLocation("/profile")}
              className="w-8 h-8 rounded-full overflow-hidden cursor-pointer"
              role="button"
              aria-label="Profile"
            >
              {user?.idPhotoUrl ? (
                <img
                  src={user.idPhotoUrl}
                  alt={user.fullName || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary dark:bg-gray-600">
                  <span className="text-xs font-medium text-secondary-foreground dark:text-gray-100">
                    {initials}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-40 flex-col">
        <div className="p-6 flex flex-col h-full">
          {/* Logo (top) */}
          <div className="flex items-center space-x-3 mb-6 flex-shrink-0">
            <div className="w-14 h-14 rounded-full overflow-hidden">
              <img
                src="/photos/kvislogo.jpeg"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">KVIS</h1>
              <p className="text-sm text-muted-foreground">Student Portal</p>
            </div>
          </div>

          {/* Scrollable Nav Links (middle) */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              // wouter's useLocation returns current path as string
              const isActive = location === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => setLocation(item.path)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent text-muted-foreground"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="w-5 h-5" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Fixed Bottom Section (User + Actions) */}
          <div className="pt-4 border-t border-border flex-shrink-0">
            <div
              onClick={() => setLocation("/profile")}
              className="flex items-center space-x-3 px-3 py-2 mb-2 cursor-pointer"
              role="button"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden">
                {user?.idPhotoUrl ? (
                  <img
                    src={user.idPhotoUrl}
                    alt={user.fullName || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary">
                    <span className="text-xs font-medium text-secondary-foreground">
                      {initials}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.fullName || user?.email || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.collegeRollNo || "N/A"}
                </p>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors text-left"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>

            <button
              onClick={toggleTheme}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors text-left"
            >
              {isDark ? (
                <>
                  <Sun className="w-5 h-5" />
                  <span>Dark</span>
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5" />
                  <span>Light</span>
                </>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
        <div className="flex h-16 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <button
                key={item.id}
                onClick={() => setLocation(item.path)}
                className={`flex flex-col flex-shrink-0 w-16 items-center justify-center space-y-1 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                aria-label={item.label}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] truncate max-w-[52px]">
                  {item.mobileLabel || item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
