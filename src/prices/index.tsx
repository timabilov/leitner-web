import { useEffect, useState } from "react";
import {
  Check,
  Loader2,
  Star,
  ShieldCheck,
  Zap,
  Globe,
  Wallet,
  Music,
  Bookmark,
  Share2,
  MessagesSquare,
  MessageCircle,
  Heart,
  ChevronRight,
  Clock,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { initializePaddle } from "@paddle/paddle-js";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as Sentry from "@sentry/react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { PRICING_TIERS, PRICING_TIERS_CLAIM } from "./assets/pricing-data";
import LiveActivityFeed2 from "./live-activity-feed2";
import CountdownTimer from "@/components/countdown-timer";
import { useOfferCountdown } from "@/hooks/use-offer-countdown";
import { useSearchParams } from "react-router-dom";
import { Trans } from "react-i18next";
import { usePostHog } from "posthog-js/react";
import SettingsDialog from "@/settings/settings-dialog2";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import user1 from "./assets/user1.png"; // Adjust the path to wherever your images are
import user2 from "./assets/user2.png";
import user3 from "./assets/user3.png";
import user4 from "./assets/user4.png";
import user5 from "./assets/user5.png";
import { AnimatedGrid, FloatingBlobs, RisingBubbles } from "@/login";

const INTERVAL_TO_PLAN: Record<string, "weekly" | "monthly" | "annual"> = {
  week: "weekly",
  month: "monthly",
  year: "annual",
};

const FAQ_DATA = [
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. Cancel anytime from your account settings with no questions asked. Weekly and monthly plans auto-renew but never lock you in.",
  },
  {
    question: "What happens after the 3-day free trial?",
    answer:
      "You'll be billed the annual rate only after your trial ends. We'll send you a reminder 24 hours before — you can cancel before then at no charge.",
  },
  {
    question: "Is the Weekly plan really free?",
    answer:
      "Yes — the weekly plan is free during our launch promotion. It includes all core features so you can try Bycat before committing.",
  },
  {
    question: "How does Live AI Tutoring work?",
    answer:
      "Our AI Tutoring uses advanced language models trained on your specific curriculum to provide step-by-step guidance, hints, and explanations in real-time.",
  },
  {
    question: "Is my data safe?",
    answer:
      "Absolutely. All data is encrypted at rest and in transit with AES-256 and TLS 1.3. We never sell your data to third parties.",
  },
];

const userImages = [user1, user2, user3, user4, user5];

const fetchSubscription = async () => {
  const res = await axiosInstance.get(`${API_BASE_URL}/subscription/get`);
  return res.data;
};

