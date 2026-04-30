import { useState, useEffect,  useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AnimatePresence,
} from "framer-motion";
import CatPenIcon from "@/notes/assets/cat-pen-icon";
import { useTranslation } from "react-i18next";
import { useUserStore } from "@/store/userStore";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useMutation } from "@tanstack/react-query";
import { GoogleLogin } from "@react-oauth/google"; // Changed to Hook for custom button support
import * as Sentry from "@sentry/react"; // 1. Import Sentry
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";
import { usePostHog } from "posthog-js/react";
import OnboardingModal from "@/onboarding";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PromoBanner } from "@/components/promo-banner";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { ArchitecturalBackground } from "@/components/layout";
import { FloatingBlobs } from "./components/floating-blobs";
import { GoogleColoredIcon } from "./components/google-icon";
import { VoiceTutorSlide } from "./components/voice-tutor-slide";
import { QuizSlide } from "./components/quiz-slide";
import { TutorSlide } from "./components/chat-slide";
import { FlashcardSlide } from "./components/flashcard-slide";


const LoginBase = () => {
  const { t } = useTranslation();
  const posthog = usePostHog();
  const navigate = useNavigate();
  const tempData = useRef({});
  const setAccessToken = useUserStore((state) => state.setAccessToken);
  const setRefreshToken = useUserStore((state) => state.setRefreshToken);
  const setUserData = useUserStore((state) => state.setUserData);
  const { accessToken, userId } = useUserStore();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  // const { hasPromo } = useOfferCountdown();
  const hasPromo = false
  const [activeSlide, setActiveSlide] = useState(0);
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    // Already signed in AND finished onboarding → go to app
    // TODO fix to no have flicker  from login to home(now for a moment it goes to login then immediately to home)
    if (accessToken && userId) {
      navigate("/notes", { replace: true });
      return;
    }
    posthog.capture("login_page_viewed");
  }, [accessToken, userId, navigate, posthog]);

  const googleVerifyMutation = useMutation({
    mutationFn: (newUser: any) => {
      return axiosInstance.post(
        API_BASE_URL + "/auth/google/v2?verify=true",
        newUser,
      );
    },
    onSuccess: async (response, variables) => {
      const data = response.data;
      posthog.capture("login_success", {
        provider: "google",
        is_new_user: data?.new,
      });
      // Essential: Set tokens immediately so the /finish call is authorized
      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      localStorage.setItem(
        "user-store",
        JSON.stringify({
          state: {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
          },
        }),
      );
      tempData.current = {
        ...data,
        ...variables,
      };
      posthog.identify(data.id, {
        email: variables.user.email,
        new_user: data?.new,
      });
      if (data?.new) {
        setSessionData({
          id: data.id,
          idToken: variables.idToken,
          email: variables.user.email,
          name: data.name || variables.user.name,
          photo: variables.user.photo || data.avatar,
          companyId: data.company_id,
          subscription: data?.company?.subscription,
          companyName: data?.company?.name,
          trialDate: data?.company?.trial_started_date,
          trialDays: data?.company?.trial_days,
          fullAdmin: data?.company?.full_admin_access || false,
        });
        setShowOnboarding(true);
        posthog.identify(data.id, {
          email: variables.user.email,
          new_user: true,
        });
      } else {
        // Existing user flow
        setUserData(
          data.id,
          data?.name,
          variables?.user?.email,
          data.company_id,
          data?.company?.subscription,
          data.company.name,
          data?.company?.trial_started_date &&
            new Date(data.company.trial_started_date),
          data?.company?.trial_days,
          variables?.user?.photo,
          data?.company?.full_admin_access || false,
        );
        navigate("/notes", { replace: true });
      }
      setIsGoogleLoading(false);
    },
    onError: (error: any) => {
      Sentry.captureException(error);
      posthog.capture("login_failed", {
        provider: "google",
        error_message: error?.message,
        status: error?.response?.status,
      });
      toast.error(t("An error occurred during sign-in."));
      setIsGoogleLoading(false);
    },
  });



  
// Automated loop logic
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 4);
    }, 5000); // Switch every 5 seconds
    return () => clearInterval(timer);
  }, []);



  const handleFinishOnboarding = async (isClaimOffer?: boolean) => {
    if (!sessionData) return;

    setIsFinishing(true);
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      // 1. Call the finish endpoint
      const response = await axiosInstance.post(
        API_BASE_URL + "/auth/google/v2",
        {
          platform: "web",
          idToken: sessionData.idToken,
          email: sessionData.email,
          name: sessionData.name,
          company: sessionData.name,
          photo: sessionData.photo,
          utm_source: "web_onboarding",
          time_zone: userTimeZone,
        }
      );
      posthog.capture("onboarding_completed", {
        method: "google_web"
      });

      // 2. Show success visual in modal
      setIsSuccess(true);
      setIsFinishing(false);

      // 3. Update the global store (Wait for visual satisfaction)

      setUserData(
        response?.data?.id,
        sessionData.name,
        sessionData.email,
        response?.data?.company_id,
        sessionData.subscription,
        sessionData.companyName,
        sessionData.trialDate && new Date(sessionData.trialDate),
        sessionData.trialDays,
        sessionData.photo,
        sessionData.fullAdmin
      );
      setTimeout(() => {
        // 4. Force the redirect
        if (isClaimOffer)
          navigate("/price-page?sale=true", { replace: true });
        else navigate("/notes", { replace: true });
      }, 1800);
    } catch (error) {
      console.error("Error finishing onboarding:", error);
      Sentry.captureException(error);
      posthog.capture("onboarding_failed", { error: error });
      setIsFinishing(false);
      toast.error(t("Failed to finalize profile. Please try again."));
    }
  };

  const signIn = async (credentialResponse: any) => {
    const idToken = credentialResponse.credential;
    const decodedToken: any = jwtDecode(idToken);
    setIsGoogleLoading(true);
    posthog.capture("login_attempted", { provider: "google" });
    googleVerifyMutation.mutate({
      idToken,
      user: {
        id: decodedToken.sub,
        name: decodedToken.name,
        email: decodedToken.email,
        photo: decodedToken.picture,
      },
      platform: "web",
    });
  };


  return (
<div className="relative min-h-screen w-full text-slate-900 selection:bg-purple-100 font-sans overflow-hidden bg-white">
      {/* 🟢 GLOBAL PERSISTENT BACKGROUNDS */}
      {/* <AnimatedGrid /> */}
     
      {/* 🟢 TOP PROMO BANNER (Conditional) */}
      { hasPromo &&  <PromoBanner />}

      <div className={cn("relative  flex min-h-screen w-full flex-col md:flex-row",
        hasPromo ? "pt-10" : ""
      )}>

        {/* 🟢 LEFT SIDE */}
         <div className="hidden md:flex md:w-1/2 flex-col relative border-r border-zinc-100 bg-white/20 backdrop-blur-sm overflow-hidden ">
           <FloatingBlobs />   
        <ArchitecturalBackground />   
          {/* Header Area */}
          <div className="p-10 flex items-center justify-between w-full absolute top-0 left-0">
             
             {/* Progress Dashes */}
             <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "h-1 rounded-full transition-all duration-500", 
                      activeSlide === i ? "w-8 bg-zinc-900" : "w-2 bg-slate-200"
                    )} 
                  />
                ))}
             </div>
          </div>

          {/* Main Slider Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-12 z-10">
            <AnimatePresence mode="wait">
              {activeSlide === 0 && <FlashcardSlide key="flash" t={t} />}
              {activeSlide === 1 && <TutorSlide key="tutor" t={t} />}
              {activeSlide === 2 && <QuizSlide key="quiz" t={t} />}
              {activeSlide === 3 && <VoiceTutorSlide key="voice" t={t} />}
            </AnimatePresence>
          </div>
        </div>

        {/* 🟢 RIGHT SIDE: LOGIN CONTENT */}
        <div className="relative flex w-full flex-col items-center justify-center bg-white/80 backdrop-blur-sm md:w-1/2 px-6 py-12 ">
           <ArchitecturalBackground />
          {/* Top Right Sale Pill */}
          <div className="absolute top-8 right-8 flex items-center gap-4 z-50">
             {hasPromo && (
               <Link to="/price-page?sale=true" className="flex items-center gap-2 rounded-full border border-zinc-100 bg-white px-3 py-1.5 text-xs font-bold shadow-sm hover:bg-zinc-50 transition-colors">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-zinc-600">Sale active — <span className="text-zinc-900 underline">View plans →</span></span>
               </Link>
             )}
             <LanguageSwitcher />
          </div>

          <div className="w-full max-w-md flex flex-col items-center z-50">
            {/* Logo/Icon */}
            <div className="mb-8">
              <CatPenIcon className="h-20 w-20 animate-slow-bounce" strokeWidth={2} />
            </div>

            {/* Typography */}
            <div className="text-center mb-10">
              <h1 className="text-2xl font-bold tracking-normal text-zinc-900 mb-3">
                {t("Start learning today.")}
              </h1>
              <p className="text-zinc-500 font-regular">
                {t("Try free for 7 days — no commitment, no card.")}
              </p>
            </div>

            {/* Login Buttons */}
            <div className="w-full space-y-3">
               {/* Google Button Wrapper */}
               <button
                disabled={isGoogleLoading}
                className="relative flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-background px-4 text-base font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300"
              >
                {isGoogleLoading ? (
                  <Loader2 className="animate-spin h-5 w-5 text-zinc-900" />
                ) : (
                  <GoogleColoredIcon className="h-6 w-6" />
                )}
                <div className="absolute inset-0 z-10 opacity-0 overflow-hidden flex items-center justify-center">
                  <div className="scale-[2.5] w-full h-full flex items-center justify-center">
                    <GoogleLogin shape="square" onSuccess={signIn} />
                  </div>
                </div>
                {t("Continue with Google")}
              </button>

            </div>

            {/* Badges Checklist */}
            <div className="flex flex-wrap justify-center gap-2 mt-8">
               <Badge text="Free for 7 days" />
               <Badge text="No credit card needed" />
               <Badge text="Cancel anytime" />
            </div>

            <p className="mt-8 text-center text-xs text-zinc-400 font-regular">
              By signing in you agree to our{" "}
              <Link to="/terms" className="underline text-zinc-600">Terms</Link> and{" "}
              <Link to="/privacy" className="underline text-zinc-600">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Onboarding Modal Overlay */}
      {showOnboarding && (
        <OnboardingModal
          isOpen={showOnboarding}
          t={t}
          isFinishing={isFinishing}
          isSuccess={isSuccess}
          onFinish={handleFinishOnboarding}
        />
      )}
    </div>
  );
};

const LoginErrorFallback = () => {
  const { t } = useTranslation();

  return (
    <div className="flex h-screen w-full items-center justify-center">
      {t("Error loading login. Please refresh")}.
    </div>
  );
};


const Badge = ({ text }: { text: string }) => (
  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
    <Check size={12} className="text-green-600" strokeWidth={4} />
    <span className="text-[11px] font-bold text-green-700">{text}</span>
  </div>
);




// 3. Export with Sentry Wrappers
const Login2 = Sentry.withProfiler(
  Sentry.withErrorBoundary(LoginBase, {
    fallback: <LoginErrorFallback />,
  }),
);

export default Login2;
