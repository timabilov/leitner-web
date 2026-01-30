import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, RefreshCw, Check } from 'lucide-react';

const AnimatedUnderline = ({ color = "#e2e8f0" }: { color?: string }) => (
  <motion.svg className="absolute -bottom-1 left-0 w-full h-2 pointer-events-none" viewBox="0 0 100 10" preserveAspectRatio="none">
    <motion.path d="M 0 5 Q 25 2, 50 5 Q 75 8, 100 5" fill="transparent" stroke={color} strokeWidth="2.5" strokeLinecap="round" 
      initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ delay: 0.8, duration: 0.8 }} />
  </motion.svg>
);

const FinalStepAnimation = ({ t }: { t: any }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Cycle: Flashcard Front -> Back -> Swap -> Quiz -> Answer -> Swap
    const timer = setInterval(() => {
      setPhase((prev) => (prev + 1) % 5);
    }, 1500); 
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
        <h2 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none">
          {t("Knowledge")}<br />
          <span className="relative inline-block text-slate-400 font-semibold text-xl mt-2 tracking-tight">
            {t("Supercharged")} <AnimatedUnderline />
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
            className="w-full h-full relative"
            animate={{ rotateY: isFlashcardFlipped ? 180 : 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 260, damping: 20 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* FRONT (Question) */}
            <div className="absolute inset-0 backface-hidden bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col justify-between overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <p className="font-semibold text-slate-900 text-xs">{t("Question")}</p>
              </div>
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="space-y-2 w-full flex flex-col items-center">
                   <div className="h-2 w-3/4 bg-slate-200 rounded-full" />
                   <div className="h-2 w-1/2 bg-slate-200 rounded-full" />
                </div>
              </div>
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-right">
                <p className="text-[9px] text-slate-400">{t("Click to reveal")}</p>
              </div>
            </div>

            {/* BACK (Answer) */}
            <div 
              className="absolute inset-0 backface-hidden bg-slate-100 border border-slate-200 rounded-xl shadow-lg flex flex-col justify-between overflow-hidden"
              style={{ transform: "rotateY(180deg)" }}
            >
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-200/50">
                <p className="font-semibold text-green-600 text-xs">{t("Answer")}</p>
              </div>
              <div className="flex-1 flex items-center justify-center p-4">
                 <div className="space-y-2 w-full flex flex-col items-center">
                   <div className="h-2 w-2/3 bg-green-200 rounded-full" />
                </div>
              </div>
              <div className="px-4 py-3 border-t border-slate-200 bg-slate-200/50 text-right">
                <p className="text-[9px] text-slate-500">{t("Click to hide")}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* --- REALISTIC QUIZ CARD ANIMATION --- */}
        <motion.div 
          custom={-60}
          variants={cardVariants}
          animate={!isFlashcardActive ? "active" : "inactive"}
          className="absolute w-64 h-52 bg-white border border-slate-200 rounded-xl shadow-lg p-4 flex flex-col"
        >
          <div className="mb-4">
             <div className="h-3 w-1/2 bg-slate-800 rounded-full mb-2" />
             <div className="h-2 w-full bg-slate-100 rounded-full" />
          </div>

          <div className="space-y-2">
            {/* Option A (Correct Answer Style) */}
            <motion.div 
              animate={{ 
                backgroundColor: isQuizCorrect ? "#dcfce7" : "transparent",
                borderColor: isQuizCorrect ? "#22c55e" : "#e2e8f0",
                color: isQuizCorrect ? "#166534" : "inherit"
              }}
              className="w-full p-3 border rounded-lg flex items-center justify-between transition-all duration-300 relative overflow-hidden"
              style={{ borderWidth: isQuizCorrect ? '2px' : '1px' }}
            >
              <div className="flex items-center gap-2">
                 <div className="w-16 h-2 bg-current opacity-30 rounded-full" />
              </div>
              {isQuizCorrect && (
                 <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <Check className="h-3.5 w-3.5" />
                 </motion.div>
              )}
            </motion.div>

            {/* Option B */}
            <div className="w-full p-3 border border-slate-200 rounded-lg opacity-60">
               <div className="w-12 h-2 bg-slate-200 rounded-full" />
            </div>

             {/* Option C */}
             <div className="w-full p-3 border border-slate-200 rounded-lg opacity-60">
               <div className="w-14 h-2 bg-slate-200 rounded-full" />
            </div>
          </div>
        </motion.div>

      </div>

      {/* 3. FOOTER */}
      <div className="w-full px-8 text-center pb-2">
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center justify-center gap-2 text-slate-500 font-medium text-[13px] tracking-tight">
            <CheckCircle2 size={15} className="text-slate-900" />
            {t("Turn passive notes into active practice")}
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-500 font-medium text-[13px] tracking-tight">
            <CheckCircle2 size={15} className="text-slate-900" />
            {t("Master concepts through smart repetition")}
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-slate-900 tracking-tighter leading-none">
          {t("Study half the time.")}<br />
          <span className="text-slate-400 font-semibold text-lg mt-1 inline-block tracking-tight">
            {t("Remember forever.")}
          </span>
        </h3>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
      `}} />
    </div>
  );
};

export default FinalStepAnimation;