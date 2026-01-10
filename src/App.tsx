import { Suspense } from "react";
import "./App.css";
import Notes from "./notes";
import Login from "./login";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigate, Route, Routes } from "react-router";
import { Toaster } from "sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import NoteDetail from "./note-detail";
import PricingPage from "./prices";
import { ProtectedRoute, PublicRoute } from "./components/protected-route";
import Alerts from "./alerts";
import Folders from "./folders";
import MobileApp from "./mobileapp";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // default: true
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <Suspense
            fallback={
              <div className="flex h-screen items-center justify-center">
                Loading...
              </div>
            }
          >
            <Routes>
              {/* --- PUBLIC ROUTES (Only accessible if NOT logged in) --- */}
              <Route element={<PublicRoute />}>
                <Route path="/" element={<Login />} />
              </Route>

              {/* --- PROTECTED ROUTES (Only accessible if logged in) --- */}
              <Route element={<ProtectedRoute />}>
                <Route path="/notes" element={<Notes />} />
                <Route path="/notes/:noteId" element={<NoteDetail />} />
                <Route path="/price-page" element={<PricingPage />} />
                <Route path="/alerts" element={<Alerts />} />
                 <Route path="/folders" element={<Folders />} />
                <Route path="/app" element={<MobileApp />} />
              </Route>

              {/* --- CATCH ALL (404) --- */}
              {/* Redirect unknown URLs to home/login */}
              {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
            </Routes>
          </Suspense>
          <Toaster />
        </GoogleOAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
