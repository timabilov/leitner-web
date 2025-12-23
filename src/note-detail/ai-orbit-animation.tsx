import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils"; // Assuming you have this, otherwise remove
import AIIcon from "@/note-detail/ai-icon"; // Your AI Icon
import QuizHardPenIcon from "./quiz-hard-pen-icon.tsx"; // Your Quiz Icon
import FlashcardIcon from "./flashcard-icon.tsx"; // Your Flashcard Icon

export const AiOrbitAnimation = ({}) => {
  return (
    <div className="relative flex items-center justify-center w-64 h-64 my-8" >
      
      {/* --- CENTER: AI CORE --- */}
      <div className="relative z-10 flex items-center justify-center">
        {/* Pulsing Glow Effect behind AI */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-primary/20 blur-xl rounded-full w-10 h-10 -z-10"
        />
        
        {/* The Static AI Icon */}
        <div className=" shadow-lg relative z-20">
          <AIIcon className="w-8 h-8 text-primary" />
        </div>
      </div>

      {/* ==============================
          ORBIT 1: FLASHCARDS (Inner) 
      =============================== */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Visual Orbit Track (Dashed Circle) */}
        <div className="absolute w-20 h-20 border border-dashed border-primary/20 rounded-full" />

        {/* Rotator Wrapper */}
        <motion.div
          className="absolute w-7 h-7"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          {/* The "Planet" (Icon) - Positioned at Top */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2">
            {/* Counter-Rotator (Keeps icon upright) */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="shadow-md"
            >
              <FlashcardIcon className="w-4 h-4 text-indigo-500" />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ==============================
          ORBIT 2: QUIZ (Outer) 
      =============================== */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Visual Orbit Track (Dashed Circle) */}
        <div className="absolute w-20 h-20 border border-dashed border-primary/20 rounded-full" />

        {/* Rotator Wrapper - Slower duration (12s) for depth */}
        <motion.div
          className="absolute w-10 h-14"
          animate={{ rotate: -360 }} // Rotate opposite direction for visual interest
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        >
          {/* The "Planet" (Icon) - Positioned at Bottom this time */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
            {/* Counter-Rotator */}
            <motion.div
              animate={{ rotate: 360 }} // Counter the parent's -360
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className=" shadow-md z-30"
            >
              <QuizHardPenIcon className="w-4 h-4 text-orange-500" />
            </motion.div>
          </div>
        </motion.div>
      </div>
      
    </div>
  );
};