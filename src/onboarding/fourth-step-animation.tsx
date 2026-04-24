import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ShieldCheck, Lock, Check, Bell, Calendar, Loader2, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initializePaddle } from "@paddle/paddle-js";
import { cn } from "@/lib/utils";
import * as Sentry from "@sentry/react";
import user1 from "./assets/user1.png"; // Adjust the path to wherever your images are
import user2 from "./assets/user2.png";
import user3 from "./assets/user3.png";
import user4 from "./assets/user4.png";
import user5 from "./assets/user5.png";


const userImages =[user1, user2, user3, user4];
// --- EXACT PRICING DATA FROM YOUR APP ---
const PRICING_TIERS = [
  {
    key: "weekly",
    id: "pro_weekly",
    unit: "wk",
    name: "Weekly",
    original: 5.99,
    defaultPrice: 5.99,
    priceId: "pri_01kn72e7s269tnzcakpvf9fvs5", 
  },
  {
    key: "monthly",
    unit: "mo",
    id: "pro_monthly",
    name: "Monthly",
    defaultPrice: 34.99,
    original: 11.99,
    priceId: "pri_01kn72g7y1k1was8fy04fnk5pr", 
  },
  {
    key: "annual",
    id: "pro_annual",
    name: "Annual",
    unit: "mo",
    defaultPrice: 239.99,
    original: 79.99, 
    discountId: 'dsc_01kn7312xn4mas8fn4bbybkadp',
    priceId: "pri_01kn72nntvwtbx9fxpjq1sjyh2",
    badge: "BEST VALUE",
    trialText: "3 DAYS FREE"
  },
];

const REVIEWS = [
  {
    id: 1,
    name: "Alex",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    content: "Amazing platform! The AI generates spot-on quizzes from my biology notes. It's totally changed how I study.",
    rating: 5,
  },
  {
    id: 2,
    name: "Jamie",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    content: "Finally, an app that actually understands my awful lecture audio. The flashcards it makes are literal lifesavers.",
    rating: 5,
  },
];

