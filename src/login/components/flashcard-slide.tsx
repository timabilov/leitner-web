import { motion } from "framer-motion";
import { Check } from "lucide-react";


// 1. FLASHCARDS SLIDE
export const FlashcardSlide = ({ t }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
    className="flex flex-col items-center text-center w-full z-[15]"
  >
    <h2 className="text-2xl font-bold tracking-normal mb-2 text-zinc-900">Flashcards that stick.</h2>
    <p className="text-zinc-500 font-regular mb-8">Built from your own notes and lectures.</p>
    
    <div className="flex gap-4 w-full max-w-lg justify-center overflow-visible">
       <CardMock category="CELL BIOLOGY" question="What enzyme unwinds DNA?" answer="Helicase" />
       <CardMock category="BIOCHEMISTRY" question="Where does glycolysis take place?" answer="Cytoplasm" scale={1.05} />
       <CardMock category="METABOLISM" question="Main energy output of Krebs?" answer="ATP" />
    </div>
  </motion.div>
);


const CardMock = ({ category, question, answer, scale = 1 }) => (
  <div style={{ transform: `scale(${scale})` }} className="w-[180px] bg-white rounded-3xl border border-zinc-100 shadow-xl p-4 text-left flex flex-col gap-3">
    <span className="text-[9px] font-black text-zinc-300 tracking-[0.2em]">{category}</span>
    <p className="text-xs font-bold leading-tight h-12">{question}</p>
    <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center gap-2">
       <div className="w-4 h-4 rounded-full border border-zinc-100 flex items-center justify-center"><Check size={8} className="text-zinc-300" /></div>
       <span className="text-xs font-black italic">{answer}</span>
    </div>
  </div>
);
