"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    particlesJS: any;
  }
}

export default function BackgroundAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/particles.js"; // ✅ must be in public/ folder
    script.async = true;

    script.onload = () => {
      if (window.particlesJS) {
        window.particlesJS.load(
          "particles-container",
          "/particlesjs-config (1).json", // ✅ config also in public/
          () => {
            console.log("Particles.js loaded successfully 🎆");
          }
        );
      } else {
        console.error("particlesJS is not available on window.");
      }
    };

    script.onerror = () => {
      console.error("Failed to load particles.js");
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div
      id="particles-container"
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
