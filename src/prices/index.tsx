import React, { useEffect, useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { initializePaddle } from "@paddle/paddle-js";
import Layout from "@/components/layout";
import { cn } from "@/lib/utils";

// --- Configuration ---
const PADDLE_ENV = "sandbox";
const PADDLE_CLIENT_TOKEN = "test_1234567890";

const tiers = [
  {
    id: "weekly",
    name: "Weekly",
    price: 8.99,
    // No discount for weekly
    description: "Perfect for short-term projects.",
    priceId: "pri_weekly_123",
    variant: "default",
    features: [
      /* ... features ... */
    ],
  },
  {
    id: "monthly",
    name: "Monthly",
    price: 11.99,
    originalPrice: 23.99, // 50% off logic
    discount: "50% OFF",
    description: "Recommended for ongoing usage.",
    priceId: "pri_monthly_456",
    variant: "default",
    features: [
      /* ... features ... */
    ],
  },
  {
    id: "annual",
    name: "Annual",
    price: 57.99,
    originalPrice: 289.95, // ~80% off logic
    discount: "80% OFF",
    description: "Best value. Save significantly.",
    priceId: "pri_annual_789",
    variant: "primary",
    features: [
      /* ... features ... */
    ],
  },
];

export default function PricingSection() {
  const [paddle, setPaddle] = useState<any | null>(null);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  // Default to "Monthly"
  const [selected, setSelected] = useState<string>("Monthly");

  // Initialize Paddle
  useEffect(() => {
    initializePaddle({
      environment: PADDLE_ENV,
      token: PADDLE_CLIENT_TOKEN,
    }).then((paddleInstance) => {
      if (paddleInstance) setPaddle(paddleInstance);
    });
  }, []);

  // Handle Checkout
  const openCheckout = (priceId: string) => {
    if (!paddle) return;
    setLoadingPriceId(priceId);

    paddle.Checkout.open({
      items: [{ priceId: priceId, quantity: 1 }],
      settings: { displayMode: "overlay", theme: "light" },
    });

    setTimeout(() => setLoadingPriceId(null), 2000);
  };

  return (
    <Layout noGap>
      {/* CSS Keyframes for the button gradient flow */}
      <style>
        {`
          @keyframes gradient-flow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>

      <div className="relative min-h-screen w-full text-slate-900 selection:bg-purple-100 font-sans flex flex-col h-full">
        <div className="mb-12 mt-12 flex flex-col items-center gap-4 text-center sm:mb-16 lg:mb-24">
          <h2 className="text-2xl font-semibold text-slate-700 md:text-3xl lg:text-4xl">
            Choose the best option for your logistic company
          </h2>
          <p className="text-xl text-slate-700">
            A Comprehensive Breakdown of Our Pricing Plans to Help You Make the
            Best Choice!
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-6 max-w-7xl mx-auto px-6 pb-20">
          {tiers.map((tier) => {
            const isSelected = selected === tier.name;

            return (
              <div
                key={tier.id}
                className="flex flex-col gap-4 cursor-pointer group"
                onClick={() => setSelected(tier.name)}
              >
                <div
                  data-slot="card"
                  className={cn(
                    "flex flex-col gap-6 rounded-xl py-6 relative overflow-hidden transition-all duration-300",
                    "bg-white/80 backdrop-blur-sm border",
                    isSelected
                      ? "border-pink-500 shadow-xl scale-[1.02]"
                      : "border-neutral-200 hover:border-neutral-300 hover:shadow-md"
                  )}
                >
                  {/* --- DISCOUNT BADGE --- */}
                  {tier.discount && (
                    <div 
                        className="absolute top-0 right-0 px-4 py-1 rounded-bl-xl font-bold text-xs text-white shadow-sm z-20 bg-black"
                        // style={{
                        //     backgroundImage: "linear-gradient(to right, #FE5E5F, #C04796)",
                        // }}
                    >
                      {tier.discount}
                    </div>
                  )}

                  <div className="px-6 flex flex-col gap-6 relative z-10 mt-2">
                    <div className="flex flex-col gap-4">
                      <h3 className="text-3xl font-semibold">{tier.name}</h3>
                      
                      {/* --- PRICE SECTION WITH OLD PRICE --- */}
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-lg font-medium text-muted-foreground">
                          $
                        </span>
                        <span className="text-5xl font-bold">{tier.price}</span>
                        
                        {/* Old Price Display */}
                        {tier.originalPrice && (
                          <div className="flex flex-col justify-end ml-2">
                            <span className="text-sm text-slate-400 line-through decoration-slate-400 decoration-1">
                              ${tier.originalPrice}
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="text-base text-muted-foreground">
                        {tier.description}
                      </p>

                      {/* Feature Highlights (Hardcoded example from previous snippet) */}
                      <div className="space-y-3">
                        <h4 className="text-slate-700 mb-5 text-lg font-semibold">
                          For micro-business:
                        </h4>
                        <div className="flex items-center gap-3">
                          <Check className="text-muted-foreground size-5 shrink-0" />
                          <span className="text-slate-700 font-medium">
                            3x Business account &amp; Cards
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Check className="text-muted-foreground size-5 shrink-0" />
                          <span className="text-slate-700 font-medium">
                            Unlimited Accounts
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Check className="text-muted-foreground size-5 shrink-0" />
                          <span className="text-slate-700 font-medium">
                           500 transfer or direct debit
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Check className="text-muted-foreground size-5 shrink-0" />
                          <span className="text-slate-700 font-medium">
                            50+ Integrations
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* --- PURCHASE BUTTON --- */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openCheckout(tier.priceId);
                      }}
                      disabled={loadingPriceId === tier.priceId || !paddle}
                      className={cn(
                        `
                        inline-flex shrink-0 items-center justify-center gap-2 text-sm font-bold whitespace-nowrap 
                        transition-all duration-500 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 
                        disabled:pointer-events-none disabled:opacity-50 
                        h-12 px-6 w-full rounded-md border
                        active:scale-[0.98]
                        `,
                        isSelected
                          ? "text-white border-transparent shadow-md"
                          : "bg-white text-slate-900 border-neutral-300 group-hover:border-neutral-400"
                      )}
                      style={
                        isSelected
                          ? {
                              backgroundImage:
                                "linear-gradient(to right, #FE5E5F, #C04796, #FE5E5F, #C04796)",
                              backgroundSize: "300% 100%",
                              animation: "gradient-flow 4s ease infinite",
                            }
                          : {}
                      }
                    >
                      {loadingPriceId === tier.priceId ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        "Purchase now"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}