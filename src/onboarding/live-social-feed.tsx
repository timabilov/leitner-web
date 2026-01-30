import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Zap, NotebookPen, Trophy, CreditCard } from "lucide-react";

const LOG_EVENTS = [
  { id: 1, user: "John Doe", action: "created a note", icon: <NotebookPen className="w-3.5 h-3.5" />, color: "text-blue-500" },
  { id: 2, user: "Sarah K.", action: "finished a quiz", icon: <Trophy className="w-3.5 h-3.5" />, color: "text-orange-500" },
  { id: 3, user: "Miguel", action: "unlocked bonuses", icon: <Zap className="w-3.5 h-3.5" />, color: "text-purple-500" },
  { id: 4, user: "Chloe", action: "went Annual", icon: <CreditCard className="w-3.5 h-3.5" />, color: "text-emerald-500" },
];

export const LiveSocialFeed = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % LOG_EVENTS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const currentLog = LOG_EVENTS[index];

  return (
    <div className="h-14 w-full flex justify-center items-center">
      <AnimatePresence mode="wait">
    <motion.div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white border border-slate-200 shadow-sm">
      <div className="relative">
        <Avatar className="h-7 w-7 border border-slate-100 grayscale">
          <AvatarImage src={`https://i.pravatar.cc/100?u=${currentLog.user}`} />
        </Avatar>
        <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute h-full w-full rounded-full bg-slate-400 opacity-75"></span>
          <span className="relative rounded-full h-2.5 w-2.5 bg-slate-900 border border-white"></span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-slate-900">{currentLog.user}</span>
        <span className="text-sm text-slate-500 font-medium">{currentLog.action}</span>
      </div>
    </motion.div>
      </AnimatePresence>
    </div>
  );
};