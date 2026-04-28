import React, { useEffect, useState, useMemo } from "react";
import {
  Check,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Lock,
  Bell,
  Calendar,
  Zap,
  Tag,
} from "lucide-react";
import { initializePaddle } from "@paddle/paddle-js";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import * as Sentry from "@sentry/react";
import { useOfferCountdown } from "@/hooks/use-offer-countdown";

// Asset Imports
import user1 from "./assets/user1.png";
import user2 from "./assets/user2.png";
import user3 from "./assets/user3.png";
import user4 from "./assets/user4.png";
import user5 from "./assets/user5.png";
const userImages = [user1, user2, user3, user4, user5];

export const PRICING_TIERS_CLAIM = [
  {
    key: "weekly",
    id: "pro_weekly",
    unit: "week",
    name: "Weekly",
    claimOffer: "Free first week",
    description: "Perfect for short-term projects.",
    discountId: "dsc_01kn732qx3f2tk2pdpvjj2dav5",
    priceId: "pri_01kn72e7s269tnzcakpvf9fvs5",
    features: [
      "Unlimited notes",
      "2x Daily Live AI Tutoring",
      "AI Chat",
      "Unlimited quizzes & flashcards",
      "Quiz notifications",
    ],
  },
  {
    key: "monthly",
    id: "pro_monthly",
    unit: "month",
    name: "Monthly",
    claimOffer: "+42% discount",
    discount: "50% OFF",
    description: "Recommended for ongoing usage.",
    discountId: "dsc_01kn733smjmmk9y4qhyhymvrfe",
    priceId: "pri_01kn72r9q9rxq8sa54n4xe51w6",
    features: [
      "Unlimited notes",
      "2x Daily Live AI Tutoring",
      "AI Chat",
      "Unlimited quizzes & flashcards",
      "Quiz notifications",
    ],
    isPopular: true,
  },
  {
    key: "annual",
    id: "pro_annual",
    unit: "month",
    name: "Annual",
    discount: "80% OFF",
    badge: "Best Value",
    trialText: "3-day free trial",
    claimOffer: "+2 month free",
    discountId: "dsc_01kn7356nt9kwp96qm62p02ef9",
    priceId: "pri_01kn72whp6q7grp3jhzadkhnny",
    description: "Best value. Save significantly.",
    features: [
      "Unlimited notes",
      "2x Daily Live AI Tutoring",
      "AI Chat",
      "Unlimited quizzes & flashcards",
      "Quiz notifications",
    ],
  },
];

export const PRICING_TIERS = [
  {
    key: "weekly",
    id: "pro_weekly",
    unit: "week",
    name: "Weekly",
    description: "Perfect for short-term projects.",
    priceId: "pri_01kn72e7s269tnzcakpvf9fvs5",
    features: [
      "Unlimited notes",
      "2x Daily Live AI Tutoring",
      "AI Chat",
      "Unlimited quizzes & flashcards",
      "Quiz notifications",
    ],
  },
  {
    key: "monthly",
    unit: "month",
    id: "pro_monthly",
    name: "Monthly",
    discountId: "dsc_01kn728x05nvebcaadtwavjyjv",
    discount: "50% OFF",
    description: "Recommended for ongoing usage.",
    priceId: "pri_01kn72g7y1k1was8fy04fnk5pr",
    features: [
      "Unlimited notes",
      "2x Daily Live AI Tutoring",
      "AI Chat",
      "Unlimited quizzes & flashcards",
      "Quiz notifications",
    ],
    isPopular: true,
  },
  {
    key: "annual",
    id: "pro_annual",
    name: "Annual",
    unit: "month",
    discount: "80% OFF",
    badge: "Best Value",
    trialText: "3-day free trial included",
    discountId: "dsc_01kn7312xn4mas8fn4bbybkadp",
    description: "Best value. Save significantly.",
    priceId: "pri_01kn72nntvwtbx9fxpjq1sjyh2",
    features: [
      "Unlimited notes",
      "2x Daily Live AI Tutoring",
      "AI Chat",
      "Unlimited quizzes & flashcards",
      "Quiz notifications",
    ],
  },
];


const AppliedDiscountBadge = ({ percent, tierKey }: { percent: string | number, tierKey: string }) => {
  const { t } = useTranslation();
  if (!percent) return null;

  // Handling different labels for different plans
  const code = tierKey === 'annual' ? 'STUDY80' : tierKey === 'monthly' ? 'STUDY42' : 'WELCOME';

  return (
    <div className="mt-2 inline-flex items-center gap-1 px-1 py-1 bg-[#FFF5F8] border border-dashed border-pink-200 rounded-lg animate-in fade-in zoom-in duration-500">
      <Tag size={12} className="text-[#EC4899] fill-[#EC4899]/10" />
      <div className="flex items-center gap-1.5 text-[11px] tracking-tight">
        <span className="text-zinc-500 font-medium lowercase">
          {percent} {t("off applied")}
        </span>
      </div>
    </div>
  );
};



