import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useUserStore } from "@/store/userStore";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { SettingsItem } from "../settings-item";

const AccountTab = () => {
  const { t } = useTranslation();
  const { fullName, email, avatarUrl, companyId } = useUserStore();

  const profileInfoQuery = useQuery({
    queryKey: ['profile', companyId],
    queryFn: async () => axiosInstance.get(API_BASE_URL + `/company/${companyId}/overview`),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
  });

  const meInfoQuery = useQuery({
    queryKey: ['me'],
    queryFn: async () => axiosInstance.get(API_BASE_URL + '/shop/profile/me'),
    staleTime: 1000 * 60 * 5,
  });

  const { total_created_notes_count } = profileInfoQuery.data?.data || {};
  const { created_at } = meInfoQuery.data?.data || {};

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("Account")}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("Manage your profile information")}
          </p>
        </div>
        <Avatar className="h-16 w-16 border border-zinc-200 dark:border-zinc-700">
          <AvatarImage src={avatarUrl} className="object-cover"/>
          <AvatarFallback className="text-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50">
            {fullName?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="flex flex-col">
        <Separator className="bg-zinc-200 dark:bg-zinc-800" />
        
        <SettingsItem label={t("Name")} value={fullName} />
        <Separator className="bg-zinc-200 dark:bg-zinc-800" />

        <SettingsItem label={t("Email")} value={email} />
        <Separator className="bg-zinc-200 dark:bg-zinc-800" />

        <SettingsItem label={t("Creation Date")} value={formatDate(created_at)} />
        <Separator className="bg-zinc-200 dark:bg-zinc-800" />

        <SettingsItem label={t("Total Content Generated")} value={total_created_notes_count || 0} />
        <Separator className="bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
};

export default AccountTab;