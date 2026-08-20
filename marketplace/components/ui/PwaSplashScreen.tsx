"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function PwaSplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Dismiss splash screen smoothly after app hydration (600ms)
    const timer = setTimeout(() => {
      setVisible(false);
    }, 650);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 select-none pointer-events-none"
        >
          <div className="flex flex-col items-center gap-6">
            {/* Logo Ayiba Icon Animated Scale */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-20 h-20 flex items-center justify-center"
            >
              <div className="absolute inset-0 rounded-3xl bg-coral-500/10 animate-ping" />
              <img
                src="/logo.png"
                alt="Ayiba Logo"
                className="w-20 h-20 object-contain drop-shadow-md relative z-10"
              />
            </motion.div>

            {/* Letter-by-Letter Animated Text "AYIBA" in Coral */}
            <div className="flex items-center gap-1 overflow-hidden">
              {["A", "Y", "I", "B", "A"].map((letter, index) => (
                <motion.span
                  key={index}
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: 0.1 + index * 0.07,
                    duration: 0.4,
                    ease: "easeOut",
                  }}
                  className="text-3xl sm:text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-coral-600 via-coral-500 to-coral-600 drop-shadow-sm"
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.3 }}
              className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400"
            >
              Marketplace de proximité
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
