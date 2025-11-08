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
import { FlashcardsTab } from "./flashcard-tab";
import { AIQuizTab } from "./quiz-tab";
import QuizHardPenIcon from "./QuizHardPenIcon";
import FlashcardIcon from "./FlashcardIcon";
import { BrainCircuit, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

  useEffect(() => {
    if (tabsListRef.current) {
      setTabsListHeight(tabsListRef.current.offsetHeight);
    }
  }, [tabsListRef.current]);

  const { noteId } = useParams();
  const { companyId } = useUserStore();

  const noteQuery = useQuery({
    queryKey: [`notes-${noteId}`],
    queryFn: async () => {
      const response = await axiosInstance.get(
        API_BASE_URL + `/company/${companyId}/notes/${noteId}`
      );
      return response;
    },
    enabled: !!companyId,
  });

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
          <div className="flex flex-row items-center justify-between w-full mb-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/notes">Notes</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{note?.name || "Loading..."}</BreadcrumbPage>
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
              className="flex flex-col flex-1 mt-4 overflow-hidden"
            >
              <div className="flex flex-row justify-between">
                <TabsList >
                  <TabsTrigger className='data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent' value="overview">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger className='data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent' value="transcript">Transcript</TabsTrigger>
                  {/* <TabsTrigger className='data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent' value="quiz">
                    <QuizHardPenIcon />
                    AI Quiz
                    </TabsTrigger>
                  <TabsTrigger className='data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent' value="flashcard">
                    <FlashcardIcon />
                    Flashcards
                  </TabsTrigger> */}
                </TabsList>
                <div>
                    <Button size="default" variant="outline" className="cursor-pointer"  onClick={() => setIsOpen(true)}>
                      <QuizHardPenIcon />
                      AI Quiz
                    </Button>
                    <Button size="default" variant="outline" className="cursor-pointer"  onClick={() => setIsOpen(true)}>
                      <FlashcardIcon />
                      Flashcard
                    </Button>
                </div>
              </div>
              {/* --- The FIXED PanelGroup for the Transcript Tab --- */}
              {/* <TabsContent value="transcript" className="flex-1 mt-4">
              <PanelGroup direction="horizontal" className="h-full rounded-lg border">
                <Panel defaultSize={70} minSize={30}>
                  <div ref={transcriptPanelRef} className="h-full p-4 overflow-y-auto">
                    <MarkdownView setTopics={handleSetTopics}>{note?.transcript}</MarkdownView>
                  </div>
                </Panel>
                
                <PanelResizeHandle className="w-2.5 flex items-center justify-center bg-transparent transition-colors hover:bg-muted">
                  <div className="h-10 w-1 rounded-full bg-border" />
                </PanelResizeHandle>
                
                <Panel defaultSize={30} minSize={20}>
                  <div className="h-full p-2 overflow-y-auto">
                    <div className="w-full">
                      <div data-slot="card" className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl">
                        <div className="px-4 pt-4"><h4 className="font-semibold text-lg">Topics</h4></div>
                        <div data-slot="card-content" className="p-2">
                          {topics.length > 0 ? (
                            <div className="space-y-1">
                              {topics.map((topic, index) => (
                                <button
                                  onClick={() => {
                                    setSelectedTopic(topic);
                                    // Scroll inside the transcript panel
                                    scrollToIdInContainer(slugify(topic), transcriptPanelRef);
                                  }}
                                  key={index}
                                  className={`w-full text-left p-4 rounded-md ...`}
                                >
                                </button>
                              ))}
                            </div>
                          ) : (<p className="p-4 text-sm text-muted-foreground">No topics found.</p>)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Panel>
              </PanelGroup>
            </TabsContent> */}

              <TabsContent
                value="transcript"
                className="flex-1 mt-4 overflow-hidden"
              >
                <PanelGroup
                  direction="horizontal"
                  className="h-full rounded-lg border"
                >
                  <Panel defaultSize={70} minSize={30}>
                    <div
                      ref={transcriptPanelRef}
                      className="h-full p-4 overflow-y-auto"
                    >
                      <MarkdownView setTopics={handleSetTopics}>
                        {note?.transcript}
                      </MarkdownView>
                    </div>
                  </Panel>
                  <PanelResizeHandle className="w-2.5 flex items-center justify-center ...">
                    <div className="h-10 w-1 rounded-full bg-border" />
                  </PanelResizeHandle>
                  <Panel defaultSize={30} minSize={20}>
                    <div className="h-full p-2 overflow-y-auto">
                     {topics.length > 0 ? (
                            <div className="space-y-1">
                              {topics.map((topic, index) => (
                                <button
                                  onClick={() => {
                                    setSelectedTopic(topic);
                                    // Scroll inside the transcript panel
                                    scrollToIdInContainer(slugify(topic), transcriptPanelRef);
                                  }}
                                  key={index}
                                  className={`w-full text-left p-4 rounded-md ...`}
                                >
                                </button>
                              ))}
                            </div>
                          ) : (<p className="p-4 text-sm text-muted-foreground">No topics found.</p>)}
                    </div>
                  </Panel>
                </PanelGroup>
              </TabsContent>

              {/* --- The SCROLLING content for other tabs --- */}
                  <TabsContent value="overview" className="flex-1 min-h-0 py-8 overflow-y-auto">
                    <PanelGroup
                  direction="horizontal"
                  className="h-full rounded-lg border"
                >
                  <Panel defaultSize={70} minSize={30}>
                    <div
                      ref={transcriptPanelRef}
                      className="h-full p-4 overflow-y-auto"
                    >
                        <MarkdownView>{note?.md_summary_ai}</MarkdownView>
                    </div>
                  </Panel>
                  <PanelResizeHandle className="w-2.5 flex items-center justify-center ...">
                    <div className="h-10 w-1 rounded-full bg-border" />
                  </PanelResizeHandle>
                  <Panel defaultSize={30} minSize={20}>
                     <div className="space-y-2">
                    <h4 className="font-semibold text-lg px-2">AI Tools</h4>
                    {/* Quiz Card */}

                    {/* Flashcards Card */}
                    
                      <Card 
                        className="transition-all hover:shadow-md hover:border-primary/20 cursor-pointer"
                        onClick={handleOpenFlashcardsModal}
                      >
                        <CardHeader className="flex flex-row items-center justify-between p-4">
                          <div className="space-y-1">
                            <CardTitle className="text-base">Flashcards</CardTitle>
                            <CardDescription className="text-xs">Review key concepts</CardDescription>
                          </div>
                          <FlashcardIcon className="h-8 w-8 text-muted-foreground" />
                        </CardHeader>
                      </Card>
  
                  </div>
      

                    

                    <div className="h-full p-2 overflow-y-auto">
                      {/* ... Topics Sidebar ... */}
                    </div>
                  </Panel>
                </PanelGroup>

                  </TabsContent>

              <TabsContent value="quiz" className="flex-1 py-8 overflow-y-auto">
                <AIQuizTab quizData={note?.questions} noteId={noteId} />
              </TabsContent>
              <TabsContent
                value="flashcard"
                className="flex-1 py-8 overflow-y-auto"
              >
                <FlashcardsTab noteId={noteId} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NoteDetail;
