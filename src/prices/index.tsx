import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { initializePaddle } from "@paddle/paddle-js";
import Layout from "@/components/layout";
import { cn } from "@/lib/utils";
import CatPenIcon from "@/notes/cat-pen-icon";
import { useTranslation } from "react-i18next";
import confetti from './confetti1.gif';
import { useUserStore } from "@/store/userStore";



const items = [
  {
    quantity: 1,
    priceId: 'pri_01kaxbbdytvqamegsd7e486r59',
  },
   {
    quantity: 1,
    priceId: 'pri_01kaxb9tc7q2kqmh0c3rhda462',
  },
   {
    quantity: 1,
    priceId: 'pri_01kaxb7rjs3vkn4dtjrk8x7hmh',
  }
];


const tiers = [
  {
    id: "pro_01kaxb3b72hj2d925014ewg41d",
    name: "Weekly",
    price: 8.99,
    description: "Perfect for short-term projects.",
    // 3. PASTE YOUR WEEKLY PRICE ID HERE (e.g., pri_01h...)
    priceId: "pri_01kaxbbdytvqamegsd7e486r59", 
    variant: "default",
    features: [
      'Unlimited notes',
      'Unlimited videos',
      'Unlimited quizzes & flashcards',
      'Quiz notifications'
    ],
  },
  {
    id: "pro_01kaxb3wfca7zwmhkm8ep9q4yb",
    name: "Monthly",
    price: 11.99,
    originalPrice: 23.99,
    discountId: 'dsc_01kbaks5he1g277bedvg06xs1m',
    discount: "50% OFF",
    description: "Recommended for ongoing usage.",
    // 4. PASTE YOUR MONTHLY PRICE ID HERE
    priceId: "pri_01kaxb9tc7q2kqmh0c3rhda462", 
    variant: "default",
     features: [
      'Unlimited notes',
      'Unlimited videos',
      'Unlimited quizzes & flashcards',
      'Quiz notifications'
    ],
  },
  {
    id: "pro_01kaxb4433xhf7za5drj0nk36k",
    name: "Annual",
    price: 57.99,
    originalPrice: 289.95,
    discount: "80% OFF",
     discountId: 'dsc_01kbaksng47cf7gsr4wht0xrdq',
    description: "Best value. Save significantly.",
    // 5. PASTE YOUR ANNUAL PRICE ID HERE
    priceId: "pri_01kaxb7rjs3vkn4dtjrk8x7hmh",
    variant: "primary",
    features: [
      'Unlimited notes',
      'Unlimited videos',
      'Unlimited quizzes & flashcards',
      'Quiz notifications'
    ],
  },
];

