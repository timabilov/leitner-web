import { useEffect, useState } from "react";
import { Check, Loader2, Star } from "lucide-react";
import { initializePaddle } from "@paddle/paddle-js";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as Sentry from "@sentry/react";
import { motion } from "framer-motion";
import Layout from "@/components/layout";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { PRICING_TIERS } from "./pricing-data";
import LiveActivityFeed2 from "./live-activity-feed2";
import CountdownTimer from "@/components/countdown-timer";

// --- COMPONENT: Social Proof (Centered Bottom) ---
const SocialProof = () => (
  <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 mt-2">
    <div className="flex flex-wrap justify-center items-center gap-4 bg-muted/30 p-3 rounded-2xl border border-border/40 backdrop-blur-sm">
      {/* Avatars Stack */}
      <div className="flex -space-x-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-8 w-8 overflow-hidden rounded-full border-2 border-background shadow-sm"
          >
            <img
              alt={`User ${i}`}
              src={`https://i.pravatar.cc/100?img=${i + 10}`} 
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
          Trusted by <span className="text-foreground font-bold">20k+</span> students
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
}: {
  tier: (typeof PRICING_TIERS)[0];
  isSelected: boolean;
  onSelect: () => void;
  onCheckout: () => void;
  isLoading: boolean;
  displayPrice: string | null;
}) => {
  const { t } = useTranslation();

  return (
    <div
      // CHANGED: Reduced max-w to 260px for a more compact look
      className="h-full w-full max-w-[300px] mx-auto perspective-1000"
      onClick={onSelect}
      style={{ perspective: 1000 }}
    >
      <motion.div
        animate={{
          scale: isSelected ? 1.03 : 1, // Reduced scale slightly for subtlety
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          // CHANGED: Reduced padding (py-6 px-4)
          "relative flex flex-col gap-4 rounded-xl py-6 px-4 h-full bg-background transition-colors duration-300",
          isSelected
            ? "border-2 border-primary shadow-2xl z-20"
            : "border border-border shadow-md z-0",
        )}
      >
        {tier.discount && (
          <div
            className="absolute -top-2 -right-2 px-3 py-1 rounded-full font-bold text-[10px] text-white shadow-sm bg-primary dark:bg-neutral-600 z-30"
            style={{ transform: "translateZ(30px)" }}
          >
            {tier.discount}
          </div>
        )}

        {/* Content Section */}
        <div className="flex flex-col gap-4 relative z-10 flex-1" style={{ transform: "translateZ(20px)" }}>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold">{t(tier.name)}</h3>

            <div className="flex items-baseline gap-2 flex-wrap">
              <div className="relative">
                {/* CHANGED: Smaller price text (text-3xl) */}
                <span className="text-3xl font-bold tracking-tight">
                  {`$${tier.originalPrice}`}
                </span>
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

              {tier.defaultPrice && (
                <div className="flex flex-col justify-end ml-1">
                  <span className="text-sm font-medium line-through text-foreground decoration-1 opacity-70">
                    ${tier.defaultPrice}
                  </span>
                </div>
              )}
            </div>

            <p className="text-sm font-medium text-muted-foreground min-h-[40px] leading-tight">
              {tier.description}
            </p>

            {/* --- FEATURES BLOCK (Re-enabled & Compacted) --- */}
            <div className="space-y-3 pt-4 border-t border-border mt-2">
              {/* <h4 className="text-[10px] font-bold text-foreground/70 uppercase tracking-widest">
                {t("Includes")}:
              </h4> */}
              <div className="space-y-3">
                {tier.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="bg-neutral-600 rounded-full h-4 w-4 flex justify-center items-center shadow-sm shrink-0 mt-1">
                      <Check className="h-2.5 w-2.5 shrink-0 text-white" />
                    </div>
                    {/* CHANGED: Smaller feature text */}
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
              onCheckout();
            }}
            disabled={isLoading}
            style={
              isSelected
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
              isSelected
                ? "text-white border-transparent shadow-md hover:shadow-xl"
                : "bg-background text-slate-900 dark:text-white border-neutral-200 hover:border-neutral-300 hover:bg-slate-50",
            )}
          >
            {isLoading ? <Loader2 className="animate-spin h-3 w-3" /> : "Purchase now"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main Component ---
export default function PricingSection() {
  const { t } = useTranslation();
  const { userId, email } = useUserStore();
  const [paddle, setPaddle] = useState<any>(null);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>("pro_monthly");
  const [prices, setPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    const init = async () => {
      try {
        const paddleInstance = await initializePaddle({
          environment: import.meta.env.VITE_PADDLE_ENV,
          token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN,
          eventCallback: (event) => {
            if (event.name === "checkout.closed") setLoadingPriceId(null);
            if (event.name === "checkout.completed") {
              toast.success(t("Payment Successful! Welcome aboard."));
            }
          },
        });

        if (paddleInstance) {
          setPaddle(paddleInstance);
          fetchPrices(paddleInstance);
        }
      } catch (error) {
        console.error("Paddle Init Error:", error);
        Sentry.captureException(error, { tags: { section: "pricing_init" } });
      }
    };
    init();
  }, [t]);

  const fetchPrices = (paddleInstance: any) => {
    const itemsToPreview = PRICING_TIERS.map((t) => ({
      quantity: 1,
      priceId: t.priceId,
    }));

    paddleInstance
      .PricePreview({ items: itemsToPreview })
      .then((result: any) => {
        const newPrices: Record<string, string> = {};
        result.data.details.lineItems.forEach((item: any) => {
          newPrices[item.price.id] = item.formattedTotals.total;
        });
        setPrices(newPrices);
      })
      .catch((error: any) => {
        console.error("Price Preview Error", error);
        Sentry.captureException(error);
      });
  };

  const openCheckout = (priceId: string, discountId?: string) => {
    if (!paddle) {
      toast.error(t("Payment system loading..."));
      return;
    }
    setLoadingPriceId(priceId);

    try {
      paddle.Checkout.open({
        items: [{ priceId: priceId, quantity: 1 }],
        discountId: discountId,
        customData: { internal_user_id: userId, internal_email: email },
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
    <Layout noGap>
      <style>
        {`
          @keyframes gradient-flow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes draw {
            from { stroke-dashoffset: 1; }
            to { stroke-dashoffset: 0; }
          }
          .animate-draw {
            stroke-dasharray: 1;
            stroke-dashoffset: 1;
            animation: draw 0.8s ease-out forwards;
          }
        `}
      </style>

      {/* Live Activity Feed */}
      <LiveActivityFeed2 />

      <div className="relative min-h-full w-full font-sans flex flex-col items-center bg-transparent gap-4 text-foreground">
        
        {/* --- HEADER --- */}
        <div className="relative w-full px-6 pt-12 pb-6 flex flex-col items-center text-center z-10">
          <div className="relative w-full max-w-5xl flex flex-col md:flex-row items-center justify-center mb-3">
            {/* <h1 className="max-w-4xl text-3xl md:text-5xl font-bold tracking-tight z-10">
              <span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700">
                  {t("Select plan")}
                </span>
                <svg
                  className="absolute -bottom-2 left-0 -z-10 w-full"
                  height="12"
                  viewBox="0 0 200 9"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="underline-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#4338ca" />
                      <stop offset="50%" stopColor="#7e22ce" />
                      <stop offset="100%" stopColor="#be185d" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M2.00025 6.99997C25.3336 4.00003 172.999 -1.49997 197.999 2.00003"
                    stroke="url(#underline-gradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="animate-draw"
                    pathLength="1"
                  />
                </svg>
              </span>
            </h1> */}
          </div>

          {/* --- SPINNING BORDER OFFER --- */}
          <div className="mx-auto flex justify-center mt-2 mb-6">
            <div className="group relative inline-flex overflow-hidden rounded-xl p-[2px] shadow-lg shadow-pink-500/10">
              <span className="relative inline-flex h-full w-full items-center justify-center rounded-xl bg-background px-4 py-2 text-sm font-medium text-foreground backdrop-blur-3xl">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 rounded-full bg-pink-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pink-500 ring-1 ring-inset ring-pink-500/20">
                    🔥 Sale
                  </span>
                  <span className="font-bold text-xs sm:text-sm">Claim offer</span>
                  <span className="h-4 w-px bg-border/60 mx-1" />
                  <CountdownTimer targetDate={new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)} size="xs" />
                </div>
              </span>
            </div>
          </div>
             <SocialProof />
          {/* <p className="max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed px-4">
            {t("Capture everything in one note! Seamlessly combine PDFs, voice recordings, multiple images, and text.")}
          </p> */}
        </div>

        {/* --- PRICING GRID --- */}
        {/* CHANGED: Tighter max-w (4xl) and gap (gap-4) for a compact layout */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 w-full max-w-4xl px-4 z-20 justify-items-center items-stretch">
          {PRICING_TIERS.map((tier) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              isSelected={selectedId === tier.id}
              onSelect={() => setSelectedId(tier.id)}
              onCheckout={() => openCheckout(tier.priceId, tier.discountId)}
              isLoading={loadingPriceId === tier.priceId}
              displayPrice={tier.originalPrice}
            />
          ))}
        </div>

        {/* --- BOTTOM SECTION: SOCIAL PROOF --- */}
        {/* <div className="w-full flex justify-center mt-8 z-10 px-4">
          <SocialProof />
        </div> */}

      </div>
    </Layout>
  );
}