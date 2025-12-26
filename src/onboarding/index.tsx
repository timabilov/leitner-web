import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CheckCircle2, Layers, Loader2 } from 'lucide-react';
import FirstStepAnimation from './first-step-animation';
import SecondStepAnimation from './second-step-animation';
import ThirdStepAnimation from './third-step-animation';
import FinalStepAnimation from './final-step-animation';

const OnboardingModal = ({ isOpen, t, onFinish, isFinishing, isSuccess }: any) => {
  const [step, setStep] = useState(0);
  const TOTAL_STEPS = 4;

  const nextStep = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(prev => prev + 1);
    } else {
      onFinish(); // This calls handleFinishOnboarding in LoginBase
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-white/80 backdrop-blur-xl" 
          />

          {/* Modal */}
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            className="relative w-full max-w-[500px] bg-white border border-slate-100 rounded-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col min-h-[580px]"
          >
            
            {/* Loading/Success Overlay - Organic View */}
            <AnimatePresence mode="wait">
              {(isFinishing || isSuccess) && (
                <motion.div 
                  key="status-overlay"
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[60] bg-white flex flex-col items-center justify-center text-center p-10"
                >
                  <div className="mb-6 flex items-center justify-center">
                    {isSuccess ? (
                      <motion.div 
                        initial={{ scale: 0, rotate: -45 }} 
                        animate={{ scale: 1, rotate: 0 }} 
                        transition={{ type: 'spring', damping: 12 }}
                        className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200"
                      >
                        <CheckCircle2 size={40} />
                      </motion.div>
                    ) : (
                      <div className="relative flex items-center justify-center">
                        <Layers size={64} className="text-slate-100 animate-pulse" />
                        <motion.div 
                          animate={{ rotate: 360 }} 
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          className="absolute"
                        >
                          <Loader2 size={32} className="text-blue-600" />
                        </motion.div>
                      </div>
                    )}
                  </div>
                  
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tighter">
                    {isSuccess ? t("All set!") : t("Building your profile...")}
                  </h2>
                  <p className="text-slate-500 mt-2 font-medium tracking-tight">
                    {isSuccess ? t("Redirecting you to your notes...") : t("We're organizing your workspace.")}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Standard Progress Header */}
            {!isFinishing && !isSuccess && (
              <div className="flex items-center justify-between px-10 pt-10">
                <div className="flex items-center gap-1.5">
                  {[...Array(TOTAL_STEPS)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        step === i ? 'w-8 bg-slate-900' : 'w-2 bg-slate-100'
                      }`} 
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Animation Body */}
            <div className="flex-1 px-10 py-6 overflow-hidden">
              {!isFinishing && !isSuccess && (
                <motion.div 
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full h-full"
                >
                  {step === 0 && <FirstStepAnimation t={t} />}
                  {step === 1 && <SecondStepAnimation t={t} />}
                  {step === 2 && <ThirdStepAnimation t={t} />}
                  {step === 3 && <FinalStepAnimation t={t} />}
                </motion.div>
              )}
            </div>

            {/* Navigation Button */}
            <div className="px-10 pb-10 flex justify-end">
              {!isFinishing && !isSuccess && (
                <button 
                  onClick={nextStep} 
                  className="h-11 px-8 bg-slate-900 text-white rounded-lg font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95"
                >
                  {step === TOTAL_STEPS - 1 ? t("Get Started") : t("Continue")}
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingModal;