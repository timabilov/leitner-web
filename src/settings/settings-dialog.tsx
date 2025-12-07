import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL, ISO_TO_LANGUAGE } from "@/services/config";
import { useUserStore } from "@/store/userStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { InfoIcon,  LogOut,  Sun } from "lucide-react";
import { GoogleLogin, googleLogout } from '@react-oauth/google';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next"; // Import the hook
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useNavigate } from "react-router";


const SettingsRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="flex items-center justify-between py-2 border-b border-neutral-200 last:border-0">
    <span className="text-sm font-medium text-neutral-800">{label}</span>
    <div>{children}</div>
  </div>
);


const SettingsDialog2 = ({isOpen, setIsOpen}) => {
  const { t } = useTranslation(); // Initialize the translation hook
    const { fullName, email, clearStore } = useUserStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();


  const availableLanguages = [
    { iso: "auto", flag: "🤖", language: t("Auto") },
    ...Object.entries(ISO_TO_LANGUAGE).map(([iso, data]) => ({
      iso,
      ...data,
    })),
  ];


  const [language, setLanguage] = useState("ru");
  const [theme, setTheme] = useState("light");
  const [chatModel, setChatModel] = useState("auto");

  const companyId = useUserStore((state) => state.companyId);
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
console.log(userTimezone); // Outputs something like: "America/Los_Angeles"

  const profileInfoQuery = useQuery({
    queryKey: ['profile', companyId],
    queryFn: async () => {
      return axiosInstance.get(API_BASE_URL + `/company/${companyId}/overview`);
    },
    enabled: !!companyId,
  });


   const meInfoQuery = useQuery({
    queryKey: ['me', companyId],
    queryFn: async () => {
      return axiosInstance.get(API_BASE_URL + '/shop/profile/me');
    },
    enabled: !!companyId,
  });


  const {full_admin_access, llm_model, subscription, today_created_notes_count, default_daily_note_limit, total_created_notes_count, enforced_daily_note_limit, enforced_daily_audio_hours_limit, settings } = profileInfoQuery.data?.data || {};


//    const updateModelMutation = useMutation(
//     (newSettings: { llm_model: number, language: string, name: string }) => {
//       // Assuming a PATCH request to an endpoint that saves user/company settings
//       return axiosInstance.post(`${API_BASE_URL}/company/${companyId}/update`, newSettings);
//     },
//     {
//       onSuccess: () => {
//         // Invalidate the profile query to refetch the data with the new model
//         queryClient.invalidateQueries(['profile', companyId]);
//         // Close the bottom sheet on success
//       },
//       onError: (error: any, newEnabledValue, context) => {
//         console.log('Error updating model:', error.response?.data);
//         toast.error(t('Failed to update the model. Please try again.'));
//       },
//     }
//   );

    const free_and_note_limit_hit = (subscription && subscription === 'free' && today_created_notes_count != null && today_created_notes_count >= 2);

    const handleLogout = () => {
        toast(t('Are you sure you want to log out?'), {
          description:  t('Log Out'),
          action: {
            label: <LogOut />,
            onClick: () => {
                 clearStore();
            try {
            //   postHog.capture("log_out_clicked", {
            //   user_id: userId,
            //   companyId,
            // });
              // postHog.reset()
             googleLogout()
            } catch (error) {
              console.error('Error signing out from Google:', error);
            }
            navigate('/login');

            },
          },
        })
  };

//   const handleDeleteAccount = () => {
//     toast(t('Are you sure you want to log out?'), {
//           description:  t('Log Out'),
//           action: {
//             label: <LogOut />,
//             onClick: () => {
//                  clearStore();
//             try {
//             //   postHog.capture("log_out_clicked", {
//             //   user_id: userId,
//             //   companyId,
//             // });
//               // postHog.reset()
//              googleLogout()
//             } catch (error) {
//               console.error('Error signing out from Google:', error);
//             }
//             navigate('/login');

//             },
//           },
//         })


//     Alert.alert(
//       t('Delete Account'),
//       t('This action cannot be undone. Are you sure you want to delete your account?'),
//       [
//         { text: t('Cancel'), style: 'cancel' },
//         {
//           text: t('Delete'),
//           style: 'destructive',
//           onPress: () => {
//             postHog.capture("delete_account_clicked", {
//               user_id: userId,
//               companyId,
//             });
//             clearStore();
//             router.replace('/(auth)/login');
//           },
//         },
//       ]
//     );
//   };

//   const handleGetPro = async () => {
//       console.log('Presenting paywall from settings')
//       postHog.capture("get_pro_clicked", {
//         user_id: userId,
//         companyId,
//       });
//       presentPaywallIfNeeded().then((paywallResult: PAYWALL_RESULT) => {
          
//           console.log('Paywall presented', paywallResult)
//           if (paywallResult === PAYWALL_RESULT.PURCHASED || paywallResult === PAYWALL_RESULT.RESTORED) {
//             postHog.capture("get_pro_finished", {
//               user_id: userId,
//               companyId,
//               result: paywallResult,
//               succeed: true
//             });
//             profileInfoQuery.refetch();
//             setInterval(() => {
//               profileInfoQuery.refetch();
//             }, 2000)
//             Alert.alert(
//               t('Thank you!'),
//               t('Your subscription has been updated.'),
//               [{ text: t('OK'), onPress: () => { 
//                 profileInfoQuery.refetch();
//                 Purchases.syncPurchases();

//               } }]
//             );
            
//           }
//         }).catch((error) => {; 
//           console.error('Error presenting paywall or processing transaction?:', error);
//            postHog.capture("get_pro_finished", {
//               user_id: userId,
//               companyId,
//               error,
//               succeed: false
//             })
//           Sentry.captureException(error, {
//             extra: {
//               companyId,
//             },
//           });
//           Alert.alert(
//             t('Error'),
//             t('There was an error getting information about your purchases. Please try again later.'),
//             [{ text: t('OK'), onPress: () => { } }]
//           );
//         })

//   };

//   const handleSupport = () => {
//      navigation('/support');
//   };




  




  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} >

      <DialogContent className="max-w-2xl w-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("Account")}</DialogTitle>
        </DialogHeader>

        <div className="w-full bg-white ">
      <div className="flex flex-col">
        
        {/* --- Language Row --- */}
        <SettingsRow label={t("Language")}>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className=" border-none focus:ring-0 shadow-none text-neutral-700">
              <SelectValue asChild>
                <div className="flex items-center gap-2">
                  <span role="img" aria-label="Russian Flag">🇷🇺</span>
                  <span>Russian</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ru">
                <div className="flex items-center gap-2">
                  <span role="img" aria-label="Russian Flag">🇷🇺</span>
                  <span>Russian</span>
                </div>
              </SelectItem>
              <SelectItem value="en">
                <div className="flex items-center gap-2">
                  <span role="img" aria-label="USA Flag">🇺🇸</span>
                  <span>English</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>

        {/* --- Theme Row --- */}
        <SettingsRow label={t("Theme")}>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="w-[110px] border-none focus:ring-0 shadow-none text-neutral-700">
              <SelectValue asChild>
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-neutral-500" />
                  <span>{t("Light")}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-neutral-500" />
                  <span>{t("Light")}</span>
                </div>
              </SelectItem>
              <SelectItem value="dark">
                <div className="flex items-center gap-2">
                  {/* You can use a Moon icon here */}
                  <span>{t("Dark")}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>

        {/* --- Chat Model Row --- */}
        <SettingsRow label={t("Model")}>
          <Select value={chatModel} onValueChange={setChatModel}>
            <SelectTrigger className="w-[90px] border-none focus:ring-0 shadow-none text-neutral-700">
              <SelectValue placeholder="Auto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              <SelectItem value="gpt4">GPT-4</SelectItem>
              <SelectItem value="gpt3.5">GPT-3.5</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow label={t("Full name")}>
          <span className="text-sm text-neutral-700  font-normal">{fullName}</span>
        </SettingsRow>
         <SettingsRow label={t("Email")}>
          <span className="text-sm text-neutral-700  font-normal">{email}</span>
        </SettingsRow>
        <SettingsRow label={t("Daily note quota")}>
          <span className="text-sm text-neutral-700  font-normal">{`${today_created_notes_count || 0} / ${enforced_daily_note_limit || '∞'}`}</span>
        </SettingsRow>
        <SettingsRow label={t("Timezone")}>
            <div className="flex flex-row items-center">
                <span className="text-sm text-neutral-700 font-normal">{userTimezone}</span>
                <Tooltip>
                    <TooltipTrigger>
                        <InfoIcon className="w-4 h-4 text-gray-400 ml-2" />
                    </TooltipTrigger>
                    <TooltipContent>
                        <span className=" text-sm">{t("You will receive notifications")}</span>
                    </TooltipContent>
                </Tooltip>
            </div>
        </SettingsRow>
        
      </div>
    </div>

      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog2;