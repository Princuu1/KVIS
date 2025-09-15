import React, { useState } from "react";
import Nav from "@/components/Nav"; // Sidebar

const Feedback: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    rollNo: "",
    className: "",
    email: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          description: formData.description,
        }),
      });

      if (res.ok) {
        setMessage("✅ Feedback submitted successfully! A confirmation email has been sent.");
        setFormData({
          name: "",
          rollNo: "",
          className: "",
          email: "",
          description: "",
        });
      } else {
        const errorData = await res.json();
        setMessage(`❌ Failed: ${errorData.error || "Something went wrong."}`);
      }
    } catch (error) {
      console.error("Feedback submit error:", error);
      setMessage("⚠️ Something went wrong while sending feedback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Nav />

      {/* Main content */}
      <main className="md:ml-64 pt-16 pb-10 px-5 flex items-center justify-center">
        <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-lg">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Student Feedback / Complaint
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <input
              type="text"
              name="rollNo"
              placeholder="Roll No"
              value={formData.rollNo}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              name="className"
              placeholder="Class"
              value={formData.className}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <textarea
              name="description"
              placeholder="Write your feedback or complaint..."
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold p-3 rounded-xl transition"
            >
              {loading ? "Sending..." : "Submit Feedback"}
            </button>
          </form>

          {message && (
            <p className="mt-4 text-center font-medium text-gray-700">
              {message}
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Feedback;
