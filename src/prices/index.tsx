import { useEffect, useState } from "react";
import {
  Check,
  Loader2,
  Star,
  ShieldCheck,
  Zap,
  Globe,
  X,
  ChevronDown,
} from "lucide-react";
import { initializePaddle } from "@paddle/paddle-js";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { PRICING_TIERS, PRICING_TIERS_CLAIM } from "./assets/pricing-data";
import { useOfferCountdown } from "@/hooks/use-offer-countdown";
import { useSearchParams } from "react-router-dom";
import { usePostHog } from "posthog-js/react";
import SettingsDialog from "@/settings/settings-dialog2";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
// Asset Imports (Keeping your existing imports)
import user1 from "./assets/user1.png";
import user2 from "./assets/user2.png";
import user3 from "./assets/user3.png";
import user4 from "./assets/user4.png";
import user5 from "./assets/user5.png";
import { PromoBanner } from "@/components/promo-banner";
const userImages = [user1, user2, user3, user4, user5];


const FAQ_DATA = [
  {
    question: "Can I cancel anytime?",
    answer: "Yes. Cancel anytime from your account settings with no questions asked. Weekly and monthly plans auto-renew but never lock you in."
  },
  {
    question: "What happens after the 3-day free trial?",
    answer: "You'll be billed the annual rate only after your trial ends. We'll send you a reminder 24 hours before — you can cancel before then at no charge."
  },
  {
    question: "Is the Weekly plan really free?",
    answer: "Yes — the weekly plan is free during our launch promotion. It includes all core features so you can try Bycat before committing."
  },
  {
    question: "How does Live AI Tutoring work?",
    answer: "Our AI Tutoring uses advanced language models trained on your specific curriculum to provide step-by-step guidance, hints, and explanations in real-time."
  },
  {
    question: "Is my data safe?",
    answer: "Absolutely. All data is encrypted at rest and in transit with AES-256 and TLS 1.3. We never sell your data to third parties."
  }
];


const fetchSubscription = async () => {
  const res = await axiosInstance.get(`${API_BASE_URL}/subscription/get`);
  return res.data;
};

// --- Sub-Component: Timer Unit ---
const TimeUnit = ({ value, label }: { value: string | number; label: string }) => (
  <div className="flex flex-col items-center min-w-[35px] sm:min-w-[45px]">
    <span className="text-xl sm:text-2xl font-bold leading-none text-zinc-900 tracking-tighter">
      {value.toString().padStart(2, "0")}
    </span>
    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
      {label}
    </span>
  </div>
);

