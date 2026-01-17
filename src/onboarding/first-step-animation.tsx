import React from 'react';
import { motion } from 'framer-motion';
import { Mic, FileText, Image as ImageIcon, Type, Sparkles, CheckCircle2, Layers, Youtube } from 'lucide-react';

/**
 * 1. Brand Gradient Definition
 * This allows us to apply the GradientProgress colors to Lucide icons.
 */
const BrandGradient = () => (
  <svg width="0" height="0" className="absolute">
    <defs>
      <linearGradient id="brand-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FE5E5F" />
        <stop offset="100%" stopColor="#C04796" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * Shadcn-style Animated Underline
 */
const AnimatedUnderline = ({ color = "#e2e8f0" }: { color?: string }) => (
  <motion.svg className="absolute -bottom-1 left-0 w-full h-2 pointer-events-none" viewBox="0 0 100 10" preserveAspectRatio="none">
    <motion.path d="M 0 5 Q 25 2, 50 5 Q 75 8, 100 5" fill="transparent" stroke={color} strokeWidth="2.5" strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ delay: 0.8, duration: 0.8 }} />
  </motion.svg>
);

const Fragment = ({ icon, label, initialPos, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, ...initialPos, scale: 0.8 }}
    animate={{ 
      opacity: [0, 1, 1, 0], 
      x: [initialPos.x, initialPos.x * 0.2, 0], 
      y: [initialPos.y, initialPos.y * 0.2, 0], 
      scale: [0.8, 1, 1, 0.5] 
    }}
    transition={{ duration: 2.8, repeat: Infinity, delay: delay, times: [0, 0.1, 0.8, 1], ease: "easeInOut" }}
    className="absolute z-30 flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-200 shadow-sm"
  >
    <span className="text-slate-900">{icon}</span>
    <span className="text-[12px] font-semibold text-slate-900 tracking-tight">{label}</span>
  </motion.div>
);

const FirstStepAnimation = ({ t }: { t: any }) => {
  return (
    <div className="flex flex-col items-center justify-between w-full max-w-sm mx-auto h-full bg-white py-4 font-sans tracking-tight">
      <BrandGradient />
      
      <div className="text-center px-4">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none">
          {t("Everything in One Note")}<br />
          <span className="relative inline-block text-slate-400 font-semibold text-xl mt-2 tracking-tight">
            {t("Unified Intelligent Capture")} <AnimatedUnderline />
          </span>
        </h2>
      </div>

      <div className="relative w-full h-50 flex items-center justify-center">
        {/* Atmosphere adjusted to brand reddish/pinkish tones */}
        <div 
          className="absolute w-44 h-44 rounded-full blur-3xl" 
          style={{ background: 'radial-gradient(circle, rgba(254, 94, 95, 0.15) 0%, transparent 70%)' }}
        />
        
        {/* Central Core */}
        <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}
          className="relative z-20 w-24 h-24 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center overflow-hidden"
        >
          <div className="relative">
             {/* Icon now uses the Brand Gradient via SVG definition */}
             <Layers size={40} style={{ stroke: "url(#brand-gradient)" }} strokeWidth={1.5} />
             
             {/* Core Glow matching GradientProgress colors */}
             <motion.div 
               animate={{ opacity: [0, 0.4, 0] }}
               transition={{ duration: 2.8, repeat: Infinity, delay: 0.5 }}
               className="absolute inset-0 blur-xl -z-10"
               style={{ backgroundImage: 'linear-gradient(to right, #FE5E5F, #C04796)' }}
             />
          </div>
          
          <motion.div 
            animate={{ opacity: [0, 1, 0], scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 2.8, repeat: Infinity, delay: 0.5 }}
            className="absolute -top-2 -right-2 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md border-2 border-white shadow-sm"
          >
            5 in 1
          </motion.div>
        </motion.div>

        {/* Fragments */}
        <Fragment icon={<Mic size={15} />} label={t("Audio")} initialPos={{ x: -140, y: -80 }} delay={0} />
        <Fragment icon={<Youtube size={15} />} label={t("YouTube")} initialPos={{ x: 140, y: -70 }} delay={0.2} />
        <Fragment icon={<FileText size={15} />} label={t("PDF")} initialPos={{ x: -140, y: 20 }} delay={0.4} />
        <Fragment icon={<ImageIcon size={15} />} label={t("Photo")} initialPos={{ x: 140, y: 30 }} delay={0.6} />
        <Fragment icon={<Type size={15} />} label={t("Text")} initialPos={{ x: 0, y: 110 }} delay={0.1} />
      </div>

      <div className="w-full text-center">
        <div className="flex flex-col gap-2.5 mb-4">
          <div className="flex items-center justify-center gap-2 text-slate-500 font-medium text-[13px] tracking-tight">
            <CheckCircle2 size={15} className="text-slate-900" />{t("Summarize YouTube and Lectures")}
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-500 font-medium text-[13px] tracking-tight">
            <CheckCircle2 size={15} className="text-slate-900" />{t("One workspace, five ways to learn")}
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-slate-900 tracking-tighter">
          {t("Stop switching apps.")}<br />
          <span className="text-slate-400 font-semibold text-lg tracking-tight">{t("One Note holds it all.")}</span>
        </h3>
      </div>
    </div>
  );
};

export default FirstStepAnimation;