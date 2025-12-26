import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2, Zap, HelpCircle, GraduationCap, RefreshCw } from 'lucide-react';

/**
 * Shadcn-style Animated Underline
 */
const AnimatedUnderline = ({ color = "#e2e8f0" }: { color?: string }) => (
  <motion.svg className="absolute -bottom-1 left-0 w-full h-2 pointer-events-none" viewBox="0 0 100 10" preserveAspectRatio="none">
    <motion.path d="M 0 5 Q 25 2, 50 5 Q 75 8, 100 5" fill="transparent" stroke={color} strokeWidth="2.5" strokeLinecap="round" 
      initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ delay: 0.8, duration: 0.8 }} />
  </motion.svg>
);

const FinalStepAnimation = ({ t }: { t: any }) => {
  // Phase 0: Flashcard Hero (Front)
  // Phase 1: Flashcard Flip (Reveal Answer)
  // Phase 2: Quiz Swap (Quiz comes to front)
  // Phase 3: Quiz Correct (Green selection)
  // Phase 4: 3D ROLL OVER (Flashcard leaps over Quiz to start again)
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhase((prev) => (prev + 1) % 5);
    }, 2200); 
    return () => clearInterval(timer);
  }, []);

  const isFlipped = phase >= 1 && phase <= 4;
  const isQuizHero = phase === 2 || phase === 3;
  const isCorrect = phase === 3;
  const isRolling = phase === 4;

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-sm mx-auto h-full bg-white py-4 font-sans tracking-tight">
      
      {/* 1. HEADER SECTION */}
      <div className="text-center px-4">
        {/* <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-medium uppercase tracking-wider mb-4">
          <GraduationCap size={12} /> {t("The Mastery Result")}
        </div> */}
        
        <h2 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none">
          {t("Knowledge")}<br />
          <span className="relative inline-block text-slate-400 font-semibold text-xl mt-2 tracking-tight">
            {t("Supercharged")} <AnimatedUnderline />
          </span>
        </h2>
      </div>

      {/* 2. VISUAL ANIMATION AREA: THE 3D SLIDER */}
      <div className="relative w-full h-72 flex items-center justify-center overflow-visible mt-4">
        
        {/* --- FLASHCARD LAYER --- */}
        <div className="perspective-1000 w-52 h-40 absolute">
          <motion.div
            animate={{ 
              rotateY: isFlipped ? 180 : 0,
              // The 3D Roll: Card arches UP (-120) and back to center
              y: isRolling ? [-120, 0] : (isQuizHero ? 30 : 0),
              x: isQuizHero ? 40 : 0,
              scale: isQuizHero ? 0.85 : (isRolling ? 1.05 : 1),
              zIndex: isQuizHero ? 10 : 50, 
            }}
            transition={{ 
              duration: isRolling ? 0.8 : 0.6, 
              type: isRolling ? "keyframes" : "spring",
              stiffness: 200, 
              damping: 22 
            }}
            style={{ transformStyle: "preserve-3d" }}
            className="w-full h-full relative"
          >
            {/* FRONT (Solid White) */}
            <div className="absolute inset-0 backface-hidden bg-white border border-slate-200 rounded-lg shadow-md p-5 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-50 pb-2">
                <Zap size={14} className="text-amber-400" />
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t("Flashcards")}</span>
              </div>
              <div className="space-y-2">
                <div className="h-1.5 w-full bg-slate-50 rounded-full" />
                <div className="h-1.5 w-2/3 bg-slate-50 rounded-full" />
              </div>
              <div className="flex justify-center pt-2">
                <RefreshCw size={14} className="text-slate-100 animate-spin-slow" />
              </div>
            </div>

            {/* BACK (Solid Slate-900) */}
            <div 
              className="absolute inset-0 backface-hidden bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between shadow-2xl"
              style={{ transform: "rotateY(180deg)" }}
            >
              <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                <Sparkles size={16} className="text-blue-400" />
                <span className="text-[11px] font-semibold text-white/30 uppercase tracking-wider">{t("Answer")}</span>
              </div>
              <div className="space-y-2">
                <div className="h-1.5 w-full bg-white/10 rounded-full" />
                <div className="h-1.5 w-1/2 bg-white/5 rounded-full" />
              </div>
              <div className="flex justify-center pt-2">
                <CheckCircle2 size={16} className="text-blue-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* --- QUIZ CARD LAYER --- */}
        <div className="perspective-1000 w-52 h-44 absolute">
          <motion.div 
            animate={{ 
              x: isQuizHero ? 0 : -40, 
              y: isQuizHero ? 0 : 30,
              scale: isQuizHero ? 1 : 0.85,
              zIndex: isQuizHero ? 40 : 5, 
              // When flashcard rolls over, quiz card tilts back
              rotateX: isRolling ? 15 : 0,
            }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformStyle: "preserve-3d" }}
            className="w-full h-full relative"
          >
            <div className="absolute inset-0 bg-white border border-slate-200 rounded-lg shadow-md p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
                <HelpCircle size={14} className="text-blue-600" />
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t("Active Quiz")}</span>
              </div>
              <div className="space-y-3">
                <div className="h-1.5 w-full bg-slate-100 rounded-full" />
                <motion.div 
                  animate={{ 
                    backgroundColor: isCorrect ? "#10b981" : "#ffffff", 
                    borderColor: isCorrect ? "#059669" : "#e2e8f0",
                    color: isCorrect ? "#ffffff" : "#64748b" 
                  }}
                  className="h-9 w-full rounded-md border flex items-center px-3 text-[11px] font-semibold shadow-sm"
                >
                  {isCorrect ? `✓ ${t("Correct")}` : t("Select Option")}
                </motion.div>
                <div className="h-9 w-full rounded-md border border-slate-50 bg-slate-50/50 flex items-center px-3 text-[11px] font-medium text-slate-300">
                  {t("Option B")}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Ambient Bloom */}
        <motion.div 
          animate={{ opacity: isCorrect ? 0.3 : 0.05, scale: isCorrect ? 1.4 : 1 }}
          className="absolute inset-0 bg-emerald-50/50 blur-3xl -z-10 rounded-full"
        />
      </div>

      {/* 3. FOOTER SECTION */}
      <div className="w-full text-center">
        <div className="grid grid-cols-2 gap-2.5 mb-8 px-4">
          <div className="flex items-center justify-center gap-2 py-2.5 bg-slate-50 rounded-md border border-slate-100 shadow-sm">
            <CheckCircle2 size={15} className="text-slate-900" /> 
            <span className="text-[13px] font-medium text-slate-600 tracking-tight">{t("AI Flashcards")}</span>
          </div>
          <div className="flex items-center justify-center gap-2 py-2.5 bg-slate-50 rounded-md border border-slate-100 shadow-sm">
            <CheckCircle2 size={15} className="text-slate-900" /> 
            <span className="text-[13px] font-medium text-slate-600 tracking-tight">{t("Smart Quiz")}</span>
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
        .perspective-1000 { perspective: 1000px; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
};

export default FinalStepAnimation;