// --- Sub-Component: Pricing Card ---
const PricingCard = ({
  tier,
  isSelected,
  onSelect,
  onCheckout,
  isLoading,
  finalOriginal,
  finalDefault,
  activePlanKey,
  onManage,
  trialFrequency,
  trialInterval,
  hasTrial,
  discountPercent
}: any) => {
  const { t } = useTranslation();
  const isActivePlan = activePlanKey === tier.key;
  const isRecommended = tier.key === "annual";
  const isAnnual = tier.key === "annual";

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between w-full max-w-[330px] rounded-xl bg-white dark:bg-zinc-950 transition-all duration-500 pb-6",
        isRecommended ? "border border-[#EC4899] z-10" : "border border-zinc-200 dark:border-zinc-800 shadow-sm"
      )}
      onClick={onSelect}
    >
      {/* Badges */}
      <div className="absolute -top-4 flex justify-between w-full">
         {isRecommended && (
        <>
          <div className="bg-[#EC4899] text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
            {t("Recommended")}
          </div>
         
        </>
      )}
      </div>
     
      {isAnnual && (
        <div className="absolute -top-3 -right-2 bg-black text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
          80% OFF
        </div>
      )}

       {tier.key === "monthly" && (
        <div className="absolute -top-3 -right-2 bg-black text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
          50% OFF
        </div>
      )}

      {/* Header */}
      <div>
        <div className="mb-6 px-6 pt-6">
          <div className="flex justify-between items-start">
            <div >
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">{t(tier.key)}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white">
                  {tier.key === "weekly" ? t("Free") : `$${isAnnual ? (Number(finalOriginal) / 12).toFixed(2) : finalOriginal}`}
                </span>
                {tier.key !== "weekly" && <span className="text-zinc-400 font-regular text-lg">/{isAnnual ? 'month' : tier.unit}</span>}
              </div>
              {finalDefault && (
                <span className="text-sm font-medium text-zinc-400 line-through">${isAnnual ? (Number(finalDefault) / 12).toFixed(2) : finalDefault}/{tier.unit}</span>
              )}
            </div>
            <span className=" inline-flex items-center rounded-full bg-[#EC4899] px-2 py-0.5 text-[10px] font-bold text-white ring-1 ring-inset ring-pink-500/20 whitespace-nowrap">🎁 { isAnnual  ? "2 months free": `${discountPercent} % discount`} </span>
          </div>
          <p className="text-zinc-500 text-sm font-regular mt-3 leading-relaxed">{tier.description}</p>
        </div>

          {hasTrial && !isActivePlan && (
            <div className="mb-6 inline-flex items-center gap-2 mx-6 bg-green-50 dark:bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-100 dark:border-green-500/20">
              <Zap size={14} className=" fill-black" />
              <span className="text-[11px] font-bold text-green-600 dark:text-green-400 tracking-tight">
                {trialFrequency}-{trialInterval} free trial
              </span>
            </div>
          )}

          {isAnnual && <p className="text-[11px] font-medium text-zinc-500 mb-6 px-6 ">Best value — billed ${finalOriginal}/year.</p>}

          {/* Features */}
          <div className="flex flex-col space-y-4 mb-8 pt-6 px-6 border-t border-dashed border-zinc-100 dark:border-zinc-800">
            {tier.features.map((feature: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className={cn("rounded-full p-0.5", "bg-white border border-neutral-200 ")}>
                  <Check size={11} className={ "text-neutral-400" } strokeWidth={4} />
                </div>
                <span className="text-[13px] font-regular text-gray-700 dark:text-zinc-400">{feature}</span>
              </div>
            ))}
          </div>
      </div>

      {/* Trial Pill */}

      {/* CTA */}
      <div className="px-6">
      <button
        onClick={(e) => { e.stopPropagation(); isActivePlan ? onManage() : onCheckout(); }}
        disabled={isLoading}
        className={cn(
          "w-full h-12 rounded-xl font-bold text-sm transition-all  active:scale-95 flex items-center justify-center gap-2",
          isAnnual && !isActivePlan 
            ? "bg-[#EC4899] text-white shadow-lg shadow-pink-200 dark:shadow-none" 
            : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white hover:border-zinc-400"
        )}
      >
        {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : (
          isActivePlan ? t("Manage subscription") : (
            hasTrial ? `${t("Start")} ${trialFrequency}-${t("day free trial")}` : (tier.key === "weekly" ? `→ ${t("Get started free")}` : t("Get started"))
          )
        )}
      </button>
      </div>
    </div>
  );
};

