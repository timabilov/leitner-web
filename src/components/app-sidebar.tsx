import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Sun, Moon } from "lucide-react";

// Custom sidebar icons matching v2 design
const IconHome = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
  </svg>
);

const IconFolder = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);

const IconBell = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
    <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
  </svg>
);

const IconSparkle = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
    <path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z" />
  </svg>
);

const IconPhone = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
    <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
  </svg>
);
import { NavUser } from "./nav-user";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "@/components/theme-provider";

// --- Nav icon button ---
function NavIconButton({
  icon: Icon,
  label,
  isActive,
  badge,
  expanded,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  badge?: boolean;
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          data-v2-hit="1"
          className={cn(
            "relative flex items-center gap-3 rounded-xl border-none cursor-pointer transition-colors",
            expanded
              ? "w-full h-[42px] px-3"
              : "w-[42px] h-[42px] justify-center",
            isActive
              ? "bg-[var(--v2-panel2)] text-[var(--v2-ink)]"
              : "bg-transparent text-[var(--v2-mut)] hover:bg-[var(--v2-panel2)]"
          )}
        >
          <Icon className="w-5 h-5 shrink-0" />
          {expanded && (
            <span className="text-sm font-medium tracking-tight truncate">
              {label}
            </span>
          )}
          {badge && (
            <span
              className={cn(
                "absolute w-[7px] h-[7px] rounded-full bg-[var(--v2-bad)] border-2 border-[var(--v2-panel)]",
                expanded ? "top-2.5 left-7" : "top-[9px] right-[9px]"
              )}
            />
          )}
        </button>
      </TooltipTrigger>
      {!expanded && (
        <TooltipContent side="right">{label}</TooltipContent>
      )}
    </Tooltip>
  );
}

export function AppSidebar({
  fullName,
  photo,
  email,
  ...props
}: {
  fullName: string;
  photo: string;
  email: string;
  [key: string]: any;
}) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { open } = useSidebar();
  const { theme, setTheme } = useTheme();

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const navItems = [
    { title: t("Home"), icon: IconHome, key: "/notes" },
    { title: t("Folders"), icon: IconFolder, key: "/folders" },
    { title: t("Alerts"), icon: IconBell, key: "/alerts", badge: true },
    { title: t("Upgrade to Pro"), icon: IconSparkle, key: "/price-page" },
    { title: t("Mobile App"), icon: IconPhone, key: "/app" },
  ];

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-[var(--v2-line)] bg-[var(--v2-panel)] z-30"
      {...props}
    >
      {/* --- Logo --- */}
      <SidebarHeader
        className={cn(
          "flex items-center border-b border-[var(--v2-line)] py-3.5",
          open ? "flex-row gap-3 px-4" : "justify-center px-0"
        )}
      >
        <button
          onClick={() => navigate("/notes")}
          className="w-9 h-9 shrink-0 rounded-xl bg-[var(--v2-ink)] flex items-center justify-center text-[var(--v2-bg)] shadow-[var(--v2-shadow-sm)] hover:opacity-90 transition-opacity cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.4 6.1 6.1 2.4-6.1 2.4L12 19.5 9.6 13.4 3.5 11l6.1-2.4z" /></svg>
        </button>
        {open && (
          <span className="text-sm font-bold tracking-tight text-[var(--v2-ink)] whitespace-nowrap">
            Bycat AI
          </span>
        )}
      </SidebarHeader>

      {/* --- Navigation --- */}
      <SidebarContent
        className={cn(
          "flex flex-col gap-1.5 py-3 overflow-x-hidden scrollbar-none",
          open ? "px-3" : "items-center px-0"
        )}
      >
        {navItems.map((item) => {
          const isActive =
            pathname === item.key ||
            (item.key !== "/" && pathname.startsWith(item.key));

          return (
            <NavIconButton
              key={item.key}
              icon={item.icon}
              label={item.title}
              isActive={isActive}
              badge={item.badge}
              expanded={open}
              onClick={() => navigate(item.key)}
            />
          );
        })}
      </SidebarContent>

      {/* --- Footer: Theme toggle + User --- */}
      <SidebarFooter
        className={cn(
          "flex flex-col gap-1.5 border-t border-[var(--v2-line)] py-3",
          open ? "px-3" : "items-center px-0"
        )}
      >
        {/* Theme Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              data-v2-hit="1"
              className={cn(
                "rounded-xl border border-[var(--v2-line)] cursor-pointer flex items-center gap-3 bg-[var(--v2-panel2)] text-[var(--v2-ink)] hover:border-[var(--v2-ink)] transition-colors",
                open
                  ? "w-full h-[42px] px-3"
                  : "w-[42px] h-[42px] justify-center"
              )}
            >
              {isDark ? (
                <Sun className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
              ) : (
                <Moon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
              )}
              {open && (
                <span className="text-sm font-medium tracking-tight">
                  {t("Theme")}
                </span>
              )}
            </button>
          </TooltipTrigger>
          {!open && (
            <TooltipContent side="right">{t("Theme")}</TooltipContent>
          )}
        </Tooltip>

        {/* User */}
        <NavUser user={{ name: fullName, email, avatar: photo }} />
      </SidebarFooter>
    </Sidebar>
  );
}
