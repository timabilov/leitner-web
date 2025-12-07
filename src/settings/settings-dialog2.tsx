import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { 
  User, 
  CreditCard, 
  Settings, 
  LogOut, 
  Copy, 
  Check, 
  Loader2, 
  Sparkles, 
  AlertTriangle,
  CalendarDays,
  AlertCircle,
  Pencil,
  Flame,
  FileText
} from "lucide-react";
import {GradientProgress}  from '@/components/gradient-progress'

// Services & Config
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL, ISO_TO_LANGUAGE } from "@/services/config";
import { useUserStore } from "@/store/userStore";

// UI Components (Shadcn)
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// --- Helper Component for Rows ---
const SettingsItem = ({ 
  label, 
  value, 
  icon: Icon,
  action, 
  className 
}: { 
  label: string; 
  value?: React.ReactNode; 
  icon?: any;
  action?: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex items-center justify-between py-4 ${className}`}>
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-neutral-900 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-neutral-400" />}
        {label}
      </span>
    </div>
    <div className="flex items-center gap-3">
      {value && <span className="text-sm text-neutral-600">{value}</span>}
      {action}
    </div>
  </div>
);

type Tab = 'account' | 'subscription' | 'preferences';

const SettingsDialog2 = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (v: boolean) => void }) => {
  const { t } = useTranslation();
  const { fullName, email, clearStore, companyId, avatarUrl } = useUserStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // --- State ---
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [language, setLanguage] = useState("ru");
  const [theme, setTheme] = useState("light");
  const [isCopied, setIsCopied] = useState(false);

  // --- Queries ---
  const profileInfoQuery = useQuery({
    queryKey: ['profile', companyId],
    queryFn: async () => axiosInstance.get(API_BASE_URL + `/company/${companyId}/overview`),
    enabled: !!companyId,
  });

  const meInfoQuery = useQuery({
    queryKey: ['me', companyId],
    queryFn: async () => axiosInstance.get(API_BASE_URL + '/shop/profile/me'),
    enabled: !!companyId,
  });

  // Extract Data
  const { 
    subscription, 
    today_created_notes_count, 
    enforced_daily_note_limit,
    total_created_notes_count // ✅ Extracted Total Notes
  } = profileInfoQuery.data?.data || {};

  const { 
    plan_interval, 
    is_cancelled, 
    is_past_due, 
    expiration_date,
    created_at // ✅ Extracted Created Date (Ensure backend sends this!)
  } = meInfoQuery.data?.data || {};

  const isPro = subscription === 'pro' || subscription === 'trial';

  // --- Helpers ---
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getPlanDetails = () => {
    if (subscription === 'trial') return { label: t('Free Trial'), variant: 'default' as const };
    if (subscription === 'free') return { label: t('Free Plan'), variant: 'secondary' as const };
    switch (plan_interval) {
      case 'YEAR': return { label: t('Pro Annual'), variant: 'default' as const };
      case 'MONTH': return { label: t('Pro Monthly'), variant: 'default' as const };
      case 'WEEK': return { label: t('Pro Weekly'), variant: 'default' as const };
      default: return { label: t('Pro Plan'), variant: 'default' as const };
    }
  };

  const plan = getPlanDetails();
  const noteLimit = enforced_daily_note_limit || 10;
  const notesUsed = today_created_notes_count || 0;
  const usagePercent = Math.min((notesUsed / noteLimit) * 100, 100);

  // --- Handlers ---
  const handleCopyReferral = () => {
    navigator.clipboard.writeText(`https://lessnote.ai/invite?ref=${companyId}`); 
    setIsCopied(true);
    toast.success(t("Referral link copied!"));
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCancelSubscription = async () => {
    if (!confirm(t("Are you sure you want to cancel?"))) return;
    setIsCancelling(true);
    try {
      await axiosInstance.post(`${API_BASE_URL}/subscription/cancel`);
      toast.success(t("Subscription canceled."));
      await Promise.all([queryClient.invalidateQueries(['me']), queryClient.invalidateQueries(['profile'])]);
    } catch (error) {
      toast.error(t("Failed to cancel."));
    } finally {
      setIsCancelling(false);
    }
  };

  const handleResumeSubscription = async () => {
    setIsResuming(true);
    try {
      await axiosInstance.post(`${API_BASE_URL}/subscription/resume`);
      toast.success(t("Subscription resumed!"));
      await Promise.all([queryClient.invalidateQueries(['me']), queryClient.invalidateQueries(['profile'])]);
    } catch (error) {
      toast.error(t("Failed to resume."));
    } finally {
      setIsResuming(false);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    setIsUpdatingPayment(true);
    try {
        // Assuming you implement a route that returns Paddle's update URL
        const res = await axiosInstance.get(`${API_BASE_URL}/subscription/update-payment-url`);
        if (res.data?.url) {
            window.open(res.data.url, '_blank');
        } else {
            toast.error(t("Unable to load payment portal."));
        }
    } catch (error) {
        // Fallback: Just tell them to check email if API fails
        toast.info(t("Please check your email for a payment update link from Paddle."));
    } finally {
        setIsUpdatingPayment(false);
    }
  };

  const handleLogout = () => {
    clearStore();
    navigate('/login');
  };

  // --- Render Sidebar ---
  const renderSidebar = () => (
    <div className="w-50 border-r border-neutral-200 bg-neutral-50/50 flex flex-col justify-between h-full p-4">
      <div className="space-y-6">
        <div>
          <h2 className="px-4 text-lg font-semibold tracking-tight mb-2">{t("Settings")}</h2>
          <div className="space-y-1">
            <Button 
              variant={activeTab === 'account' ? "secondary" : "ghost"} 
              className="w-full justify-start" 
              onClick={() => setActiveTab('account')}
            >
              <User className="mr-2 h-4 w-4" />
              {t("Account")}
            </Button>
            <Button 
              variant={activeTab === 'subscription' ? "secondary" : "ghost"} 
              className="w-full justify-start" 
              onClick={() => setActiveTab('subscription')}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {t("Plans & Billing")}
              {is_past_due && <div className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
            </Button>
            <Button 
              variant={activeTab === 'preferences' ? "secondary" : "ghost"} 
              className="w-full justify-start" 
              onClick={() => setActiveTab('preferences')}
            >
              <Settings className="mr-2 h-4 w-4" />
              {t("Preferences")}
            </Button>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Separator />
        <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          {t("Log out")}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl sm:max-w-4xl  p-0 gap-0 overflow-auto h-[600px] flex flex-row">
        
        {renderSidebar()}

        <div className="flex-1 overflow-y-auto bg-white p-8">
            
            {/* ---------------- ACCOUNT TAB ---------------- */}
            {activeTab === 'account' && (
                <div className="animate-in fade-in duration-300">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-semibold tracking-tight">{t("Account")}</h3>
                            <p className="text-sm text-neutral-500">{t("Manage your profile information")}</p>
                        </div>
                        {/* Avatar on the right or top? Keeping generic layout */}
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={avatarUrl} />
                            <AvatarFallback>{fullName?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                    </div>

                    {/* ROW BY ROW LAYOUT */}
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
                            value={formatDate(created_at || new Date().toISOString())} // Fallback if backend doesn't send yet
                        />

                        <Separator />

                        {/* New Field: Total Notes */}
                        <SettingsItem 
                            label={t("Total Content Count")} 
                            value={total_created_notes_count || 0}
                        />


                        {/* Referral Section (Styled as requested) */}
                        {/* <div className="py-6">
                            <h4 className="text-sm font-bold text-neutral-900 mb-1">
                                {t("15% Discount - Referral Link")}
                            </h4>
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-neutral-500 max-w-sm">
                                    {t("Invite friends, get 15% discount for 1 month.")}
                                </p>
                                <Button 
                                    className="bg-neutral-900 text-white hover:bg-neutral-800"
                                    onClick={handleCopyReferral}
                                >
                                    {isCopied ? t("Copied!") : t("Copy Link")}
                                </Button>
                            </div>
                        </div> */}

                    </div>
                </div>
            )}

            {/* ---------------- SUBSCRIPTION TAB ---------------- */}
            {activeTab === 'subscription' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div>
                        <h3 className="text-2xl font-semibold tracking-tight">{t("Plan & Billing")}</h3>
                        <p className="text-sm text-neutral-500">{t("Manage your subscription")}</p>
                    </div>
                    <Separator />

                    {is_past_due && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>{t("Payment Failed")}</AlertTitle>
                            <AlertDescription>{t("Please update payment method.")}</AlertDescription>
                        </Alert>
                    )}

                    <Card className={`border ${is_cancelled ? 'border-orange-200' : 'border-neutral-200'} gap-0 py-0`}>
                         <div className={`p-6 border-b flex justify-between items-center ${is_cancelled ? 'bg-orange-50/30' : 'bg-neutral-50/30'}`}>
                            <div>
                                <p className="text-xs font-bold uppercase text-neutral-500 mb-1">{t("Current Plan")}</p>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold">{plan.label}</h2>
                                    {is_cancelled && <Badge >{t("Cancelling")}</Badge>}
                                </div>
                            </div>
                            {isPro && (
                                <div className="text-right">
                                    <span className="text-sm font-medium">{is_cancelled ? t("Expires on") : t("Renews on")}</span>
                                    <p className="text-sm text-neutral-500">{expiration_date ? formatDate(expiration_date) : "-"}</p>
                                </div>
                            )}
                         </div>
                         <CardContent className="p-6">
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{t("Daily Usage")}</span>
                                    <span className="text-neutral-500">{notesUsed} / {enforced_daily_note_limit || '∞'}</span>
                                </div>
                                <GradientProgress value={usagePercent} className="w-full" />

                            </div>
                         </CardContent>
                    </Card>

                    {/* Actions Row by Row style */}
                    <div className="flex flex-col">
                        {isPro && !is_cancelled && (
                            <>
                                <Separator />
                                <SettingsItem 
                                    label={t("Cancel Subscription")}
                                    action={
                                        <Button 
                                            variant="outline" 
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={handleCancelSubscription}
                                            disabled={isCancelling}
                                        >
                                            {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {t("Cancel")}
                                        </Button>
                                    }
                                />
                            </>
                        )}

                        {is_cancelled && (
                            <>
                                <Separator />
                                <SettingsItem 
                                    label={t("Undo Cancellation")}
                                    action={
                                        <Button variant="secondary" onClick={handleResumeSubscription} disabled={isResuming}>
                                            {isResuming ? <Loader2 className="animate-spin w-4 h-4"/> : t("Resume Plan")}
                                        </Button>
                                    }
                                />
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ---------------- PREFERENCES TAB ---------------- */}
            {activeTab === 'preferences' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div>
                        <h3 className="text-2xl font-semibold tracking-tight">{t("Preferences")}</h3>
                        <p className="text-sm text-neutral-500">{t("Customize experience")}</p>
                    </div>
                    
                    <div className="flex flex-col">
                        <Separator />
                        
                        <SettingsItem 
                            label={t("Language")}
                            action={
                                <Select value={language} onValueChange={setLanguage}>
                                    <SelectTrigger className="w-[140px] h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(ISO_TO_LANGUAGE).map(([iso, data]) => (
                                            <SelectItem key={iso} value={iso}>{data.flag} {data.language}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            }
                        />

                        <Separator />

                        <SettingsItem 
                            label={t("Theme")}
                            action={
                                <Select value={theme} onValueChange={setTheme}>
                                    <SelectTrigger className="w-[140px] h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="light">{t("Light")}</SelectItem>
                                        <SelectItem value="dark">{t("Dark")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            }
                        />

                        <Separator />

                        <SettingsItem 
                            label={t("Email Notifications")}
                            action={<Switch defaultChecked />}
                        />

                        <Separator />
                    </div>
                </div>
            )}

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog2;