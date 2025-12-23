import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { initializePaddle } from "@paddle/paddle-js";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as Sentry from "@sentry/react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Layout from "@/components/layout";
import { cn } from "@/lib/utils";
import CatPenIcon from "@/notes/cat-pen-icon";
import { useUserStore } from "@/store/userStore";
import { PRICING_TIERS } from "./pricing-data"; // Assuming you put data here

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
  // --- 3D TILT LOGIC ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth out the mouse values (Spring physics)
  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

  // Convert mouse position to rotation degrees
  // Range: [-0.5, 0.5] -> [-12deg, 12deg]
  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-7deg", "7deg"]);

  // Glare movement
  const glareX = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Calculate mouse position as a percentage (-0.5 to 0.5)
    const mouseXPct = (e.clientX - rect.left) / width - 0.5;
    const mouseYPct = (e.clientY - rect.top) / height - 0.5;

    x.set(mouseXPct);
    y.set(mouseYPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div
      className="h-full perspective-1000" // perspective-1000 is needed for 3D depth
      onClick={onSelect}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1000 }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        animate={{
          scale: isSelected ? 1.05 : 1, // Handle selection scaling via Framer
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "relative flex flex-col gap-6 rounded-xl py-8 h-full bg-background transition-colors duration-300",
          isSelected
            ? "border-2 border-primary shadow-2xl z-20"
            : "border border-border shadow-lg z-0"
        )}
      >
        {/* --- GLARE EFFECT LAYER --- */}
        <div 
            className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none z-[2]"
            style={{ transform: "translateZ(1px)" }} // Sits slightly above
        >
            <motion.div
                style={{
                    x: glareX,
                    y: glareY,
                    background: "radial-gradient(circle, rgba(255,255,255, 0.1) 0%, transparent 60%)",
                }}
                className="absolute -inset-[100%] w-[300%] h-[300%]"
            />
        </div>

        {/* Discount Badge (Popped out in 3D) */}
        {tier.discount && (
          <div 
            className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl font-bold text-xs text-white shadow-sm bg-primary dark:bg-neutral-600 z-30"
            style={{ transform: "translateZ(30px)" }} // Pops out
          >
            {tier.discount}
          </div>
        )}

        <div className="px-6 flex flex-col gap-6 relative z-10 flex-1" style={{ transform: "translateZ(20px)" }}>
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-bold">{tier.name}</h3>

            <div className="flex items-baseline gap-2 flex-wrap">
              <div className="relative">
                <span className="text-4xl font-bold tracking-tight">
                  {`$${tier.originalPrice}`}
                </span>
                {isSelected && (
                  <svg
                    className="absolute bottom-1 left-0 -z-10 w-full h-[2em]"
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
                  <span className="text-md font-medium line-through text-foreground decoration-1 opacity-70">
                    ${tier.defaultPrice}
                  </span>
                </div>
              )}
            </div>

            <p className="text-sm font-medium text-muted-foreground min-h-[40px]">
              {tier.description}
            </p>

            <div className="space-y-4 pt-6 border-t border-border mt-2">
              <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-widest">
                Includes:
              </h4>
              <div className="space-y-3">
                {tier.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="bg-neutral-600 rounded-full h-5 w-5 flex justify-center items-center shadow-sm">
                      <Check className="h-3.5 w-3.5 shrink-0 text-white" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-2 mt-auto" style={{ transform: "translateZ(20px)" }}>
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
              inline-flex shrink-0 items-center justify-center gap-2 text-sm font-bold whitespace-nowrap 
              transition-all duration-500 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 
              disabled:pointer-events-none disabled:opacity-50 
              h-12 px-6 w-full rounded-lg border shadow-sm
              active:scale-[0.98] cursor-pointer
              `,
              isSelected
                ? "text-white border-transparent shadow-md hover:shadow-xl"
                : "bg-background text-slate-900 dark:text-white border-neutral-200 hover:border-neutral-300 hover:bg-slate-50"
            )}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Purchase now"}
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

  const [paddle, setPaddle] = useState(null);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>("pro_monthly"); // Use ID not Name

  // ✅ Store localized prices here
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

  const fetchPrices = (paddleInstance: Paddle) => {
    const itemsToPreview = PRICING_TIERS.map((t) => ({
      quantity: 1,
      priceId: t.priceId,
    }));

    paddleInstance
      .PricePreview({ items: itemsToPreview })
      .then((result) => {
        const newPrices: Record<string, string> = {};
        result.data.details.lineItems.forEach((item) => {
          newPrices[item.price.id] = item.formattedTotals.total;
        });
        setPrices(newPrices); // ✅ Update state to trigger re-render
      })
      .catch((error) => {
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
          theme: "system", // ✅ Auto-detects dark mode
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
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
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

          /* --- NEW SLOW CAT BOUNCE --- */
          /* Moving 10px up and down smoothly */
          @keyframes slow-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animate-slow-bounce {
            /* 3s duration = Slow speed */
            /* ease-in-out = Smooth "floating" feeling */
            animation: slow-bounce 3s ease-in-out infinite;
          }

        `}
      </style>

      <div className="relative min-h-screen w-full font-sans flex flex-col items-center bg-background gap-4 text-foreground">
        {/* --- HEADER --- */}
        <div className="relative w-full  px-4 flex flex-col items-center text-center z-10">
          {/* Background Decoration (Dark Mode Compatible) */}
      

            <div className="animate-slow-bounce flex items-center justify-center rounded-full mb-4">
              <CatPenIcon className="h-12 w-12" />
            </div>
          {/* <h1 className="max-w-4xl mb-4 text-4xl md:text-5xl font-bold tracking-tight">
            <span className="relative inline-block">
              <span className="relative z-10">{t("Select plan")}</span>
              <svg className="absolute -bottom-1 left-0 -z-10 h-3 w-full text-primary/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
            </span>
          </h1> */}

          {/* <h1 className="max-w-4xl mb-4 text-4xl md:text-5xl font-bold tracking-tight">
            <span className="relative inline-block">
              <span className="relative z-10">{t("Select plan")}</span>
              <svg
                className="absolute -bottom-2 left-0 -z-10 w-full"
                height="12"
                viewBox="0 0 200 9"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <path
                  d="M2.00025 6.99997C25.3336 4.00003 172.999 -1.49997 197.999 2.00003"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className=" animate-draw text-blue/60 dark:text-blue/80" // Adjust color here
                  pathLength="1"
                />
              </svg>
            </span>
          </h1> */}

          {/* <h1 className="max-w-4xl mb-4 text-4xl md:text-5xl font-bold tracking-tight">
              <span className="relative inline-block px-2">
                <span className="relative z-10">{t("Select plan")}</span>
                
                <svg 
                  className="absolute bottom-1 left-0 -z-10 w-full h-[0.6em]" // h-[0.6em] makes it cover half the text height
                  viewBox="0 0 100 10" 
                  preserveAspectRatio="none"
                >
                  <path 
                    d="M0 5 Q 50 10 100 5" 
                    stroke="currentColor" 
                    strokeWidth="15" // Very thick stroke
                    fill="none" 
                    className="animate-draw text-blue-300/50 dark:text-blue-500/40" // Pink highlighter color
                                  pathLength="1"
                  />
                </svg>
              </span>
            </h1> */}

          <h1 className="max-w-4xl mb-4 text-4xl md:text-5xl font-bold tracking-tight">
            <span className="relative inline-block">
              <span className="relative z-10">{t("Select plan")}</span>
             <svg
                className="absolute -bottom-2 left-0 -z-10 w-full"
                height="12"
                viewBox="0 0 200 9"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <path
                  d="M2.00025 6.99997C25.3336 4.00003 172.999 -1.49997 197.999 2.00003"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className=" animate-draw text-blue/60 dark:text-blue/80" // Adjust color here
                  pathLength="1"
                />
              </svg>

           
              {/* <svg
                className="absolute -bottom-1 left-0 -z-10 w-full h-3"
                viewBox="0 0 300 15"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M3 12C50 10 120 7 290 5C250 10 150 15 10 13"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-draw text-blue"
                  pathLength="1"
                />
              </svg> */}
            </span>
          </h1>

          <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed">
            {t(
              "Capture everything in one note! Seamlessly combine PDFs, voice recordings, multiple images, and text."
            )}
          </p>
        </div>

        {/* --- PRICING GRID --- */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 w-full max-w-7xl px-30 z-20">
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
      </div>
    </Layout>
  );
}
