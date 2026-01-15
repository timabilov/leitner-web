import { useUserStore } from "@/store/userStore";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Folder, Folders, Loader2Icon, Search, SearchX } from "lucide-react";
import { Grid3X3, List } from "lucide-react";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CreateYoutubeNote from "./create-youtube-note";
import { AIPromptInput } from "./ai-prompt-textarea";
import Layout from "@/components/layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import CatPenIcon from "./assets/cat-pen-icon";
import debounce from "lodash.debounce";
import { useTranslation } from "react-i18next";
import * as Sentry from "@sentry/react";
import { usePostHog } from "posthog-js/react";
import Lottie from "lottie-react";
import youtubeAnimation from "./assets/youtube.json";
import folderAnimation from "./assets/folder.json";
import { AnimatePresence, motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { NoteCard } from "./note-card";
import { cn } from "@/lib/utils";

const isNoteInLoadingState = (note: any) => {
  return (
    note.status !== "failed" &&
    note.status !== "transcribed" &&
    note.status !== "draft"
  );
};

const Notes = ({ children }: any) => {
  const posthog = usePostHog();
  // 2. Create the Ref
  const notesListRef = useRef<HTMLDivElement>(null);
  const { companyId, isLoggedIn, fullName, email, userId, selectedFolder } =
    useUserStore();

  const [viewMode, setViewMode] = useState<string>("grid");
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  const [processingNotes, setProcessingNotes] = useState(0);
  const [loadingNoteIds, setProcessingNoteIds] = useState<number[]>([]);

  const { t } = useTranslation(); // Translation hook

  // 3. Create the Scroll Handler
  const scrollToNotes = () => {
    if (notesListRef.current) {
      notesListRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const notesQuery = useQuery({
    queryKey: ["notes", selectedFolder?.id],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      return axiosInstance.get(
        API_BASE_URL +
          `/company/${companyId}/notes/all${
            selectedFolder ? `?folder_id=${selectedFolder?.id}` : ""
          }`
      );
    },
    enabled: !!userId || isPolling,
    refetchInterval: (query) => {
      const notes = query.state?.data?.data.notes;
      if (!notes || !Array.isArray(notes) || notes.length === 0) {
        return false;
      }
      const loadingNotes = notes.filter(isNoteInLoadingState) || []; // TODO fix later in be, some notes never change status
      const loadingNotesCount = loadingNotes?.length;
      if (loadingNotesCount > 0) {
        setProcessingNotes(loadingNotesCount);
        setProcessingNoteIds(loadingNotes);
        return 3000; // Poll every 5 seconds if there are loading notes
      } else {
        setProcessingNotes(0);
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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [
      ...prev,
      ...acceptedFiles.map((f) =>
        Object.assign(f, { preview: URL.createObjectURL(f) })
      ),
    ]);
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open: openFilePicker,
  } = useDropzone({
    onDrop,
    noClick: true,
    accept: { "image/*": [], "application/pdf": [], "audio/*": [] },
  });

  return (
    <Layout
      search={debouncedSearch}
      searchValue={searchQuery}
      isSearching={searchNotesQuery.isPending}
      processingNotes={processingNotes}
      onProcessingClick={scrollToNotes}
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
            <Alert className="flex items-center justify-between border-none bg-transparent">
              <Avatar className="h-18 w-18 rounded-full  flex items-center mr-2 animate-slow-bounce">
                <CatPenIcon size={58} />
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
          {/* 2. ACTION CARDS SECTION - 1 col on mobile, 2 col on sm+ */}
          <div className="px-4 grid grid-cols-1 sm:grid-cols-4  md:grid-cols-2 w-full gap-4 max-w-4xl mx-auto md:justify-items-center">
            <CreateYoutubeNote
              refetch={notesQuery.refetch}
              className="w-4 h-4"
              component={
                <Card className="sm:col-span-full md:max-w-[330px] md:col-span-1 md:justify-self-end bg-white z-40 hover:shadow-lg transition-all duration-300 hover:border-black w-full cursor-pointer relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-red-500/5 blur-3xl group-hover:bg-red-500/10 transition-colors" />
                  <CardHeader className="p-4 sm:p-6 pb-4">
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 p-2 shadow-inner transition-transform duration-500 group-hover:scale-110">
                      <Lottie
                        animationData={youtubeAnimation}
                        loop={true}
                        className="w-6 h-6"
                      />
                    </div>
                    <CardTitle className="text-sm sm:text-md font-bold tracking-tight text-zinc-600">
                      {t("YouTube")}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm leading-tight">
                      {t("For youtube videos (max 2 hours)")}
                    </CardDescription>
                  </CardHeader>
                </Card>
              }
            />

            <Card
              onClick={openFilePicker}
              className="sm:col-span-full md:max-w-[330px] md:col-span-1 md:justify-self-start bg-white z-40 hover:shadow-lg transition-all duration-300 hover:border-black w-full cursor-pointer relative overflow-hidden group"
            >
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/5 blur-3xl group-hover:bg-amber-500/10 transition-colors" />
              <CardHeader className="p-4 sm:p-6 pb-4">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 shadow-inner transition-transform duration-500 group-hover:scale-110">
                  <Lottie
                    animationData={folderAnimation}
                    loop={true}
                    autoplay={true}
                    className="w-6 h-6"
                  />
                </div>
                <CardTitle className="text-sm sm:text-md font-bold tracking-tight text-zinc-600">
                  {t("Multi note")}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm leading-tight">
                  {t("For audio, text, recording, images")}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="px-4 mt-4 grid gap-x-6 md:grid-cols-1 justify-items-center relative ">
            <AIPromptInput
              setIsPolling={setIsPolling}
              files={files}
              setFiles={setFiles}
              openFilePicker={openFilePicker}
              getInputProps={getInputProps}
              getRootProps={getRootProps}
              isDragActive={isDragActive}
              refetch={notesQuery.refetch}
            />
          </div>
          <div className="sm:flex justify-between p-4 mt-4">
            <h3
              className="scroll-m-20 text-2xl font-semibold tracking-tight flex items-center"
              ref={notesListRef}
            >
              {selectedFolder ? (
                <Folder className="h-5 w-5 mr-2" />
              ) : (
                <Folders className="h-5 w-5 mr-2" />
              )}
              {selectedFolder ? selectedFolder?.name : t("All notes")}
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
          {/* ADAPTED SEARCH BLOCK */}
          <div className="px-4 relative w-full flex flex-row justify-start mb-6 group">
            {/* Organic Glow to match AIPromptInput */}
            <div className="absolute -left-4 -top-4 h-24  rounded-full bg-pink-500/5 blur-3xl group-hover:bg-pink-500/10 transition-all pointer-events-none" />

            <div className="relative w-full max-w-full overflow-hidden rounded-xl border bg-white transition-all duration-300 hover:border-black hover:shadow-lg focus-within:border-black focus-within:shadow-lg">
              <div className="flex items-center px-3 py-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/40 mr-2">
                  <Search className="w-4 h-4" />
                </div>

                <input
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
                  className="flex-1 w-full bg-transparent border-none focus:ring-0 text-base py-1 outline-none placeholder:text-muted-foreground/50 font-medium"
                />

                <AnimatePresence>
                  {searchNotesQuery.isPending && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="pr-2"
                    >
                      <Loader2Icon className="animate-spin text-pink-500 h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div
            className={
              viewMode === "grid"
                ? "xs:grid-cols-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            }
          >
            {searchQuery && searchNotesQuery.isPending ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                </div>
                <p className="mt-4 text-slate-400 font-medium animate-pulse">
                  {t("Searching your library...")}
                </p>
              </div>
            ) : searchQuery &&
              searchNotesQuery.isFetched &&
              searchNotesQuery.data?.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                <SearchX
                  className="text-slate-300"
                  size={60}
                  strokeWidth={1.5}
                />
                <h2 className="text-xl font-bold text-slate-400 mt-4 tracking-tight">
                  {t("No results found")}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  {t("Try adjusting your keywords or filters")}
                </p>
              </div>
            ) : (
              <div
                className={cn(
                  "w-full p-4 grid gap-4",
                  viewMode === "grid"
                    ? "sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3"
                    : "grid-cols-1"
                )}
              >
                {(searchQuery
                  ? searchNotesQuery?.data || []
                  : notesQuery?.data?.data?.notes || []
                ).map((item) => (
                  <NoteCard key={item.id} item={item} view={viewMode} />
                ))}
              </div>
            )}

            <input {...getInputProps()} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Notes;
