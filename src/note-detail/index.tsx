import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as Sentry from "@sentry/react"; 
import { usePostHog } from 'posthog-js/react'
import Layout from "@/components/layout";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useUserStore } from "@/store/userStore";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import MarkdownView from "@/components/markdown-view";
import { 
  BellOff, 
  BellRing, 
  Calendar, 
  ChevronDown, 
  Dot, 
  Send, 
  Bot, 
  User, 
  Loader2,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardFooter } from "@/components/ui/card"; // Added CardFooter
import AiModal from "./ai-modal";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getNoteLanguageIso, getTypeIcon } from "@/notes/note-card";
import { toast } from "sonner";
import JSZip from "jszip";
import Zoom from "react-medium-image-zoom";
import { AudioPlayer } from "@/components/AudioPlayer";
import { FilePreviewDialog } from "@/components/file-preview-dialog";
import { useTranslation } from "react-i18next"; 
import { Input } from "@/components/ui/input"; // Added Input
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Added Avatar
import { ScrollArea } from "@/components/ui/scroll-area"; // Added ScrollArea
import AIIcon from "./ai-icon";

export const POLLING_INTERVAL_MS = 5000;

// --- Chat Component ---
const ChatInterface = ({ noteName }: { noteName?: string }) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Mock Messages State - Replace with real logic later
  const [messages, setMessages] = useState([
    {
      id: "1",
      role: "ai",
      content: t("Hello! I've analyzed your note '{{name}}'. Ask me anything about it!", { name: noteName || "Untitled" }),
    }
  ]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    // Add User Message
    const userMsg = { id: Date.now().toString(), role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    // Simulate AI Response (Remove this when implementing real API)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev, 
        { 
          id: (Date.now() + 1).toString(), 
          role: "ai", 
          content: t("I am a placeholder for the AI response. I will be connected to the backend soon!") 
        }
      ]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-3xl mx-auto">
      {/* Messages Area */}
      <ScrollArea className="flex-1 pr-4">
        <div className="flex flex-col gap-4 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex w-full gap-3",
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <Avatar className={cn("h-8 w-8 border", message.role === "ai" ? "bg-black" : "bg-muted")}>
                {message.role === "ai" ? (
                  <div className="flex h-full w-full items-center justify-center text-white">
                    {/* <Sparkles className="h-4 w-4" /> */}
                    <AIIcon  className="h-4 w-4"/>
                  </div>
                ) : (
                  <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                )}
              </Avatar>
              
              <div
                className={cn(
                  "relative max-w-[80%] px-4 py-3 text-sm rounded-2xl",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted text-foreground rounded-tl-sm"
                )}
              >
                {message.content}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex w-full gap-3">
               <Avatar className="h-8 w-8 border bg-black text-white flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
               </Avatar>
               <div className="bg-muted px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce"></span>
               </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="pt-4 border-t bg-background">
        <form 
          onSubmit={handleSendMessage}
          className="relative flex items-center w-full"
        >
          <Input
            placeholder={t("Ask something about this note...")}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="pr-12 py-6 rounded-full shadow-sm border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-1.5 rounded-full h-9 w-9 shrink-0"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          {t("AI can make mistakes. Check important info.")}
        </p>
      </div>
    </div>
  );
};

