import { useUserStore } from "@/store/userStore";
import { redirect } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import SortableGrid from "./sortable-example";
import { CircleAlert, FolderArchive, Plus, Youtube } from "lucide-react";

import { Grid3X3, List } from "lucide-react";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CreateYoutubeNote from "./create-youtube-note";
import CreateMultiNote from "./create-multi-note";
import { AIPromptInput } from "./ai-prompt-textarea";
import Layout from "@/components/layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import CatLogo from "@/note-detail/cat-logo";
import CatPenIcon from "./cat-pen-icon";

const isNoteInLoadingState = (note: any) => {
  return (
    note.status !== "failed" &&
    note.status !== "transcribed" &&
    note.status !== "draft"
  );
};

const Notes = ({ children }: any) => {
  const { companyId, isLoggedIn, fullName } = useUserStore();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<string>("grid");

  useEffect(() => {
    console.log("viewMode", viewMode);
  }, [viewMode])

  
  const notesQuery = useQuery({
    queryKey: ["notes"],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    queryFn: async () => {
      return axiosInstance.get(
        API_BASE_URL + `/company/${companyId}/notes/all`
      );
    },
    enabled: !!companyId,
    refetchInterval: (data) => {
      const notes = data?.data?.notes;
      if (!notes || !Array.isArray(notes) || notes.length === 0) {
        return false;
      }
      const hasLoadingNotes = notes.some(isNoteInLoadingState);
      return hasLoadingNotes ? 5000 : false; // Poll every 5 seconds if there are loading notes
    },
    throwOnError: (error) => {
      console.error("Get notes error:", error);
      return false;
    },
  });

  // const searchNotesQuery = useQuery({
  //   queryKey: ["searchNotes", searchQuery],
  //   queryFn: () => searchNotes(searchQuery),
  //   enabled: true,
  //   throwOnError: (error) => {
  //     console.error("Search error:", error);
  //     return false;
  //   },
  // });

  // const debouncedSearch = useCallback(
  //   debounce((value: string) => {
  //     setSearchQuery(value);
  //   }, 300),
  //   []
  // );

  // const onRefresh = useCallback(() => {
  //   notesQuery.refetch();
  //   if (searchNotesQuery) {
  //     queryClient.invalidateQueries(["searchNotes"]);
  //   }
  // }, [notesQuery, searchQuery, queryClient]);

  // const getIcon = (noteType: string) => {
  //   switch (noteType) {
  //     case "text":
  //     case "audio":
  //       return "mic-outline";
  //     case "image":
  //       return "image-outline";
  //     case "pdf":
  //       return "document-text-outline";
  //     case "youtube":
  //       return "logo-youtube";
  //     case "test":
  //       return "school-outline";
  //     case "multi":
  //       return "layers-outline";
  //     default:
  //       return "document-outline";
  //   }
  // };

  if (!isLoggedIn || !companyId) {
    return redirect("/login");
  }

  return (
    <Layout>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className=" w-full max-w-2xl m-auto mt-8">
             <Alert className="flex items-center justify-between border-none">
              <Avatar className="h-16 w-16 rounded-md bg-gray-950 flex items-center mr-2">
                {/* <CatLogo /> */}
                <CatPenIcon />
              </Avatar>
              <div className="flex-1 flex-col justify-between gap-1">
                <AlertTitle className="flex-1 text-xl">Learning Experience!</AlertTitle>
                <AlertDescription className=" text-xl">
                  {" "}
               {`Hey ${fullName}, do you want to create new note?`}
                </AlertDescription>
              </div>
            </Alert>

            {/* <p className="text-muted-foreground text-2xl tracking-tight">
              {`Hey ${fullName}, do you want to create new note?`}
            </p> */}
            {/* <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                Create new
                </h3> */}
          </div>
          <div className="px-4 grid w-full gap-x-6 md:grid-cols-2">
            <Card className=" hover:shadow-lg transition-shadow duration-200 bg-card border-border pb-0 w-xs justify-self-end">
              <CardHeader>
                <CardTitle>
                  <Youtube fill="oklch(63.7% 0.237 25.331)" />
                </CardTitle>
                <CardDescription>
                  For youtube videos (max 2 hours)
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col h-full border-t py-3 cursor-pointer">
                <p className="flex justify-between items-center text-link hover:underline font-medium group transition-colors duration-200">
                  Youtube
                  <CreateYoutubeNote />
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow duration-200 bg-card border-border pb-0 w-xs justify-self-start">
              <CardHeader>
                <CardTitle>
                  <FolderArchive fill="oklch(94.5% 0.129 101.54)" />
                </CardTitle>
                <CardDescription>
                  For audio, text, recording, images
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col h-full border-t py-3 cursor-pointer">
                <p className="flex justify-between items-center text-link hover:underline font-medium group transition-colors duration-200">
                  Multi note
                  {/* <CreateMultiNote /> */}
                    <Plus className="mr-2 h-4 w-4" />
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="px-4 mt-4 grid gap-x-6 md:grid-cols-1 justify-items-center relative ">
            <AIPromptInput />
          </div>
          {/* <img src="./adaptive-icon.png" />  */}
          <div className="sm:flex justify-between p-4 mt-4">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              All notes
            </h3>
            <ButtonGroup
              orientation="horizontal"
              aria-label="Media controls"
              className="h-fit"
            >
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </ButtonGroup>
          </div>
          <div
            className={
              viewMode === "grid"
                   ? "xs:grid-cols-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            }
          >
            <SortableGrid
              data={notesQuery?.data?.data?.notes}
              view={viewMode}
              setView={setViewMode}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Notes;
