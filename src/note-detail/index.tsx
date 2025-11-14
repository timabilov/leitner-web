import Layout from "@/components/layout";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useUserStore } from "@/store/userStore";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import MarkdownView, { slugify } from "@/components/markdown-view";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {  BellOff, BellRing, Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import AiModal from "@/components/ai-modal";
import { Badge } from "@/components/ui/badge";
import { getNoteLanguageIso, getTypeIcon } from "@/notes/sortable-example";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const POLLING_INTERVAL_MS = 5000;

const extractYouTubeID = (url) => {
  if (!url) return null;
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const NoteDetail = () => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(undefined);
  const [isYouTubeVisible, setIsYouTubeVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const mainContainerRef = useRef(null);
  const transcriptPanelRef = useRef(null);
  const tabsListRef = useRef(null);
  const [tabsListHeight, setTabsListHeight] = useState(0);
  const [isPolling, setIsPolling] = useState<boolean>(false);


  useEffect(() => {
    if (tabsListRef.current) {
      setTabsListHeight(tabsListRef.current.offsetHeight);
    }
  }, [tabsListRef.current]);

  const { noteId } = useParams();
  const { companyId } = useUserStore();

  const noteQuery = useQuery({
    queryKey: [`notes-${noteId}`],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await axiosInstance.get(
        API_BASE_URL + `/company/${companyId}/notes/${noteId}`
      );
      return response;
    },
    enabled: !!companyId,
    refetchInterval: (query) => {
      const note = query.state.data;
      const isGenerating =  query.state?.data?.data?.quiz_status === "in_progress" ||  query.state?.data?.data?.quiz_status === 'ready_to_generate';
      console.log("fetching started", query.state?.data?.data?.quiz_status, isPolling);
      if (!isPolling) {
        console.log("not fetching")
        return false;
      }
      console.log(
        `[Note ${noteId} Quiz Generation status isGenerating:`,
        isGenerating
      );

      if (isGenerating) {
        console.log("continue fetching", query.state?.data?.data?.quiz_status);
        return POLLING_INTERVAL_MS;
      } else {
        console.log("stop fetching", query.state?.data?.data?.quiz_status);
        setIsPolling(false);
        return false;
      }
    },
  });

    const startPollingForQuiz = () => {
      setIsPolling(true);
    };


    useEffect(() => {
      if (isPolling) noteQuery.refetch();
    }, [isPolling])

  const { data: note } = noteQuery?.data || {};

  const youtubeVideoId = useMemo(() => {
    return note?.youtube_url ? extractYouTubeID(note.youtube_url) : null;
  }, [note]);

  const handleSetTopics = (topic) => {
    if (!topics.includes(topic)) {
      setTopics((prevTopics) => [...prevTopics, topic]);
    }
  };

  const scrollToIdInContainer = (id, containerRef) => {
    const container = containerRef.current;
    if (!container) return;
    const element = container.querySelector(`#${id}`);
    if (element) {
      const topPosition = element.offsetTop - 80; // Offset for sticky header
      container.scrollTo({
        top: topPosition,
        behavior: "smooth",
      });
    } else {
      console.warn(`Element with id "${id}" not found.`);
    }
  };

  const handleOpenQuizModal = () => {
    // In the future, this will open your Quiz modal.
    // For now, we can just log a message.
    console.log("Opening AI Quiz Modal...");
    alert("This will open the AI Quiz modal.");
  };

  const handleOpenFlashcardsModal = () => {
    // In the future, this will open your Flashcards modal.
    console.log("Opening Flashcards Modal...");
    alert("This will open the Flashcards modal.");
  };

  return (
    <Layout title={note?.name} containerRef={mainContainerRef}>
      <div className="flex flex-col h-full">
        <div className="overflow-auto">
          <div className="flex flex-row items-center justify-between w-full mb-2">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link className="text-2xl" to="/notes">Notes</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-2xl flex flex-row items-center" >
                      {getTypeIcon(note?.note_type, 5)}
                      <span className="mr-3"/>
                  {note?.name || "Loading..."}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {youtubeVideoId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsYouTubeVisible(!isYouTubeVisible)}
                aria-expanded={isYouTubeVisible}
                aria-controls="youtube-embed-section"
              >
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform duration-300",
                    isYouTubeVisible && "rotate-180"
                  )}
                />
              </Button>
            )}
          </div>
            <div className="flex flex-row items-center justify-start w-full mb-4">
                <Badge variant="secondary" className="mr-2">
                       <Calendar />
                  {(new Date(note?.created_at)).toLocaleString()}
                </Badge>
                <Badge variant="secondary" className="mr-2">
                      Language:{' '} 
                      {getNoteLanguageIso(note?.language)}
                </Badge>
                 <Badge variant="secondary">
                      Attachments: 0
                </Badge>
                 <Tooltip>
                  <TooltipTrigger >
                    <Badge className={cn("ml-4 h-5 w-5 p-0 flex items-center justify-center", note?.quiz_alerts_enabled && "border-pink-300 bg-pink-100 dark:border-pink-300/10 dark:bg-pink-400/10")}>
                      {note?.quiz_alerts_enabled ? <BellRing className="h-4 w-4 stroke-pink-700 dark:stroke-pink-500" /> : <BellOff className="h-4 w-4" />}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Notification alerts</p>
                  </TooltipContent>
                </Tooltip>

             
   
            </div>
          {youtubeVideoId && (
            <div
              id="youtube-embed-section"
              className={cn(
                "overflow-hidden transition-all duration-500 ease-in-out",
                isYouTubeVisible
                  ? "max-h-[1000px] opacity-100"
                  : "max-h-0 opacity-0"
              )}
            >
              <div className="mb-8 mt-4 w-full max-w-3xl mx-auto">
                <div className="relative w-full overflow-hidden rounded-lg shadow-lg aspect-video">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                    title={note?.name || "YouTube video player"}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>
          )}

          <div className="@container/main w-full mt-10">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              // className="flex flex-col flex-1 mt-4 overflow-hidden"
              className="w-full "
            >
              <div className="flex flex-row justify-between z-20">
                <TabsList
                  className="
                      relative 
                      w-full
                      p-0
   
                      gap-2
                    bg-muted text-muted-foreground inline-flex h-12 items-center max-w-3xl justify-center m-auto rounded-lg p-[3px]

                    "
                >
                  <TabsTrigger
                    className={cn(
                      "flex flex-col items-center gap-1 px-2.5 sm:px-3",
                      'cursor-pointer',
                      // "data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground",
                      // Active state (white, elevated, and overlapping)
                    )}
                    value="overview"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    className={cn(
                      //"relative h-auto flex items-center justify-center gap-2 px-4 py-3 rounded-t-lg transition-all",
                      'cursor-pointer',
                      // "data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]",
                      "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground h-[calc(100%-1px)] flex-1 justify-center rounded-md border border-transparent px-4 py-3 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 flex flex-col items-center gap-1 sm:px-3"
                    )}
                    value="transcript"
                  >
                    Transcript
                  </TabsTrigger>
                  {/* <TabsTrigger className='data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent' value="quiz">
                    <QuizHardPenIcon />
                    AI Quiz
                    </TabsTrigger>
                  <TabsTrigger className='data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent' value="flashcard">
                    <FlashcardIcon />
                    Flashcards
                  </TabsTrigger> */}
                </TabsList>
                <AiModal noteId={noteId} noteQuery={noteQuery}  isPolling={isPolling} setIsPolling={setIsPolling} startPollingForQuiz={startPollingForQuiz}/>
              </div>
              <Card className="relative rounded-md border-t-inherit shadow-md z-10 -mt-[30px]">
              
                <TabsContent
                  value="transcript"
                  className="flex-1 mt-4 overflow-hidden"
                >
                  <CardContent className="p-6 text-sm text-muted-foreground ">
                    <MarkdownView setTopics={handleSetTopics}>
                      {note?.transcript}
                    </MarkdownView>

                    <div className="h-full p-2 overflow-y-auto">
                      {topics.length > 0 ? (
                        <div className="space-y-1">
                          {topics.map((topic, index) => (
                            <button
                              onClick={() => {
                                setSelectedTopic(topic);
                                // Scroll inside the transcript panel
                                scrollToIdInContainer(
                                  slugify(topic),
                                  transcriptPanelRef
                                );
                              }}
                              key={index}
                              className={`w-full text-left p-4 rounded-md ...`}
                            ></button>
                          ))}
                        </div>
                      ) : (
                        <p className="p-4 text-sm text-muted-foreground">
                          No topics found.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </TabsContent>

                {/* --- The SCROLLING content for other tabs --- */}
                <TabsContent
                  value="overview"
                  className="flex-1 min-h-0 py-8 overflow-y-auto"
                >
                  <CardContent className="p-6 text-sm text-muted-foreground border-none">
                    <MarkdownView>{note?.md_summary_ai}</MarkdownView>
                  </CardContent>
                </TabsContent>
              </Card>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NoteDetail;
