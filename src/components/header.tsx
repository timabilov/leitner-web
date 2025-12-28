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

const Header = ({
  isAlertEnabled,
  showAlertBadge,
}: {
  isAlertEnabled?: boolean;
  showAlertBadge?: boolean;
}) => {
  const posthog = usePostHog();
  const { t } = useTranslation();
  const { companyId, setFolders } = useUserStore();
  const [checked, setChecked] = useState<boolean>(!!isAlertEnabled);
  const id = useId();

  const { data: foldersQuery, isLoading: isLoadingFolders } = useQuery({
    queryKey: ["folders"],
    refetchOnWindowFocus: false,
    queryFn: async () =>
      axiosInstance.get(API_BASE_URL + `/company/${companyId}/notes/folder`),
    enabled: !!companyId,
  });

  useEffect(() => {
    if (foldersQuery?.data) setFolders(foldersQuery?.data?.folders);
  }, [foldersQuery?.data, setFolders]);

  const toggleSwitch = (val: boolean) => {
    setChecked(val);
    posthog.capture("alert_status_changed", { enabled: val });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-all">
      <div className="flex h-14 items-center justify-end px-4 gap-4 sm:px-8">
        
        {/* 1. ALERT TOGGLE: Integrated Pill Logic */}
        {showAlertBadge && (
          <div className="hidden sm:block">
            <AnimatedTooltip
              trigger={[
                <div
                  key="alert-toggle"
                  className="flex items-center gap-3 rounded-md border border-border/50 bg-muted/30 px-3 py-1.5 transition-colors hover:border-border"
                >
                  <button
                    onClick={() => toggleSwitch(false)}
                    className={cn(
                      "transition-all duration-200",
                      !checked ? "text-foreground opacity-100" : "text-muted-foreground opacity-40 hover:opacity-100"
                    )}
                  >
                    <BellOff size={16} strokeWidth={2.5} />
                  </button>

                  <Switch
                    id={id}
                    checked={checked}
                    onCheckedChange={toggleSwitch}
                    className="data-[state=checked]:bg-primary"
                  />

                  <button
                    onClick={() => toggleSwitch(true)}
                    className={cn(
                      "transition-all duration-200",
                      checked ? "text-foreground opacity-100" : "text-muted-foreground opacity-40 hover:opacity-100"
                    )}
                  >
                    <BellRing size={16} strokeWidth={2.5} />
                  </button>
                </div>,
              ]}
              items={[
                <div key="tip" className="flex flex-col gap-1 p-1">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                      {t("Notifications")}
                   </p>
                   <p className="text-[11px] font-medium text-muted-foreground">
                      {t("Smart alerts for memory decay.")}
                   </p>
                </div>
              ]}
            />
          </div>
        )}

        {/* 2. ACTION GROUP: Studio Buttons & Selects */}
        <div className="flex items-center gap-2">
          {/* Create Folder inherits shadcn/ui button styles */}
          <CreateFolder />
          
          {/* Select Component wrapped for precise width */}
          <div className="w-auto">
            <Select
              data={foldersQuery?.data?.folders || []}
              loading={isLoadingFolders}
            />
          </div>

          {/* Language Switcher */}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
};

export default Header;