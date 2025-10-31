import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { useUserStore } from "@/store/userStore";
import { redirect } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import React, { useCallback, useState } from "react";
import debounce from "lodash.debounce";
import { IconCirclePlusFilled } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import SortableGrid from "./sortable-example";
import {
  FolderArchive,
  FoldHorizontal,
  Paperclip,
  Plus,
  Search,
  Youtube,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Select from "@/notes/select";
import CreateFolder from "./create-folder";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Grid3X3, List, Heart, Star, ShoppingCart, Filter } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Header from "./header";
import { Tabs, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CreateYoutubeNote from "./create-youtube-note";
import { toast } from "sonner";
import CreateMultiNote from "./create-multi-note";
import { AIPromptInput } from "./ai-prompt-textarea";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipPortal, TooltipProvider } from "@/components/ui/tooltip";

const isNoteInLoadingState = (note: any) => {
  return (
    note.status !== "failed" &&
    note.status !== "transcribed" &&
    note.status !== "draft"
  );
};

const Notes = ({ children }: any) => {
  const { companyId, userId, email, isLoggedIn, photo, fullName } =
    useUserStore();
  const shortName = `${fullName.split(" ")[0][0]}${
    fullName.split(" ")[1][0]
  }`?.toLowerCase();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const setSelectedFolder = useUserStore((store) => store.setSelectedFolder);
  const selectedFolder = useUserStore((store) => store.selectedFolder);
  const [viewMode, setViewMode] = useState<string>("grid");

  const { data: foldersQuery, isLoading: isLoadingFolders } = useQuery({
    queryKey: ["folders"],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    queryFn: async () => {
      return axiosInstance.get(
        API_BASE_URL + `/company/${companyId}/notes/folder`
      );
    },
    enabled: !!companyId,
    onError: (error) => {
      console.error("Get folders error:", error);
    },
    onSuccess: (response) => {
      console.log("response is1", response.data);
    },
  });

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
    onError: (error) => {
      console.error("Get notes error:", error);
    },
  });

  const searchNotesQuery = useQuery({
    queryKey: ["searchNotes", searchQuery],
    queryFn: () => searchNotes(searchQuery),
    enabled: true,
    onError: (error) => {
      console.error("Search error:", error);
    },
  });

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
    }, 300),
    []
  );

  const onRefresh = useCallback(() => {
    notesQuery.refetch();
    if (searchNotesQuery) {
      queryClient.invalidateQueries(["searchNotes"]);
    }
  }, [notesQuery, searchQuery, queryClient]);

  const getIcon = (noteType: string) => {
    switch (noteType) {
      case "text":
      case "audio":
        return "mic-outline";
      case "image":
        return "image-outline";
      case "pdf":
        return "document-text-outline";
      case "youtube":
        return "logo-youtube";
      case "test":
        return "school-outline";
      case "multi":
        return "layers-outline";
      default:
        return "document-outline";
    }
  };

  if (!isLoggedIn || !companyId) {
    return redirect("/login");
  }

  const renderNoteItem = ({ item }: { item: Note }) => {
    const isDraft = item.status === "draft";
    const isItemProcessing = isNoteInLoadingState(item);
    const created_at = new Date(item.created_at);
    const formattedDate = created_at.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    return <div>{item.name}</div>;
  };

  const onCreateNewNote = () => {
    // For now, just show an alert. Later you can implement note creation
    alert("Note creation will be implemented next");
  };

  return (
    <>
        <SidebarProvider
        className=" h-full min-h-auto"
        style={
            {
            "--sidebar-width": "calc(var(--spacing) * 64)",
            } as React.CSSProperties
        }
        >
          <AppSidebar variant="sidebar" /> 
        <SidebarInset className="relative overflow-visible"> 
            <Header
            photo={photo}
            shortName={shortName}
            selectedFolder={selectedFolder}
            setSelectedFolder={setSelectedFolder}
            foldersList={foldersQuery?.data?.folders}
            />
            <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className=" sm:flex p-4 mt-4 flex-row justify-center ">
                    <p className="text-muted-foreground text-2xl tracking-tight">
                    {`Hey ${fullName}, do you want to create new note?`}
                    </p>
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
                        <FolderArchive fill="oklch(94.5% 0.129 101.54)"/>
                    </CardTitle>
                    <CardDescription>
                        For audio, text, recording, images
                    </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col h-full border-t py-3 cursor-pointer">
                    <p className="flex justify-between items-center text-link hover:underline font-medium group transition-colors duration-200">
                        Multi note
                        <CreateMultiNote />
                    </p>
                    </CardContent>
                </Card>
                </div>
                <div className="px-4 mt-4 grid gap-x-6 md:grid-cols-1 justify-items-center relative ">
                        {/* <Search className="text-muted-foreground absolute top-1/2 h-4 w-4 -translate-y-1/2 transform" /> */}
                        {/* <Input
                            placeholder="Search notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 max-w-2xl"
                        /> */}
                            <AIPromptInput />

                </div>
                {/* <img src="./adaptive-icon.png" />  */}
                <div className="hidden sm:flex justify-between p-4 mt-4">
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
        </SidebarInset>
        </SidebarProvider>
        </>
  );
};

export default Notes;
