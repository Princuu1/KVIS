import React from "react";
import { Github, Linkedin, Instagram, CheckCircle } from "lucide-react";
import Nav from "@/components/Nav"; // Sidebar + Mobile Nav

interface TeamMember {
  name: string;
  university: string;
  img: string;
  socials: {
    github?: string;
    linkedin?: string;
    instagram?: string;
  };
  style?: string;
  position?: string;
}

const team: TeamMember[] = [
  {
    name: "Koushal Sharma",
    university: "BRCM College Of Engineering & Technology",
    img: "/photos/koushal.jpg",
    socials: { github: "#", linkedin: "#", instagram: "#" },
    style: "object-center scale-100",
  },
  {
    name: "Lalit Pandey",
    university: "BRCM College Of Engineering & Technology",
    img: "/photos/lalit.jpeg",
    socials: { github: "#", linkedin: "#", instagram: "#" },
    style: "object-center scale-100",
  },
];

const TeamPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Navigation (sticky) */}
      <Nav />

      {/* Title Section */}
      <div className="pt-20 md:pt-12 md:ml-64 px-4 sm:px-6 lg:px-12">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800">
          Team InnoVision
        </h1>
      </div>

      {/* Team Grid */}
      <main className="md:ml-64 px-4 sm:px-6 lg:px-12 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {team.map((member, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center text-center 
              hover:shadow-xl hover:-translate-y-2 transition-transform duration-300"
            >
              {/* Avatar */}
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-yellow-400 shadow-md mb-5">
                <img
                  src={member.img}
                  alt={member.name}
                  className={`w-full h-full rounded-full object-cover transition-transform duration-500 hover:scale-110 ${member.style ?? ""}`}
                  style={
                    member.position
                      ? { objectPosition: member.position, objectFit: "cover" }
                      : {}
                  }
                />
              </div>

              {/* Name */}
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-1">
                {member.name}
                <CheckCircle className="w-4 h-4 text-blue-500 animate-pulse" />
              </h2>

              {/* Social Links */}
              <div className="flex gap-5 mt-4">
                {member.socials.github && (
                  <a
                    href={member.socials.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
                  >
                    <Github className="w-5 h-5 text-gray-700 hover:text-black" />
                  </a>
                )}
                {member.socials.linkedin && (
                  <a
                    href={member.socials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
                  >
                    <Linkedin className="w-5 h-5 text-gray-700 hover:text-blue-700" />
                  </a>
                )}
                {member.socials.instagram && (
                  <a
                    href={member.socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
                  >
                    <Instagram className="w-5 h-5 text-gray-700 hover:text-pink-600" />
                  </a>
                )}
              </div>

              {/* University */}
              <p className="text-xs text-gray-500 mt-5 uppercase tracking-wide">
                {member.university}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default TeamPage;
