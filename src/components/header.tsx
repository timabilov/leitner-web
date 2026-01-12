import { useUserStore } from "@/store/userStore";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import Select from "./select";
import { ArrowDown, BellOff, BellRing } from "lucide-react";
import { AnimatedTooltip } from "./ui/motion-tooltip";
import { useState, useId, useEffect } from "react";
import { Switch } from "./ui/switch";
import { LanguageSwitcher } from "./language-switcher";
import { useTranslation } from "react-i18next";
import CreateFolder from "./create-folder";
import { usePostHog } from 'posthog-js/react';
import { cn } from "@/lib/utils";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Spinner } from "./ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { toast } from "sonner";

const Header = ({  setChecked, checked, toggleSwitch, processingNotes, onProcessingClick }: any) => {
  const { t } = useTranslation();
  const { companyId, folders } = useUserStore();


  
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-all">
          <style>
        {
          `
           @keyframes slow-bounce-arrow {
            0%, 100% { transform: translateY(1px); }
            50% { transform: translateY(-1px); }
          }
          .animate-slow-bounce-arrow {
            animation: slow-bounce-arrow 2s ease infinite;
          }`
        }
      </style>

      <div className="flex h-14 items-center justify-between px-4">
        
        {/* LEFT: Sidebar Toggle & Studio Title */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" />
        </div>
        <div>
          {
            processingNotes ? 
            (
                     <div onClick={onProcessingClick} className="flex justify-center items-center hover:underline">
                        <Spinner className="" />
                        <p  className="cursor-pointer ml-2 text-muted-foreground text-sm font-medium tracking-tight whitespace-nowrap ">{`transcribing ${processingNotes} notes`}</p>
                        <ArrowDown  className="animate-slow-bounce-arrow w-4 h-4 text-muted-foreground ml-2 animate-" />
                      </div>
            )
            : null
          }
        </div>
        {/* RIGHT: Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Hide Alert Toggle on small mobile to save space */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <CreateFolder />
            <div className="">
              <Select data={folders || []} /*loading={isLoadingFolders}*/ />
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;