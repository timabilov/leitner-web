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
import { useTranslation } from "react-i18next"; // Import the hook
import CreateFolder from "./create-folder";
import { usePostHog } from 'posthog-js/react';

const Header = ({
  isAlertEnabled,
  showAlertBadge,
}: {
  title?: string;
  isAlertEnabled?: boolean;
  showAlertBadge?: boolean;
  search: (val?: string) => void;
  isSearching: boolean
}) => {
  const posthog = usePostHog();
  const { t } = useTranslation(); // Initialize the hook
  const { companyId } = useUserStore();
  const [checked, setChecked] = useState<boolean>(!!isAlertEnabled);
  const { setFolders } = useUserStore();
  const id = useId();
  const toggleSwitch = () => setChecked((prev) => !prev);


  const { data: foldersQuery, isLoading: isLoadingFolders } = useQuery({
    queryKey: ["folders"],
    refetchOnWindowFocus: false,
    queryFn: async () =>
      axiosInstance.get(API_BASE_URL + `/company/${companyId}/notes/folder`),
    enabled: !!companyId,
    throwOnError: (error) => {
      console.error("Get folders error:", error);
      return false;
    },
  });

  useEffect(() => {
    if (foldersQuery?.data) setFolders(foldersQuery?.data?.folders);
  }, [foldersQuery?.data, setFolders]);

  return (
    <header className="bg-background/90 z-20 p-2 sticky top-0 flex h-[var(--header-height)] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[var(--header-height)]">
      <div className="flex w-full items-center gap-1 justify-end">
        {showAlertBadge && (
          <AnimatedTooltip
            className=""
            trigger={[
              <div
                key="alert-toggle"
                className="group flex flex-row justify-center h-[36px] items-center gap-2"
                data-state={checked ? "checked" : "unchecked"}
              >
                <span
                  id={`${id}-light`}
                  className="group-data-[state=checked]:text-muted-foreground/70 cursor-pointer text-left text-sm font-medium"
                  aria-controls={id}
                  onClick={() => {
                    posthog.capture("alert_badge_clicked")
                    setChecked(false)
                  }}
                >
                  <BellOff className="size-5" aria-hidden="true" />
                </span>
                <Switch
                  id={id}
                  checked={checked}
                  onCheckedChange={toggleSwitch}
                  aria-labelledby={`${id}-dark ${id}-light`}
                />
                <span
                  id={`${id}-dark`}
                  className="group-data-[state=unchecked]:text-muted-foreground/70 cursor-pointer text-right text-sm font-medium"
                  aria-controls={id}
                  onClick={() => setChecked(true)}
                >
                  <BellRing className="size-5" aria-hidden="true" />
                </span>
              </div>,
            ]}
            items={[
              <p key="alert-tooltip">{t("Turn on this setting to get notifications on your phone.")}</p>,
            ]}
          />
        )}
        
        <div className="relative flex justify-end items-center gap-2">
          <CreateFolder />
          <Select
            data={foldersQuery?.data?.folders || []}
            loading={isLoadingFolders}
          />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
};

export default Header;