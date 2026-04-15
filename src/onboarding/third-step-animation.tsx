import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const ThirdStepAnimation = ({ t }: { t: any }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Cycle: Flashcard Front -> Back -> Swap -> Quiz -> Answer -> Swap
    const timer = setInterval(() => {
      setPhase((prev) => (prev + 1) % 5);
    }, 2000); // Slightly slower so they can read the text
    return () => clearInterval(timer);
  }, []);

  const isFlashcardActive = phase === 0 || phase === 1 || phase === 4;
  const isFlashcardFlipped = phase === 1 || phase === 4;
  const isQuizCorrect = phase === 3;

  // --- ANIMATION VARIANTS ---
  const cardVariants = {
    active: {
      x: 0, y: 0, z: 50, scale: 1, zIndex: 20, opacity: 1, rotateZ: 0,
      filter: "brightness(1)",
      transition: { duration: 0.5, type: "spring", stiffness: 120, damping: 20 }
    },
    inactive: (customOffset: number) => ({
      x: customOffset, y: -25, z: -50, scale: 0.9, zIndex: 0, opacity: 0.6,
      rotateZ: customOffset > 0 ? 3 : -3,
      filter: "brightness(0.95)",
      transition: { duration: 0.5, ease: "easeInOut" }
    })
  };

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-sm mx-auto h-full bg-white py-4 pt-0 font-sans tracking-tight">
      
      {/* 1. HEADER */}
      <div className="text-center px-4 mt-4">
        <h2 className="text-3xl font-bold text-muted-foreground-900 tracking-tighter leading-none">
          {t("Quizzes and flashcards")}<br />
          <span className="relative inline-block text-muted-foreground-400 font-semibold text-[14px] mt-5 mb-5 tracking-tight">
            {t("Turn passive notes into active practice")} 
          </span>
        </h2>
      </div>

      {/* 2. 3D STAGE */}
      <div 
        className="relative w-full h-64 flex items-center justify-center"
        style={{ perspective: "1000px" }}
      >
        
        {/* --- REALISTIC FLASHCARD ANIMATION --- */}
        <motion.div
          custom={60} 
          variants={cardVariants}
          animate={isFlashcardActive ? "active" : "inactive"}
          className="absolute w-64 h-48"
          style={{ transformStyle: "preserve-3d" }}
        >
          <motion.div
            className="w-full h-full relative shadow-xl rounded-xl"
            animate={{ rotateY: isFlashcardFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* FRONT (Question) */}
            <div className="absolute inset-0 backface-hidden bg-white border border-slate-200 rounded-xl flex flex-col justify-between overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <p className="font-semibold text-muted-foreground-900 text-xs">{t("Question")}</p>
              </div>
              <div className="flex-1 flex items-center justify-center p-5 text-center">
                <p className="text-sm font-bold text-muted-foreground-800 leading-snug">
                  {t("What was the primary trigger for the start of World War I?")}
                </p>
              </div>
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-right">
                <p className="text-[9px] text-muted-foreground-400 font-medium">{t("Click to reveal")}</p>
              </div>
            </div>

            {/* BACK (Answer) */}
            <div 
              className="absolute inset-0 backface-hidden bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between overflow-hidden"
              style={{ transform: "rotateY(180deg)" }}
            >
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-200/50">
                <p className="font-bold text-green-600 text-xs flex items-center gap-1">
                   {t("Answer")}
                </p>
              </div>
              <div className="flex-1 flex items-center justify-center p-5 text-center">
                <p className="text-[13px] font-medium text-muted-foreground-700 leading-relaxed">
                  {t("The assassination of Archduke Franz Ferdinand of Austria in June 1914.")}
                </p>
              </div>
              <div className="px-4 py-3 border-t border-slate-200 bg-slate-200/50 text-right">
                <p className="text-[9px] text-muted-foreground-500 font-medium">{t("Click to hide")}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* --- REALISTIC QUIZ CARD ANIMATION --- */}
        <motion.div 
          custom={-60}
          variants={cardVariants}
          animate={!isFlashcardActive ? "active" : "inactive"}
          className="absolute w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-4 flex flex-col"
        >
          <div className="mb-4">
             <p className="text-xs font-bold text-muted-foreground-800 mb-1">{t("Question 1 of 10")}</p>
             <p className="text-sm font-semibold text-muted-foreground-700 leading-snug">
               {t("Which event directly triggered World War I?")}
             </p>
          </div>

          <div className="space-y-2">
            
            {/* Option A */}
            <div className="w-full p-2.5 px-3 border border-slate-200 rounded-lg opacity-60 bg-slate-50">
               <p className="text-xs font-medium text-muted-foreground-600">{t("The sinking of the Lusitania")}</p>
            </div>

            {/* Option B (Correct Answer Style) */}
            <motion.div 
              animate={{ 
                backgroundColor: isQuizCorrect ? "#dcfce7" : "#f8fafc",
                borderColor: isQuizCorrect ? "#22c55e" : "#e2e8f0",
                color: isQuizCorrect ? "#166534" : "#475569"
              }}
              className="w-full p-2.5 px-3 border rounded-lg flex items-center justify-between transition-colors duration-300 relative overflow-hidden"
            >
              <p className="text-xs font-medium relative z-10 pr-6">
                {t("Assassination of Archduke Franz Ferdinand")}
              </p>
              
              {isQuizCorrect && (
                 <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-3 z-10">
                    <Check className="h-4 w-4 text-green-600" />
                 </motion.div>
              )}
            </motion.div>
            
          </div>
        </motion.div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
      `}} />
    </div>
  );
};

export default ThirdStepAnimation;