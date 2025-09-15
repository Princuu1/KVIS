import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Lightbulb, Bot, Newspaper, ShoppingCart } from "lucide-react";
import Nav from "@/components/Nav"; // Sidebar

const features = [
  {
    title: "Vision Room",
    description: "Live video class experience for better learning.",
    icon: <Lightbulb className="w-8 h-8 text-indigo-500" />,
  },
 
  {
    title: "Plusewall",
    description: "All campus news, events & memes in one place.",
    icon: <Newspaper className="w-8 h-8 text-pink-500" />,
  },
  {
    title: "Online Ordering",
    description: "Order easily from Canteen, Tuck Shop, and Bahal Market in one place.",
    icon: <ShoppingCart className="w-8 h-8 text-orange-500" />,
  },
];

const Upcoming: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Nav />

      {/* Main content */}
      <main className="md:ml-64 pt-16 pb-10 px-5">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-10 text-gray-800">
          🚀 Upcoming Features
        </h1>

        <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <Card className="rounded-2xl shadow-md hover:shadow-xl transition bg-white">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                  {feature.icon}
                  <h2 className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </h2>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Upcoming;