const FifthStepAnimation = ({ t, finishSignup }: { t: any, finishSignup: (claimed: boolean) => void }) => {
  const [paddle, setPaddle] = useState<any | null>(null);
  const [prices, setPrices] = useState<Record<string, { current: number; original: number | null }>>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [selectedPlanKey, setSelectedPlanKey] = useState<string>("annual");
  const [reviewIndex, setReviewIndex] = useState(0);

  // Dynamic Dates
  const timelineDates = useMemo(() => {
    const todayObj = new Date();
    const todayStr = todayObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    let reminderObj = new Date();
    let endObj = new Date();

    if (selectedPlanKey === "annual") {
      reminderObj.setDate(todayObj.getDate() + 2); 
      endObj.setDate(todayObj.getDate() + 3);      
    } else if (selectedPlanKey === "weekly") {
      reminderObj.setDate(todayObj.getDate() + 6); 
      endObj.setDate(todayObj.getDate() + 7);      
    } else if (selectedPlanKey === "monthly") {
      endObj.setMonth(todayObj.getMonth() + 1);    
      reminderObj = new Date(endObj);
      reminderObj.setDate(endObj.getDate() - 1);   
    }

    return {
      today: todayStr,
      reminderDate: reminderObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      endDate: endObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      step1Subtitle: selectedPlanKey === "annual" ? t("Full access — $0 charged") : t("Full access unlocked"),
      step3Subtitle: selectedPlanKey === "annual" ? t("Billing starts. Cancel anytime.") : t("Subscription renews."),
      buttonText: selectedPlanKey === "annual" ? t("Start free trial") : t("Continue to checkout"),
      footerNote: selectedPlanKey === "annual" 
        ? t("No charge today. Billed on {{date}} if not cancelled.", { date: endObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) })
        : t("You will be charged today. Auto-renews on {{date}}.", { date: endObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) })
    };
  }, [selectedPlanKey, t]);

  useEffect(() => {
    const timer = setInterval(() => {
      setReviewIndex((prev) => (prev + 1) % REVIEWS.length);
    }, 5000); 
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const initPaddle = async () => {
      try {
        const paddleInstance = await initializePaddle({
          environment: import.meta.env.VITE_PADDLE_ENV || "production",
          token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN || "test_token",
        });

        if (paddleInstance && isMounted) {
          setPaddle(paddleInstance);
          const previewPromises = PRICING_TIERS.map((tier) => paddleInstance.PricePreview({
            items: [{ priceId: tier.priceId, quantity: 1 }],
            discountId: tier.discountId || undefined, 
          }));

          const results = await Promise.all(previewPromises);
          const newPrices: Record<string, { current: number; original: number | null }> = {};

          results.forEach((result: any) => {
            const item = result.data.details.lineItems[0]; 
            const currentNum = parseInt(item.formattedTotals.total.replace(/[^0-9]/g, ""), 10) / 100;
            const subtotalNum = parseInt(item.formattedTotals.subtotal.replace(/[^0-9]/g, ""), 10) / 100;
            newPrices[item.price.id] = { current: currentNum, original: subtotalNum !== currentNum ? subtotalNum : null };
          });

          if (isMounted) setPrices(newPrices);
        }
      } catch (error) {
        Sentry.captureException(error);
      } finally {
        if (isMounted) setIsLoadingPrices(false);
      }
    };
    initPaddle();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="flex justify-center w-full font-sans text-slate-900 tracking-normal bg-slate-50/30">
      
      {/* 🟢 MAIN CONTAINER: Sleek, crisp borders */}
      <div className="w-full flex flex-col md:flex-row overflow-hidden max-w-[1000px] mx-auto my-4 md:my-8 ">
        
        {/* --- LEFT COLUMN: PRICING --- */}
        <div className="flex-1 flex flex-col p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-100 bg-white">
          
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
              {t("Choose your plan")}
            </h2>
            <p className="text-slate-500 text-[15px] leading-relaxed">
              {t("Join 10,000+ students studying smarter. Cancel anytime.")}
            </p>
          </div>

          {/* Pricing Options Stack - Highly Professional UI */}
          <div className="flex flex-col gap-4 mb-8">
            {PRICING_TIERS.map((tier) => {
              const liveData = prices[tier.priceId];
              const fallbackOriginal = tier.original !== undefined ? tier.original : tier.defaultPrice;
              const finalOriginal = liveData ? liveData.current : fallbackOriginal;
              const finalDefault = liveData && liveData.original ? liveData.original : tier.defaultPrice;
              
              const isAnnual = tier.key === "annual";
              const isSelected = selectedPlanKey === tier.key;

              return (
                <div 
                  key={tier.id}
                  onClick={() => setSelectedPlanKey(tier.key)}
                  className={cn(
                    "relative flex items-center justify-between p-5 rounded-xl border-[1.5px] cursor-pointer transition-all duration-200",
                    isSelected 
                      ? "border-slate-900 bg-slate-50/50 shadow-sm" 
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  )}
                >
                  {isAnnual && tier.badge && (
                    <div className="absolute -top-3 left-6  border-pink-500/20 dark:border-rose-500/30 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                      {t(tier.badge)}
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                  

                    <div className="flex flex-col">
                      <span className={cn("font-bold text-[16px]", isSelected ? "text-slate-900" : "text-slate-700")}>
                        {t(tier.name)}
                      </span>
                      {isAnnual && tier.trialText && (
                        <span className="text-[12px] font-medium text-emerald-600 mt-0.5">
                          {t(tier.trialText)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <div className="flex items-baseline gap-1">
                      <span className={cn("text-2xl font-bold tracking-tight", isSelected ? "text-slate-900" : "text-slate-700")}>
                        {isLoadingPrices ? <Loader2 className="h-5 w-5 animate-spin text-slate-300" /> : `$${isAnnual ? (Number(finalOriginal) / 12).toFixed(2) : Number(finalOriginal).toFixed(2)}`}
                      </span>
                      <span className="text-sm font-medium text-slate-500">/{t(tier.unit)}</span>
                    </div>
                    {isAnnual && finalDefault && Number(finalDefault) > 0 && (
                      <span className="text-[12px] font-medium line-through text-slate-400 mt-1">
                        ${(Number(finalDefault) / 12).toFixed(2)}/mo
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trusted By / Feature Highlight */}
          <div className="mt-auto pt-6 border-t border-slate-100 flex items-center gap-4">
            <div className="flex -space-x-2">
               {userImages.map((img, i) => (
                  <img key={i} src={img} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100" alt="Student" />
               ))}
            </div>
            <div className="flex flex-col">
              <div className="flex gap-0.5 text-[#FBBF24]">
                <span className="text-xs leading-snug text-slate-500">
                  Used by <strong>20,000+</strong>
                </span>
              </div>
              <span className="text-xs font-medium text-slate-500 mt-0.5">Free for the first week — zero risk.</span>
            </div>
          </div>

        </div>

        {/* --- RIGHT COLUMN: INVOICE TIMELINE & CHECKOUT --- */}
        <div className="flex-1 shrink-0 flex flex-col p-8 md:p-12 bg-slate-50/50 relative">
          
          <h4 className="text-[12px] font-bold text-slate-900 uppercase tracking-wider mb-8">
            {t("How your trial works")}
          </h4>

          {/* 🟢 VERTICAL "RECEIPT" TIMELINE (Highly Professional) */}
          {/* 🟢 VERTICAL "RECEIPT" TIMELINE (Animated) */}
          <div className="relative flex flex-col gap-8 mb-10 pl-2">
            
            {/* Static Background Line (Gray) */}
            <div className="absolute left-[13px] top-4 bottom-4 w-[2px] bg-slate-200 z-0" />

            {/* 🟢 Animated Foreground Line (Black) */}
            <motion.div 
              initial={{ height: "0%" }}
              animate={{ height: "calc(100% - 2rem)" }} // Stops exactly at the last icon
              transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
              className="absolute left-[13px] top-4 w-[2px] bg-slate-900 z-0 origin-top"
            />

            {/* Step 1: Today (Always Active) */}
            <div className="relative z-10 flex gap-5 items-start">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5 ring-4 ring-slate-50"
              >
                <Lock size={10} />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-slate-900 leading-none mb-1.5">{t("Today")}</span>
                <span className="text-[13px] text-slate-600 leading-snug">{timelineDates.step1Subtitle}</span>
              </div>
            </div>

            {/* Step 2: Reminder (Activates at 1.5s when line hits it) */}
            <div className="relative z-10 flex gap-5 items-start">
              <motion.div 
                // Starts gray, turns amber
                initial={{ backgroundColor: "#e2e8f0", color: "#94a3b8" }} 
                animate={{ backgroundColor: "#f59e0b", color: "#ffffff" }} 
                transition={{ duration: 0.3, delay: 1.5 }}
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ring-4 ring-slate-50"
              >
                <Bell size={10} />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-slate-900 leading-none mb-1.5">{timelineDates.reminderDate}</span>
                <span className="text-[13px] text-slate-600 leading-snug">{t("We send you a reminder email.")}</span>
              </div>
            </div>

            {/* Step 3: Billing Starts (Activates at 2.5s when line finishes) */}
            <div className="relative z-10 flex gap-5 items-start">
              <motion.div 
                // Starts gray, turns dark slate
                initial={{ backgroundColor: "#e2e8f0", color: "#94a3b8" }} 
                animate={{ backgroundColor: "#0f172a", color: "#ffffff" }} 
                transition={{ duration: 0.3, delay: 2.5 }}
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ring-4 ring-slate-50"
              >
                <Calendar size={10} />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-slate-900 leading-none mb-1.5">{timelineDates.endDate}</span>
                <span className="text-[13px] text-slate-600 leading-snug">{timelineDates.step3Subtitle}</span>
              </div>
            </div>
          </div>


          <hr className="border-slate-200 mb-8" />

          {/* Clean, Solid CTA Button */}
          <div className="mt-auto flex flex-col items-center w-full">
            <button
              onClick={() => finishSignup(true)}
              className="w-full h-[56px] rounded-xl  border-pink-500/20 dark:border-rose-500/30 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 hover:bg-slate-800 text-white font-bold text-[16px] flex items-center justify-center transition-all active:scale-[0.98] shadow-md"
            >
              {timelineDates.buttonText} <ChevronRight size={18} className="ml-1 opacity-70" />
            </button>
            
            <p className="text-center text-[12px] font-medium text-slate-500 mt-4 px-2">
              {timelineDates.footerNote}
            </p>

            {/* Premium Trust Badges */}
            <div className="flex items-center justify-center gap-6 mt-6 text-[11px] font-semibold text-slate-400">
              <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-500" /> {t("Secure Checkout")}</span>
              <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500" /> {t("Cancel anytime")}</span>
            </div>

            {/* Unobtrusive Skip */}
            <button 
              onClick={() => finishSignup(false)} 
              className="text-[12px] font-medium text-slate-400 hover:text-slate-900 underline underline-offset-4 mt-8 transition-colors"
            >
              {t("Skip for now")}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default FifthStepAnimation;