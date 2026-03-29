import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { NavUser } from "./nav-user";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import CatLogo from "@/note-detail/assets/cat-logo";
import { FoldersPanel } from "./folders-panel";
import { useOfferCountdown } from "@/hooks/use-offer-countdown";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// --- SIDEBAR SALE CARD ---
const SidebarSaleCard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const { targetDate, hasPromo, discountPercent } = useOfferCountdown();


  useEffect(() => {
    setMounted(true);
    if (!targetDate || !hasPromo) return;

    const calculateTime = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

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
  }, [targetDate, hasPromo]);

  // Don't render if not mounted or no active promo
  if (!mounted || !hasPromo || !targetDate) return null;

  return (
    <>
      <style>{`
        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-flow { animation: gradient-flow 3s ease infinite; background-size: 200% 200%; }
      `}</style>

      {/* --- 1. FULL CARD (Visible when Expanded) --- */}
      <div
        role="button"
        onClick={() => navigate("/price-page?sale=true")}
        className="hidden group-data-[state=expanded]:block cursor-pointer pt-2 pb-1 w-full"
      >
        <div className="group relative w-full overflow-hidden rounded-lg box-border transition-transform hover:scale-[1.02] active:scale-[0.98] duration-200">
          <div className="relative h-full w-full rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 animate-gradient-flow shadow-md p-[1px]">
            {/* Inner Content */}
            <div className="relative z-10 flex flex-row justify-between items-center px-3 py-2 bg-black/10 backdrop-blur-[1px] rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white drop-shadow-md">
                  🔥 Claim offer
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] font-bold text-white drop-shadow-md tracking-tight">
                  {timeLeft.d}d {timeLeft.h}h {timeLeft.m}m
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- 2. MINI ICON (Visible when Collapsed) --- */}
      <div
        role="button"
        onClick={() => navigate("/price-page")}
        className="hidden group-data-[state=collapsed]:flex justify-center items-center py-2 cursor-pointer w-full"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-600 to-pink-600 flex items-center justify-center shadow-md animate-pulse">
              <span className="text-base">🔥</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>
              {discountPercent > 0 ? `-${discountPercent}%` : "Offer"} expires in: {timeLeft.d}d {timeLeft.h}h!
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </>
  );
};

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
      <SidebarHeader className="h-14 border-b border-zinc-200/50 dark:border-zinc-800/50 flex flex-row items-center px-4 group-data-[collapsible=icon]:px-2 py-7 gap-3 transition-all">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 shadow-sm cursor-pointer" onClick={() => navigate('/')}>
          <CatLogo size={18} />
        </div>
        <span className="text-[14px] font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 group-data-[collapsible=icon]:hidden whitespace-nowrap overflow-hidden">
          Bycat AI
        </span>
      </SidebarHeader>

      <SidebarContent className="px-2 group-data-[collapsible=icon]:px-1 pt-4 gap-0 overflow-x-hidden scrollbar-none">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 relative">
        
             
              <div className="px-3 mb-2 mt-4 group-data-[collapsible=icon]:hidden transition-opacity duration-200">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                  {t("Library")}
                </span>
              </div>
             <SidebarMenuItem>
                <SidebarSaleCard />
              </SidebarMenuItem>
              

              {items.map((item) => {
                const isActive =
                  pathname === item.key ||
                  (item.key !== "/" && pathname.startsWith(item.key));
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          onClick={() => navigate(item.key)}
                          className={cn(
                            "h-9 px-3 transition-all duration-200 rounded-md relative group cursor-pointer w-full",
                            isActive
                              ? "text-zinc-900 dark:text-zinc-50"
                              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                          )}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="activeNav"
                              className="absolute inset-0 bg-zinc-100 dark:bg-zinc-900 z-0 rounded-md w-full"
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                          )}
                          {isActive && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full z-10"
                              style={{ backgroundColor: "currentColor" }}
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
                            <span
                              className={cn(
                                "text-sm font-medium tracking-tight group-data-[collapsible=icon]:hidden transition-opacity",
                                isActive ? "opacity-100" : "opacity-80"
                              )}
                            >
                              {item.title}
                            </span>
                          </div>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                );
              })}
                    
              {/* Promo Card Positioned Here */}
              
              <SidebarSeparator className="my-2 group-data-[collapsible=icon]:hidden" />

              <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
                <SidebarMenuButton
                  onClick={() => window.open("https://bycat.ai/terms-conditions", "_blank")}
                  className="text-zinc-500 hover:text-zinc-900"
                >
                  <FileText className="size-4 opacity-70" />
                  <span className="text-sm font-medium opacity-80">
                    {t("Terms of use")}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
                <SidebarMenuButton
                  onClick={() => window.open("https://bycat.ai/privacy-policy", "_blank")}
                  className="text-zinc-500 hover:text-zinc-900"
                >
                  <Shield className="size-4 opacity-70" />
                  <span className="text-sm font-medium opacity-80">
                    {t("Privacy policy")}
                  </span>
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