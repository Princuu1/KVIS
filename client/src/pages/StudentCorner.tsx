"use client";

import React from "react";
import Nav from "@/components/Nav";
import { useLocation } from "wouter";
import {
  BookOpen,
  Users,
  Calendar,
  FileText,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Option = {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
  description: string;
};

type Section = {
  title: string;
  options: Option[];
};

const sections: Section[] = [
  {
    title: "📚 Academics",
    options: [
      {
          id: "Studytracker",
          label: "Study Tracker",
          path: "/studytracker",
          icon: BookOpen,
          description: ""
      },
      {
          id: "Syllabustracker",
          label: "Syllabus Tracker",
          path: "/syllabustracker",
          icon: Calendar,
          description: ""
      },
      {
          id: "notes",
          label: "Notes",
          path: "/notes",
          icon: FileText,
          description: ""
      },
    ],
  },
  {
    title: "🗓️ Planning & Activities",
    options: [
      {
          id: "timetable",
          label: "Timetable",
          path: "/timetable",
          icon: Users,
          description: ""
      },
      {
          id: "Todaysgoal",
          label: "Today's Goal",
          path: "/todaysgoal",
          icon: MessageSquare,
          description: ""
      },
    ],
  },
];

export default function StudentCorner() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Nav />

      <main className="md:ml-64 pt-24 md:pt-8 pb-20 md:pb-8 max-w-6xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
          Student Corner
        </h1>

        {sections.map((section) => (
          <div key={section.title} className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
              {section.title}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {section.options.map((opt) => {
                const Icon = opt.icon;
                return (
                  <Card
                    key={opt.id}
                    onClick={() => setLocation(opt.path)}
                    className="cursor-pointer hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl"
                  >
                    <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                      <div className="w-14 h-14 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                        <Icon className="w-7 h-7 text-blue-600 dark:text-blue-300" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {opt.label}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {opt.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
