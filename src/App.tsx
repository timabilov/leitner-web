import { Suspense, useEffect } from "react";
import "./App.css";
import Notes from "./notes";
import Login from "./login";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Navigate, Route, Routes } from "react-router";
import { Toaster } from "sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import NoteDetail from "./note-detail";
import PricingPage from "./prices";
import { ProtectedRoute, PublicRoute } from "./components/protected-route";
import Alerts from "./alerts";
import Folders from "./folders";
import MobileApp from "./mobileapp";
import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "./store/userStore";
import { axiosInstance } from "./services/auth";
import { API_BASE_URL } from "./services/config";



function App() {
  const { companyId, userId, setFolders, setAllNotesCount} = useUserStore();

      // --- DATA FETCHING ---
    const { data:foldersData, isLoading } = useQuery({
      queryKey: ["folders", companyId],
      enabled: !!userId && !!companyId,
      queryFn:  () =>  axiosInstance.get(`${API_BASE_URL}/company/${companyId}/notes/folder`),
    });


    useEffect(() => {
      console.log("data is", foldersData?.data?.folders)
      if (foldersData?.data?.folders?.length){
        setFolders(foldersData?.data.folders)
        setAllNotesCount(foldersData?.data?.total_notes_count)
      }
    }, [foldersData]);






  return (
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
  );
}

export default App;