const extractYouTubeID = (url:string) => {
  if (!url) return null;
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const NoteDetailBase = () => {
  const { t } = useTranslation(); 
  const { noteId } = useParams();
  const { companyId, userId, email, fullName } = useUserStore();
  const posthog = usePostHog();

  const [topics, setTopics] = useState([]);
  const [isYouTubeVisible, setIsYouTubeVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const mainContainerRef = useRef(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const previewLoadingAlreadyFired = useRef(false);
  const [imagePaths, setImagePaths] = useState<any[]>([]);
  const [audioPaths, setAudioPaths] = useState<any[]>([]);
  const [pdfPaths, setPdfPaths] = useState<any[]>([]);
  const [textContent, setTextContent] = useState<string>("");
  const [isProcessingFiles, setProcessingFiles] = useState(false);
  const [pdf, setPDF] = useState<File | undefined>();

  // 2. Set Sentry User Context
  useEffect(() => {
    if (userId) {
      Sentry.setUser({
        id: String(userId),
        email: email,
        username: fullName,
        company_id: companyId
      });
    }
  }, [userId, email, fullName, companyId]);

  const noteQuery = useQuery({
    queryKey: [`notes-${noteId}`],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      try {
        const response = await axiosInstance.get(
          API_BASE_URL + `/company/${companyId}/notes/${noteId}`
        );
        return response;
      } catch (error) {
        Sentry.captureException(error, { tags: { query: 'fetch_note_detail' }, extra: { noteId } });
        throw error;
      }
    },
    enabled: !!companyId,
    refetchInterval: (query) => {
      const isGenerating =
        query.state?.data?.data?.quiz_status === "in_progress" ||
        query.state?.data?.data?.quiz_status === "ready_to_generate";
      if (!isPolling) return false;
      if (isGenerating) return POLLING_INTERVAL_MS;
      else {
        setIsPolling(false);
        return false;
      }
    },
  });

  const noteIdResponse = noteQuery.data?.data?.id || "";
  const noteType = noteQuery?.data?.data.note_type;

  const noteFilesRequest = useQuery({
    queryKey: [`notes`, `${noteId}`, "file"],
    queryFn: async () => {
      try {
        return await axiosInstance.get(
          API_BASE_URL + `/company/${companyId}/notes/${noteId}/documents-url`
        );
      } catch (error) {
        Sentry.captureException(error, { tags: { query: 'fetch_note_files' }, extra: { noteId, email, userId } });
        throw error;
      }
    },
    enabled: !!noteIdResponse && noteType !== "youtube",
  });

  useEffect(() => {
    if (
      noteFilesRequest.isSuccess &&
      noteFilesRequest.data?.data &&
      !previewLoadingAlreadyFired.current
    ) {
      previewLoadingAlreadyFired.current = true;
      handlePreviewFiles(noteFilesRequest.data.data);
    }
    return () => {
      [...imagePaths, ...audioPaths, ...pdfPaths].forEach((file) => {
        URL.revokeObjectURL(file.url);
      });
    };
  }, [noteFilesRequest.isSuccess, noteFilesRequest.data]);

  const handlePreviewFiles = async (note) => {
    if (!note?.file_url) return;
    if (note?.youtube_url) return;

    setProcessingFiles(true);

    try {
      const response = await fetch(note.file_url);
      if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);
      const zipBlob = await response.blob();
      const zip = await JSZip.loadAsync(zipBlob);

      const newImagePaths = [];
      const newAudioPaths = [];
      const newPdfPaths = [];
      let newTextContent = '';

      const filePromises: Promise<void>[] = [];
      zip.forEach((relativePath, zipEntry) => {
        const fileName = zipEntry.name;
        const extension = fileName.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
        
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const audioExtensions = ['.mp3', '.wav', '.m4a', '.ogg'];
        const pdfExtensions = ['.pdf'];
        const textExtensions = ['.txt'];

        const processFile = async () => {
          const rawBlob = await zipEntry.async('blob');
          if (imageExtensions.includes(extension)) {
            const typedBlob = new Blob([rawBlob], { type: `image/${extension.slice(1)}` });
            newImagePaths.push({ name: fileName, url: URL.createObjectURL(typedBlob) });
          } else if (audioExtensions.includes(extension)) {
            const typedBlob = new Blob([rawBlob], { type: `audio/${extension.slice(1)}` });
            newAudioPaths.push({ name: fileName, url: URL.createObjectURL(typedBlob) });
          } else if (pdfExtensions.includes(extension)) {
            const typedBlob = new Blob([rawBlob], { type: 'application/pdf' });
            newPdfPaths.push({ name: fileName, url: URL.createObjectURL(typedBlob) });
          } else if (textExtensions.includes(extension)) {
            newTextContent += await zipEntry.async('string') + '\n';
          }
        };
        filePromises.push(processFile());
      });

      await Promise.all(filePromises);

      setImagePaths(newImagePaths);
      setAudioPaths(newAudioPaths);
      setPdfPaths(newPdfPaths);
      setTextContent(newTextContent);

    } catch (error) {
      console.error("Preview processing error:", error);
      Sentry.captureException(error, { tags: { action: 'process_zip_files' }, extra: { fileUrl: note.file_url, userId, email } });
      toast.error(t("Failed to open preview files. Please try refreshing the page."));
    } finally {
      setProcessingFiles(false);
    }
  };

  const startPollingForQuiz = () => setIsPolling(true);

  useEffect(() => {
    if (isPolling) noteQuery.refetch();
  }, [isPolling]);

  const { data: note } = noteQuery?.data || {};

  const youtubeVideoId = useMemo(() => {
    return note?.youtube_url ? extractYouTubeID(note.youtube_url) : null;
  }, [note]);

  const handleSetTopics = (topic) => {
    if (!topics.includes(topic)) {
      setTopics((prevTopics) => [...prevTopics, topic]);
    }
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
                    <Link className="text-2xl" to="/notes">
                      {t("Notes")}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-2xl flex flex-row items-center">
                    {getTypeIcon(note?.note_type, 5)}
                    <span className="mr-3" />
                    {note?.name || t("Loading...")}
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
              {note?.created_at ? new Date(note.created_at).toLocaleString() : ''}
            </Badge>
            <Badge variant="secondary" className="mr-2">
              {t("Language")}:{' '}
              {getNoteLanguageIso(note?.language)}
            </Badge>
            <Badge variant="secondary">{t("Attachments")}: {' '} {(imagePaths?.length + audioPaths?.length + pdfPaths?.length + (textContent ? 1 : 0))}</Badge>
            <Tooltip>
              <TooltipTrigger>
                <Badge
                  className={cn(
                    "ml-4 h-5 w-5 p-0 flex items-center justify-center",
                    note?.quiz_alerts_enabled && "border-pink-300 bg-pink-100 dark:border-pink-300/10 dark:bg-pink-400/10"
                  )}
                >
                  {note?.quiz_alerts_enabled ? (
                    <BellRing className="h-4 w-4 stroke-pink-700 dark:stroke-pink-500" />
                  ) : (
                    <BellOff className="h-4 w-4" />
                  )}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("Notification alerts")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          {youtubeVideoId ? (
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
                    title={note?.name || t("YouTube video player")}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {isProcessingFiles && (
                <p>{t("Loading and processing attachments...")}</p>
              )}
              {!isProcessingFiles && (
                <div className="max-w-full">
                  {textContent && (
                    <pre className="mt-2 whitespace-pre-wrap">{textContent}</pre>
                  )}
                  <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-8">
                    {imagePaths.map((img, index) => (
                      <Zoom key={index}>
                        <div key={img.name} className="group relative">
                          <img
                            src={img.url}
                            alt={img.name}
                            className="h-30 w-full cursor-pointer rounded-lg object-cover border transition-transform duration-300 group-hover:scale-105"
                            onClick={() =>  posthog.capture('img_clicked', { userId, email, name: img.name })}
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {img.name}
                          </div>
                        </div>
                      </Zoom>
                    ))}
                  </div>
                  {audioPaths.map((audio, index) => (
                    <div key={audio.name + index} className="w-full mt-6 mb-6">
                      <AudioPlayer key={audio.name} audio={audio} />
                    </div>
                  ))}
                  {pdfPaths.map((pdf, index) => (
                    <div className="flex flex-row items-center hover:bg-muted mt-2" key={index}>
                      <Dot />
                      <li
                        onClick={() => {
                          posthog.capture('pdf_clicked', { userId, email, name: pdf.name })
                          setPDF(pdf)
                        }}
                        key={pdf.name + index}
                        className="group relative flex items-center gap-2 cursor-pointer hover:underline text-blue-800 px-3 text-sm"
                      >
                        {pdf.name}
                      </li>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {pdf && (
            <FilePreviewDialog
              renderAsBlobUrl
              url={pdf?.url}
              name={pdf?.name}
              onClose={() => setPDF(null)}
            />
          )}
          <div className="@container/main w-full mt-10">
            <Tabs value={activeTab} onValueChange={(val) => {
              posthog.capture('tab_clicked', { userId, email, tab: val })
              setActiveTab(val)
            }}
              className="w-full">
              <div className="flex flex-row justify-between z-20">
                <TabsList className="relative w-full p-0 gap-2 bg-muted text-muted-foreground inline-flex h-12 items-center max-w-3xl justify-center m-auto rounded-lg p-[3px]">
                  <TabsTrigger
                    className="flex flex-col items-center gap-1 px-2.5 sm:px-3 cursor-pointer"
                    value="overview"
                  >
                    {t("Overview")}
                  </TabsTrigger>
                  <TabsTrigger
                    className="cursor-pointer data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground h-[calc(100%-1px)] flex-1 justify-center rounded-md border border-transparent px-4 py-3 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 flex flex-col items-center gap-1 sm:px-3"
                    value="transcript"
                  >
                    {t("Transcript")}
                  </TabsTrigger>
                  <TabsTrigger
                    className="cursor-pointer data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground h-[calc(100%-1px)] flex-1 justify-center rounded-md border border-transparent px-4 py-3 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 flex flex-col items-center gap-1 sm:px-3 "
                    value="chat"
                  >
                    <div className="flex flex-row items-center">
                      <AIIcon  />
                      {t("AI Chat")}
                    </div>
                  </TabsTrigger>
                </TabsList>
                {!note?.processing_error_message && (
                  <AiModal
                    noteId={noteId}
                    noteQuery={noteQuery}
                    isPolling={isPolling}
                    setIsPolling={setIsPolling}
                    startPollingForQuiz={startPollingForQuiz}
                  />
                )}
              </div>
              <Card className="relative rounded-md border-t-inherit shadow-md z-10 -mt-[30px]">
                <TabsContent value="transcript" className="flex-1 mt-4 overflow-hidden">
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    <MarkdownView setTopics={handleSetTopics}>
                      {note?.transcript}
                    </MarkdownView>
                  </CardContent>
                </TabsContent>
                <TabsContent value="overview" className="flex-1 min-h-0 py-8 overflow-y-auto">
                  <CardContent className="p-6 text-sm text-muted-foreground border-none">
                    {note?.processing_error_message && (
                      <p className="text-sm font-medium text-destructive">
                        {note?.processing_error_message}
                      </p>
                    )}
                    <MarkdownView>{note?.md_summary_ai}</MarkdownView>
                  </CardContent>
                </TabsContent>
                
                {/* --- ADDED CHAT CONTENT --- */}
                <TabsContent value="chat" className="flex-1 min-h-0 py-8 overflow-y-auto">
                  <CardContent className="p-0 border-none">
                    <ChatInterface noteName={note?.name} />
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

// 4. Export with Wrappers
const NoteDetail = Sentry.withProfiler(
  Sentry.withErrorBoundary(NoteDetailBase, {
    fallback: <div className="p-10 text-center text-red-500">Error loading note details.</div>
  })
);

export default NoteDetail;