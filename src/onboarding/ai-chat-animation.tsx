import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Sparkles, Send, FileText } from "lucide-react";
import CatPenIcon from "@/notes/assets/cat-pen-icon";

// You can swap this for your actual AI icon component if you prefer!
const AIIcon = ({ size = 16, className = "" }: any) => (
  <Sparkles size={size} className={className} />
);

const AIChatAnimation = ({ t }: { t: any }) => {
  const [chatPhase, setChatPhase] = useState(0);

useEffect(() => {
    // Phase 0: Empty chat
    // Phase 1: User types message
    // Phase 2: AI is "thinking"
    // Phase 3: AI responds (Stops here)
    const interval = setInterval(() => {
      setChatPhase((prev) => {
        if (prev >= 3) {
          clearInterval(interval); // 🟢 Instantly kill the timer once it hits Phase 3
          return prev; // Keep it at 3 forever
        }
        return prev + 1; // Move to the next phase
      });
    }, 800); // Wait 1.5s between each phase to make it feel natural

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-sm mx-auto h-full bg-white py-4 pt-0 font-sans tracking-tight">
      
      {/* 1. HEADER */}
      <div className="text-center px-4 mt-4 mb-5">
        <h2 className="text-3xl font-bold text-muted-foreground-900 tracking-tighter leading-none">
          {t("Chat about your notes")}<br />
          <span className="relative inline-block text-muted-foreground-400 font-semibold text-[14px] mt-5 tracking-tight">
            {t("Every note has its own chat with an AI tutor ready to answer questions.")}
          </span>
        </h2>
      </div>

      {/* 2. 3D STAGE / CHAT UI */}
      <div className="relative w-full h-64 flex items-center justify-center mt-6">
        
        {/* Background Decorative Glow */}
        <div 
          className="absolute w-48 h-48 rounded-full blur-3xl opacity-50" 
          style={{ background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)' }}
        />

        {/* The Chat "Window" */}
        <div className="relative z-10 w-[270px] h-72 bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col overflow-hidden">
          
          {/* Chat Header */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-md">
              <FileText size={12} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-800 leading-none">BycatAIGuide_101.pdf</p>
              <p className="text-[8px] text-slate-400 mt-0.5">AI Tutor Active</p>
            </div>
          </div>

          {/* Chat Body */}
          <div className="flex-1 p-3 flex flex-col gap-3 overflow-hidden relative">
            
            {/* User Message */}
            <AnimatePresence>
              {chatPhase >= 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="self-end max-w-[85%]"
                >
                  <div className="bg-slate-900 text-white text-[11px] px-3 py-2 rounded-2xl rounded-tr-sm shadow-sm leading-snug">
                    {t("How do the Bycat AI quiz alerts work?")}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Response Bubble */}
            <AnimatePresence>
              {chatPhase >= 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="self-start w-full flex gap-2"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <CatPenIcon size={14} />
                  </div>
                  
                  <div className="bg-slate-100 text-slate-800 text-[11px] px-3 py-2.5 rounded-2xl rounded-tl-sm shadow-sm flex-1 leading-relaxed">
                    {chatPhase === 2 ? (
                      /* Thinking Dots */
                      <div className="flex gap-1 items-center h-3">
                        <motion.div animate={{ y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1 h-1 bg-slate-400 rounded-full" />
                        <motion.div animate={{ y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1 h-1 bg-slate-400 rounded-full" />
                        <motion.div animate={{ y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1 h-1 bg-slate-400 rounded-full" />
                      </div>
                    ) : (
                      /* 🟢 FINAL REAL TEXT ANSWER */
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                      <span className="font-semibold block mb-1">I focus on your weak spots! 🎯</span>
When you get a quiz question wrong, I remember it. A few hours later, I’ll send a push notification to your phone testing you on that exact topic so you never forget it again.
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Chat Input Footer */}
          <div className="px-3 py-2 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
            <div className="flex-1 h-7 bg-slate-50 border border-slate-200 rounded-full flex items-center px-3">
              {chatPhase === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: [0, 1, 1, 0] }} 
                  transition={{ duration: 2, times: [0, 0.2, 0.8, 1] }}
                  className="h-1.5 w-16 bg-slate-300 rounded-full" 
                />
              )}
            </div>
            <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
              <Send size={12} className="text-white -ml-0.5" />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AIChatAnimation;