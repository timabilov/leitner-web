import {
  EllipsisVertical,
  LogOut,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import SettingsDialog2 from "@/settings/settings-dialog2";
import { useState } from "react";
import { googleLogout } from "@react-oauth/google";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useUserStore } from "@/store/userStore";
import { usePostHog } from "posthog-js/react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { fullName, email, clearStore, userId, companyId } = useUserStore();
  const postHog = usePostHog();
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const { t } = useTranslation();
  const { isMobile, open } = useSidebar();

  const initials =
    (fullName?.split(" ")[0]?.charAt(0) || "") +
    (fullName?.split(" ")[1]?.charAt(0) || "");

  const logout = () => {
    toast(t("Are you sure you want to log out?"), {
      action: {
        label: <LogOut className="w-3 h-3" />,
        onClick: () => {
          clearStore();
          try {
            postHog.capture("log_out_clicked", { userId, companyId, email });
            postHog.reset();
            googleLogout();
          } catch (error) {
            console.error("Error signing out from Google:", error);
          }
          navigate("/");
        },
      },
    });
  };

  const avatarElement = (
    <Avatar
      className={cn(
        "shrink-0 bg-[#3D4757] text-white",
        open ? "h-8 w-8 rounded-lg" : "h-9 w-9 rounded-full"
      )}
    >
      <AvatarImage src={user.avatar} alt={user.name} />
      <AvatarFallback
        className={cn(
          "bg-[#3D4757] text-white font-bold text-sm",
          open ? "rounded-lg" : "rounded-full"
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-3 cursor-pointer transition-colors rounded-xl hover:bg-[var(--v2-panel2)]",
                  open
                    ? "w-full px-2 py-1.5"
                    : "w-[42px] h-[42px] justify-center p-0"
                )}
              >
                {avatarElement}
                {open && (
                  <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                    <span className="truncate font-medium text-[var(--v2-ink)]">
                      {user.name}
                    </span>
                    <span className="truncate text-xs text-[var(--v2-mut)]">
                      {user.email}
                    </span>
                  </div>
                )}
                {open && (
                  <EllipsisVertical className="ml-auto size-4 text-[var(--v2-mut)]" />
                )}
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          {!open && (
            <TooltipContent side="right">{user.name}</TooltipContent>
          )}
        </Tooltip>

        <DropdownMenuContent
          className="min-w-56 rounded-xl border-[var(--v2-line)] bg-[var(--v2-panel)] shadow-[var(--v2-shadow)]"
          side={isMobile ? "bottom" : "right"}
          align="end"
          sideOffset={8}
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-[#3D4757] text-white font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-[var(--v2-mut)] truncate text-xs">
                  {user.email}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[var(--v2-line)]" />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => {
                postHog.capture("price_page_clicked", {
                  userId,
                  companyId,
                  email,
                });
                navigate("/price-page");
              }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {t("Upgrade to Pro")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="bg-[var(--v2-line)]" />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={() => {
                postHog.capture("account_modal_opened", {
                  userId,
                  companyId,
                  email,
                });
                setOpenDialog(true);
              }}
              className="cursor-pointer"
            >
              <UserCheck className="mr-2 h-4 w-4" />
              <span>{t("Account")}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="bg-[var(--v2-line)]" />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            {t("Log out")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SettingsDialog2 isOpen={openDialog} setIsOpen={setOpenDialog} />
    </>
  );
}
