import Layout from "@/components/layout";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useUserStore } from "@/store/userStore";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MarkdownView, { slugify } from "@/components/markdown-view";
import { useEffect, useMemo, useRef, useState } from "react";
import { Separator } from "@radix-ui/react-separator";
import { Badge } from "@/components/ui/badge";
import { BellOff, BellRing } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Link } from "react-router-dom";
import { FlashcardsTab } from "./flashcard-tab";
import { AIQuizTab } from "./quiz-tab";
import QuizHardPenIcon from "./QuizHardPenIcon";
import FlashcardIcon from "./FlashcardIcon";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const POLLING_INTERVAL_MS = 5000;

const extractYouTubeID = (url:string) => {
  if (!url) return null;
  // Regular expression to find the video ID in various URL formats
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};


const NoteDetail = ({}) => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState<string | undefined>();
  const [isYouTubeVisible, setIsYouTubeVisible] = useState(false);

  const mainContainerRef = useRef(null);

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
    // refetchInterval: (data, query) => {
    // const note = data?.data || {};
    // const isNoteLoading = note.status !== 'failed' && note.status !== 'transcribed' && note.status !== 'draft'
    // if (isNoteLoading) {
    //     console.log('Note is still processing.. Polling enabled.');
    //     return POLLING_INTERVAL_MS;
    // } else {
    //     console.log(`Note is ${note.status}. Polling disabled.`);
    //     return false; // Stop polling if no notes are in a loading state
    // }
    // },
  });


  const handleSetTopics = (topic: string) => {
    if (topics.indexOf(topic) === -1) setTopics([...topics, topic]);
  };

  
    const note = noteQuery?.data?.data;
    const youtubeVideoId = useMemo(() => {
      return note?.youtube_url ? extractYouTubeID(note.youtube_url) : null;
    }, [note])
    

  


  const scrollToIdInContainer = (id, containerRef) => {
  // 1. Ensure the container exists.
  const container = containerRef.current;
  if (!container) {
    console.warn("Scroll container ref not found.");
    return;
  }

  // 2. Find the target element *inside* the container.
  //    Using querySelector is slightly more robust for this.
  const element = container.querySelector(`#${id}`);


  if (element) {
    // 3. Calculate the position to scroll to.
    //    `offsetTop` gives the distance from the top of the element to the top of its parent container.
    //    We subtract a small offset to give some padding above the element.
    const topPosition = element.offsetTop - 20; // 20px padding

    // 4. Use the `scrollTo` method on the container with smooth behavior.
    container.scrollTo({
      top: topPosition,
      behavior: 'smooth',
    });
  } else {
    console.warn(`Element with id "${id}" not found inside the container.`);
  }
};


  return (
    <Layout title={noteQuery?.data?.data?.name} containerRef={mainContainerRef} isAlertEnabled={noteQuery?.data?.data?.quiz_alerts_enabled} showAlertBadge={true}>
      <div className="flex flex-row justify-around">
        <div className="flex flex-row justify-between w-full align-middle mb-8">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/notes">Notes</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                  {noteQuery?.data?.data?.name}
                  
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
            <span className="sr-only">Toggle YouTube Video</span>
          </Button>
        )}

        </div>
        {/* --- ADD THIS SECTION to embed the YouTube video --- */}

      </div>
      {youtubeVideoId && (
        <div
          id="youtube-embed-section"
          className={cn(
            "overflow-hidden transition-all duration-500 ease-in-out",
            isYouTubeVisible ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="mb-8 mt-4 w-full max-w-3xl mx-auto">
            <div className="relative w-full overflow-hidden rounded-lg shadow-lg aspect-video">
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                title={note?.name || 'YouTube video player'}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
        <div className="@container/main flex flex-1 flex-col gap-2 mt-10">
          <Tabs defaultValue="overview" >
            <TabsList className='inline-flex text-muted-foreground  border border-primary/10 dark:border-primary/5 overflow-x-auto items-center relative rounded-2xl h-auto w-full max-w-full justify-start'>
              <TabsTrigger className='data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent'   value="overview">Overview</TabsTrigger>
              <TabsTrigger className='data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent'  value="transcript">Transcript</TabsTrigger>
              <TabsTrigger className='data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent' value="attachments">Attachments</TabsTrigger>
              <TabsTrigger className='data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent' value="quiz"> <QuizHardPenIcon /> AI Quiz</TabsTrigger>
              <TabsTrigger className='data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent' value="flashcard"><FlashcardIcon />  Flashcards</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className=" py-8">
              <MarkdownView>
                {noteQuery.data?.data?.md_summary_ai}
              </MarkdownView>
            </TabsContent>
            <TabsContent value="flashcard" className=" py-8">
              <FlashcardsTab noteId={noteId} />
            </TabsContent>
             <TabsContent value="quiz" className=" py-8">
              {console.log("JSON.parse(note.quiz_json)", note?.quiz_json)}
              <AIQuizTab quizData={note?.questions} noteId={noteId} />
            </TabsContent>
            <TabsContent value="transcript" className=" py-8">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="space-y-8 lg:col-span-2">
                  <MarkdownView setTopics={handleSetTopics}>
                    {noteQuery.data?.data?.transcript}
                  </MarkdownView>
                </div>
                <div className="lg:col-span-1">
                  <div className="sticky top-20 self-start w-full">
                      <div
                        data-slot="card"
                        className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border shadow-sm"
                      >
                        {/* <div
                          data-slot="card-header"
                          className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6"
                        >
                          <div
                            data-slot="card-title"
                            className="leading-none font-semibold flex items-center gap-2"
                          >
                            Headings
                          </div>
                        </div> */}
                        <div data-slot="card-content" className="p-0 overflow-y-auto 
                    max-h-[calc(100vh-10rem)]">
                      {
                        topics && topics?.length && (

                            <div className="space-y-1">
                              {
                                  topics.map((topic, index) => {
                                      return (

                                      <button onClick={() => {
                                          setSelectedTopic(topic);
                                          scrollToIdInContainer(slugify(topic), mainContainerRef);
                                      }} key={index} className={`hover:bg-muted/50 w-full ${selectedTopic === topic ? " border-l-2 bg-primary/5 ": ""} cursor-pointer  p-4 text-left transition-colors border-l-primary  `}>
                                      <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                              {/* <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              width="24"
                                              height="24"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              stroke-width="2"
                                              stroke-linecap="round"
                                              stroke-linejoin="round"
                                              className="lucide lucide-play h-3 w-3"
                                              >
                                              <polygon points="6 3 20 12 6 21 6 3"></polygon>
                                              </svg> */}
                                              ¶
                                          </div>
                                          <div>
                                              <p className="text-sm font-medium text-pretty text-primary">
                                                  {topic}
                                              </p>
                                          </div>
                                          </div>
                              
                                      </div>
                                      </button>
                                      )
                                  })
                              }
                              
                            </div>
                            )
                          }
                        </div>
                      </div>

                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
    </Layout>
  );
};

export default NoteDetail;
