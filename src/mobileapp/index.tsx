import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";
import { Download, Cloud, Bell, Mic } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";
import CatPenIcon from "@/notes/assets/cat-pen-icon";

const MobileApp = () => {
  const { t } = useTranslation();
  const posthog = usePostHog();

  useEffect(() => {
    posthog.capture("mobile_app_page_viewed");
  }, [posthog]);

  const appStoreUrl =
    "https://apps.apple.com/us/app/leitner-ai-note-quiz-alerts/id6747087851";

  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto">
      <div className="w-full max-w-5xl px-6 py-10">
        {/* Hero Section */}
        <div className="relative flex flex-col lg:flex-row items-center gap-10 mb-16">
          {/* Left: Text + CTA */}
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
            <CatPenIcon className="h-14 w-14" />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
              {t("Get Bycat AI on iOS")}
            </h1>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-md">
              {t(
                "Your AI-powered study companion. Notes, quizzes, flashcards, and quiz alerts — all in your pocket."
              )}
            </p>
            <p className="text-sm italic text-zinc-400 dark:text-zinc-500 max-w-md">
              *{t("Quiz alerts require the mobile app. Enable alerts on the web, then download the app to receive push notifications on your device.")}
            </p>

            <a
              href={appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-7 py-3.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              onClick={() => {
                posthog.capture("mobile_app_download_clicked", {
                  destination: "app_store",
                  url: appStoreUrl,
                });
              }}
            >
              <Download className="h-5 w-5" />
              {t("Download on the App Store")}
            </a>

            {/* QR Code - compact */}
            <div className="flex items-center gap-4 mt-2">
              <div className="bg-white p-3 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-700">
                <QRCode
                  value={appStoreUrl}
                  size={80}
                  style={{
                    height: "auto",
                    maxWidth: "100%",
                    width: "100%",
                  }}
                  viewBox={`0 0 80 80`}
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-[140px] leading-snug">
                {t("Scan with your iPhone camera to download")}
              </p>
            </div>
          </div>

          {/* Right: App Screenshots */}
          <div className="relative flex items-end justify-center gap-4 flex-shrink-0">
            <div className="relative z-10 rounded-[2rem] overflow-hidden shadow-2xl border-2 border-zinc-800 dark:border-zinc-600 w-[200px] sm:w-[220px]">
              <img
                src="/iPhone 16 HomeMarketv5.png"
                alt="Bycat AI - All Notes"
                className="w-full h-auto"
              />
            </div>
            <div className="relative -ml-6 rounded-[2rem] overflow-hidden shadow-2xl border-2 border-zinc-800 dark:border-zinc-600 w-[200px] sm:w-[220px] translate-y-6">
              <img
                src="/iPhone 16 Note Details.png"
                alt="Bycat AI - Note Details"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>

        {/* Features - modern pill/glass style */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 dark:from-violet-500/20 dark:to-violet-500/5 border border-violet-500/20 p-6 transition-all hover:scale-[1.02] hover:shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-500/15 dark:bg-violet-500/25">
                <Cloud className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                {t("Cloud Sync")}
              </h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t(
                "Seamless sync across all devices. Start on web, continue on mobile — your notes are always up to date."
              )}
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 dark:from-amber-500/20 dark:to-amber-500/5 border border-amber-500/20 p-6 transition-all hover:scale-[1.02] hover:shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/15 dark:bg-amber-500/25">
                <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                {t("Smart Alerts")}
              </h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t(
                "Personalized quiz reminders timed to your learning schedule. Never miss the optimal review window."
              )}
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 dark:from-emerald-500/20 dark:to-emerald-500/5 border border-emerald-500/20 p-6 transition-all hover:scale-[1.02] hover:shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/25">
                <Mic className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                {t("Live AI Talk")}
              </h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t(
                "Speak to your notes. Ask questions, get explanations, and study hands-free with real-time AI conversation."
              )}
            </p>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 mt-10">
          {t("Available for iPhone and iPad")}
        </p>
      </div>
    </div>
  );
};

export default MobileApp;
