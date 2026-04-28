import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useOfferCountdown } from "@/hooks/use-offer-countdown";

// Sub-component for the numbers
const TimeUnit = ({ value, label }: { value: string | number; label: string }) => (
  <div className="flex flex-col items-center min-w-[35px] sm:min-w-[45px]">
    <span className="text-xl sm:text-2xl font-black leading-none text-zinc-900 tracking-tighter">
      {value.toString().padStart(2, "0")}
    </span>
    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
      {label}
    </span>
  </div>
);

export const PromoBanner = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  
  // 🟢 Logic from your hooks
  const { targetDate, hasPromo } = useOfferCountdown();
  const isPromoLink = searchParams.get("sale") === "true";
  
  // 🟢 Internal UI state
  const [isDismissed, setIsDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // 🟢 Internal Timer Logic
  useEffect(() => {
    if (!targetDate || !hasPromo) return;

    const calculateTime = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) return null;

      return {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      };
    };

    const timer = setInterval(() => {
      const updatedTime = calculateTime();
      if (!updatedTime) {
        clearInterval(timer);
      } else {
        setTimeLeft(updatedTime);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, hasPromo]);

  // 🟢 Render Conditions
  const shouldShow = hasPromo && targetDate  && !isDismissed;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed top-0 z-[200] w-full border-b border-pink-100 bg-[#FFF5F8] overflow-hidden"
        >
          <div className="flex h-14 w-full items-center justify-between px-4  max-w-[1400px] mx-auto">
            
            {/* Left Section: Badge & Message */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-[#EC4899] text-white px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-widest shadow-sm">
                {t("SALE")}
              </div>
              <p className="text-[12px] sm:text-sm font-medium text-zinc-700 tracking-tight leading-none">
                {t("Limited time:")}{" "}
                <span className="font-bold text-zinc-900 block sm:inline">
                  {t("Special student pricing is active")}
                </span>
              </p>
            </div>

            {/* Right Section: Countdown & Close */}
            <div className="flex items-center gap-4 sm:gap-10">
              <div className="flex items-center gap-3 sm:gap-6">
                <TimeUnit value={timeLeft.days} label={t("Days")} />
                <TimeUnit value={timeLeft.hours} label={t("Hrs")} />
                <TimeUnit value={timeLeft.minutes} label={t("Mins")} />
                <TimeUnit value={timeLeft.seconds} label={t("Secs")} />
              </div>

              {/* <button
                onClick={() => setIsDismissed(true)}
                className="text-zinc-400 hover:text-zinc-600 p-1.5 transition-colors rounded-full hover:bg-pink-100/50"
                aria-label="Close offer"
              >
                <X size={18} strokeWidth={2.5} />
              </button> */}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};