import { cn } from "@/lib/utils";
import CatPenIcon from "@/notes/assets/cat-pen-icon";
import { motion } from "framer-motion";
import { Check } from "lucide-react";



// 3. QUIZ SLIDE
export const QuizSlide = ({ t }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
    className="flex flex-col items-center text-center w-full"
  >
    <h2 className="text-2xl font-bold tracking-normal mb-2 text-zinc-900">Quizzes on your weak spots.</h2>
    <p className="text-zinc-500 font-regular mb-8">Three difficulty tiers. Bycat picks what to drill.</p>
    
    <div className="w-full max-w-sm space-y-3">
       <div className="bg-white p-4 rounded-lg border border-zinc-100 font-medium text-sm">
          Which process produces the most ATP?
       </div>
       <QuizOption label="A" text="Glycolysis" />
       <QuizOption label="B" text="Oxidative phosphorylation" active />
       <QuizOption label="C" text="Krebs cycle" />
       <div className="bg-zinc-50/50 p-3 rounded-lg border border-zinc-100 flex gap-3 text-left">
          <CatPenIcon className="w-5 h-5 shrink-0" />
          <div><p className="text-[11px] font-bold leading-none">Correct — Oxidative phosphorylation</p><p className="text-[10px] text-zinc-400 mt-1">Produces ~30-32 ATP via the electron transport chain.</p></div>
       </div>
    </div>
  </motion.div>
);


const QuizOption = ({ label, text, active }) => (
  <div className={cn("flex items-center gap-3 p-3 rounded-lg border transition-all", active ? "bg-green-50 border-green-200" : "bg-white border-zinc-100")}>
     <div className={cn("w-4 h-4 rounded-lg flex items-center justify-center text-[10px] font-bold", active ? "bg-green-500 text-white" : "bg-zinc-50 text-zinc-400")}>
        {active ? <Check size={10} /> : label}
     </div>
     <span className={cn("text-xs font-bold", active ? "text-green-700" : "text-zinc-500")}>{text}</span>
  </div>
);