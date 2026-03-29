import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClaimButton } from '.';
import OnboardingBanner from './onboarding-banner';

/**
 * Shadcn-style Animated Underline
 */
const AnimatedUnderline = ({ color = "#e2e8f0" }: { color?: string }) => (
  <motion.svg className="absolute -bottom-1 left-0 w-full h-2 pointer-events-none" viewBox="0 0 100 10" preserveAspectRatio="none">
    <motion.path d="M 0 5 Q 25 8, 50 5 Q 75 2, 100 5" fill="transparent" stroke={color} strokeWidth="2.5" strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }} />
  </motion.svg>
);

const FEEDBACKS = [
  { 
    id: 1, name: "Emma", 
    text: "Ngl the notifications for my weak spots are a lot, but they're the only reason I'm actually learning..", 
    img: "https://i.pravatar.cc/100?u=emma",
    offset: -12 // Slight horizontal offset for organic feel
  },
  { 
    id: 2, name: "Kate", 
    text: "Question #2 was the exact one from my alert last night. Jaw, meet floor. 💀", 
    img: "https://i.pravatar.cc/100?u=kate",
    offset: 12
  },
  { 
    id: 3, name: "Sara", 
    text: "My brain refused to separate Freud from Jung. This turned my notes into a quiz that made it click. Legit.", 
    img: "https://i.pravatar.cc/100?u=sara",
    offset: -8
  },
];



const FourthStepAnimation = ({ t, finishSignup, hasPromo }: { t: any, finishSignup: () => void, hasPromo?: boolean }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, y: 0, scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 25 } 
    }
  };

  return (
    // FIX: Removed `h-full`, `overflow-y-auto`. Replaced with `h-fit`.
    <div className="flex flex-col items-center justify-start w-full max-w-sm mx-auto h-fit bg-white py-4 pt-0 font-sans tracking-tight">
      
      {/* 1. HEADER SECTION */}
      <div className="text-center w-full">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none">
          {t("Study Together")}<br />
          <span className="relative inline-block text-slate-400 font-semibold text-xl mt-2 tracking-tight">
            {t("Join 10,000+ Students")} <AnimatedUnderline />
          </span>
        </h2>
      </div>

      {/* 2. VISUAL ANIMATION: STAGGERED REVEAL */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative w-full flex flex-col gap-3 px-2 py-6"
      >
        {FEEDBACKS.map((f) => (
          <motion.div
            key={f.id}
            variants={itemVariants}
            style={{ x: f.offset }} 
            className="flex items-start gap-3 px-4 py-3 bg-white border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-lg w-full"
          >
            <div className="relative shrink-0 mt-0.5">
              <Avatar className="h-8 w-8 border border-slate-100 grayscale">
                <AvatarImage src={f.img} />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white bg-slate-900 shadow-sm" />
            </div>
            
            <div className="flex flex-col text-left">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[12px] font-semibold text-slate-900 leading-none tracking-tight">{f.name}</span>
                <div className="flex text-amber-500 gap-0.5">
                  <Star size={10} fill="currentColor" />
                  <Star size={10} fill="currentColor" />
                  <Star size={10} fill="currentColor" />
                  <Star size={10} fill="currentColor" />
                  <Star size={10} fill="currentColor" />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 font-normal leading-snug italic">
                "{t(f.text)}"
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* 3. FOOTER SECTION */}
      <div className="w-full text-center flex flex-col gap-5 pt-2">
        
        {/* Bullet Points */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-center gap-2 text-slate-500 font-medium text-[13px] tracking-tight">
            <CheckCircle2 size={15} className="text-slate-900" />{t("Real-time collaborative insights")}
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-500 font-medium text-[13px] tracking-tight">
            <CheckCircle2 size={15} className="text-slate-900" />{t("Join a hive-mind of learners")}
          </div>
        </div>
        
        {/* <h3 className="text-xl font-bold text-slate-900 tracking-tighter leading-none mb-2">
          {t("Learning is better")}<br />
          <span className="text-slate-400 font-semibold text-lg mt-1 inline-block tracking-tight">
            {t("when collective.")}
          </span>
        </h3> */}

        {/* Claim Button (Banner is now globally in the modal header, so we just show the button here) */}
       
 <div className="flex flex-col items-center justify-center gap-4 w-full pt-2">
          <OnboardingBanner step={3} hasPromo={hasPromo}/>
          {
            hasPromo && (
              <div className='flex justify-center w-full'>
            <ClaimButton t={t} onClick={finishSignup}/>
          </div>
            )
          }
          
        </div>

      </div>
    </div>
  );
};



export default FourthStepAnimation;



