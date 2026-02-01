import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { User, CreditCard, Settings, LogOut } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";

// Imported Tabs
import AccountTab from "./tabs/account-tab";
import SubscriptionTab from "./tabs/subscription-tab";
import PreferencesTab from "./tabs/preferences-tab";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { usePostHog } from "posthog-js/react";
import * as Sentry from "@sentry/react"

type Tab = 'account' | 'subscription' | 'preferences';

const SettingsDialog = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (v: boolean) => void }) => {
  const { t } = useTranslation();
  const posthog = usePostHog();
  const { clearStore } = useUserStore();
  const [activeTab, setActiveTab] = useState<Tab>('account');

   useEffect(() => {
    if (isOpen) {
      posthog.capture("settings_dialog_opened");
    }
  }, [isOpen, posthog]);


  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    // 4. Track Tab Switch (Feature Usage)
    posthog.capture("settings_tab_changed", { tab });
  };

  const handleLogout = () => {
    // 5. Track Logout (Churn/Session End)
    posthog.capture("user_logged_out", { source: "settings_modal" });
    
    // 6. Sentry Breadcrumb (Context for debugging)
    Sentry.addBreadcrumb({
      category: "auth",
      message: "User clicked logout button in settings",
      level: "info",
    });

    clearStore();
    // Assuming clearStore redirects or App.tsx handles the auth state change
    setIsOpen(false); 
  };




  // ✅ 1. Updated Sidebar Button Helper
  // Now uses the exact same styling logic as your AppSidebar
  const SidebarBtn = ({ tab, icon: Icon, label }: { tab: Tab, icon: any, label: string }) => {
    const isActive = activeTab === tab;

    return (
      <SidebarMenuButton
        onClick={() => handleTabChange(tab)}
        // Keep this for accessibility/semantics, but we override the styles below
        isActive={isActive} 
        className={cn(
          "h-10 w-full justify-start gap-3 px-3 transition-all",
          
          isActive
            ? // ACTIVE STATE
              // 1. We use '!' to override the default 'bg-sidebar-accent'
              // 2. We removed 'data-[active=true]:' because we are inside the 'true' part of the JS ternary
              // 3. Fixed 'dark:text-zinc-white' -> 'dark:text-white'
              "!bg-zinc-900 !text-white hover:bg-zinc-800 hover:text-white dark:!bg-zinc-50 dark:!text-zinc-900"
            : // INACTIVE STATE
              "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
      </SidebarMenuButton>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl sm:max-w-4xl p-0 gap-0 overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[600px]">
        
        {/* ✅ 2. Sidebar Container */}
        {/* Changed bg to 'bg-muted/40' to match AppSidebar */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-muted/40 flex flex-col justify-between p-4">
          <div className="space-y-6">
            <div>
              <h2 className="px-3 text-lg font-semibold tracking-tight mb-2">{t("Settings")}</h2>
              <div className="space-y-1">
                <SidebarBtn tab="account" icon={User} label={t("Account")} />
                <SidebarBtn tab="subscription" icon={CreditCard} label={t("Plans & Billing")} />
                <SidebarBtn tab="preferences" icon={Settings} label={t("Preferences")} />
              </div>
            </div>
          </div>

          <div className="hidden md:block space-y-2">
            <Separator className="bg-zinc-200 dark:bg-zinc-800 my-2" />
            <Button 
              variant="ghost" 
              className="w-full justify-start h-10 gap-3 px-3 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30" 
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              {t("Log out")}
            </Button>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto bg-background p-6 md:p-8">
            {activeTab === 'account' && <AccountTab />}
            {activeTab === 'subscription' && <SubscriptionTab />}
            {activeTab === 'preferences' && <PreferencesTab />}
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;