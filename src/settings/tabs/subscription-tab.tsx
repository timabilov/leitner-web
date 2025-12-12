import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as Sentry from "@sentry/react";
import { AlertCircle, Loader2 } from "lucide-react";

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

  const profileInfoQuery = useQuery({
    queryKey: ['profile', companyId],
    queryFn: async () => axiosInstance.get(API_BASE_URL + `/company/${companyId}/overview`),
    enabled: !!companyId,
  });

  const meInfoQuery = useQuery({
    queryKey: ['me'],
    queryFn: async () => axiosInstance.get(API_BASE_URL + '/shop/profile/me'),
  });

  const { subscription, today_created_notes_count, enforced_daily_note_limit } = profileInfoQuery.data?.data || {};
  const { plan_interval, is_cancelled, is_past_due, expiration_date } = meInfoQuery.data?.data || {};

  const isPro = subscription === 'pro' || subscription === 'trial';
  const noteLimit = enforced_daily_note_limit || 10;
  const notesUsed = today_created_notes_count || 0;
  const usagePercent = Math.min((notesUsed / noteLimit) * 100, 100);

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
      Sentry.captureException(error);
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
      Sentry.captureException(error);
      toast.error(t("Failed to resume."));
    } finally {
      setIsResuming(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h3 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{t("Plan & Billing")}</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("Manage your subscription and usage")}</p>
      </div>
      <Separator className="bg-zinc-200 dark:bg-zinc-800" />

      {is_past_due && (
        <Alert variant="destructive" className="dark:border-red-900 dark:bg-red-900/10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("Payment Failed")}</AlertTitle>
          <AlertDescription>{t("Please update your payment method.")}</AlertDescription>
        </Alert>
      )}

      {/* PLAN CARD: Updated colors for Dark Mode */}
      <Card className={`border ${is_cancelled ? 'border-orange-200 dark:border-orange-900' : 'border-zinc-200 dark:border-zinc-800'} gap-0 py-0 overflow-hidden dark:bg-transparent`}>
        <div className={`p-6 border-b flex justify-between items-center ${
            is_cancelled 
            ? 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900' 
            : 'bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800'
        }`}>
          <div>
            <p className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">{t("Current Plan")}</p>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{plan.label}</h2>
              {is_cancelled && <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800">{t("Cancelling")}</Badge>}
            </div>
          </div>
          {isPro && (
            <div className="text-right">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block uppercase mb-1">
                {is_cancelled ? t("Expires on") : t("Renews on")}
              </span>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{expiration_date ? formatDate(expiration_date) : "-"}</p>
            </div>
          )}
        </div>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{t("Daily Generations")}</span>
              <span className="text-zinc-500 dark:text-zinc-400">{notesUsed} / {enforced_daily_note_limit || '∞'}</span>
            </div>
            <GradientProgress value={usagePercent} className="w-full h-3" />
            <p className="text-xs text-zinc-400 text-right">{t("Resets at midnight UTC")}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col">
        {isPro && !is_cancelled && (
          <>
            <Separator className="bg-zinc-200 dark:bg-zinc-800" />
            <SettingsItem
              label={t("Cancel Subscription")}
              action={
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-900/30 dark:bg-red-950/10 dark:text-red-400 dark:hover:bg-red-950/30"
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
                        {t("You will lose access to Pro features.")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("Keep Plan")}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancelSubscription} className="bg-red-600 hover:bg-red-700">
                        {t("Yes, Cancel")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              }
            />
          </>
        )}
        {is_cancelled && (
          <>
             <Separator className="bg-zinc-200 dark:bg-zinc-800" />
            <SettingsItem
              label={t("Undo Cancellation")}
              action={
                <Button 
                    onClick={handleResumeSubscription} 
                    disabled={isResuming}
                    className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800"
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