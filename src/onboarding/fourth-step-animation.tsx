import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// --- BOLD APP STORE LAUREL WREATH ---
const BoldLaurel = ({ className, flipped = false }: { className?: string; flipped?: boolean }) => (
  <svg 
    width="42" height="70" viewBox="0 0 42 70" fill="currentColor" 
    className={className}
    style={flipped ? { transform: 'scaleX(-1)' } : undefined}
  >
    <path d="M 37.5 70 C 35.8 63.6 30 52 23.5 45 C 23.5 45 28 55 35 63 C 35 63 36.5 67 37.5 70 Z" />
    <path d="M 31.5 59 C 28.8 52.8 21.5 41 14 34 C 14 34 20 44 28 52 C 28 52 30 56.5 31.5 59 Z" />
    <path d="M 24.5 47 C 20.8 41 12 29 4 23 C 4 23 11 33 20 40 C 20 40 22.5 44.5 24.5 47 Z" />
    <path d="M 17.5 34.5 C 13.8 28.5 4 16 0 10 C 0 10 7 20 13.5 28 C 13.5 28 15.5 32 17.5 34.5 Z" />
    <path d="M 12 22 C 8.5 16.5 2 5.5 0 0 C 0 0 5 10 9.5 17 C 9.5 17 10.5 19.5 12 22 Z" />
  </svg>
);

const FifthStepAnimation = ({ t }: { t: any }) => {
  // YOUR EXACT ORIGINAL DATA
  const reviews = [
    {
      id: 1,
      name: "Alex",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
      content:
        "Amazing platform! The AI generates spot-on quizzes from my biology notes. It's totally changed how I study.",
      rating: 5,
    },
    {
      id: 2,
      name: "Jamie",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
      content:
        "Finally, an app that actually understands my awful lecture audio. The flashcards it makes are literal lifesavers.",
      rating: 5,
    },
    {
      id: 3,
      name: "Taylor",
      avatar: "https://i.pravatar.cc/150?u=a04258114e29026702d",
      content:
        "The YouTube summary feature is insane. I just paste the link and I get a full study guide. Highly recommend!",
      rating: 5,
    },
  ];

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-sm mx-auto h-full bg-white py-4 pt-0 font-sans tracking-tight">
      
      {/* 1. HEADER (10,000+ Students metric) */}
      <div className="text-center px-4 mt-6">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none">
          {t("10,000+ Students")}<br />
        </h2>
        <p className="text-slate-400 font-semibold text-[14px] mt-3 tracking-tight px-4">
          {t("Join the top students studying smarter, not harder.")}
        </p>
      </div>

      {/* 2. LAUREL WREATH BADGE (Centered) */}
      <div className="flex flex-col items-center justify-center mt-8 mb-4">
        <div className="flex items-center justify-center gap-6 mb-2">
          
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <BoldLaurel className="text-slate-800" />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <span className="text-[52px] font-black text-slate-900 tracking-tighter leading-none mt-2">
              4.9
            </span>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <BoldLaurel className="text-slate-800" flipped />
          </motion.div>
          
        </div>
        
        {/* 5 Solid Gold Stars */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
          className="flex items-center gap-1.5"
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} size={20} className="fill-[#FBBF24] text-[#FBBF24]" />
          ))}
        </motion.div>
      </div>

      {/* 3. REVIEW CARDS (Your exact original marquee/layout) */}
      <div className="relative w-full max-w-sm mt-auto pb-4 overflow-hidden mask-horizontal">
        <div className="animate-marquee flex gap-4 w-max">
          {[...reviews, ...reviews, ...reviews].map((review, i) => (
            <div
              key={`${review.id}-${i}`}
              className="w-64 shrink-0 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-zinc-100">
                  <AvatarImage src={review.avatar} alt={review.name} />
                  <AvatarFallback className="bg-zinc-100 text-zinc-600 font-medium">
                    {review.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-zinc-900">
                    {review.name}
                  </span>
                  <div className="flex gap-0.5 mt-0.5">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-3 w-3 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
                {t(review.content)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Required style for the marquee exactly as you had it */}
      <style dangerouslySetInnerHTML={{ __html: `
        .mask-horizontal {
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}} />
    </div>
  );
};

export default FifthStepAnimation;