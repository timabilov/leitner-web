import { motion } from "framer-motion";
import { Mic, Timer, Volume2 } from "lucide-react";


export const VoiceTutorSlide = ({ t }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
    className="flex flex-col items-center text-center w-full"
  >
    <h2 className="text-4xl font-bold tracking-normal mb-2 text-zinc-900">Learn through conversation.</h2>
    <p className="text-zinc-500 font-regular mb-8">Hands-free learning. Talk to your tutor while on the go.</p>
    
    <div className="w-full max-w-sm bg-white rounded-[40px] border border-zinc-100 shadow-2xl p-8 relative overflow-hidden">
       {/* Top Status */}
       <div className="flex flex-col items-center gap-2 mb-10">
          
       
       </div>

       {/* Animated Waveform */}
       <div className="flex items-center justify-center gap-1 h-12 mb-10">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1.5 bg-zinc-900 rounded-full"
              animate={{ 
                height: [10, Math.random() * 40 + 10, 10] 
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 0.6, 
                delay: i * 0.05,
                ease: "easeInOut" 
              }}
            />
          ))}
       </div>

       {/* Live Transcription Mock */}
       <div className="space-y-4 text-left">
          <div className="bg-zinc-50 p-4 rounded-2xl rounded-tl-none border border-zinc-100">
             <p className="text-[11px] font-bold text-zinc-400 uppercase mb-1">Tutor is speaking...</p>
             <p className="text-xs font-bold leading-snug">"Excellent! Now, can you explain the role of ATP synthase in this process?"</p>
          </div>
          
          <div className="flex items-center gap-3 justify-center pt-2">
             <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                <Timer size={18} />
             </div>
             <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center text-white shadow-lg">
                <Mic size={24} />
             </div>
             <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                <Volume2 size={18} />
             </div>
          </div>
       </div>
    </div>
  </motion.div>
);