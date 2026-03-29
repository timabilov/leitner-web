import { useState, useEffect } from "react";
import { Timer, Sparkles, Gift, Rocket, PartyPopper, ArrowDown } from "lucide-react";
import AIIcon from "@/note-detail/assets/ai-icon";
import { cn } from "@/lib/utils";
import { useOfferCountdown } from "@/hooks/use-offer-countdown";

const OnboardingBanner = ({ className, step, hasPromo }: { className: string; step?: number, hasPromo?: boolean }) => {
  const [timeLeft, setTimeLeft] = useState({ m: 0, s: 0, h: 0, d: 0 });
  const [mounted, setMounted] = useState(false);
 const { targetDate } = useOfferCountdown();

  useEffect(() => {
    setMounted(true);
    if (!targetDate) return;

    const calculateTime = () => {
      const formattedTargetDate = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const distance = formattedTargetDate - now;

      if (distance < 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
      } else {
        setTimeLeft({
          d: Math.floor(distance / (1000 * 60 * 60 * 24)),
          h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const format = (n: number) => n.toString().padStart(2, "0");

  const getBannerContent = () => {
    switch (step) {
      case 0:
        return {
          title: hasPromo ? "Complete setup for 50% Off" : "Set up your workspace today and get rewarded.",
          sub: hasPromo ? "Exclusive onboarding reward" : "Complete the full onboarding process to apply your discount.",
          icon: <Gift className="size-4" />,
        };
      case 1:
        return {
          title: hasPromo ? "You're on your way! 🚀" : "Great start! You're officially on your way.🚀",
          sub: hasPromo ? "Keep going to unlock your promo" : "Keep going to apply your discount.",
          icon: <Rocket className="size-4" />,
        };
      case 2:
        return {
          title: hasPromo ? "Almost there! ✨" : "Almost there! Your discount is waiting. ⏳",
          sub: hasPromo ? "Just one more step for 50% Off" : "Just one more step to apply your discount.",
          icon: <AIIcon className="size-4" />,
        };
      case 3:
      default:
        return {
          title: hasPromo ? "Promo Unlocked! 🎉" : "All Set! Enjoy Your Welcome Discount. ✨",
          sub: "Exclusive onboarding reward",
          icon: <Gift className="size-4" />,
        };
    }
  };

  const content = getBannerContent();

  if (!mounted) return null;

  return (
    <>
      {/* 
        Add the bounce animation style specifically for the arrow 
        (if you don't already have one in your global css)
      */}
      <style>
        {`
          @keyframes bounce-down {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(6px); }
          }
          .animate-bounce-down {
            animation: bounce-down 1.5s ease-in-out infinite;
          }
        `}
      </style>
    <div className={`relative justify-between group w-full mx-auto overflow-hidden rounded-xl p-[1px] shadow-lg shadow-pink-500/10 fade-in animate-in slide-in-from-top-4 duration-700 z-[100] ${className} `}>
      
      {/* Animated Glowing Border */}
      <span 
        className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite]"
        style={{
          background: "conic-gradient(from 90deg at 50% 50%, #f1f5f9 0%, #f1f5f9 50%, #f43f5e 80%, #ec4899 100%)"
        }}
      />
      
      {/* Inner Content */}
      {/* CHANGED: justify-between -> gap-6, rounded-[15px] -> rounded-full, added backdrop-blur */}
      <div className={cn("relative flex items-center bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl justify-between w-full h-full", step === 3 ? "gap-2" : "gap-6")}>
        
        <div className={cn("flex items-center", step === 3 ? "gap-1" : "gap-2")}>
          <div className="flex items-center justify-center size-8 rounded-full bg-pink-500/10 text-pink-500">
            <AIIcon className="size-4" />
          </div>
          <div className="flex flex-col text-left">
            <span className={cn("text-[13px] font-bold text-slate-900 leading-tight", step === 3 ? "pr-0" : "pr-1")}>
               {content.title}
            </span>
          </div>
              
        </div>
        {/* Timer Box */}
        {step === 3 && (
                <div className="fade-in animate-in zoom-in duration-500 z-[100]  animate-bounce-down">
                  <ArrowDown strokeWidth={2} className="size-4" />
                </div>
              )}
              {
                hasPromo && (
                  <div className="flex items-center gap-1.5 bg-slate-50/80 border border-slate-100 px-3 py-1.5 rounded-full shadow-sm">
                    <Timer className="size-3.5 text-pink-500 animate-wiggle" />
                    <span className="font-mono text-[13px] font-bold text-slate-700 tabular-nums tracking-tight">
                      {format(timeLeft.d)}d:{format(timeLeft.h)}h:{format(timeLeft.m)}m:{format(timeLeft.s)}s
                    </span>
                  </div>
                )
              }

      
      </div>
    </div>
    </>
  );
};

export default OnboardingBanner;