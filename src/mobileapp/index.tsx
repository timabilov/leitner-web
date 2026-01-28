import Layout from "@/components/layout";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";
import { Smartphone, Download } from "lucide-react";

const MobileApp = () => {
  const { t } = useTranslation();
  const appStoreUrl =
    "https://apps.apple.com/us/app/leitner-ai-note-quiz-alerts/id6747087851";

  return (
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          {/* Header Section */}
          <div className="flex flex-col items-center text-center mb-12">
            <div className="mb-6 p-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <Smartphone className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
              {t("Get Leitner AI on iOS")}
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-md">
              {t(
                "Take your smart notes and learning on the go. Download the Leitner AI mobile app and study anywhere, anytime."
              )}
            </p>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-white p-8 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
              <QRCode
                value={appStoreUrl}
                size={280}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 280 280`}
                fgColor="#000000"
                bgColor="#ffffff"
              />
            </div>
            <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-500 text-center">
              {t("Scan with your iPhone camera to download")}
            </p>
          </div>

          {/* Download Button */}
          <div className="flex flex-col items-center gap-4">
            <a
              href={appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Download className="h-5 w-5" />
              {t("Download on the App Store")}
            </a>
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              {t("Available for iPhone and iPad")}
            </p>
          </div>

          {/* Features List */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                {t("Mobile First")}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t("Optimized for iOS with native performance")}
              </p>
            </div>
            <div className="text-center p-6 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-3xl mb-3">🔔</div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                {t("Smart Alerts")}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t("Get personalized quiz reminders")}
              </p>
            </div>
            <div className="text-center p-6 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-3xl mb-3">☁️</div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                {t("Cloud Sync")}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t("Seamless sync across all devices")}
              </p>
            </div>
          </div>
        </div>
      </div>
  );
};

export default MobileApp;
