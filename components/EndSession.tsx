
import React from "react";
import { motion } from "framer-motion";

interface EndScreenProps {
  onRestart: () => void;
}

const EndScreen: React.FC<EndScreenProps> = ({ onRestart }) => {
  return (
    <div className="w-screen h-screen bg-[#060b16] text-white flex flex-col items-center justify-center text-center px-6">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-4"
      >
        🎧 Session Ended
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg text-white/70 max-w-md mb-8"
      >
        Thanks for jamming with <span className="text-[#ff4f6e] font-semibold">DeepJ</span>!  
        Your AI DJ session has ended.  
        Come back anytime to start a new vibe 🎶
      </motion.p>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRestart}
        className="px-6 py-3 rounded-2xl bg-[#ff4f6e] text-white font-semibold shadow-[0_0_25px_rgba(255,79,110,0.6)]"
      >
        Start New Session
      </motion.button>

      <p className="mt-10 text-xs text-white/40">Powered by Gemini AI • DeepJ</p>
    </div>
  );
};

export default EndScreen;
