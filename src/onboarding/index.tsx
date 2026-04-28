import { useState, useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, CheckCircle2, Layers, Loader2 } from "lucide-react";
import FirstStepAnimation from "./first-step-animation";
import FourthStepAnimation from "./fourth-step-animation";
import SecondStepAnimation from "./second-step-animation";
import * as Sentry from "@sentry/react";
import ThirdStepAnimation from "./third-step-animation";
import { cn } from "@/lib/utils";
import LiveActivityFeed2 from "@/prices/live-activity-feed2";
import { useOfferCountdown } from "@/hooks/use-offer-countdown";
import OnboardingBanner from "./onboarding-banner"; // <-- Your newly created banner!
import AIChatAnimation from "./ai-chat-animation";
import LiveSessionAnimation from "./live-session-animation";
import FifthStepAnimation from "./fourth-step-animation";


export const ClaimButton = ({
  onClick,
  t,
}: {
  onClick: () => void;
  t: any;
}) => {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [mounted, setMounted] = useState(false);
  const { targetDate} = useOfferCountdown();


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
      `}</style>

      <div className="relative w-full flex flex-col items-center">
        {/* --- BUTTON --- */}
        <button
          onClick={onClick}
          className={cn(
            "relative w-full h-12 rounded-lg font-bold text-[15px] flex items-center justify-center gap-2 overflow-hidden",
            "text-white shadow-xl shadow-rose-600/30",
            "transition-all active:scale-95",
            "animate-heartbeat-button",
          )}
        >
          {/* LIQUID BACKGROUND */}
          <div className="absolute inset-0 bg-gradient-to-r from-rose-600 via-pink-600 to-red-600 animate-gradient-flow" />

          {/* INNER GLOW (Glass effect) */}
          <div className="absolute inset-0 border-t border-white/30" />
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/10 to-transparent" />

          {/* CONTENT */}
          <span className="relative z-10 flex items-center gap-2">
            <span className="drop-shadow-sm">🔥 {t("TRY for $0")}</span>
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
  const TOTAL_STEPS = 6;
  const posthog = usePostHog();
  const [step, setStep] = useState(0);
  const { hasPromo } = useOfferCountdown();

  useEffect(() => {
    if (isOpen) {
      posthog.capture("onboarding_viewed");
      Sentry.logger.info("Onboarding Modal Opened", { category: "onboarding", level: "info" });
    }
  }, [isOpen, posthog]);

  useEffect(() => {
    if (isSuccess) posthog.capture("onboarding_completed_success");
  }, [isSuccess, posthog]);

  const nextStep = (isClaimOffer?: boolean) => {
    if (step < TOTAL_STEPS - 1) {
      posthog.capture("onboarding_step_completed", { step_index: step, step_name: getStepName(step) });
      setStep((prev) => prev + 1);
    } else {
      posthog.capture("onboarding_finish_clicked");
      onFinish(isClaimOffer);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      posthog.capture("onboarding_step_back", { from_step: step });
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
          @keyframes wiggle {
            0%, 100% { transform: rotate(0deg) translateX(0); }
            25% { transform: rotate(-25deg) translateX(-1px); }
            75% { transform: rotate(25deg) translateX(1px); }
          }
          .animate-wiggle {
            animation: wiggle 0.3s ease-in-out infinite;
          }
        `}
      </style>

      {isOpen && (
        // 1. OUTER WRAPPER: Locks the background
        <div className="fixed inset-0 z-[100]">
          
          {/* 2. BACKDROP: Fixed behind everything */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/80 backdrop-blur-xl z-0"
          />


          {/* Background Live Activity (Only on last step) */}

          {step === TOTAL_STEPS - 1 && !isFinishing && !isSuccess && (
            <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
              <div className="absolute left-2 bottom-10">
                <LiveActivityFeed2 />
              </div>
            </div>
          )}



          {/* 3. SCROLLABLE AREA: This allows the whole modal to scroll natively! */}
          <div className="fixed inset-0 overflow-y-auto z-20">
            
            {/* min-h-full & py-12 ensures padding on top/bottom when scrolling */}
            <div className="flex min-h-full items-center justify-center p-4 py-12 sm:p-6">
              
              {/* 4. MODAL CARD: Height grows naturally based on content */}
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "relative w-full bg-white border border-slate-100 rounded-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden",
                  step === TOTAL_STEPS - 1 ? "max-w-4xl" : "max-w-2xl",
                )}
              >
                
                {/* Loading/Success Overlay */}
                <AnimatePresence mode="wait">
                  {(isFinishing || isSuccess) && (
                    <motion.div
                      key="status-overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                     className="relative w-full z-[60] bg-white flex flex-col items-center justify-center text-center p-10 min-h-[400px]"
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
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* HEADER (Progress + Banner) */}
             {/* 🟢 HEADER (Full-Width Continuous Progress + Banner) */}
         {/* HEADER (Progress + Banner) */}
                {!isFinishing && !isSuccess && (
                  <div className="w-full flex flex-col px-6 pt-6 sm:px-10 sm:pt-8 gap-5">
                    
                    {/* 🟢 Full-Width Segmented Slider Dots */}
                    <div className="flex items-center w-full gap-2">
                      {[...Array(TOTAL_STEPS)].map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-1.5 rounded-full transition-all duration-500",
                            // 🟢 flex-1 forces every dot to stretch and share the full width equally!
                            "flex-1", 
                            step >= i ? "bg-slate-900" : "bg-slate-100"
                          )}
                        />
                      ))}
                    </div>

                    {/* {
                      step !== 5 && (
                        <div className="w-full flex justify-center">
                          <OnboardingBanner step={step} hasPromo={hasPromo}/>
                        </div>
                      )
                    } */}
                  </div>
                )}

                {/* BODY: No overflow constraints! Height grows naturally */}
                <div className="w-full px-4 py-4 sm:px-10 relative z-10">
                  {
                    step === 5 && (
                        <button
                              onClick={prevStep}
                              className="h-11 px-4 text-slate-400 hover:text-slate-600 rounded-lg font-medium text-[14px] flex items-center justify-center gap-2 transition-colors"
                            >
                              <ChevronLeft size={16} />
                              {t("Back")}
                            </button>
                    )
                  }

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
                      {step === 2 && <SecondStepAnimation t={t} />}
                      {step === 1 && <ThirdStepAnimation t={t} />}
                     
                      {step === 3 && (
                        <AIChatAnimation t={t} />
                      )}
                       {step === 4 && (
                        <LiveSessionAnimation t={t}/>
                      )}
                       {step === 5 && (
                        <FifthStepAnimation t={t} finishSignup={() => nextStep(true)} hasPromo={hasPromo} />
                      )}

                    </motion.div>
                  )}
                </div>

                {/* FOOTER - Navigation buttons */}
                {!isFinishing && !isSuccess && step!== 5 && (
                  <div className="w-full px-6 pb-6 sm:px-10 sm:pb-8 flex items-center justify-between mt-2 border-t border-slate-50 pt-4">
                    <div className={step === 0 ? "invisible pointer-events-none" : "visible"}>
                      <button
                        onClick={prevStep}
                        className="h-11 px-4 text-slate-400 hover:text-slate-600 rounded-lg font-medium text-[14px] flex items-center justify-center gap-2 transition-colors"
                      >
                        <ChevronLeft size={16} />
                        {t("Back")}
                      </button>
                    </div>

                    <button
                      onClick={nextStep}
                      className={cn(
                        "relative h-11 px-8 rounded-lg font-bold text-[14px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg overflow-hidden",
                        "bg-slate-900 text-white",
                      )}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        {step === TOTAL_STEPS - 1 && hasPromo ? t("Skip Discount 😌") : t("Continue")}
                      </span>
                    </button>
                  </div>
                )}

              </motion.div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingModal;