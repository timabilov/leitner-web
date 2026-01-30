import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { Zap, Crown, ArrowUpCircle, Check } from "lucide-react";

import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";

// --- TYPES ---
type ActivityItem = {
  id: string;
  user: string;
  actionPrefix: string;
  highlight: string;
  icon: any;
  time: string;
};

// --- HELPER: Parse Real API Action ---
const parseActionStyle = (rawAction: string) => {
  const lower = rawAction.toLowerCase();

  if (lower.includes("pro") || lower.includes("monthly")) {
    return { 
      prefix: "upgraded to",
      highlight: "Monthly", 
      icon: Zap 
    };
  }
//   if (lower.includes("trial")) {
//     return { 
//       prefix: "started", 
//       highlight: "7-Day Trial", 
//       icon: Sparkles 
//     };
//   }
  if (lower.includes("yearly") || lower.includes("annual")) {
    return { 
      prefix: "subscribed to", 
      highlight: "Annual", 
      icon: Crown 
    };
  }
//   if (lower.includes("lifetime")) {
//     return { 
//       prefix: "acquired", 
//       highlight: "Lifetime Access", 
//       icon: Star 
//     };
//   }
  if (lower.includes("weekly")) {
    return { 
      prefix: "subscribed to", 
      highlight: "Weekly", 
      icon: ArrowUpCircle 
    };
  }
  
  return { 
    prefix: "", 
    highlight: rawAction, 
    icon: Check 
  };
};

// --- COMPONENT ---
const LiveActivityFeed2 = () => {

  const { companyId } = useUserStore()

  const [currentActivity, setCurrentActivity] = useState<ActivityItem | null>(null);
  const [activityQueue, setActivityQueue] = useState<ActivityItem[]>([]);

  useQuery({
    queryKey: ["liveActivityChatStyle", companyId],
    queryFn: async () => {
      const response = await axiosInstance.get(`${API_BASE_URL}/company/${companyId}/notes/activity/live`);
      
      if (response.data && response.data.activities) {
        const mapped: ActivityItem[] = response.data.activities.map((item: any) => {
          const style = parseActionStyle(item.action);

          return {
            id: Math.random().toString(36),
            user: item.user,
            actionPrefix: style.prefix,
            highlight: style.highlight,
            time: item.time,
          };
        });
        setActivityQueue(mapped);
      }
      return response.data;
    },
    refetchInterval: 10000,
    refetchOnWindowFocus: false,
    enabled: !!companyId,
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const cycleActivity = () => {
      setCurrentActivity(null);
      const delay = Math.random() * 1500 + 500; 

      timeoutId = setTimeout(() => {
        setActivityQueue((prevQueue) => {
          if (prevQueue.length === 0) return prevQueue;
          const [nextItem, ...remaining] = prevQueue;
          setCurrentActivity(nextItem);
          return remaining;
        });
        timeoutId = setTimeout(cycleActivity, 3500);
      }, delay);
    };
    cycleActivity();
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="absolute top-2 right-2 z-50 pointer-events-none w-auto hidden md:block">
      <AnimatePresence mode="wait">
        {currentActivity && (
          <SystemMessagePill item={currentActivity} />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- SUB-COMPONENT ---
const SystemMessagePill = ({ item }: { item: ActivityItem }) => {
  const initial = item.user ? item.user.charAt(0).toUpperCase() : "?";

  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 15, scale: 0.9, originX: 0 }} 
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "flex items-start gap-3",
        "rounded-xl p-3 pr-4",
        "bg-background/90 dark:bg-zinc-950/90 backdrop-blur-md",
        "border border-border/50 shadow-lg",
        "min-w-[280px]"
      )}
    >
      {/* 1. Avatar */}
      <div className="relative shrink-0 mt-0.5">
        <div className={cn(
          "h-9 w-9 rounded-full flex items-center justify-center",
          "bg-muted border border-white/10 shadow-sm",
          "text-xs font-bold text-muted-foreground"
        )}>
          {initial}
        </div>
        
        {/* Green Pulse Dot */}
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-85"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-background"></span>
        </span>
      </div>

      {/* 2. Message Content */}
      <div className="flex flex-col text-sm leading-tight flex-1">
        <div className="flex justify-between items-baseline w-full">
            <span className="font-bold text-foreground hover:underline cursor-pointer decoration-muted-foreground/50 underline-offset-2">
                {item.user}
            </span>
            <span className="ml-2 text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                {item.time}
            </span>
        </div>
        
        <div className="flex items-center flex-wrap gap-1 mt-0.5">
            <span className="text-muted-foreground text-[13px]">
                {item.actionPrefix}
            </span>

            {/* UPDATED: Green Gradient Text */}
            <div className="flex items-center gap-1">
                <span className={cn(
                    "font-bold text-[13px] whitespace-nowrap",
                    "text-transparent bg-clip-text",
                    // ✨ Green Gradient ✨
                    "bg-gradient-to-r from-emerald-600 to-green-500",
                    "dark:from-emerald-400 dark:to-green-400" 
                )}>
                    {item.highlight}
                </span>
            </div>
        </div>
      </div>

    </motion.div>
  );
};

export default LiveActivityFeed2;