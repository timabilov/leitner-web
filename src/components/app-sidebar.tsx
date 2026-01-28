import React, { useMemo, useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupContent,
  SidebarMenuButton,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Home,
  FolderOpen,
  Smartphone,
  Bell,
  FileText,
  Shield,
  Timer,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NavUser } from "./nav-user";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import CatLogo from "@/note-detail/assets/cat-logo";
import { FoldersPanel } from "./folders-panel";
import AIIcon from "@/note-detail/assets/ai-icon";
import { useOfferCountdown } from "@/hooks/use-offer-countdown";

// --- UPDATED SIDEBAR SALE CARD ---
const SidebarSaleCard = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
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

    calculateTime(); // Initial calc
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate) return null;

  return (
    <>
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg) translateX(0); }
          40% { transform: rotate(-20deg) translateX(-1px); }
          60% { transform: rotate(20deg) translateX(1px); }
        }
        
        @keyframes pulse-card {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(236, 72, 153, 0); 
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 15px 0 rgba(236, 72, 153, 0.6); 
            transform: scale(1.02);
          }
        }

        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .animate-wiggle {
          animation: wiggle 1.5s ease-in-out infinite;
        }
        
        .animate-pulse-card {
          animation: pulse-card 3s ease-in-out infinite;
        }

        .animate-gradient-flow {
          animation: gradient-flow 3s ease infinite;
          background-size: 200% 200%;
        }
      `}</style>

      <div onClick={() => navigate('/price-page')} className="group-data-[collapsible=icon]:hidden cursor-pointer pt-[2px] pb-[2px]">
        <div className="group relative w-full overflow-hidden rounded-lg box-border animate-pulse-card">
          

          {/* 
              INNER CARD: Handles the Gradient Flow Animation 
              Kept 'animate-gradient-flow' here.
          */}
          <div className="relative h-full w-full rounded-xs transition-all duration-300 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 animate-gradient-flow shadow-lg pt-[2px] pb-[2px]">
            
            {/* Background Blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none mix-blend-overlay">
               <motion.div 
                 animate={{ y: [0, -15, 0], opacity: [0.1, 0.3, 0.1] }} 
                 transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                 className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-white/20 blur-2xl" 
               />
               <motion.div 
                 animate={{ y: [0, 15, 0], opacity: [0.1, 0.3, 0.1] }} 
                 transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                 className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" 
               />
            </div>

            {/* Rising Sparkles */}
            {/* <SidebarRisingSparkles /> */}

            {/* Main Content */}
            <div className="relative z-10 flex flex-row justify-between items-center pr-3">
              <div className="flex items-center justify-center">
                <div className="flex items-center justify-center gap-2">
                   <div className="relative flex h-8 w-8 items-center justify-center">
                     {/* <motion.div
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="text-lg"
                     > */}
                        🔥
                     {/* </motion.div> */}
                   </div>
                </div>
                <span className="text-xs font-semibold text-white flex items-center gap-1 shadow-black drop-shadow-md">
                    Claim offer
                </span>
              </div>

              <div className="">
                <div className="flex justify-end items-center gap-1 text-[10px]">
                  <div className="text-white text-[14px] animate-wiggle">
                    {/* <Timer className="size-3 animate-wiggle text-white" /> */}
                   ⏳
                  </div>
                  
                  <span className="font-bold tabular-nums tracking-wide text-white shadow-black drop-shadow-md">
                    {mounted ? `${timeLeft.d}d ${timeLeft.h}h ${timeLeft.m}m` : "..."}
                  </span>
                  <ChevronRight className="size-4 text-white"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// 1. Sidebar Animation Component (Unchanged)
export const SidebarRisingSparkles = React.memo(() => {
  const sparkles = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      size: Math.floor(Math.random() * 8) + 6,
      left: Math.floor(Math.random() * 90) + 5, 
      duration: Math.random() * 5 + 3,
      delay: Math.random() * 2,
    }));
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          className="absolute"
          style={{
            left: `${sparkle.left}%`,
            width: sparkle.size,
            height: sparkle.size,
            bottom: "-20%", 
          }}
          animate={{
            y: [0, -150], 
            opacity: [0, 1, 0], 
            rotate: [0, 180], 
            scale: [0.5, 1, 0.5], 
          }}
          transition={{
            duration: sparkle.duration,
            repeat: Infinity,
            ease: "linear",
            delay: sparkle.delay,
          }}
        >
          <AIIcon className="w-full h-full drop-shadow-sm" />
        </motion.div>
      ))}
    </div>
  );
});

export function AppSidebar({ fullName, photo, email, ...props }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const items = [
    { title: t("Notes"), icon: Home, key: "/notes" },
    { title: t("Folders"), icon: FolderOpen, key: "/folders" },
    { title: t("Alerts"), icon: Bell, key: "/alerts" },
    { title: t("App"), icon: Smartphone, key: "/app" },
  ];

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-zinc-200/50 bg-white dark:bg-zinc-950 dark:border-zinc-800/50"
      {...props}
    >
      <SidebarHeader className="h-14 border-b border-zinc-200/50 dark:border-zinc-800/50 flex flex-row items-center px-4 group-data-[collapsible=icon]:px-2 py-7 gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 shadow-sm">
          <CatLogo size={18} />
        </div>
        <span className="text-[14px] font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 group-data-[collapsible=icon]:hidden">
          Leitner AI
        </span>
      </SidebarHeader>

      <SidebarContent className="px-2 group-data-[collapsible=icon]:px-1 pt-4 gap-0 overflow-x-hidden">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 relative">
              <div className="px-3 mb-3 group-data-[collapsible=icon]:hidden">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                  {t("Library")}
                </span>
              </div>

              {items.map((item) => {
                const isActive = pathname === item.key || (item.key !== "/" && pathname.startsWith(item.key));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.key)}
                      className={cn(
                        "h-9 px-3 transition-colors duration-200 rounded-md relative group cursor-pointer",
                        isActive
                          ? "text-zinc-900 dark:text-zinc-50"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute inset-0 bg-zinc-100 dark:bg-zinc-900 z-0 rounded-md"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full z-10"
                          style={{ backgroundColor: "black" }}
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <div className="relative z-10 flex items-center gap-3">
                        <item.icon
                          className={cn(
                            "size-4 stroke-[1.8px] transition-colors",
                            isActive
                              ? "text-zinc-900 dark:text-zinc-50"
                              : "opacity-70 group-hover:opacity-100"
                          )}
                        />
                        <span className={cn("text-sm font-medium tracking-tight group-data-[collapsible=icon]:hidden", isActive ? "opacity-100" : "opacity-80")}>
                          {item.title}
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              <SidebarSaleCard />

              <SidebarSeparator className="my-2 group-data-[collapsible=icon]:hidden" />

              <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
                 <SidebarMenuButton onClick={() => navigate("/terms")} className="text-zinc-500 hover:text-zinc-900">
                    <FileText className="size-4 opacity-70" />
                    <span className="text-sm font-medium opacity-80">{t("Terms of use")}</span>
                 </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
                 <SidebarMenuButton onClick={() => navigate("/privacy")} className="text-zinc-500 hover:text-zinc-900">
                    <Shield className="size-4 opacity-70" />
                    <span className="text-sm font-medium opacity-80">{t("Privacy policy")}</span>
                 </SidebarMenuButton>
              </SidebarMenuItem>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="px-2 pb-2">
        <FoldersPanel />
      </div>

      <SidebarFooter className="border-t border-zinc-200/50 dark:border-zinc-800/50 p-2">
        <NavUser user={{ name: fullName, email: email, avatar: photo }} />
      </SidebarFooter>
    </Sidebar>
  );
}