const FifthStepAnimation = ({
  t,
  finishSignup,
}: {
  t: any;
  finishSignup: (claimed: boolean) => void;
}) => {
  const [paddle, setPaddle] = useState<any | null>(null);
  const [prices, setPrices] = useState<
    Record<string, { current: number; original: number | null }>
  >({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [selectedPlanKey, setSelectedPlanKey] = useState<string>("annual");

  const { hasPromo } = useOfferCountdown();
  const activeTiers = useMemo(
    () => (hasPromo ? PRICING_TIERS_CLAIM : PRICING_TIERS),
    [hasPromo],
  );

  const timelineDates = useMemo(() => {
    const todayObj = new Date();
    const todayStr = todayObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    let reminderObj = new Date();
    let endObj = new Date();

    if (selectedPlanKey === "annual") {
      reminderObj.setDate(todayObj.getDate() + 2);
      endObj.setDate(todayObj.getDate() + 3);
    } else if (selectedPlanKey === "weekly") {
      reminderObj.setDate(todayObj.getDate() + 6);
      endObj.setDate(todayObj.getDate() + 7);
    } else {
      endObj.setMonth(todayObj.getMonth() + 1);
      reminderObj = new Date(endObj);
      reminderObj.setDate(endObj.getDate() - 1);
    }

    return {
      today: todayStr,
      reminderDate: reminderObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      endDate: endObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      step1Subtitle:
        selectedPlanKey === "annual"
          ? t("Full access — $0 charged")
          : t("Full access unlocked"),
      step3Subtitle:
        selectedPlanKey === "annual"
          ? t("Billing starts. Cancel anytime.")
          : t("Subscription renews."),
      buttonText:
        selectedPlanKey === "annual"
          ? t("Start free trial")
          : t("Continue to checkout"),
      footerNote:
        selectedPlanKey === "annual"
          ? t("No charge today. Billed on {{date}} if not cancelled.", {
              date: endObj.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }),
            })
          : t("You will be charged today. Auto-renews on {{date}}.", {
              date: endObj.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }),
            }),
    };
  }, [selectedPlanKey, t]);

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

          const previewPromises = activeTiers.map((tier) =>
            paddleInstance.PricePreview({
              items: [{ priceId: tier.priceId, quantity: 1 }],
              discountId: tier.discountId || undefined,
            }),
          );

          const results = await Promise.all(previewPromises);
          const newPrices: Record<string, any> = {};
          results.forEach((result: any) => {
            console.log("result" , result);
            // 🟢 FIX 1: Change lineItems to line_items
            const item = result.data.details.lineItems?.[0];
            if (!item) return;

            const discountObj = item.discounts?.[0]?.discount;
            const discountType = discountObj?.type;
            const discountValue = discountObj?.amount;

            // 🟢 FIX 2: Change trialPeriod to trial_period
            const trialObj = item.price?.trialPeriod;

            newPrices[item.price.id] = {
              // 🟢 FIX 3: Use raw numeric 'totals' instead of regex on 'formatted_totals'
              // This is much safer and prevents NaN errors
              current: parseFloat(item.totals.total) / 100,
              original: parseFloat(item.totals.subtotal) / 100,
              hasTrial: !!trialObj,
              trialFrequency: trialObj?.frequency,
              trialInterval: trialObj?.interval,
              discountPercent:
                discountType === "percentage" ? discountValue : null,
              // 🟢 FIX 4: Change formattedTotals to formatted_totals
              discountFormatted: item.formattedTotals.discount,
            };
          });

          if (isMounted) setPrices(newPrices);
        }
      } catch (error) {
        console.error("Paddle Fetch Error:", error);
      } finally {
        if (isMounted) setIsLoadingPrices(false);
      }
    };
    initPaddle();
    return () => {
      isMounted = false;
    };
  }, [activeTiers]);

  return (
    <div className="flex justify-center w-full font-sans text-slate-900 tracking-normal bg-slate-50/30">
      <div className="w-full flex flex-col md:flex-row overflow-hidden max-w-[1000px] mx-auto">
        {/* --- LEFT COLUMN --- */}
        <div className="flex-1 flex flex-col p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-100 bg-white">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
              {t("Choose your plan")}
            </h2>
            <p className="text-slate-500 text-[15px] leading-relaxed">
              {t("Pick what works for you — try it free, cancel any time.")}
            </p>
          </div>

          <div className="flex flex-col gap-4 mb-8">
            {activeTiers.map((tier) => {
              const liveData = prices[tier.priceId];

              // logic to prevent showing 0 while loading
              const isAnnual = tier.key === "annual";
              const isSelected = selectedPlanKey === tier.key;

              // We only use 0 if liveData specifically says 0 (like Weekly),
              // otherwise we show null/loading
              const priceToDisplay = liveData ? liveData.current : null;
              const originalToDisplay = liveData ? liveData.original : null;

              return (
                <div
                  key={tier.id}
                  onClick={() => setSelectedPlanKey(tier.key)}
                  className={cn(
                    "relative flex items-center justify-between p-5 rounded-xl border-[1.5px] cursor-pointer transition-all duration-200",
                    isSelected
                      ? "border-[#EC4899] bg-slate-50/50 shadow-sm"
                      : "border-zinc-200 hover:border-slate-300 bg-white",
                  )}
                >
                  {(tier as any).discountId && (
                    <div className="absolute -top-5 left-6 ">
                        <AppliedDiscountBadge percent={"40%"} tierKey={tier.key} />
                    </div>
                  )}

                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "font-bold text-[16px]",
                        isSelected ? "text-slate-900" : "text-slate-700",
                      )}
                    >
                      {t(tier.name)}
                    </span>

             

                    {isAnnual && tier.trialText && (
                      <span className="text-[12px] font-medium text-emerald-600 mt-0.5">
                        {t(tier.trialText)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-end">
                    <div className="flex items-baseline gap-1">
                      <span
                        className={cn(
                          "text-2xl font-bold tracking-tight",
                          isSelected ? "text-slate-900" : "text-slate-700",
                        )}
                      >
                        { priceToDisplay === null ? (
                          <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
                        ) : (
                          `$${isAnnual ? (priceToDisplay / 12).toFixed(2) : priceToDisplay.toFixed(2)}`
                        )}
                      </span>
                      <span className="text-sm font-medium text-slate-500">
                        /{t(tier.unit)}
                      </span>
                    </div>
                    { originalToDisplay && liveData?.discountPercent > 1 && (
                      <span className="text-[12px] font-medium line-through text-slate-400 mt-1">
                        ${(isAnnual ?  originalToDisplay / 12 : originalToDisplay).toFixed(2)}/mo
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-6 border-t border-slate-100 flex items-center gap-4">
            <div className="flex -space-x-2">
              {userImages.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  className="w-8 h-8 rounded-full border-2 border-white bg-slate-100"
                  alt="Student"
                />
              ))}
            </div>
            <div className="flex flex-col text-xs font-medium text-slate-500">
              <span>
                Used by <strong>20,000+</strong> students
              </span>
              <span className="mt-0.5">
                Free for the first week — zero risk.
              </span>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="flex-1 flex flex-col p-8 md:p-12 relative bg-slate-50/50">
          <h4 className="text-[12px] font-bold text-slate-900 uppercase tracking-wider mb-8">
            {t("How your trial works")}
          </h4>

          <div className="relative flex flex-col gap-8 mb-10 pl-2">
            <div className="absolute left-[16px] top-4 bottom-4 w-[2px] bg-slate-200 z-0" />
            <motion.div
              initial={{ height: "0%" }}
              animate={{ height: "calc(100% - 2rem)" }}
              transition={{ duration: 2.5, ease: "easeInOut", delay: 0.5 }}
              className="absolute left-[16px] top-4 w-[2px] bg-slate-900 z-0 origin-top"
            />
            <TimelineStep
              icon={<Lock size={10} />}
              title={t("Today")}
              subtitle={timelineDates.step1Subtitle}
              delay={0.2}
              active
            />
            <TimelineStep
              icon={<Bell size={10} />}
              title={timelineDates.reminderDate}
              subtitle={t("We send you a reminder email.")}
              color="#f59e0b"
              delay={1.5}
            />
            <TimelineStep
              icon={<Calendar size={10} />}
              title={timelineDates.endDate}
              subtitle={timelineDates.step3Subtitle}
              color="#0f172a"
              delay={2.5}
            />
          </div>

          <hr className="border-slate-200 mb-8" />

          <div className="mt-auto flex flex-col items-center w-full">
            <button
              onClick={() => finishSignup(true)}
              className="group w-full h-[56px] rounded-xl bg-[#EC4899] hover:opacity-90 text-white font-bold text-[16px] flex items-center justify-center transition-all active:scale-[0.98] shadow-md"
            >
              {timelineDates.buttonText}
              <ChevronRight
                size={18}
                className="ml-1 opacity-70 group-hover:translate-x-1 transition-transform"
              />
            </button>
            <p className="text-center text-[12px] font-medium text-slate-500 mt-4 italic">
              {timelineDates.footerNote}
            </p>
            <div className="flex items-center gap-6 mt-6 text-[11px] font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-500" />{" "}
                {t("Secure")}
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-emerald-500" />{" "}
                {t("Cancel anytime")}
              </span>
            </div>
            <button
              onClick={() => finishSignup(false)}
              className="text-[12px] font-medium text-slate-400 hover:text-slate-900 underline mt-8 transition-colors"
            >
              {t("Skip for now")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TimelineStep = ({
  icon,
  title,
  subtitle,
  color = "#0f172a",
  delay,
  active,
}: any) => (
  <div className="relative z-10 flex gap-5 items-start">
    <motion.div
      initial={
        active
          ? { backgroundColor: color, color: "#fff" }
          : { backgroundColor: "#e2e8f0", color: "#94a3b8" }
      }
      animate={{ backgroundColor: color, color: "#ffffff" }}
      transition={{ duration: 0.4, delay }}
      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ring-4 ring-white"
    >
      {icon}
    </motion.div>
    <div className="flex flex-col">
      <span className="text-[15px] font-bold text-slate-900 leading-none mb-1.5">
        {title}
      </span>
      <span className="text-[13px] text-slate-600 leading-snug">
        {subtitle}
      </span>
    </div>
  </div>
);

export default FifthStepAnimation;
