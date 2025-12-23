import { useUserStore } from "@/store/userStore";
import { redirect } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import SortableGrid from "./sortable-example";
import {
  FolderArchive,
  Loader2Icon,
  LoaderIcon,
  Plus,
  Search,
  SearchX,
  Youtube,
} from "lucide-react";
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
import { AIPromptInput } from "./ai-prompt-textarea";
import Layout from "@/components/layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import CatPenIcon from "./cat-pen-icon";
import debounce from "lodash.debounce";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import * as Sentry from "@sentry/react";
import { usePostHog } from "posthog-js/react";
import { LeitnerCatAnimation } from "./leitner-cat-animation";
import Lottie from "lottie-react";
import searchAnimation from "./search.json";
import youtubeAnimation from "./youtube.json";
import folderAnimation from "./folder.json";

const isNoteInLoadingState = (note: any) => {
  return (
    note.status !== "failed" &&
    note.status !== "transcribed" &&
    note.status !== "draft"
  );
};

const Notes = ({ children }: any) => {
  const posthog = usePostHog();
  const { companyId, isLoggedIn, fullName, email, userId } = useUserStore();
  const [viewMode, setViewMode] = useState<string>("grid");
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useTranslation(); // Translation hook

  const notesQuery = useQuery({
    queryKey: ["notes"],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      return axiosInstance.get(
        API_BASE_URL + `/company/${companyId}/notes/all`
      );
    },
    enabled: !!companyId || isPolling,
    refetchInterval: (query) => {
      const notes = query.state?.data?.data.notes;
      if (!notes || !Array.isArray(notes) || notes.length === 0 || !isPolling) {
        return false;
      }
      const hasLoadingNotes = false; //!!notes.some(isNoteInLoadingState); // TODO fix later in be, some notes never change status
      if (hasLoadingNotes) {
        return 5000; // Poll every 5 seconds if there are loading notes
      } else {
        setIsPolling(false);
        return false;
      }
    },
    throwOnError: (error) => {
      console.error("Get notes error:", error);
      Sentry.captureException(error, {
        tags: { query: "fetch_all_notes" },
        extra: { companyId, email, userId },
      });

      return false;
    },
  });

  useEffect(() => {
    if (isPolling && notesQuery) notesQuery.refetch();
  }, [isPolling]);

  const searchNotesQuery = useQuery({
    queryKey: ["searchNotes", searchQuery],
    queryFn: () => searchNotes(searchQuery),
    enabled: true,
    throwOnError: (error) => {
      console.error("Search error:", error);
      Sentry.captureException(error, {
        tags: { query: "search_notes" },
        extra: { userId, email },
      });
      return false;
    },
  });

  const searchNotes = async (query: string) => {
    try {
      console.log("Searching notes with query:", query);
      return new Promise((resolve) => {
        setTimeout(() => {
          const filteredNotes = (notesQuery.data?.data?.notes || []).filter(
            (note) => note.name.toLowerCase().includes(query.toLowerCase())
          );
          console.log("Filtered Notes:", filteredNotes.length);
          resolve(filteredNotes);
        }, 500);
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { query: "search_notes" },
        extra: { userId, email },
      });
      throw new Error("Failed to search notes");
    }
  };

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
    }, 300),
    []
  );

  // if (!isLoggedIn || !companyId) {
  //   return redirect("/login");
  // }

  return (
    <Layout
      search={debouncedSearch}
      searchValue={searchQuery}
      isSearching={searchNotesQuery.isPending}
    >
      <style>
        {`
          @keyframes gradient-flow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }

           @keyframes draw {
            from { stroke-dashoffset: 1; }
            to { stroke-dashoffset: 0; }
          }
          .animate-draw {
            stroke-dasharray: 1;
            stroke-dashoffset: 1;
            animation: draw 0.8s ease-out forwards;
          }

          /* --- NEW SLOW CAT BOUNCE --- */
          /* Moving 10px up and down smoothly */
          @keyframes slow-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animate-slow-bounce {
            /* 3s duration = Slow speed */
            /* ease-in-out = Smooth "floating" feeling */
            animation: slow-bounce 4s ease-in-out infinite;
          }

        `}
      </style>

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className=" w-full max-w-2xl m-auto mt-8">
            <Alert className="flex items-center justify-between border-none">
              <Avatar className="h-18 w-18 rounded-full  flex items-center mr-2 animate-slow-bounce" >
                <CatPenIcon />
              </Avatar>
              <div className="flex-1 flex-col justify-between gap-1">
                <AlertTitle className="flex-1 text-xl">
                  {t("Learning Experience")}!
                </AlertTitle>
                <AlertDescription className=" text-xl">
                  {t("Hey , do you want to create new note", { fullName })}?
                </AlertDescription>
              </div>
            </Alert>
          </div>
          <div className="px-4 grid w-full gap-x-6 md:grid-cols-2">
            
               <CreateYoutubeNote className="w-4 h-4" component={(
                <Card className="hover:shadow-lg transition-shadow duration-200 bg-card hover:border-black pb-0 w-xs justify-self-end cursor-pointer">
              {/* Subtle background decorative blob */}
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-red-500/5 blur-3xl group-hover:bg-red-500/10 transition-colors" />

              <CardHeader className="pb-4">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/50 p-2 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <Lottie
                    animationData={youtubeAnimation}
                    loop={true}
                    className="w-6 h-6"
                  />
                </div>
                <CardTitle className="text-md tracking-tight text-zinc-600">
                  {t("YouTube")}
                </CardTitle>
                <CardDescription className="leading-normal">
                  {t("For youtube videos (max 2 hours)")}
                </CardDescription>
              </CardHeader>
              </Card>
               )}/>

              {/* <CardContent className="pt-0  border-t">
                <div className="flex items-center justify-between rounded-2xl bg-background/50 p-4 transition-colors group-hover:bg-background">
                  <span className="text-sm font-semibold text-foreground/80">
                    {t("Create Note")}
                  </span>
                    <CreateYoutubeNote className="w-4 h-4" />
                  <div className="rounded-full bg-black p-1.5 text-white shadow-lg shadow-black-500/30 cursor-pointer">
                  </div>
                </div>
              </CardContent> */}
            {/* </Card> */}

            <Card className="hover:shadow-lg transition-shadow duration-200 bg-card hover:border-black pb-0 w-xs justify-self-start cursor-pointer">
              {/* Decorative Organic Glow (Yellow) */}
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/5 blur-3xl group-hover:bg-amber-500/10 transition-colors" />

              <CardHeader className="pb-4">
                {/* Floating Icon Container */}
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/50  shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <Lottie
                    animationData={folderAnimation}
                    loop={true}
                    autoplay={true}
                    className="w-6 h-6"
                  />
                </div>

                <CardTitle className="text-md tracking-tight text-zinc-600">
                  {t("Multi note")}
                </CardTitle>
                <CardDescription className="leading-normal">
                  {t("For audio, text, recording, images")}
                </CardDescription>
              </CardHeader>

              {/* <CardContent className="pt-0 border-t">
                <div className="flex items-center justify-between rounded-2xl bg-background/50 p-4 transition-colors group-hover:bg-background cursor-pointer">
                  <span className="text-sm font-semibold text-foreground/80">
                    {t("Create Folder")}
                  </span>
                  <div className="rounded-full bg-black p-1.5 text-white shadow-lg shadow-black-500/30 cursor-pointer">
                    <Plus className="w-4 h-4" strokeWidth={3} />
                  </div>
                </div>
              </CardContent> */}
            </Card>
          </div>
          <div className="px-4 mt-4 grid gap-x-6 md:grid-cols-1 justify-items-center relative ">
            <AIPromptInput setIsPolling={setIsPolling} />
          </div>
          <div className="sm:flex justify-between p-4 mt-4">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              {t("All notes")}
            </h3>
            <ButtonGroup
              orientation="horizontal"
              aria-label="Media controls"
              className="h-fit border rounded-md"
            >
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => {
                  setViewMode("grid");
                  posthog.capture("notes_view_changed", {
                    userId,
                    email,
                    name: "grid",
                  });
                }}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => {
                  setViewMode("list");
                  posthog.capture("notes_view_changed", {
                    userId,
                    email,
                    name: "list",
                  });
                }}
              >
                <List className="h-4 w-4" />
              </Button>
            </ButtonGroup>
          </div>
          <div className="p-4 relative w-full flex flex-row justify-start">
            <InputGroup>
              {/* <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" /> */}
              <Lottie
                animationData={searchAnimation}
                loop={true}
                autoplay={true}
                //style={{ width: '20px' }}
                className=" absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform"
              />

              <InputGroupInput
                placeholder={t("Search notes...")}
                value={searchQuery}
                onChange={(e) => {
                  posthog.capture("note_searched", {
                    userId,
                    email,
                    name: e.target.value,
                  });
                  setSearchQuery(e.target.value);
                  debouncedSearch(e.target.value);
                }}
                className="pl-10 w-2xl z-30"
              />
              {searchNotesQuery.isPending ? (
                <InputGroupAddon align="inline-end">
                  <Loader2Icon className="animate-spin text-pink-500" />
                </InputGroupAddon>
              ) : (
                <div className="w-[28px]" />
              )}
            </InputGroup>
          </div>
          <div
            className={
              viewMode === "grid"
                ? "xs:grid-cols-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            }
          >
            {searchQuery && searchNotesQuery.isPending ? (
              <div className="max-w-4xl flex  flex-row justify-center m-auto mt-8 mb-8">
                <LoaderIcon
                  role="status"
                  aria-label="Loading"
                  className={cn("size-8 animate-spin ")}
                />
              </div>
            ) : searchQuery &&
              searchNotesQuery.isFetched &&
              searchNotesQuery.data?.length === 0 ? (
              <div className="flex flex-col items-center mt-8 mb-8">
                <SearchX className="text-muted-foreground" size={70} />
                <h2 className="scroll-m-20  pb-2 text-3xl font-semibold text-muted-foreground mt-4">
                  {t("No results found")}
                </h2>
              </div>
            ) : (
              <SortableGrid
                data={
                  searchQuery
                    ? searchNotesQuery.data || []
                    : notesQuery?.data?.data?.notes
                }
                view={viewMode}
                setView={setViewMode}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Notes;
