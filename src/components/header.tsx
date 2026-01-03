import { useUserStore } from "@/store/userStore";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import Select from "./select";
import { BellOff, BellRing } from "lucide-react";
import { AnimatedTooltip } from "./ui/motion-tooltip";
import { useState, useId, useEffect } from "react";
import { Switch } from "./ui/switch";
import { LanguageSwitcher } from "./language-switcher";
import { useTranslation } from "react-i18next";
import CreateFolder from "./create-folder";
import { usePostHog } from 'posthog-js/react';
import { cn } from "@/lib/utils";

import { SidebarTrigger } from "@/components/ui/sidebar";

const Header = ({ isAlertEnabled, showAlertBadge, foldersQuery, isLoadingFolders, setChecked, checked, toggleSwitch }: any) => {
  const { t } = useTranslation();
  const id = useId();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-all">
      <div className="flex h-14 items-center justify-between px-4">
        
        {/* LEFT: Sidebar Toggle & Studio Title */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" />
          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block" />
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] hidden lg:block">
            {t("Leitner AI")}
          </span>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Hide Alert Toggle on small mobile to save space */}
          {showAlertBadge && (
            <div className="hidden xs:block">
              <AnimatedTooltip
                trigger={[
                  <div key="alert-toggle" className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-2 py-1">
                    <BellOff className={cn("size-4", !checked ? "text-foreground" : "text-muted-foreground/40")} />
                    <Switch checked={checked} onCheckedChange={toggleSwitch} className="scale-75" />
                    <BellRing className={cn("size-4", checked ? "text-foreground" : "text-muted-foreground/40")} />
                  </div>,
                ]}
                items={[<p key="t">{t("Smart alerts")}</p>]}
              />
            </div>
          )}

          <div className="flex items-center gap-1.5 sm:gap-2">
            <CreateFolder />
            <div className="w-[120px] sm:w-[180px]">
              <Select data={foldersQuery?.data?.folders || []} loading={isLoadingFolders} />
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;