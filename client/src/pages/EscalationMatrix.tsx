// EscalationMatrix.tsx
import React from "react";
import Nav from "@/components/Nav"; // Sidebar

type Teacher = {
  id: string;
  name: string;
  rank: string;
  email: string;
  phone: string;
};

type Department = {
  id: string;
  name: string;
  teachers: Teacher[];
};

const escalationData: Department[] = [
 {
  id: "cse",
  name: "Computer Science & Engineering",
  teachers: [
    { 
      id: "cse1", 
      name: "Dr. Amit Rajan", 
      rank: "Head of Department", 
      email: "hodcse@brcm.edu.in", 
      phone: "8059900250" 
    },
    { 
      id: "cse2", 
      name: "Jyotish", 
      rank: "Professor", 
      email: "Jyotish@brcm.edu.in", 
      phone: "6200086078" 
    },
    { 
      id: "cse3", 
      name: "Dimple Tawar", 
      rank: "Assistant Professor", 
      email: "dimpletawar@brcm.edu.in", 
      phone: "9729228155" 
    },
  ],
},

  {
    id: "me",
    name: "Mechanical Engineering",
    teachers: [
      { id: "me1", name: "Dr. R. Mehta", rank: "Head of Department", email: "rmehta@brcm.edu.in", phone: "9876543220" },
      { id: "me2", name: "Prof. S. Yadav", rank: "Professor", email: "syadav@brcm.edu.in", phone: "9876543221" },
      { id: "me3", name: "Mr. T. Patel", rank: "Lecturer", email: "tpatel@brcm.edu.in", phone: "9876543222" },
    ],
  },
  {
    id: "ee",
    name: "Electrical Engineering",
    teachers: [
      { id: "ee1", name: "Dr. P. Nair", rank: "Head of Department", email: "pnair@brcm.edu.in", phone: "9876543230" },
      { id: "ee2", name: "Prof. K. Reddy", rank: "Professor", email: "kreddy@brcm.edu.in", phone: "9876543231" },
      { id: "ee3", name: "Ms. L. Das", rank: "Assistant Professor", email: "ldas@brcm.edu.in", phone: "9876543232" },
    ],
  },
];

// rank priority for sorting
const rankPriority: Record<string, number> = {
  "Head of Department": 0,
  "HOD": 0,
  "Professor": 1,
  "Associate Professor": 2,
  "Assistant Professor": 3,
  "Lecturer": 4,
};

const EscalationMatrix: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Nav />

      {/* Main content */}
      <main className="md:ml-64 pt-16 pb-10 px-5">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-10 text-gray-800">
          📊 Escalation Matrix
        </h1>

        {escalationData.map((dept) => {
          const sortedTeachers = [...dept.teachers].sort((a, b) => {
            const pa = rankPriority[a.rank] ?? 99;
            const pb = rankPriority[b.rank] ?? 99;
            return pa - pb;
          });

          return (
            <div key={dept.id} className="mb-10">
              <h2 className="text-2xl font-semibold mb-5 text-indigo-600">
                {dept.name}
              </h2>

              <div className="grid gap-6 md:grid-cols-3">
                {sortedTeachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition"
                  >
                    <h3 className="text-lg font-bold mb-2">{teacher.name}</h3>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {teacher.rank}
                    </p>
                    <p className="text-sm mb-1">
                      📧{" "}
                      <a
                        href={`mailto:${teacher.email}`}
                        className="text-indigo-600 hover:underline"
                      >
                        {teacher.email}
                      </a>
                    </p>
                    <p className="text-sm">
                      📞{" "}
                      <a
                        href={`tel:${teacher.phone}`}
                        className="text-indigo-600 hover:underline"
                      >
                        {teacher.phone}
                      </a>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
};

export default EscalationMatrix;
