import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as Sentry from "@sentry/react";
import { AlertCircle, Loader2 } from "lucide-react";

// Components
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GradientProgress } from '@/components/gradient-progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Services & Helpers
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useUserStore } from "@/store/userStore";
import { SettingsItem } from "../settings-item";

const SubscriptionTab = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { companyId, userId, email } = useUserStore();

  const [isCancelling, setIsCancelling] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  // Queries
  const profileInfoQuery = useQuery({
    queryKey: ['profile', companyId],
    queryFn: async () => axiosInstance.get(API_BASE_URL + `/company/${companyId}/overview`),
    enabled: !!companyId,
  });

  const meInfoQuery = useQuery({
    queryKey: ['me'],
    queryFn: async () => axiosInstance.get(API_BASE_URL + '/shop/profile/me'),
  });

  // Derived Data
  const { subscription, today_created_notes_count, enforced_daily_note_limit } = profileInfoQuery.data?.data || {};
  const { plan_interval, is_cancelled, is_past_due, expiration_date } = meInfoQuery.data?.data || {};

  const isPro = subscription === 'pro' || subscription === 'trial';
  const noteLimit = enforced_daily_note_limit || 10;
  const notesUsed = today_created_notes_count || 0;
  const usagePercent = Math.min((notesUsed / noteLimit) * 100, 100);

  // Logic for Plan Label
  const getPlanDetails = () => {
    if (subscription === 'trial') return { label: t('Free Trial'), variant: 'default' };
    if (subscription === 'free') return { label: t('Free Plan'), variant: 'secondary' };
    switch (plan_interval) {
      case 'YEAR': return { label: t('Pro Annual'), variant: 'default' };
      case 'MONTH': return { label: t('Pro Monthly'), variant: 'default' };
      case 'WEEK': return { label: t('Pro Weekly'), variant: 'default' };
      default: return { label: t('Pro Plan'), variant: 'default' };
    }
  };
  
  const plan = getPlanDetails();

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Actions
  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      await axiosInstance.post(`${API_BASE_URL}/subscription/cancel`);
      toast.success(t("Subscription canceled."));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['me'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] })
      ]);
    } catch (error) {
      Sentry.captureException(error, { tags: { action: 'cancel_subscription' }, extra: { userId, email } });
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['me'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] })
      ]);
    } catch (error) {
      Sentry.captureException(error, { tags: { action: 'resume_subscription' }, extra: { email, userId } });
      toast.error(t("Failed to resume."));
    } finally {
      setIsResuming(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h3 className="text-2xl font-semibold tracking-tight">{t("Plan & Billing")}</h3>
        <p className="text-sm text-neutral-500">{t("Manage your subscription and usage")}</p>
      </div>
      <Separator />

      {/* Payment Failure Alert */}
      {is_past_due && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("Payment Failed")}</AlertTitle>
          <AlertDescription>{t("We couldn't process your payment. Please update your payment method to avoid interruption.")}</AlertDescription>
        </Alert>
      )}

      {/* Usage Card */}
      <Card className={`border ${is_cancelled ? 'border-orange-200' : 'border-neutral-200'} gap-0 py-0 overflow-hidden`}>
        <div className={`p-6 border-b flex justify-between items-center ${is_cancelled ? 'bg-orange-50/50' : 'bg-neutral-50/50'}`}>
          <div>
            <p className="text-xs font-bold uppercase text-neutral-500 mb-1">{t("Current Plan")}</p>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{plan.label}</h2>
              {is_cancelled && <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-100">{t("Cancelling")}</Badge>}
            </div>
          </div>
          {isPro && (
            <div className="text-right">
              <span className="text-xs font-medium text-neutral-500 block uppercase mb-1">
                {is_cancelled ? t("Expires on") : t("Renews on")}
              </span>
              <p className="text-sm font-medium">{expiration_date ? formatDate(expiration_date) : "-"}</p>
            </div>
          )}
        </div>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{t("Daily Generations")}</span>
              <span className="text-neutral-500">{notesUsed} / {enforced_daily_note_limit || '∞'}</span>
            </div>
            <GradientProgress value={usagePercent} className="w-full h-3" />
            <p className="text-xs text-neutral-400 text-right">{t("Resets at midnight UTC")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col">
        {/* Case 1: Active Pro User -> Show Cancel Option */}
        {isPro && !is_cancelled && (
          <>
            <Separator />
            <SettingsItem
              label={t("Cancel Subscription")}
              action={
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        disabled={isCancelling}
                    >
                      {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t("Cancel Plan")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("Are you absolutely sure?")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("You will lose access to Pro features at the end of your current billing period. This action cannot be undone immediately.")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("Keep Plan")}</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={(e) => {
                           // Prevent default to handle async logic if needed, 
                           // though Shadcn dialog usually closes on click.
                           handleCancelSubscription();
                        }}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                      >
                        {t("Yes, Cancel")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              }
            />
          </>
        )}

        {/* Case 2: Cancelled User -> Show Resume Option */}
        {is_cancelled && (
          <>
            <Separator />
            <SettingsItem
              label={t("Undo Cancellation")}
              action={
                <Button 
                    onClick={handleResumeSubscription} 
                    disabled={isResuming}
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isResuming ? <Loader2 className="animate-spin w-4 h-4 mr-2"/> : null}
                  {t("Resume Plan")}
                </Button>
              }
            />
          </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionTab;