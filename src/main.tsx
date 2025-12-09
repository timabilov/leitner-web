import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from "react-router-dom";
import './i18n'; // Import the i18next configuration
import { useTranslation } from "react-i18next";
import { AlertTriangle, RefreshCcw, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from "react-router-dom";

// 1. Import Sentry
import * as Sentry from "@sentry/react";


Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1, // Sample rate for all sessions (10%)
  replaysOnErrorSampleRate: 1.0,
  environment: import.meta.env.MODE,
  debug: false, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
  integrations: [
     Sentry.reactRouterV6BrowserTracingIntegration({
      useEffect: React.useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
  ]
  // enabled: ! import.meta.env.MODE.DEV,
});



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={ErrorFallback} onReset={() => window.location.reload()}>
      <BrowserRouter>
          <App />
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </StrictMode>
)


interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  eventId: string | null;
}

export default function ErrorFallback({ resetError, eventId }: ErrorFallbackProps) {
  const { t } = useTranslation();

  const handleReportFeedback = () => {
    if (eventId) {
      Sentry.showReportDialog({ eventId });
    }
  };

  return (
    <div className="flex min-h-[400px] w-full items-center justify-center p-6">
      <Card className="w-full max-w-md border-red-100 shadow-lg">
        <CardHeader className="flex flex-col items-center gap-2 pb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-bold text-neutral-900 text-center">
            {t("Something went wrong")}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-neutral-500">
            {t("We apologize for the inconvenience. The error has been logged and we are working on a fix.")}
          </p>

          {/* Technical Error Details (Collapsible or Small) */}
          {/* <div className="rounded-lg bg-neutral-50 p-3 text-left">
            <p className="font-mono text-xs text-red-600 break-words line-clamp-4">
              {error.message || t("Unknown error occurred")}
            </p>
            {eventId && (
              <p className="mt-1 text-[10px] text-neutral-400 font-mono">
                Event ID: {eventId}
              </p>
            )}
          </div> */}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 sm:flex-row justify-center">
          <Button 
            onClick={resetError} 
            className="w-full sm:w-auto bg-neutral-900 hover:bg-neutral-800"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            {t("Try Again")}
          </Button>

          {eventId && (
            <Button 
              variant="outline" 
              onClick={handleReportFeedback}
              className="w-full sm:w-auto"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              {t("Report Feedback")}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}