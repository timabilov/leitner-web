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
  ShieldCheck,
  FileText,
  Handshake,
  HatGlasses,
  CatIcon,
  Bell,
  GlassesIcon,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NavUser } from "./nav-user";
import CatPenIcon from "@/notes/cat-pen-icon";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import CatLogo from "@/note-detail/assets/cat-logo";

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

  const footerLinks = [
    { title: t("Privacy"), icon: HatGlasses, key: "/privacy" },
    { title: t("Terms"), icon: Handshake, key: "/terms" },
  ];

  return (
    <Sidebar
      // Changed to collapsible to allow mobile/ipad trigger behavior
      collapsible="icon"
      className="border-r border-zinc-200/50 bg-white dark:bg-zinc-950 dark:border-zinc-800/50"
      {...props}
    >
      <SidebarHeader className="h-14 border-b border-zinc-200/50 dark:border-zinc-800/50 flex flex-row items-center px-4 group-data-[collapsible=icon]:px-2 py-7 gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 shadow-sm">
          <CatLogo size={18} />
        </div>
        {/* Hidden on icon-only mode */}
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
                const isActive =
                  pathname === item.key ||
                  (item.key !== "/" && pathname.startsWith(item.key));
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
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                          }}
                        />
                      )}
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full z-10"
                          style={{ backgroundColor: "black" }}
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                          }}
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
                            "text-sm font-medium tracking-tight group-data-[collapsible=icon]:hidden",
                            isActive ? "opacity-100" : "opacity-80"
                          )}
                        >
                          {item.title}
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              <SidebarSeparator className="my-6 mx-3 bg-zinc-100 dark:bg-zinc-800 group-data-[collapsible=icon]:hidden" />
              <SidebarMenuItem>
                <SidebarMenuButton
                  //onClick={() => navigate(item.key)}
                  className={cn(
                    "h-9 px-3 transition-colors duration-200 rounded-md relative group cursor-pointer",
                    "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-medium tracking-tight group-data-[collapsible=icon]:hidden flex items-center gap-3",
                      "opacity-80"
                    )}
                  >
                    <Handshake
                      className={cn(
                        "size-4 stroke-[1.8px] transition-colors",
                        "opacity-70 group-hover:opacity-100"
                      )}
                    />
                    {t("Terms of use")}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  //onClick={() => navigate(item.key)}
                  className={cn(
                    "h-9 px-3 transition-colors duration-200 rounded-md relative group cursor-pointer",
                    "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-medium tracking-tight group-data-[collapsible=icon]:hidden flex items-center gap-3",
                      "opacity-80"
                    )}
                  >
                    <HatGlasses
                      className={cn(
                        "size-4 stroke-[1.8px] transition-colors",
                        "opacity-70 group-hover:opacity-100"
                      )}
                    />
                    {t("Privacy policy")}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-zinc-200/50 dark:border-zinc-800/50 p-2">
        <NavUser user={{ name: fullName, email: email, avatar: photo }} />
      </SidebarFooter>
    </Sidebar>
  );
}