export default function PricingSection() {
    const { i18n, t } = useTranslation();
       const { userId, email } = useUserStore();
  // Type the paddle instance state
  const [paddle, setPaddle] = useState<  null>(null);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>("Monthly");

  // Initialize Paddle on Component Mount
  useEffect(() => {
    initializePaddle({
      environment: import.meta.env.VITE_PADDLE_ENV,
      token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN,
      eventCallback: (event) => {
        // Optional: Listen for events
        if (event.name === "checkout.closed") {
          setLoadingPriceId(null);
        }
        if (event.name === "checkout.completed") {
          alert("Payment Successful! Welcome aboard.");   // You could redirect here: window.location.href = "/thank-you";
      }
      }
    }).then((paddleInstance) => {
      console.log("paddleInstance", paddleInstance);
      if (paddleInstance) {
        setPaddle(paddleInstance);
        getPrices(paddleInstance)
      }
    });
  }, []);


  const  getPrices = (paddleInstance) =>  {
    paddleInstance.PricePreview({items})
      .then((result) => {
        console.log(result);
      })
      .catch((error) => {
        console.error(error);
      });
  }



  // Handle Checkout Logic
  const openCheckout = (priceId: string, discountId: string) => {
    if (!paddle) {
      console.error("Paddle not initialized yet");
      return;
    }
    
    setLoadingPriceId(priceId);

    try {
      console.log("userId", userId, " email", email);
      paddle.Checkout.open({
        items: [{ priceId: priceId, quantity: 1 }],
        discountId: discountId,
        customData: {
          internal_user_id: userId,
          internal_email: email
        },
        settings: { 
            displayMode: "overlay", 
            theme: "dark",
            variant: "one-page",
            // locale: 'ar',
            showAddTaxId: false,
            showAddDiscounts: false
            // You can add success/redirect URLs here
            // successUrl: "http://localhost:3000/success" 
        },
      });
    } catch (error) {
      console.error("Checkout error:", error);
      setLoadingPriceId(null);
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
        `}
      </style>

      {/* Main Container */}
      <div className="relative min-h-screen w-full text-slate-900 selection:bg-purple-100 font-sans flex flex-col items-center bg-white gap-4 pb-24">
        
        {/* --- HEADER SECTION --- */}
        <div className="relative w-full pt-2 px-4 flex flex-col items-center text-center z-10">
          
          {/* Background SVG */}
          <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden opacity-40">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-100/50 via-transparent to-transparent" />
             <svg className="absolute top-0 left-0 w-full h-full text-slate-500" viewBox="0 0 1440 600" fill="none" preserveAspectRatio="none">
               <path 
                 d="M-100 300 C 300 300, 500 500, 720 500 C 940 500, 1140 300, 1540 300" 
                 stroke="url(#gradient-path)" 
                 strokeWidth="3" 
                 strokeLinecap="round"
                 className="opacity-60"
               />
               <defs>
                 <linearGradient id="gradient-path" x1="0" y1="0" x2="1" y2="0">
                   <stop stopColor="#FE5E5F" />
                   <stop offset="1" stopColor="#dc527d" />
                 </linearGradient>
               </defs>
             </svg>
          </div>

          {/* Floating Icon Decoration */}
          <div className="animate-[float_6s_ease-in-out_infinite] flex items-center justify-center rounded-full">
             <div>
                <CatPenIcon /> 
             </div>
          </div>

          {/* Main Title */}
          <h1 className="max-w-4xl mb-1 text-4xl font-bold tracking-tight text-slate-900">
            <span className="relative inline-block mt-2 mb-1">
              <span className="relative z-10 px-2">Select plan</span>
              <svg className="absolute bottom-1 left-0 -z-10 h-0.5 w-full text-pink-200" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl text-md md:text-xl text-slate-600 leading-relaxed">
            Capture everything in one note! Seamlessly combine PDFs, voice recordings, multiple images, and text into one note for effortless organization and transcription.
          </p>

        </div>

        {/* --- CARDS SECTION --- */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 w-full max-w-7xl px-30 z-20">
          {tiers.map((tier) => {
            const isSelected = selected === tier.name;

            return (
              <div
                key={tier.id}
                className="flex flex-col gap-4 cursor-pointer group h-full"
                onClick={() => setSelected(tier.name)}
              >
                <div
                  data-slot="card"
                  className={cn(
                    "flex flex-col gap-6 rounded-xl py-8 relative overflow-hidden transition-all duration-300 h-full",
                    "bg-white border",
                    isSelected
                      ? "border-black shadow-2xl scale-[1.02] ring-1 ring-black/10"
                      : "border-neutral-200 hover:border-neutral-300 hover:shadow-lg hover:-translate-y-1"
                  )}
                >
                  {/* Discount Badge */}
                  {tier.discount && (
                    <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl font-bold text-xs text-white shadow-sm z-20 bg-slate-900">
                      {tier.discount}
                    </div>
                  )}

                  <div className="px-6 flex flex-col gap-6 relative z-10 flex-1">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-xl font-bold text-slate-900">{tier.name}</h3>
                      
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-lg font-medium text-slate-500">$</span>
                        <span className="text-4xl font-bold tracking-tight text-slate-900">{tier.price}</span>
                        
                        {tier.originalPrice && (
                          <div className="flex flex-col justify-end ml-1">
                            <span className="text-md font-medium text-slate-500 line-through decoration-slate-400/60 decoration-1">
                              ${tier.originalPrice}
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="text-sm font-medium text-slate-500 min-h-[40px]">
                        {tier.description}
                      </p>

                      <div className="space-y-4 pt-6 border-t border-slate-100 mt-2">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                          Includes:
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Check className="h-5 w-5 shrink-0 text-pink-500" />
                            <span className="text-sm text-slate-600 font-medium">Unlimited notes</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <Check className="h-5 w-5 shrink-0 text-pink-500" />
                            <span className="text-sm text-slate-600 font-medium">Unlimited videos</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <Check className="h-5 w-5 shrink-0 text-pink-500" />
                            <span className="text-sm text-slate-600 font-medium">Unlimited quizzes & flashcards</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <Check className="h-5 w-5 shrink-0 text-pink-500" />
                            <span className="text-sm text-slate-600 font-medium">Quiz notifications</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 pb-2 mt-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("priceid", tier.priceId)
                        openCheckout(tier.priceId, tier.discountId);
                      }}
                      disabled={loadingPriceId === tier.priceId || !paddle}
                      className={cn(
                        `
                        inline-flex shrink-0 items-center justify-center gap-2 text-sm font-bold whitespace-nowrap 
                        transition-all duration-500 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 
                        disabled:pointer-events-none disabled:opacity-50 
                        h-12 px-6 w-full rounded-lg border shadow-sm
                        active:scale-[0.98]
                        `,
                        isSelected
                          ? "text-white border-transparent shadow-md"
                          : "bg-white text-slate-900 border-neutral-200 hover:border-neutral-300 hover:bg-slate-50"
                      )}
                      style={
                        isSelected
                          ? {
                              // BLACK ANIMATED GRADIENT
                              backgroundImage: "linear-gradient(to right, #000000, #404040, #000000, #404040)",
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
          {/* <img className="absolute top-0 right-0 bottom-0 left-0 z-50 w-full"  src={confetti} /> */}
        </div>
      </div>
    </Layout>
  );
}