import { cn } from "@/lib/utils";
import CatPenIcon from "@/notes/assets/cat-pen-icon";
import { motion } from "framer-motion";


// 2. TUTOR SLIDE
export const TutorSlide = ({ t }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
    className="flex flex-col items-center text-center w-full"
  >
    <h2 className="text-2xl font-bold tracking-tight mb-2 text-zinc-900">Live AI tutoring. Twice daily.</h2>
    <p className="text-zinc-500 font-regular mb-8">Like a patient tutor at 2am — never tired.</p>
    
    <div className="w-full max-w-sm bg-white rounded-xl border border-zinc-100 p-6 overflow-hidden">
       <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100">
                <CatPenIcon className="w-4 h-4" />
             </div>
             <div className="text-left"><p className="text-xs font-bold leading-none">Bycat Tutor</p><p className="text-[10px] text-green-500 font-bold tracking-tight italic">● Live session</p></div>
          </div>
          <div className="bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded tracking-normal">LIVE</div>
       </div>
       <div className="space-y-3">
          <ChatBubble align="right" text="I keep getting G2/M checkpoint wrong" />
          <ChatBubble align="left" text="What triggers it when DNA is damaged?" />
          <ChatBubble align="right" text="ATM activates Chk2... which blocks CDK1?" />
       </div>
    </div>
  </motion.div>
);





const ChatBubble = ({ text, align }) => (
  <div className={cn("max-w-[80%] p-3 rounded-xl text-[11px] font-medium", align === "right" ? "bg-black text-white ml-auto rounded-tr-none" : "bg-zinc-100 text-zinc-900 mr-auto rounded-tl-none")}>
    {text}
  </div>
);