const TimeUnit = ({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) => (
  <div className="flex flex-col items-center min-w-[32px]">
    <span className="text-lg md:text-xl font-bold tracking-tighter tabular-nums animate-pulse-subtle">
      {value.toString().padStart(2, "0")}
    </span>
    <span className="text-[9px] uppercase font-bold text-zinc-500 -mt-1">
      {label}
    </span>
  </div>
);

// --- COMPONENT: Trust & Organic Data (Bottom Section) ---
export const TrustStats = () => {
  const { t } = useTranslation();

  const stats = [
    {
      icon: ShieldCheck,
      text: "Bank-level security",
      sub: "256-bit encryption",
    },
    { icon: Zap, text: "Cancel anytime", sub: "No hidden fees" },
    {
      icon: Globe,
      text: "Global community",
      sub: "Learners from 120+ countries",
    },
  ];

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="flex items-center gap-3  p-3 rounded-xl border border-border/30 backdrop-blur-sm"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm text-zinc-600 dark:text-zinc-300 group-hover:scale-105 transition-transform duration-300">
            <stat.icon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">
              {t(stat.text)}
            </span>
            <span className="text-[11px] text-sidebar-accent-foreground">
              {t(stat.sub)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- COMPONENT: Social Proof (Centered Bottom) ---
export const SocialProof = () => (
  <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 mt-2">
    <div className="flex flex-wrap justify-center items-center gap-4 bg-muted/30 p-3 rounded-2xl border border-border/40 backdrop-blur-sm">
      {/* Avatars Stack */}
      <div className="flex -space-x-3">
        {userImages.map((imgSrc, i) => (
          <div
            key={i}
            className="h-8 w-8 overflow-hidden rounded-full border-2 border-background shadow-sm"
          >
            <img
              alt={`User ${i + 1}`}
              src={imgSrc} // <--- Use the imported variable directly!
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Stars & Text */}
      <div className="flex flex-col items-start gap-0.5">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
            />
          ))}
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">
          <Trans
            i18nKey="trusted_by_students"
            defaults="Trusted by <bold>20k+</bold> students"
            components={{
              bold: <span className="text-foreground font-bold" />,
            }}
          />
        </span>
      </div>
    </div>
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
  isPromo,
  isSpecialAnnual,
  claimOffer,
  activePlanKey,
  isCanceling,
  onManage,
  trialInterval,
  trialFrequency,
  hasTrial,
}: {
  tier: (typeof PRICING_TIERS)[0];
  isSelected: boolean;
  onSelect: () => void;
  onCheckout: () => void;
  isLoading: boolean;
  finalOriginal: number | string;
  finalDefault: number | string | null | undefined;
  isPromo?: boolean;
  isSpecialAnnual: boolean;
  claimOffer?: string;
  activePlanKey: string | null;
  isCanceling?: boolean;
  onManage: () => void;
  trialFrequency?: number;
  trialInterval?: string;
  hasTrial?: boolean;
}) => {
  const isActivePlan = activePlanKey === tier.key;
  const { t } = useTranslation();

  return (
    <div
      className="h-full w-full max-w-[300px] mx-auto perspective-1000"
      onClick={onSelect}
      style={{ perspective: 1000 }}
    >
      <motion.div
        animate={{
          scale: isSelected ? 1.03 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "relative flex flex-col gap-4 rounded-xl py-6 px-4 h-full bg-background transition-colors duration-300",
          isSelected
            ? "border-2 border-primary shadow-2xl z-20"
            : "border border-border shadow-md z-0",
        )}
      >
        {/* Top-Right Discount Badge */}
        {(tier as any).discount && (
          <div
            className="absolute -top-2 -right-2 px-3 py-1 rounded-full font-bold text-[10px] text-white shadow-sm bg-primary dark:bg-neutral-600 z-30"
            style={{ transform: "translateZ(30px)" }}
          >
            {(tier as any).discount}
          </div>
        )}

        {/* Content Section */}
        <div
          className="flex flex-col gap-4 relative z-10 flex-1"
          style={{ transform: "translateZ(20px)" }}
        >
          <div className="flex flex-col gap-1">
            {/* 🟢 REDESIGNED TRIAL INDICATOR PILL */}

            <div className="flex justify-between items-center gap-2">
              <h3 className="text-lg font-bold leading-none">{t(tier.name)}</h3>

              {isActivePlan && (
                <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-[10px] font-semibold text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20">
                  {t("Active")}
                </span>
              )}

              {isActivePlan && isCanceling && (
                <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 ring-1 ring-inset ring-amber-600/20">
                  {t("Canceling")}
                </span>
              )}

              {isSpecialAnnual && isPromo && claimOffer && (
                <span className=" inline-flex items-center rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-2 py-0.5 text-[10px] font-bold text-white ring-1 ring-inset ring-pink-500/20 whitespace-nowrap">
                  🎁 {t(claimOffer)}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2 flex-wrap mt-2">
              <div className="relative">
                <span className="text-3xl font-bold tracking-tight">
                  $
                  {tier.key === "annual"
                    ? (Number(finalOriginal || 0) / 12).toFixed(2)
                    : Number(finalOriginal || 0).toFixed(2)}
                </span>
                <span className="text-md font-bold tracking-tight opacity-70">{`/${tier.unit}`}</span>

                {isSelected && (
                  <svg
                    className="absolute bottom-1 left-0 -z-10 w-full h-[1.5em]"
                    viewBox="0 0 100 10"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0 5 Q 50 10 100 5"
                      stroke="currentColor"
                      strokeWidth="15"
                      fill="none"
                      className="animate-draw text-yellow-200/50"
                      pathLength="1"
                    />
                  </svg>
                )}
              </div>

              {finalDefault && Number(finalDefault) > 0 && (
                <div className="flex flex-col justify-end ml-1">
                  <span className="text-sm font-medium line-through text-foreground decoration-1 opacity-70">
                    $
                    {tier.key === "annual"
                      ? (Number(finalDefault || 0) / 12).toFixed(2)
                      : Number(finalDefault || 0).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <p
              className={cn(
                "text-sm font-medium text-muted-foreground leading-tight mt-1",
                tier.key !== "annual" ? " min-h-[40px]" : "",
              )}
            >
              {tier.description}
            </p>
            {hasTrial && !isActivePlan && (
              <div className="flex items-center animate-in fade-in slide-in-from-bottom-1 duration-500">
                <div className="relative flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 dark:bg-blue-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widesfont-bold text-white ring-1 ring-inset ring-pink-500/20 ">
                  {trialFrequency} {trialInterval} {t("Free Trial")}
                </div>
              </div>
            )}
            {/* Features Block */}
            <div className="space-y-3 pt-4 border-t border-border mt-2">
              <div className="space-y-3">
                {tier.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="bg-neutral-600 rounded-full h-4 w-4 flex justify-center items-center shadow-sm shrink-0 mt-1">
                      <Check className="h-2.5 w-2.5 shrink-0 text-white" />
                    </div>
                    <span className="text-sm font-medium text-foreground leading-snug">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer / Button */}
        <div className="pt-2 mt-auto" style={{ transform: "translateZ(20px)" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              isActivePlan ? onManage() : onCheckout();
            }}
            disabled={isLoading}
            style={
              isSelected && !isActivePlan
                ? {
                    backgroundImage:
                      "linear-gradient(to right, #000000, #404040, #000000, #404040)",
                    backgroundSize: "300% 100%",
                    animation: "gradient-flow 4s ease infinite",
                  }
                : {}
            }
            className={cn(
              `
              inline-flex shrink-0 items-center justify-center gap-2 text-xs font-bold whitespace-nowrap
              transition-all duration-500 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50
              disabled:pointer-events-none disabled:opacity-50
              h-10 px-4 w-full rounded-lg border shadow-sm
              active:scale-[0.98] cursor-pointer
              `,
              isActivePlan
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30"
                : isSelected
                  ? "text-white border-transparent shadow-md hover:shadow-xl"
                  : "bg-background text-slate-900 dark:text-white border-neutral-200 hover:border-neutral-300 hover:bg-slate-50",
            )}
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-3 w-3" />
            ) : isActivePlan ? (
              t("Manage subscription")
            ) : hasTrial ? (
              <span className="flex items-center gap-2">
                <Zap size={14} className="fill-current" />
                {t("Start")} {trialInterval} {trialFrequency}-{t("free trial")}
              </span>
            ) : (
              t("Purchase now")
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main Component ---
export default function PricingSection() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { userId, email, subscriptionStatus } = useUserStore();
  const [paddle, setPaddle] = useState<any>(null);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>("pro_monthly");

  const [prices, setPrices] = useState<
    Record<string, { current: number; original: number | null }>
  >({});

  const { targetDate, hasPromo, discountPercent } = useOfferCountdown();
  const [searchParams] = useSearchParams();
  const isPromoLink = searchParams.get("sale") === "true";
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState(0);

  const hasActivePlan = subscriptionStatus !== "free";
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!targetDate) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        ),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const { data: subscriptionData, error: subscriptionError } = useQuery({
    queryKey: ["subscription"],
    queryFn: fetchSubscription,
    enabled: !!userId,
  });

  const activePlanKey = subscriptionData?.data?.billing_cycle?.interval
    ? (INTERVAL_TO_PLAN[subscriptionData.data.billing_cycle.interval] ?? null)
    : null;

  const isCanceling =
    subscriptionData?.data?.scheduled_change?.action === "cancel";

  useEffect(() => {
    if (subscriptionData) {
      console.log(
        "[Subscription] Response:",
        JSON.stringify(subscriptionData, null, 2),
      );
    }
    if (subscriptionError) {
      console.error("[Subscription] Error:", subscriptionError);
    }
  }, [subscriptionData, subscriptionError]);

  const posthog = usePostHog();

  useEffect(() => {
    posthog.capture("pricing_page_viewed", {
      is_promo: isPromoLink,
      source: "web_app",
    });
  }, [posthog, isPromoLink]);

  // 🟢 Move fetchPrices ABOVE the useEffect that uses it
  const fetchPrices = async (paddleInstance: any) => {
    const activeTiers =
      isPromoLink && hasPromo ? PRICING_TIERS_CLAIM : PRICING_TIERS;

    try {
      const previewPromises = activeTiers.map((tier: any) => {
        return paddleInstance.PricePreview({
          items: [{ priceId: tier.priceId, quantity: 1 }],
          discountId: tier.discountId || undefined,
        });
      });

      const results = await Promise.all(previewPromises);

      const newPrices: Record<
        string,
        { current: number; original: number | null }
      > = {};

      results.forEach((result: any) => {
        const item = result.data.details.lineItems[0];

        const currentNum =
          parseInt(item.formattedTotals.total.replace(/[^0-9]/g, ""), 10) / 100;
        const subtotalNum =
          parseInt(item.formattedTotals.subtotal.replace(/[^0-9]/g, ""), 10) /
          100;
        console.log("item.price", item.price);
        newPrices[item.price.id] = {
          current: currentNum,
          original: subtotalNum !== currentNum ? subtotalNum : null,
          hasTrial: !!item.price?.trialPeriod,
          trialInterval: item.price?.trialPeriod?.interval
            ? item.price?.trialPeriod?.interval
            : undefined,
          trialFrequency: item.price?.trialPeriod?.frequency
            ? item.price?.trialPeriod?.frequency
            : undefined,
        };
      });
      console.log("Fetched Prices:", newPrices);
      setPrices(newPrices);
    } catch (error: any) {
      console.error("Price Preview Error", error);
      Sentry.captureException(error);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const paddleInstance = await initializePaddle({
          environment: import.meta.env.VITE_PADDLE_ENV,
          token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN,
          eventCallback: (event) => {
            if (event.name === "checkout.closed") {
              setLoadingPriceId(null);
            }
            if (event.name === "checkout.completed") {
              console.log("Checkout Completed Event:", event);
              posthog.capture("pricing_checkout_completed", {
                is_promo: isPromoLink,
                selected_tier: selectedId,
              });
              setTimeout(() => {
                toast.success(t("Payment Successful! Welcome aboard."));
                queryClient.invalidateQueries({ queryKey: ["subscription"] });
                queryClient.invalidateQueries({ queryKey: ["me"] });
                queryClient.invalidateQueries({ queryKey: ["profile"] });
              }, 2400);
            } else if (event.name === "checkout.error") {
              posthog.capture("pricing_checkout_failed", {
                is_promo: isPromoLink,
                event_name: event.name,
                email: email,
              });
              toast.error(
                t("There was an issue with payment. Please contact support."),
              );
            }
          },
        });

        if (paddleInstance) {
          setPaddle(paddleInstance);
          fetchPrices(paddleInstance); // <--- Called safely here
        }
      } catch (error) {
        console.error("Paddle Init Error:", error);
        Sentry.captureException(error, { tags: { section: "pricing_init" } });
      }
    };
    init();
  }, [t, isPromoLink, hasPromo]);

  const openCheckout = (priceId: string, discountId?: string) => {
    if (!paddle) {
      toast.error(t("Payment system loading..."));
      return;
    }
    posthog.capture("pricing_checkout_started", {
      price_id: priceId,
      is_promo: isPromoLink,
      selected_tier: selectedId,
    });

    setLoadingPriceId(priceId);

    try {
      paddle.Checkout.open({
        items: [{ priceId: priceId, quantity: 1 }],
        discountId: discountId,
        customData: {
          internal_user_id: userId ? userId.toString() : "",
          internal_email: email ? email.toString() : "",
          internal_use_promo: isPromoLink ? "true" : "false",
        },
        settings: {
          displayMode: "overlay",
          theme: "system",
          variant: "one-page",
          showAddTaxId: false,
          showAddDiscounts: true,
        },
      });
    } catch (error) {
      setLoadingPriceId(null);
      Sentry.captureException(error, { extra: { priceId, userId } });
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes marquee-left {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee-left {
            animation: marquee-left 40s linear infinite;
            width: max-content;
          }
          .mask-horizontal {
            mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
            -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
          }
        `}
      </style>

      {/* 🟢 TOP BANNER: Only shows if hook returns hasPromo and a valid date */}
      {hasPromo && targetDate && isPromoLink && (
        <div className="absolute top-0 left-0 right-0 z-[300] w-full border-b border-pink-100 bg-[#FFF5F8] py-1 sm:py-0">
          <div className="flex h-full sm:h-14 w-full items-center justify-between px-4 sm:px-8 max-w-[1400px] mx-auto">
            {/* Left: Badge & Text */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-[#ED4B8E] text-white px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest shadow-sm">
                {t("SALE")}
              </div>
              <p className="text-[13px] sm:text-[15px] font-medium text-zinc-700 tracking-tight">
                {t("Limited time:")}{" "}
                <span className="font-bold text-zinc-900">
                  {t("Special student pricing is active")}
                </span>
              </p>
            </div>

            {/* Right: Timer & Close Button */}
            <div className="flex items-center gap-6 sm:gap-10">
              <div className="flex items-center gap-4 sm:gap-6">
                <TimeUnit value={timeLeft.days} label={t("Days")} />
                <TimeUnit value={timeLeft.hours} label={t("Hrs")} />
                <TimeUnit value={timeLeft.minutes} label={t("Mins")} />
                <TimeUnit value={timeLeft.seconds} label={t("Secs")} />
              </div>

              {/* Close Button */}
            </div>
          </div>
        </div>
      )}

      <div
        className={cn(
          "relative  w-full font-sans flex flex-col items-center bg-transparent gap-4 text-foreground px-4 sm:px-6",
          hasPromo && targetDate && isPromoLink ? "pt-16" : "",
        )}
      >
        {/* <div className="flex  md:flex-row md:items-center justify-between gap-4 w-full">
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <span className="p-2 rounded-xl">
              <Wallet className="text-zinc-800 dark:text-zinc-100" />
            </span>
            <span>{t("Select plan")}</span>
            {hasActivePlan && (
              <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20">
                {t("Active")}
              </span>
            )}
          </h1>
        </div> */}
        <div className="flex flex-col items-center text-center px-4 pt-16 w-full max-w-4xl mx-auto">
          {/* 🟢 Social Proof Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 px-3 py-1 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-300">
              20k+ {t("students learning smarter")}
            </span>
          </div>

          {/* 🟢 Main Heading */}
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white leading-[1.1]">
            {t("Simple, transparent pricing")}
          </h1>

          {/* 🟢 Sub-description */}
          <p className="mt-4 text-base sm:text-xl font-normal text-zinc-400 dark:text-zinc-400 max-w-2xl leading-relaxed">
            {t(
              "No hidden fees. No credit card required to start. Cancel anytime.",
            )}
          </p>
        </div>

        <SocialProof />
        {/* --- PRICING GRID --- */}
        <div
          id="pricing-grid"
          className="grid gap-4 grid-cols-1 md:grid-cols-3 w-full max-w-4xl px-4 z-20 justify-items-center items-stretch mt-6"
        >
          {(isPromoLink && hasPromo ? PRICING_TIERS_CLAIM : PRICING_TIERS).map(
            (tier) => {
              const liveData = prices[(tier as any).priceId];
              const hasTrial = !!liveData?.hasTrial;
              const trialFrequency = liveData?.trialFrequency;
              const trialInterval = liveData?.trialInterval;
              console.log("trialDays", liveData);
              return (
                <PricingCard
                  key={tier.id}
                  hasTrial={hasTrial}
                  trialFrequency={trialFrequency}
                  trialInterval={trialInterval}
                  tier={tier}
                  isSelected={selectedId === tier.id}
                  onSelect={() => setSelectedId(tier.id)}
                  onCheckout={() =>
                    openCheckout(
                      (tier as any).priceId,
                      (tier as any).discountId,
                    )
                  }
                  isLoading={loadingPriceId === (tier as any).priceId}
                  finalOriginal={
                    liveData ? liveData.current : (tier as any).defaultPrice
                  }
                  finalDefault={
                    liveData && liveData.original
                      ? liveData.original
                      : (tier as any).defaultPrice
                  }
                  isPromo={hasPromo}
                  isSpecialAnnual={isPromoLink}
                  activePlanKey={activePlanKey}
                  isCanceling={isCanceling}
                  onManage={() => setSettingsOpen(true)}
                />
              );
            },
          )}
        </div>
        {/* 🟢 TIKTOK VIDEO SLIDER */}
        <div className="w-full max-w-4xl px-4 mt-10 flex flex-col gap-8 z-10">
          <TrustStats />
        </div>
        <div className="max-w-4xl flex flex-col items-center">
          {/* <div className="text-center mb-8 px-4">
            <h3 className="text-2xl font-bold tracking-tight text-foreground uppercase italic">
              See it in action
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              Join thousands of students upgrading their study routine.
            </p>
          </div> */}

          {/* <div className="relative w-full overflow-hidden mask-horizontal pb-10">
            <div className="animate-marquee-left flex gap-4 w-max px-4 hover:[animation-play-state:paused]">
              {[
                "https://bycatassets.com/ugcsimplebycatdeskroom.mp4#t=0.001",
                "https://bycatassets.com/droppingabookbycatai.mp4#t=0.001",
                "https://bycatassets.com/midtermstressugc.mp4#t=0.001",
                "https://bycatassets.com/ugcchessestickbycatai.mp4#t=0.001",
                "https://bycatassets.com/fooduserreview.mp4#t=0.001",
                "https://bycatassets.com/ugcbycataisippingondesk.mp4#t=0.001",
                // Duplicated for seamless loop
                "https://bycatassets.com/ugcsimplebycatdeskroom.mp4#t=0.001",
                "https://bycatassets.com/droppingabookbycatai.mp4#t=0.001",
                "https://bycatassets.com/midtermstressugc.mp4#t=0.001",
                "https://bycatassets.com/ugcchessestickbycatai.mp4#t=0.001",
                "https://bycatassets.com/fooduserreview.mp4#t=0.001",
                "https://bycatassets.com/ugcbycataisippingondesk.mp4#t=0.001",
              ].map((vid, index) => (
                <div key={index} className="shrink-0 w-[150px] aspect-[9/19] bg-zinc-900 rounded-[30px] p-1 border border-white/5 overflow-hidden">
                  <div className="w-full h-full rounded-[26px] overflow-hidden relative">
                    <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
                      <source src={vid} type="video/mp4" />
                    </video>
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white z-20">
                      <Zap size={10} className="fill-white" />
                      <span className="text-[10px] font-bold">{(Math.random() * 40 + 10).toFixed(1)}K</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div> */}
          <div className="w-full max-w-4xl mx-auto px-4 py-10 font-sans">
        {/* --- HEADER --- */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {t("Frequently asked questions")}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1">
            {t("Everything you need to know before upgrading.")}
          </p>
        </div>

        {/* --- FAQ CARD --- */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[24px] overflow-hidden shadow-sm mb-12">
          {FAQ_DATA.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`border-b border-zinc-100 dark:border-zinc-800 last:border-none transition-colors ${isOpen ? "bg-zinc-50/30 dark:bg-zinc-800/20" : ""}`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-all"
                >
                  <span className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                    {t(item.question)}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-zinc-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-1 duration-200">
                    <p className="text-zinc-500 text-[15px] leading-relaxed font-regular">
                      {t(item.answer)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* --- BOTTOM CTA BOX --- */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="text-center sm:text-left">
            <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {t("Still unsure? Start free.")}
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1">
              {t("The weekly plan is always free — no credit card needed.")}
            </p>
          </div>

          <button className="bg-[#ED4B8E] hover:bg-[#D43D7A] text-white px-8 py-3.5 rounded-2xl font-bold text-base transition-all active:scale-95 shadow-[0_10px_20px_-5px_rgba(237,75,142,0.3)] whitespace-nowrap">
            {t("Get started for free")} →
          </button>
        </div>
      </div>

        </div>
        
      </div>
      

      <div className="fixed bottom-6 right-6 z-[220] pointer-events-none hidden md:block">
        <div className="pointer-events-auto drop-shadow-2xl">
          <LiveActivityFeed2 />
        </div>
      </div>

      <SettingsDialog
        isOpen={settingsOpen}
        setIsOpen={setSettingsOpen}
        defaultTab="subscription"
      />
    </>
  );
}
