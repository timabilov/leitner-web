import { useUserStore } from "@/store/userStore";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import {
  Bell,
  CircleAlert,
} from "lucide-react";
import Layout from "@/components/layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import * as Sentry from "@sentry/react";
import SortableGrid from "@/notes/sortable-example";
import CatLogo from "@/note-detail/assets/cat-logo";


const Alerts = ({ children }: any) => {
  // 2. Create the Ref
  const { companyId,  email, userId } = useUserStore();

  const { t } = useTranslation(); // Translation hook

  const notesQuery = useQuery({
    queryKey: ["notes"],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      return axiosInstance.get(
        API_BASE_URL + `/company/${companyId}/notes/alerts`
      );
    },
    enabled: !!userId,
    throwOnError: (error) => {
      console.error("Get notes error:", error);
      Sentry.captureException(error, {
        tags: { query: "fetch_all_notes" },
        extra: { companyId, email, userId },
      });

      return false;
    },
  });

  return (
    <Layout>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col ">
          <div className=" w-full">
            <div className="col-span-12 px-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <span className="p-2  rounded-xl">
                <Bell className="w-6 h-6" />
              </span>
              <span> {t("Library")}</span>
             
            </h1>
            <p className="text-muted-foreground">
              {t("Organize your learning materials into collections.")}
            </p>
          </div>

              <Alert className="flex items-center justify-between mt-2">
                <Avatar className="rounded-md bg-gray-950 flex items-center">
                  <CatLogo />
                </Avatar>
                <div className="flex-1 flex-col justify-center gap-1">
                  <AlertTitle className="flex-1">
                    {t("Smart Reminders Active")}
                  </AlertTitle>
                  <AlertDescription>
                    {t(
                      "Showing only notes with enabled alerts. You will receive personalized quizzes for these items based on your learning curve."
                    )}
                  </AlertDescription>
                </div>
                <CircleAlert />
              </Alert>
            </div>
          </div>

          {/* ADAPTED SEARCH BLOCK */}

          <div
            className={
              "xs:grid-cols-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
            }
          >
            <SortableGrid data={notesQuery?.data?.data?.notes} view={"grid"} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Alerts;
