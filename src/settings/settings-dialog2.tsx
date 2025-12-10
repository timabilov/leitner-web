import { useState } from "react";
import { useTranslation } from "react-i18next";
import { User, CreditCard, Settings, LogOut } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils"; // Standard Shadcn utility
import { useUserStore } from "@/store/userStore";
import AccountTab from "./tabs/account-tab"; // Extracted
import SubscriptionTab from "./tabs/subscription-tab"; // Extracted
import PreferencesTab from "./tabs/preferences-tab"; // Extracted

type Tab = 'account' | 'subscription' | 'preferences';

const SettingsDialog = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (v: boolean) => void }) => {
  const { t } = useTranslation();
  const { clearStore } = useUserStore();
  const [activeTab, setActiveTab] = useState<Tab>('account');

  // Sidebar Button Helper (prevents repetition)
  const SidebarBtn = ({ tab, icon: Icon, label }: { tab: Tab, icon: any, label: string }) => (
    <Button 
      variant={activeTab === tab ? "secondary" : "ghost"} 
      className={cn("w-full justify-start", activeTab === tab && "bg-neutral-100 font-semibold")} 
      onClick={() => setActiveTab(tab)}
    >
      <Icon className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* Fix: Responsive layout (col on mobile, row on desktop) */}
      <DialogContent className="max-w-4xl sm:max-w-4xl p-0 gap-0 overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[600px]">
        
        {/* SIDEBAR */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-neutral-200 bg-neutral-50/50 flex flex-col justify-between p-4">
          <div className="space-y-6">
            <div>
              <h2 className="px-4 text-lg font-semibold tracking-tight mb-2">{t("Settings")}</h2>
              <div className="space-y-1">
                <SidebarBtn tab="account" icon={User} label={t("Account")} />
                <SidebarBtn tab="subscription" icon={CreditCard} label={t("Plans & Billing")} />
                <SidebarBtn tab="preferences" icon={Settings} label={t("Preferences")} />
              </div>
            </div>
          </div>
          <div className="hidden md:block space-y-2">
            <Separator />
            <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50" onClick={clearStore}>
              <LogOut className="mr-2 h-4 w-4" />
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