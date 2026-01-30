import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import QuizHardPenIcon from "./assets/quiz-hard-pen-icon.tsx";
import FlashcardIcon from "./assets/flashcard-icon.tsx";
import CatPenIcon from "@/notes/assets/cat-pen-icon.tsx";

export const AiOrbitAnimation = ({ className }: { className?: string }) => {
  return (
    <div className={cn("relative flex items-center justify-center w-[150px] h-[150px] my-8", className)}>
      
      {/* --- CENTER: AI CORE --- */}
      <div className="relative z-10 flex items-center justify-center">
        {/* Pulsing Glow Effect matching Brand Colors */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-zinc-100 dark:bg-zinc-100 blur-2xl rounded-full w-12 h-12 -z-10"
        />
        
        <div className="relative z-20">
          <CatPenIcon size={48} className="text-zinc-900 dark:text-zinc-100" />
        </div>
      </div>

      {/* ==========================================
          ORBIT 1: FLASHCARDS (Inner - 60px)
      =========================================== */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Visual Orbit Track (Dashed Circle) */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute w-[60px] h-[60px] border border-dashed border-[#3b3b2345] dark:border-zinc-800 rounded-full" 
        />

        {/* Rotator Wrapper */}
        <motion.div
          className="absolute w-[60px] h-[60px]"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          {/* The Icon - Positioned exactly on the line */}
          <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <FlashcardIcon size={22} className="text-black dark:text-zinc-100" />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ==========================================
          ORBIT 2: QUIZ (Outer - 100px)
      =========================================== */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Visual Orbit Track (Dashed Circle) */}
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute w-[100px] h-[100px] border border-dashed border-[#3b3b2345] dark:border-zinc-800 rounded-full" 
        />

        {/* Rotator Wrapper */}
        <motion.div
          className="absolute w-[100px] h-[100px]"
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        >
          {/* The Icon - Positioned exactly on the line */}
          <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              // className="bg-white dark:bg-zinc-950 p-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800 shadow-sm"
            >
              <QuizHardPenIcon size={20} className="text-zinc-900 dark:text-zinc-100" />
            </motion.div>
          </div>
        </motion.div>
      </div>
      
    </div>
  );
};