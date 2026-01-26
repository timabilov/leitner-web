import { useEffect, useState } from "react";
import { Check, Loader2, Zap, FileText, BrainCircuit, Mic, Wand2 } from "lucide-react";
import { initializePaddle } from "@paddle/paddle-js";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as Sentry from "@sentry/react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import Layout from "@/components/layout";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { PRICING_TIERS } from "./pricing-data"; 

// --- UPDATED COMPONENT: Floating Side Notification (Down -> Up Animation) ---
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useQuery } from "@tanstack/react-query";

// --- TYPES ---
type ActivityItem = {
  id?: string;
  user: string;
  action: string;
  icon?: any;
  color?: string;
  time: string;
};

// --- COMPONENT ---
const LiveActivityFeed = () => {
  // 1. Get Company ID (Assuming user is logged in based on your URL requirement)
  // If this is a public page, you might need a hardcoded ID or a different public endpoint.
  const { companyId } = useUserStore();

  const [currentActivity, setCurrentActivity] = useState<ActivityItem | null>(null);
  const [activityQueue, setActivityQueue] = useState<ActivityItem[]>([]);

  // 2. Helper to map text to icons
  const getActionConfig = (actionText: string) => {
    if (actionText.includes("subscribed")) return { icon: Check, color: "text-purple-500" };
    if (actionText.includes("note")) return { icon: Check, color: "text-blue-500" };
    if (actionText.includes("quizzes")) return { icon: Check, color: "text-green-500" };
    if (actionText.includes("flashcards")) return { icon: Check, color: "text-yellow-500" };
    if (actionText.includes("PDF")) return { icon: Check, color: "text-indigo-500" };
    if (actionText.includes("voice")) return { icon: Check, color: "text-red-500" };
    if (actionText.includes("AI")) return { icon: Check, color: "text-cyan-500" };
    return { icon: Check, color: "text-gray-500" };
  };

  // 3. TanStack Query: Fetch every 5 seconds
  useQuery({
    queryKey: ["liveActivity", companyId],
    queryFn: async () => {
      // Using your specific URL structure
      const response = await axiosInstance.get(`${API_BASE_URL}/company/${companyId}/notes/activity/live`);
      
      // Process and map data immediately
      if (response.data && response.data.activities) {
        const mapped: ActivityItem[] = response.data.activities.map((item: ApiActivityItem) => {
          const config = getActionConfig(item.action);
          return {
            id: Math.random().toString(36), // Unique ID for Framer keys
            user: item.user,
            action: item.action,
            icon: config.icon,
            color: config.color,
            time: item.time,
          };
        });
        
        // Update local queue with fresh data
        // We replace the queue to ensure we always cycle through the freshest 50
        setActivityQueue(mapped); 
      }
      return response.data;
    },
    refetchInterval: 5000, // Fetch every 5 seconds
    refetchOnWindowFocus: false,
    enabled: !!companyId, // Only fetch if we have an ID
  });

  // 4. Cycle Logic: Pop items from the queue
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const cycleActivity = () => {
      // Animate OUT current item
      setCurrentActivity(null);

      // Random delay between items (1s - 2s) for organic feel
      const delay = Math.random() * 1000 + 1000;

      timeoutId = setTimeout(() => {
        setActivityQueue((prevQueue) => {
          if (prevQueue.length === 0) return prevQueue;

          // Pop the first item
          const [nextItem, ...remaining] = prevQueue;
          setCurrentActivity(nextItem);
          
          return remaining;
        });

        // Keep item visible for ~3.5s before cycling again
        timeoutId = setTimeout(cycleActivity, 3500); 
      }, delay);
    };

    cycleActivity();

    return () => clearTimeout(timeoutId);
  }, []); // Run once on mount, internal recursion handles the rest

  return (
    <div className="absolute bottom-6 left-6 z-50 pointer-events-none max-w-[320px] w-full hidden md:block">
      <AnimatePresence mode="wait">
        {currentActivity && (
          <motion.div
            key={currentActivity.id}
            initial={{ opacity: 0, y: 40, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.3 } }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex items-center gap-3 bg-background/80 backdrop-blur-md border border-border/50 shadow-xl rounded-2xl p-4"
          >
            {/* Icon Bubble */}
            {/* <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 flex items-center justify-center shrink-0 border border-white/10 shadow-inner"> */}
              {/* <currentActivity.icon className={cn("w-5 h-5", currentActivity.color)} /> */}
              {/* Pulse Dot */}
              {/* <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span> */}
            {/* </div> */}
            
            {/* Text Content */}
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {currentActivity.user}
              </span>
              <span className="text-xs text-muted-foreground">
                {/* {currentActivity.action} */}
                subscribed
              </span>
            </div>
            
            {/* <span className="ml-auto text-[10px] text-muted-foreground/50 font-medium">
              {currentActivity.time}
            </span> */}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


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
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-7deg", "7deg"]);

  const glareX = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
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
      className="h-full w-full max-w-[280px] mx-auto perspective-1000" 
      onClick={onSelect}
      style={{ perspective: 1000 }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        animate={{
          scale: isSelected ? 1.05 : 1, 
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "relative flex flex-col gap-6 rounded-xl py-8 h-full bg-background transition-colors duration-300",
          isSelected
            ? "border-2 border-primary shadow-2xl z-20"
            : "border border-border shadow-lg z-0"
        )}
      >
        <div 
            className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none z-[2]"
            style={{ transform: "translateZ(1px)" }} 
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

        {tier.discount && (
          <div 
            className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl font-bold text-xs text-white shadow-sm bg-primary dark:bg-neutral-600 z-30"
            style={{ transform: "translateZ(30px)" }} 
          >
            {tier.discount}
          </div>
        )}

        <div className="px-5 flex flex-col gap-6 relative z-10 flex-1" style={{ transform: "translateZ(20px)" }}>
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
                    <div className="bg-neutral-600 rounded-full h-4 w-4 flex justify-center items-center shadow-sm shrink-0">
                      <Check className="h-2.5 w-2.5 shrink-0 text-white" />
                    </div>
                    <span className="text-sm font-medium text-foreground leading-tight">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-2 mt-auto" style={{ transform: "translateZ(20px)" }}>
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

      {/* Live Activity Feed (Side, Down-to-Up) */}
      <LiveActivityFeed />

      <div className="relative min-h-full w-full font-sans flex flex-col items-center bg-transparent gap-4 text-foreground">
        
        {/* --- HEADER --- */}
        <div className="relative w-full px-6 pt-12 pb-8 flex flex-col items-center text-center z-10">
          <h1 className="max-w-4xl mb-6 text-4xl md:text-5xl font-bold tracking-tight">
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
                  className=" animate-draw text-blue/60 dark:text-blue/80"
                  pathLength="1"
                />
              </svg>
            </span>
          </h1>

          <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed">
            {t(
              "Capture everything in one note! Seamlessly combine PDFs, voice recordings, multiple images, and text."
            )}
          </p>
        </div>

        {/* --- PRICING GRID --- */}
        <div className="grid gap-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full max-w-5xl px-4 z-20 justify-items-center">
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