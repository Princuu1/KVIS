"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const YEARS = [
  { year: 1, label: "1st Year", pdf: "/photos/H_SCHEME FIRST YEAR_DRAFT SYLLABUS (1) (1).pdf" },
  { year: 2, label: "2nd Year", pdf: "photos/n66ebff887bc67 (1).pdf" },
  { year: 3, label: "3rd Year", pdf: "/photos/n66ebff7f5d540 (2).pdf" },
  { year: 4, label: "4th Year", pdf: "/photos/n66ebff9226eca (1).pdf" },
];

export default function Syllabus() {
  const [selectedYear, setSelectedYear] = useState("1"); // default: 2nd Year

  const current = YEARS.find((y) => String(y.year) === selectedYear);

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <main className="pt-16 md:pt-0 md:ml-64 min-h-screen p-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Course Syllabus</h2>

          {/* Year Selector Dropdown */}
          <div className="mb-8 w-64">
            <Label htmlFor="year">Select Year</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="year" className="mt-2">
                <SelectValue placeholder="Choose a Year" />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y.year} value={String(y.year)}>
                    {y.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Display PDF or Coming Soon */}
          <Card>
            <CardContent className="p-6">
              {current?.pdf ? (
                <div className="w-full h-[80vh]">
                  <iframe
                    src={current.pdf}
                    className="w-full h-full border rounded-lg"
                    title={`${current.label} Syllabus`}
                  />
                </div>
              ) : (
                <div className="text-center py-20">
                  <h3 className="text-xl font-semibold mb-2">
                    {current?.label} Syllabus
                  </h3>
                  <p className="text-muted-foreground">Coming Soon 🚀</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