export default function PricingSection() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { userId, email, subscriptionStatus } = useUserStore();
  const [paddle, setPaddle] = useState<any>(null);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [prices, setPrices] = useState<any>({});
  const [showBanner, setShowBanner] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const { targetDate, hasPromo } = useOfferCountdown();
  const [searchParams] = useSearchParams();
  const isPromoLink = searchParams.get("sale") === "true";
  const posthog = usePostHog();

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Timer Logic
  useEffect(() => {
    if (!targetDate) return;
    const timer = setInterval(() => {
      const distance = targetDate.getTime() - new Date().getTime();
      if (distance < 0) return clearInterval(timer);
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const { data: subscriptionData } = useQuery({
    queryKey: ["subscription"],
    queryFn: fetchSubscription,
    enabled: !!userId,
  });

  const activePlanKey = subscriptionData?.data?.billing_cycle?.interval ? (subscriptionData.data.billing_cycle.interval === 'year' ? 'annual' : 'monthly') : null;

  // Paddle Initialization & Price Fetching
  useEffect(() => {
    const init = async () => {
      const paddleInstance = await initializePaddle({
        environment: import.meta.env.VITE_PADDLE_ENV,
        token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN,
        eventCallback: (event) => {
          if (event.name === "checkout.closed") setLoadingPriceId(null);
          if (event.name === "checkout.completed") {
            toast.success(t("Welcome aboard!"));
            queryClient.invalidateQueries({ queryKey: ["subscription"] });
          }
        },
      });

      if (paddleInstance) {
        setPaddle(paddleInstance);
        const activeTiers = isPromoLink && hasPromo ? PRICING_TIERS_CLAIM : PRICING_TIERS;
        const results = await Promise.all(activeTiers.map(tier => paddleInstance.PricePreview({ items: [{ priceId: tier.priceId, quantity: 1 }], discountId: tier.discountId })));
        const newPrices: any = {};
        results.forEach((result: any) => {
            
          const item = result.data.details.lineItems[0];
                const discountObj = item.discounts?.[0]?.discount;
            const discountType = discountObj?.type; // "percentage" or "flat"
            const discountValue = discountObj?.amount; // e.g. "17.7"
          newPrices[item.price.id] = {
            current: parseInt(item.formattedTotals.total.replace(/[^0-9]/g, ""), 10) / 100,
            original: parseInt(item.formattedTotals.subtotal.replace(/[^0-9]/g, ""), 10) / 100,
            hasTrial: !!item.price?.trialPeriod,
            trialFrequency: item.price?.trialPeriod?.frequency,
            trialInterval: item.price?.trialPeriod?.interval,
            discountPercent: discountType === 'percentage' ? discountValue : null,
            discountFormatted: item.formattedTotals.discount, // e.g. "$14.16"
          };
        });
        setPrices(newPrices);
      }
    };
    init();
  }, [isPromoLink, hasPromo]);

  const openCheckout = (priceId: string, discountId?: string) => {
    setLoadingPriceId(priceId);
    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      discountId,
      customData: { internal_user_id: userId, internal_email: email },
      settings: { displayMode: "overlay", theme: "system" }
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950">
      {/* 🟢 BANNER */}

      <main className="flex flex-col items-center pt-20 pb-32">
        {/* HEADER */}
        <div className="flex flex-col items-center text-center px-4 max-w-3xl mb-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/50 px-3 py-1  mb-6">
             <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
             </span>
             <span className="text-xs font-medium text-zinc-600">20k+ students learning smarter</span>
          </div>
          <h1 className="text-5xl  font-black tracking-tight text-zinc-900 dark:text-white mb-6">Simple, transparent pricing</h1>
          <p className="text-lg font-regular text-zinc-500 max-w-lg leading-relaxed">No hidden fees. No credit card required to start. Cancel anytime.</p>
        </div>

        {/* 🟢 NEW SEGMENTED TOGGLE */}
        {/* <div className="flex items-center justify-center p-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl mb-12">
           <button 
             onClick={() => setBillingCycle("monthly")}
             className={cn("px-8 py-2.5 rounded-xl text-sm font-bold transition-all", billingCycle === "monthly" ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500")}
           >
             Monthly
           </button>
           <button 
             onClick={() => setBillingCycle("annual")}
             className={cn("px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2", billingCycle === "annual" ? "bg-zinc-900 dark:bg-white shadow-sm text-white dark:text-zinc-900" : "text-zinc-500")}
           >
             Annual
             <span className="bg-[#ED4B8E] text-white text-[9px] px-1.5 py-0.5 rounded-md font-black">SAVE 80%</span>
           </button>
        </div> */}

         {/* --- ORGANIC VALUE ANCHOR --- */}
      


        {/* SOCIAL PROOF */}
        <div className="flex items-center gap-4 mb-16 py-3 px-5 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
           <div className="flex -space-x-3">
              {userImages.map((img, i) => <img key={i} src={img} className="h-8 w-8 rounded-full border-2 border-white dark:border-zinc-900" />)}
           </div>
           <div className="flex flex-col">
              <div className="flex gap-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{[1,2,3,4].map(i=><Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}</div>
              <span className="text-[11px] font-medium text-zinc-500">Trusted by <span className="text-zinc-900 dark:text-white font-black">20K+</span> students</span>
           </div>
        </div>

        {/* PRICING GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full px-6">
           {(isPromoLink && hasPromo ? PRICING_TIERS_CLAIM : PRICING_TIERS).map((tier: any) => {
              const liveData = prices[tier.priceId];
              return (
                <PricingCard
                  key={tier.id}
                  tier={tier}
                  isSelected={billingCycle === (tier.key === 'annual' ? 'annual' : 'monthly')}
                  onCheckout={() => openCheckout(tier.priceId, tier.discountId)}
                  finalOriginal={liveData ? liveData.current : tier.defaultPrice}
                  finalDefault={liveData?.original}
                  hasTrial={liveData?.hasTrial}
                  trialFrequency={liveData?.trialFrequency}
                  trialInterval={liveData?.trialInterval}
                  activePlanKey={activePlanKey}
                  onManage={() => setSettingsOpen(true)}
                  discountPercent={liveData?.discountPercent}
                  discountFormatted={liveData?.discountFormatted}
                />
              );
           })}
        </div>

        {/* TRUST STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mt-24 px-6">
           {[
             { icon: ShieldCheck, title: "Bank-level security", desc: "256-bit AES encryption" },
             { icon: Zap, title: "Cancel anytime", desc: "No hidden fees or commitments" },
             { icon: Globe, title: "Global community", desc: "Learners from 120+ countries" }
           ].map((stat, i) => (
             <div key={i} className="flex items-center gap-3 p-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
               <div ><stat.icon size={20} className="text-zinc-500" /></div>
               <div>
                 <p className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white leading-none">{stat.title}</p>
                 <p className="text-[12px]  tracking-tight font-medium text-zinc-400 mt-1">{stat.desc}</p>
               </div>
             </div>
           ))}
        </div>

        {/* FAQ SECTION */}
        <div className="max-w-4xl w-full mt-32 px-6">
           <h2 className="text-2xl font-bold tracking-tight mb-1 text-zinc-900 dark:text-white">Frequently asked questions</h2>
           <p className="text-zinc-500 font-medium mb-10">Everything you need to know before upgrading.</p>
           <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden ">
             {FAQ_DATA.map((faq, i) => (
               <div key={i} className="border-b border-zinc-50 dark:border-zinc-800 last:border-none text-sm">
                 <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left hover:bg-zinc-50/50 transition-all">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{faq.question}</span>
                    <ChevronDown size={20} className={cn("text-zinc-500 transition-transform duration-300", faqOpen === i && "rotate-180")} />
                 </button>
                 <div className={cn("grid transition-[grid-template-rows] duration-500 ease-in-out", faqOpen === i ? "grid-template-rows-[1fr]" : "grid-template-rows-[0fr]")}>
                    <div className="overflow-hidden">
                      <p className="px-6 pb-6 text-zinc-500 text-sm font-regular leading-relaxed">{faq.answer}</p>
                    </div>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* FINAL CTA */}
        <div className="max-w-4xl w-full mt-12 px-6">
           <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-10 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl ">
             <div>
               <h3 className="text-xl font-medium tracking-tight text-zinc-900 dark:text-white">Still unsure? Start free.</h3>
               <p className="text-zinc-500 font-regular mt-1">The weekly plan is always free — no credit card needed.</p>
             </div>
             <button className="bg-[#EC4899] text-white px-10 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-pink-100 dark:shadow-none">
               Get started for free →
             </button>
           </div>
        </div>
      </main>

      <SettingsDialog isOpen={settingsOpen} setIsOpen={setSettingsOpen} defaultTab="subscription" />
    </div>
  );
}