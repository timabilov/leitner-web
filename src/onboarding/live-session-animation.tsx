import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MicOff, Square, X, CheckCircle2, Star } from "lucide-react";
import CatLogo from "@/note-detail/assets/cat-logo";

// Swap this for your custom AI Icon if needed
const AIIcon = ({ size = 16, className = "" }: any) => (
  <Star size={size} className={className} />
);

const CatAvatar = () => (
  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
     <div className="text-3xl">🐱</div>
  </div>
);

const LiveSessionAnimation = ({ t }: { t: any }) => {
  const [callPhase, setCallPhase] = useState(0);

  useEffect(() => {
    // Phase 0: AI Speaking
    // Phase 1: User Speaking (ring changes color/shape)
    // Phase 2: Results Screen
    const timer = setInterval(() => {
      setCallPhase((prev) => (prev + 1) % 3);
    }, 3500); // Slower transitions so user can read it
    return () => clearInterval(timer);
  }, []);

  const isAiSpeaking = callPhase === 0;
  const isUserSpeaking = callPhase === 1;
  const showResults = callPhase === 2;

  // Custom animation for the organic blob shape
  const blobVariants = {
    ai: {
      borderRadius: ["40% 60% 70% 30% / 40% 50% 60% 50%", "60% 40% 30% 70% / 60% 50% 40% 50%", "40% 60% 70% 30% / 40% 50% 60% 50%"],
      scale: [1, 1.05, 1],
      transition: { repeat: Infinity, duration: 3, ease: "easeInOut" }
    },
    user: {
      borderRadius: ["30% 70% 50% 50% / 50% 30% 70% 50%", "70% 30% 50% 50% / 50% 70% 30% 50%", "30% 70% 50% 50% / 50% 30% 70% 50%"],
      scale: [1, 1.15, 1],
      transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
    }
  };

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-sm mx-auto h-full bg-white py-4 pt-0 font-sans tracking-tight">
      
      {/* 1. HEADER */}
      <div className="text-center px-4 mt-4">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none">
          {t("Live Voice Tutoring")}<br />
          <span className="relative inline-block text-slate-400 font-semibold text-[14px] mt-3 tracking-tight">
            {t("Talk to your AI tutor on the go. Available on mobile.")}
          </span>
        </h2>
      </div>

      {/* 2. 3D STAGE / PHONE UI */}
      <div className="relative w-full h-[320px] flex items-center justify-center mt-6">
        
        {/* Background Decorative Glow */}
        <div 
          className="absolute w-48 h-48 rounded-full blur-3xl opacity-40" 
          style={{ background: 'radial-gradient(circle, rgba(254, 94, 95, 0.2) 0%, transparent 70%)' }}
        />

        {/* The Mobile Phone "Screen" - EXACT UI MATCH */}
        <div className="relative z-10 w-52 h-[300px] bg-[#0a0a0a] border-[4px] border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white font-sans">
          
          {/* Top Speaker Notch */}
          <div className="absolute top-0 inset-x-0 h-4 bg-slate-800 rounded-b-xl w-20 mx-auto z-30" />

          <AnimatePresence mode="wait">
            {!showResults ? (
              // --- ACTIVE CALL UI ---
              <motion.div 
                key="call"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col pt-6 pb-4 px-4 justify-between h-full"
              >
                
                {/* Top Header */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                      </div>
                    </div>
                    {/* <X size={14} className="text-red-400" /> */}
                  </div>
                  

                  <div className="space-y-1">
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">AI</p>
                    
                    <p className="text-[13px] font-medium leading-snug">
                      What is the powerhouse of the cell?
                    </p>
                  </div>
                </div>

                {/* Bottom Controls & Blob */}
                <div className="flex flex-col items-center gap-4">
                  {/* Status Badge */}
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] px-3 py-1 rounded-full flex items-center gap-1.5">
                    {isAiSpeaking ? (
                      <><MicOff size={10} /> Mic paused — AI is speaking</>
                    ) : (
                      <><div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Listening...</>
                    )}
                  </div>

                  {/* Organic Ring & Stop Button Container */}
                  <div className="flex items-center gap-4 relative w-full justify-center">
                    
                    {/* The Blob */}
                    <div className="w-16 h-16 flex items-center justify-center relative">
                      <motion.div
                        variants={blobVariants}
                        animate={isAiSpeaking ? "ai" : "user"}
                        className={cn(
                          "absolute inset-0 opacity-80 mix-blend-screen filter blur-[2px]",
                          isAiSpeaking 
                            ? "bg-gradient-to-tr from-orange-500 via-red-500 to-pink-500" 
                            : "bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-500"
                        )}
                      />
                      {/* Inner dark circle to make it look like a ring */}
                      <div className="w-12 h-12 bg-[#0a0a0a] rounded-full z-10" />
                    </div>

                    {/* Stop Button (Offset to the right) */}
                    <div className="absolute right-4 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                      <Square size={10} fill="currentColor" />
                    </div>
                  </div>

                  <p className={cn("text-[10px] font-medium transition-colors", isAiSpeaking ? "text-red-400" : "text-blue-400")}>
                    {isAiSpeaking ? "AI speaking." : "Your turn."}
                  </p>
                </div>
              </motion.div>
            ) : (
              // --- RESULTS UI ---
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col pt-6 pb-4 px-4 h-full overflow-hidden"
              >
                
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg leading-none">Results</h3>
                  <X size={14} className="text-zinc-500" />
                </div>
                {/* <div className="flex justify-between text-[8px] text-zinc-500 mb-6">
                  <span>Biology 101</span>
                  <span>14 Apr, 13:53</span>
                </div> */}

                {/* Score Section */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <CatLogo />
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-3xl font-bold text-pink-500">7.1</span>
                      <span className="text-xs text-zinc-500 font-semibold">/10</span>
                    </div>
                    <span className="text-[10px] font-bold">Great Job!</span>
                  </div>
                </div>

                {/* Bars Section */}
                <div className="space-y-3 flex-1">
                  {[
                    { label: "Accuracy", score: 7 },
                    { label: "Confidence", score: 6 },
                    { label: "Response Speed", score: 8 },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center justify-between text-[9px]">
                      <span className="font-medium text-zinc-300 w-20">{stat.label}</span>
                      
                      {/* Segmented Progress Bar */}
                      <div className="flex gap-0.5 flex-1 mx-2">
                        {[...Array(10)].map((_, index) => (
                          <div 
                            key={index} 
                            className={cn(
                              "h-1.5 flex-1 rounded-sm",
                              index < stat.score ? "bg-pink-500" : "bg-zinc-800"
                            )}
                          />
                        ))}
                      </div>
                      
                      <span className="font-bold text-pink-500">{stat.score}</span>
                    </div>
                  ))}
                </div>

                {/* Footer Button */}
                {/* <div className="mt-auto">
                  <div className="flex items-center justify-between text-[9px] text-zinc-400 mb-2 px-1">
                    <span className="flex items-center gap-1 text-green-400"><CheckCircle2 size={10}/> Strengths</span>
                    <span>4/5 answered</span>
                  </div>
                  <div className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-xl text-center text-[10px] font-bold cursor-pointer">
                    Done
                  </div>
                </div> */}

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};

// Required utility for Tailwind conditional classes if you don't have it imported already
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export default LiveSessionAnimation;