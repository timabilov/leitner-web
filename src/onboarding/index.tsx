import { useState, useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Layers,
  Loader2,
  Sparkles,
  Timer,
  Calendar,
} from "lucide-react"; // Added ChevronLeft
import FirstStepAnimation from "./first-step-animation";
import FourthStepAnimation from "./fourth-step-animation";
import SecondStepAnimation from "./second-step-animation";
import * as Sentry from "@sentry/react";
import ThirdStepAnimation from "./third-step-animation";
import { cn } from "@/lib/utils";
import { TrustStats } from "@/prices";
import LiveActivityFeed2 from "@/prices/live-activity-feed2";
import ShopAnimation from './assets/shop.json';

import React from "react";
import { Flame } from "lucide-react";
import { useOfferCountdown } from "@/hooks/use-offer-countdown";
import Lottie from "lottie-react";

export const ClaimButton = ({ onClick }: { onClick: () => void }) => {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [mounted, setMounted] = useState(false);
  const { targetDate } = useOfferCountdown();

  useEffect(() => {
    setMounted(true);
    if (!targetDate) return;

    const calculateTime = () => {
      const formattedTargetDate = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const distance = formattedTargetDate - now;

      if (distance < 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
      } else {
        setTimeLeft({
          d: Math.floor(distance / (1000 * 60 * 60 * 24)),
          h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <>
      <style>{`
        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes heartbeat {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.4); }
          50% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(225, 29, 72, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(225, 29, 72, 0); }
        }
        .animate-gradient-flow {
          background-size: 200% 200%;
          animation: gradient-flow 3s ease infinite;
        }
        .animate-heartbeat-button {
          animation: heartbeat 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
        }
          @keyframes text-shimmer {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-text-shimmer {
            background-size: 200% auto;
            animation: text-shimmer 3s linear infinite;
          }
              @keyframes text-shimmer {
        0% { background-position: 0% 50%; }
        100% { background-position: 200% 50%; }
      }
      
      /* 2. The Organic "Breath" (Subtle Expansion) */
      @keyframes organic-breath {
        0%, 100% { transform: scale(1); opacity: 0.9; filter: brightness(1); }
        50% { transform: scale(1.02); opacity: 1; filter: brightness(1.1); }
      }

      .animate-organic-text {
        background-size: 200% auto;
        animation: text-shimmer 3s linear infinite, organic-breath 3s ease-in-out infinite;
      }

      `}</style>

      <div className="relative w-full flex flex-col items-center">
        {/* Floating "Last Chance" Badge */}
        {/* <div className="absolute -top-3 z-20 bg-slate-900 text-white text-[10px] font-bold px-3 py-0.5 rounded-full border border-slate-700 shadow-sm flex items-center gap-1 animate-bounce">
          <Timer size={10} className="text-red-400" />
          <span>Last chance today</span>
        </div> */}
       <div className="flex justify-center items-center mb-2 gap-1.5">
      {/* Optional: Icon with matching gradient */}
      <span className="font-mono text-[15px] font-black tracking-tight animate-organic-text bg-gradient-to-r from-red-600 via-orange-500 to-rose-600 bg-clip-text text-transparent drop-shadow-sm flex items-center">
          <Lottie  style={{  height: "15px" }} animationData={ShopAnimation} loop={true} />{' '}
         {timeLeft.d}d:{timeLeft.h}h:{timeLeft.m}m:{timeLeft.s}s
      </span>
    </div>

    {/* --- BUTTON --- */}
    <button
      onClick={onClick}
      className={cn(
        "relative w-full h-12 rounded-lg font-bold text-[15px] flex items-center justify-center gap-2 overflow-hidden",
        "text-white shadow-xl shadow-rose-600/30",
        "transition-all active:scale-95",
        "animate-heartbeat-button"
      )}
    >
      {/* 1. LIQUID BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-r from-rose-600 via-pink-600 to-red-600 animate-gradient-flow" />

      {/* 2. INNER GLOW (Glass effect) */}
      <div className="absolute inset-0 border-t border-white/30" />
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/10 to-transparent" />

      {/* 3. CONTENT */}
      <span className="relative z-10 flex items-center gap-2">
        <span className="drop-shadow-sm">🔥 TRY for $0</span>
      </span>
    </button>
      </div>
    </>
  );
};

const OnboardingModal = ({
  isOpen,
  t,
  onFinish,
  isFinishing,
  isSuccess,
}: any) => {
  const TOTAL_STEPS = 4;
  const posthog = usePostHog();

  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      posthog.capture("onboarding_viewed");
      Sentry.logger.info("Onboarding Modal Opened", {
        category: "onboarding",
        level: "info",
      });
    }
  }, [isOpen, posthog]);

  useEffect(() => {
    if (isSuccess) {
      posthog.capture("onboarding_completed_success");
    }
  }, [isSuccess, posthog]);

  const nextStep = () => {
    if (step < TOTAL_STEPS - 1) {
      posthog.capture("onboarding_step_completed", {
        step_index: step,
        step_name: getStepName(step),
      });
      Sentry.logger.info(`Advanced to step ${step + 1}`, {
        category: "onboarding",
        level: "info",
      });
      setStep((prev) => prev + 1);
    } else {
      posthog.capture("onboarding_finish_clicked");
      Sentry.logger.info("User clicked Get Started", {
        category: "onboarding",
        level: "info",
      });
      onFinish();
    }
  };

  // New function to handle going back
  const prevStep = () => {
    if (step > 0) {
      posthog.capture("onboarding_step_back", {
        from_step: step,
      });
      setStep((prev) => prev - 1);
    }
  };

  const getStepName = (index: number) => {
    const names = ["Intro", "Features", "Workflow", "Final"];
    return names[index] || `Step ${index}`;
  };

  return (
    <AnimatePresence>
      <style>
        {`
   @keyframes aurora {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.animate-aurora {
  background-size: 200% 200%;
  animation: aurora 5s ease infinite;
}
        `}
      </style>
      {step === TOTAL_STEPS - 1 && (
        <div className="relative  w-full z-[9999]">
          <div className="absolute right-2 -bottom-190 z-9999">
            <LiveActivityFeed2 />
          </div>
        </div>
      )}
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
            {/* Loading/Success Overlay */}
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
                        transition={{ type: "spring", damping: 12 }}
                        className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200"
                      >
                        <CheckCircle2 size={40} />
                      </motion.div>
                    ) : (
                      <div className="relative flex items-center justify-center">
                        <Layers
                          size={64}
                          className="text-slate-100 animate-pulse"
                        />
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "linear",
                          }}
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
                    {isSuccess
                      ? t("Redirecting you to your notes...")
                      : t("We're organizing your workspace.")}
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
                        step === i ? "w-8 bg-slate-900" : "w-2 bg-slate-100"
                      }`}
                    />
                  ))}
                </div>
                {/* {step === TOTAL_STEPS - 1 && <ClaimButton onClick={console.log}/>}
                  <div className="w-[50px]"/> */}
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
                  transition={{ ease: "easeInOut", duration: 0.3 }}
                  className="w-full h-full"
                >
                  {step === 0 && <FirstStepAnimation t={t} />}
                  {step === 1 && <SecondStepAnimation t={t} />}
                  {step === 2 && <ThirdStepAnimation t={t} />}
                  {step === 3 && <FourthStepAnimation t={t} />}
                </motion.div>
              )}
            </div>

            {/* Navigation Footer */}
            {!isFinishing && !isSuccess && (
              <div className="px-10 pb-10 flex items-center justify-between">
                {/* Back Button */}
                {/* We use visibility: hidden when disabled to maintain layout spacing if needed, 
                    though generic rendering works fine with justify-between */}
                <div
                  className={
                    step === 0 ? "invisible pointer-events-none" : "visible"
                  }
                >
                  <button
                    onClick={prevStep}
                    className="h-11 px-4 text-slate-400 hover:text-slate-600 rounded-lg font-medium text-[14px] flex items-center justify-center gap-2 transition-colors"
                  >
                    <ChevronLeft size={16} />
                    {t("Back")}
                  </button>
                </div>

                {/* Continue/Finish Button */}

                <button
                  onClick={nextStep}
                  className={cn(
                    "relative h-11 px-8 rounded-lg font-bold text-[14px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg overflow-hidden",
                    // Base styles
                    "bg-slate-900 text-white",
                  )}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {step === TOTAL_STEPS - 1 ? t("Skip Discount 😌") : t("Continue")}
                    {/* <ChevronRight size={16} /> */}
                  </span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingModal;
