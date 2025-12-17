import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const screenshots = [
  { id: 1, label: "Dashboard" },
  { id: 2, label: "Health Tracking" },
  { id: 3, label: "Vet Finder" },
  { id: 4, label: "AI Assistant" },
];

export default function AppPreviewCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % screenshots.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [paused]);

  return (
    <div
      className="relative max-w-sm mx-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* PHONE FRAME */}
      <div className="relative aspect-[9/16] rounded-[32px] bg-gradient-to-br from-black to-[#151522] border border-white/10 overflow-hidden shadow-2xl">

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* PLACEHOLDER SCREEN */}
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
              {screenshots[index].label}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* DOTS */}
      <div className="flex justify-center gap-2 mt-4">
        {screenshots.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-2.5 h-2.5 rounded-full transition ${
              i === index
                ? "bg-indigo-400"
                : "bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
