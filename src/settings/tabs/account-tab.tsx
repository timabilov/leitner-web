import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useUserStore } from "@/store/userStore";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { SettingsItem } from "../settings-item"; // Import the helper we created

const AccountTab = () => {
  const { t } = useTranslation();
  const { fullName, email, avatarUrl, companyId } = useUserStore();

  // Fetch specific profile stats
  const profileInfoQuery = useQuery({
    queryKey: ['profile', companyId],
    queryFn: async () => axiosInstance.get(API_BASE_URL + `/company/${companyId}/overview`),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Fetch 'me' info for creation date
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
          <h3 className="text-2xl font-semibold tracking-tight">{t("Account")}</h3>
          <p className="text-sm text-neutral-500">{t("Manage your profile information")}</p>
        </div>
        <Avatar className="h-16 w-16 border border-neutral-200">
          <AvatarImage src={avatarUrl} objectFit="cover"/>
          <AvatarFallback className="text-lg">{fullName?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
      </div>

      <div className="flex flex-col">
        <Separator />
        
        <SettingsItem 
          label={t("Name")} 
          value={fullName} 
        />

        <Separator />

        <SettingsItem 
          label={t("Email")} 
          value={email} 
        />

        <Separator />

        <SettingsItem 
          label={t("Creation Date")} 
          value={formatDate(created_at)} 
        />

        <Separator />

        <SettingsItem 
          label={t("Total Content Generated")} 
          value={total_created_notes_count || 0}
        />
        
        <Separator />
      </div>
    </div>
  );
};

export default AccountTab;