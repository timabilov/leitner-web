import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, Sparkles } from 'lucide-react';

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

const ThirdStepAnimation = ({ t }: { t: any }) => {
  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    // Sequence happens once after entering
    const timer = setTimeout(() => {
      setIsRestored(true);
    }, 600); // Slight delay for the user to see the "faded" state first
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-sm mx-auto h-full bg-white py-4 pt-0 font-sans tracking-tight">
      
      {/* HEADER SECTION */}
      <div className="text-center px-4">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none">
          {t("Stop Forgetting")}<br />
          <span className="relative inline-block text-slate-400 font-semibold text-xl mt-2 tracking-tight">
            {t("Master Spaced Recall")} <AnimatedUnderline />
          </span>
        </h2>
      </div>

      {/* VISUAL ANIMATION: ONE-TIME MEMORY RESTORE */}
      <div className="relative w-full h-50 flex items-center justify-center">
        
        {/* The "Knowledge Cards" - Snappy snap-to-focus */}
        <div className="relative w-full flex flex-col items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.3, filter: "blur(4px)", scale: 0.9, y: (i - 1) * 10 }}
              animate={{
                opacity: isRestored ? 1 : 0.3,
                filter: isRestored ? "blur(0px)" : "blur(4px)",
                scale: isRestored ? 1 : 0.9,
                y: isRestored ? 0 : (i - 1) * 10,
              }}
              transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.05 }}
              className="w-48 h-10 bg-slate-50 border border-slate-200 rounded-md flex items-center px-3 gap-2 shadow-sm"
            >
              <div className="w-4 h-1.5 rounded-full bg-slate-200" />
              <div className="w-full h-1.5 rounded-full bg-slate-100" />
            </motion.div>
          ))}
        </div>

        {/* The Smart Alert - Physical Entrance */}
        <AnimatePresence>
          {isRestored && (
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute top-4 z-20 w-[260px] bg-white border border-slate-200 rounded-md p-3 flex items-center gap-3 shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
            >
              <div className="relative">
                <div className="p-2 bg-slate-900 rounded-md text-white">
                  <Bell size={18} />
                </div>
                {/* SLOWER & ORGANIC RIPPLE EFFECT */}
                <motion.div 
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ 
                    duration: 1.8, // Increased duration for a slower effect
                    repeat: Infinity, 
                    ease: "easeOut",
                    repeatDelay: 0.5 
                  }}
                  className="absolute inset-0 bg-blue-500 rounded-md -z-10"
                />
              </div>
              <div className="flex-1 overflow-hidden text-left">
                <p className="text-[13px] font-semibold text-slate-900 truncate tracking-tight">{t("Quick Review")}</p>
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{t("Rescue memory")}</p>
              </div>
              <Sparkles size={14} className="text-blue-600" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ambient Glow */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: isRestored ? 0.3 : 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-blue-50/30 blur-3xl -z-10 rounded-full"
        />
      </div>

      {/* FOOTER SECTION */}
      <div className="w-full text-center">
        <div className="flex flex-col gap-2.5 mb-8">
          <div className="flex items-center justify-center gap-2 text-slate-500 font-medium text-[13px] tracking-tight">
            <CheckCircle2 size={15} className="text-slate-900" />{t("Pinged only at the perfect time")}
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-500 font-medium text-[13px] tracking-tight">
            <CheckCircle2 size={15} className="text-slate-900" />{t("Scientific spaced-repetition logic")}
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-slate-900 tracking-tighter leading-none">
          {t("We’ll alert you only")}<br />
          <span className="text-slate-400 font-semibold text-lg mt-1 inline-block tracking-tight">
            {t("when your brain needs it.")}
          </span>
        </h3>
      </div>
    </div>
  );
};

export default ThirdStepAnimation;