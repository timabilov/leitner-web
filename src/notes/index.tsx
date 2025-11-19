import { useUserStore } from "@/store/userStore";
import { redirect } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import SortableGrid from "./sortable-example";
import { FolderArchive, LoaderIcon, Plus, SearchX, Youtube } from "lucide-react";
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
import debounce from 'lodash.debounce';
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';

const isNoteInLoadingState = (note: any) => {
  return (
    note.status !== "failed" &&
    note.status !== "transcribed" &&
    note.status !== "draft"
  );
};

const Notes = ({ children }: any) => {
  const { companyId, isLoggedIn, fullName } = useUserStore();
  const [viewMode, setViewMode] = useState<string>("grid");
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
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
      const notes =  query.state?.data?.data.notes;
      if ((!notes || !Array.isArray(notes) || notes.length === 0) || !isPolling) {
        return false;
      }
      const hasLoadingNotes = !!notes.some(isNoteInLoadingState);
      if (hasLoadingNotes){
        return 5000; // Poll every 5 seconds if there are loading notes
      }
      else {
        setIsPolling(false);
        return false;
      }

    },
    throwOnError: (error) => {
      console.error("Get notes error:", error);
      return false;
    },
  });



    useEffect(() => {
    if (isPolling) notesQuery.refetch();
  }, [isPolling, notesQuery]);


  const searchNotesQuery = useQuery({
    queryKey: ["searchNotes", searchQuery],
    queryFn: () => searchNotes(searchQuery),
    enabled: true,
    throwOnError: (error) => {
      console.error("Search error:", error);
      return false;
    },
  });

   const searchNotes = async (query: string) => {
    try {
      console.log('Searching notes with query:', query);
      return new Promise((resolve) => {
        setTimeout(() => {
          const filteredNotes = (notesQuery.data?.data?.notes || []).filter(note =>
            note.name.toLowerCase().includes(query.toLowerCase())
          );
          console.log('Filtered Notes:', filteredNotes.length);
          resolve(filteredNotes);
        }, 500);
      });
    } catch (error) {
      throw new Error('Failed to search notes');
    }
  };

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
    }, 300),
    []
  );

  if (!isLoggedIn || !companyId) {
    return redirect("/login");
  }

  return (
    <Layout search={debouncedSearch} searchValue={searchQuery} isSearching={searchNotesQuery.isPending} >
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className=" w-full max-w-2xl m-auto mt-8">
             <Alert className="flex items-center justify-between border-none">
              <Avatar className="h-16 w-16 rounded-md bg-gray-950 flex items-center mr-2">
                <CatPenIcon />
              </Avatar>
              <div className="flex-1 flex-col justify-between gap-1">
                <AlertTitle className="flex-1 text-xl">{t("Learning Experience")}!</AlertTitle>
                <AlertDescription className=" text-xl">
                  {t('Hey , do you want to create new note', { fullName })}?
                </AlertDescription>
              </div>
            </Alert>
          </div>
          <div className="px-4 grid w-full gap-x-6 md:grid-cols-2">
            <Card className=" hover:shadow-lg transition-shadow duration-200 bg-card border-border pb-0 w-xs justify-self-end">
              <CardHeader>
                <CardTitle>
                  <Youtube fill="oklch(63.7% 0.237 25.331)" />
                </CardTitle>
                <CardDescription>
                  {t("For youtube videos (max 2 hours)")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col h-full border-t py-3 cursor-pointer">
                <p className="flex justify-between items-center text-link hover:underline font-medium group transition-colors duration-200">
                  {t("Youtube")}
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
                  {t("For audio, text, recording, images")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col h-full border-t py-3 cursor-pointer">
                <p className="flex justify-between items-center text-link hover:underline font-medium group transition-colors duration-200">
                  {t("Multi note")}
                    <Plus className="mr-2 h-4 w-4" />
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="px-4 mt-4 grid gap-x-6 md:grid-cols-1 justify-items-center relative ">
            <AIPromptInput setIsPolling={setIsPolling}/>
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
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
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
            {
              searchQuery && searchNotesQuery.isPending ? (
                <div className="max-w-4xl flex  flex-row justify-center m-auto mt-8 mb-8">
                  <LoaderIcon
                      role="status"
                      aria-label="Loading"
                      className={cn("size-8 animate-spin ")}
                    />
                </div>
              ) :
              searchQuery && searchNotesQuery.isFetched && searchNotesQuery.data?.length === 0 ? (
                <div className="flex flex-col items-center mt-8 mb-8">
                  <SearchX className="text-muted-foreground" size={70}/>
                  <h2 className="scroll-m-20  pb-2 text-3xl font-semibold text-muted-foreground mt-4">
                    {t("No results found")}
                  </h2>
                </div>

              ) : (
                <SortableGrid
                  data={searchQuery ? (searchNotesQuery.data || []) :notesQuery?.data?.data?.notes}
                  view={viewMode}
                  setView={setViewMode}
                />
              )
            }
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Notes;