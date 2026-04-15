import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Battery, Bell, CatIcon, CheckCircle2, Smartphone, Sparkles } from 'lucide-react';
import AIIcon from '@/note-detail/assets/ai-icon';
import { useNavigate } from "react-router-dom";
import { Trans } from 'react-i18next';
import CatPenIcon from '@/notes/assets/cat-pen-icon';
import BackgroundSvg from './assets/background.svg';

/**
 * Shadcn-style Animated Underline
 */
const AnimatedUnderline = ({ color = "#e2e8f0" }: { color?: string }) => (
  <motion.svg className="absolute -bottom-1 left-0 w-full h-2 pointer-events-none" viewBox="0 0 100 10" preserveAspectRatio="none">
    <motion.path d="M 0 5 Q 25 2, 50 5 Q 75 8, 100 5" fill="transparent" stroke={color} strokeWidth="2.5" strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }} 
      animate={{ pathLength: 1, opacity: 1 }} 
      transition={{ delay: 0.4, duration: 0.5 }} 
    />
  </motion.svg>
);

const SecondStepAnimation = ({ t }: { t: any }) => {
  // 0 = Nothing
  // 1 = Main card appears
  // 2 = 1st background card appears behind it
  // 3 = 2nd background card appears behind it
  // 4 = 3rd background card appears behind it
  const [visiblePhase, setVisiblePhase] = useState(0);

  useEffect(() => {
    // Start sequence slightly after component mounts
    const initialDelay = setTimeout(() => {
      setVisiblePhase(1); // Main card drops in
      
      // 🟢 FASTER ANIMATION: Trigger the background cards every 150ms instead of 600ms
      const interval = setInterval(() => {
        setVisiblePhase((prev) => {
          if (prev < 4) return prev + 1;
          clearInterval(interval);
          return prev;
        });
      }, 150);

      return () => clearInterval(interval);
    }, 200); // 🟢 FASTER INITIAL DELAY: Reduced to 200ms

    return () => clearTimeout(initialDelay);
  }, []);

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-sm mx-auto h-full bg-white py-4 pt-0 font-sans tracking-tight">
      
      {/* HEADER SECTION */}
      <div className="text-center px-4 mb-5 mt-4">
        <h2 className="text-3xl font-bold text-muted-foreground-900 tracking-tighter leading-none">
          {t("Master Spaced Recall")}<br />
          <span className="relative inline-block text-muted-foreground-400 font-semibold text-[14px] mt-3 tracking-tight">
            {t("Get the app for push alerts")} 
          </span>
        </h2>
      </div>

      {/* 🟢 3D STAGE / iPHONE UI CONTAINER */}
      <div className="relative w-full h-[320px] flex items-center justify-center mt-2">
        
        {/* Background Decorative Glow */}
        <div 
          className="absolute w-60 h-60 rounded-full blur-3xl opacity-40" 
          style={{ background: 'radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, transparent 70%)' }}
        />

        {/* The Mobile Phone "Screen" wrapper */}
        <div className="relative z-10 w-80 h-[320px] bg-[#0f172a] border-[6px] border-slate-900 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">

             <div 
            className="absolute inset-0 w-full h-full object-cover -z-20 bg-[#0f172a]" 
            style={{ 
              backgroundImage: `url(${BackgroundSvg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }} 
          />

          {/* Top Notch (Dynamic Island style) */}
          <div className="absolute top-2 inset-x-0 h-[18px] bg-black rounded-full w-[70px] mx-auto z-50 flex items-center justify-end px-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/80 mr-1" /> {/* Little camera indicator */}
          </div>

          {/* Time & Battery (Mock iOS Header) */}
          <div className="w-full flex justify-between items-center px-5 pt-3 z-40 text-white font-medium text-[10px]">
            <span>9:41</span>
            <div className="flex items-center gap-1 opacity-80">
              <Battery size={12} className="text-white" />
            </div>
          </div>

          {/* 🟢 STACKED NOTIFICATIONS (Inside the phone screen) */}
          <div className="relative w-full h-full flex flex-col items-center pt-8">
            <div className="relative w-[92%] h-full flex justify-center">
              
              {/* Background Cards Mapping (Drop in one by one BEHIND main card) */}
              {[1, 2].map((i, index) => {
                // If phase is 2, show card 1. If phase is 3, show card 1 & 2.
                const shouldShow = visiblePhase >= i + 1; 

                // Math to push them further down and make them slightly smaller/more faded
                const targetY = i * 26; 
                const targetScale = 1 - (i * 0.05);
                const targetOpacity = 1 - (i * 0.1);

                return (
                  <AnimatePresence key={index}>
                    {shouldShow && (
                      <motion.div
                        // 🟢 Start at y: 0 (directly behind main card) and slide down
                        initial={{ opacity: 0, scale: targetScale, y: 0 }} 
                        animate={{
                          opacity: targetOpacity, 
                          scale: targetScale,
                          y: targetY,
                        }}
                        transition={{ type: "spring", stiffness: 900, damping: 55 }}
                        // 🟢 Z-index strictly forces them behind the main card (z-20)
                        style={{ zIndex: 15 - i }} 
                        className="absolute top-0 w-[95%] bg-slate-50/100 rounded-2xl p-3 flex items-start gap-2 shadow-sm border border-slate-200"
                      >
                        <div className="flex w-full items-start gap-2 opacity-80 blur-[1px]">
                          <div className="shrink-0 mt-0.5 grayscale-[20%] scale-90">
                            <CatPenIcon />
                          </div>
                          
                          <div className="flex-1 flex flex-col pt-0.5 gap-1.5">
                            <div className="flex justify-between items-start w-full">
                              <div className="w-20 h-2 rounded-full bg-slate-400/80" />
                              <div className="w-5 h-2 rounded-full bg-slate-300/80" />
                            </div>
                            <div className="flex flex-col gap-1 mt-1">
                              <div className="w-full h-1.5 rounded-full bg-slate-300/70" />
                              <div className="w-3/4 h-1.5 rounded-full bg-slate-300/70" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                );
              })}

              {/* 🟢 EXACT iOS NOTIFICATION REPLICA (Main Alert - Drops in FIRST) */}
              <AnimatePresence>
                {visiblePhase >= 1 && (
                  <motion.div
                    // Main card drops in from top of screen
                    initial={{ opacity: 0, y: -40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="absolute top-0 z-20 w-[105%]" // z-20 puts it in absolute front!
                  >
                    <div className="absolute inset-x-4 -bottom-2 h-4 bg-white/50 rounded-b-xl blur-[2px] shadow-md -z-10" />
                    
                    <div className="bg-white/95 backdrop-blur-xl rounded-[20px] p-3 flex items-start gap-2 shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-slate-100">
                      
                      <div className="shrink-0 mt-0.5 scale-90">
                        <CatPenIcon />
                      </div>

                      <div className="flex-1 flex flex-col pt-0.5">
                        <div className="flex justify-between items-start">
                          <p className="text-[11px] font-bold text-slate-900 tracking-tight leading-none">
                            {t("Your lovely note")}
                          </p>
                          <p className="text-[8px] text-slate-400 font-medium">now</p>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-snug mt-1 pr-1 font-medium">
                          {t("Couldn't help but forgetting answers? No sweat, we got you covered!")}
                        </p>
                      </div>
                      
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SecondStepAnimation;