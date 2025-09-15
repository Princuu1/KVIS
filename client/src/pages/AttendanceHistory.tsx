"use client";

import React, { useState } from "react";
import Nav from "@/components/Nav";
import { useAttendance, AttendanceRecord } from "@/hooks/useattendance";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function AttendanceHistory() {
  const [dateFilter, setDateFilter] = useState(""); // filter by day
  const { data, isLoading, isError } = useAttendance();

  if (isLoading)
    return (
      <div className="pt-28 text-center text-gray-500 dark:text-gray-300">
        Loading attendance...
      </div>
    );
  if (isError)
    return (
      <div className="pt-28 text-center text-red-600">
        Failed to load attendance.
      </div>
    );

  let records: AttendanceRecord[] = data?.records ?? [];

  // Apply date filter
  if (dateFilter) {
    records = records.filter(
      (rec) =>
        new Date(rec.date).toLocaleDateString() ===
        new Date(dateFilter).toLocaleDateString()
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation (Header + Sidebar + Bottom Nav) */}
      <Nav />

      {/* Page Content */}
      <main className="md:ml-64 pt-24 md:pt-8 pb-20 md:pb-8 max-w-6xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
          Attendance History
        </h1>

        {/* Date Filter */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Label
            htmlFor="filterDate"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Filter by Day:
          </Label>
          <Input
            id="filterDate"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border rounded p-2 dark:bg-gray-800 dark:text-white"
          />
          {dateFilter && (
            <Button
              onClick={() => setDateFilter("")}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Attendance Table */}
        <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-lg">
          <table className="min-w-full border-collapse">
            <thead className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold">
              <tr>
                <th className="border px-4 py-2 text-left">Date</th>
                <th className="border px-4 py-2 text-left">Subject</th>
                <th className="border px-4 py-2 text-left">Status</th>
                <th className="border px-4 py-2 text-left">Reason</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-6 text-gray-500 dark:text-gray-400"
                  >
                    No records found for this day.
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="border px-4 py-2">
                      {new Date(rec.date).toLocaleDateString()}
                    </td>
                    <td className="border px-4 py-2">
                      {rec.subject ?? "-"}
                    </td>
                    <td
                      className={`border px-4 py-2 font-semibold ${
                        rec.status === "present"
                          ? "text-green-600"
                          : rec.status === "absent"
                          ? "text-red-600"
                          : "text-orange-600"
                      }`}
                    >
                      {rec.status.toUpperCase()}
                    </td>
                    <td className="border px-4 py-2">
                      {rec.reason ?? "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
