import React from "react";
import { Github, Linkedin, Instagram, CheckCircle } from "lucide-react";
import Nav from "@/components/Nav"; // Sidebar

interface TeamMember {
  name: string;
  university: string;
  img: string;
  socials: {
    github?: string;
    linkedin?: string;
    instagram?: string;
  };
  style?: string;       // Tailwind classes for object-fit, scale, etc.
  position?: string;    // Custom object-position (e.g. "30% 50%")
}

const team: TeamMember[] = [
  {
    name: "Koushal",
    university: "BRCM College Of Engineering & Technology",
    img: "/photos/koushal.jpg",
    socials: { github: "#", linkedin: "#", instagram: "#" },
    style: "object-center scale-100", // default
  },
  {
    name: "Vanshika",
    university: "BRCM College Of Engineering & Technology",
    img: "/photos/Vanshika.jpeg",
    socials: { github: "#", linkedin: "#", instagram: "#" },
    style: "scale-100",       // zoom in
    position: "40% 40%",      // move focus slightly right
  },
  {
    name: "Sania",
    university: "BRCM College Of Engineering & Technology",
    img: "/photos/saniya.jpeg",
    socials: { github: "#", linkedin: "#", instagram: "#" },
    style: "scale-100",      
    position: "30% 30%",     
  },
  {
    name: "Soniya",
    university: "BRCM College Of Engineering & Technology",
    img: "/photos/soniya2.jpeg",
    socials: { github: "#", linkedin: "#", instagram: "#" },
    style: "scale-100",       // zoom in
    position: "40% 40%",      // move focus slightly upward
  },
];

const TeamPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Nav />

      {/* Main content */}
      <main className="md:ml-64 py-12 px-6">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">
          Team InnoVision
        </h1>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
          {team.map((member, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition"
            >
              {/* Avatar */}
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-yellow-400 mb-4 flex items-center justify-center">
                <img
                  src={member.img}
                  alt={member.name}
                  className={`w-full h-full rounded-full object-cover ${member.style ?? ""}`}
                  style={
                    member.position
                      ? { objectPosition: member.position, objectFit: "cover" }
                      : {}
                  }
                />
              </div>

              {/* Name */}
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-1">
                {member.name} <CheckCircle className="w-4 h-4 text-blue-500" />
              </h2>

              {/* Social Links */}
              <div className="flex gap-4 mt-4">
                {member.socials.github && (
                  <a
                    href={member.socials.github}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="w-5 h-5 text-gray-700 hover:text-black" />
                  </a>
                )}
                {member.socials.linkedin && (
                  <a
                    href={member.socials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Linkedin className="w-5 h-5 text-gray-700 hover:text-blue-700" />
                  </a>
                )}
                {member.socials.instagram && (
                  <a
                    href={member.socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Instagram className="w-5 h-5 text-gray-700 hover:text-pink-600" />
                  </a>
                )}
              </div>

              {/* University */}
              <p className="text-xs text-gray-500 mt-4 uppercase tracking-wide">
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
