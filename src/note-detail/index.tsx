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
import { motion } from "framer-motion";
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
  Sparkles,
  MessageCircleMore,
  NotepadText,
  ScrollText
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
import { getNoteLanguageIso, getTypeIcon } from "@/notes/note-utils";
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
import { AiOrbitAnimation } from "./ai-orbit-animation";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { SlidingNumber } from '@/components/animate-ui/primitives/texts/sliding-number';
import typingAnimation from './typing2.json';
import { File } from 'lucide-react';
import { StudyMaterials } from "./study-materials";
import Lottie from "lottie-react";
import Typewriter from "./type-writter";
import CatLogo from "./cat-logo";



const SPRING_TRANSITION = {
  type: "spring",
  bounce: 0.2,
  duration: 0.6,
};

export const POLLING_INTERVAL_MS = 5000;

type Message = {
  id: string;
  role: "ai" | "user";
  content: string;
};

const ChatInterface = ({ noteName, noteId }: { noteName?: string; noteId: string }) => {
  const { t } = useTranslation();
  const { companyId } = useUserStore();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Track the ID of the message currently being generated
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init-1",
      role: "ai",
      content: t("Hello! I've analyzed your note '{{name}}'. Ask me anything about it!", { name: noteName || "Untitled" }),
    }
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Auto-scroll logic (Improved)
  // We use a MutationObserver or a simple useEffect on messages length + loading state
  // But for typewriter, we want to scroll often. 
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, streamingMessageId]); 

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    
    // Add User Message
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: userText };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    // Add AI Placeholder
    const aiMsgId = (Date.now() + 1).toString();
    setStreamingMessageId(aiMsgId); // Mark this ID as streaming
    setMessages((prev) => [...prev, { id: aiMsgId, role: "ai", content: "" }]);

    // Prepare History
    const historyPayload = messages.map((m) => ({
      role: m.role === "ai" ? "model" : "user",
      message: m.content
    }));

    let lastIndex = 0;

    try {
      await axiosInstance.post(
        `${API_BASE_URL}/company/${companyId}/notes/${noteId}/chat`,
        { 
          message: userText, 
          history: historyPayload 
        },
        
        {
          timeout: 120000, // 2 minutes
          onDownloadProgress: (progressEvent) => {
            const xhr = progressEvent.event.target;
            const fullResponse = xhr.responseText || "";
            const newChunk = fullResponse.substring(lastIndex);
            
            if (newChunk) {
              lastIndex = fullResponse.length; 
              
              setMessages((prev) => 
                prev.map((msg) => 
                  msg.id === aiMsgId 
                    ? { ...msg, content: msg.content + newChunk } 
                    : msg
                )
              );
            }
          }
        }
      );
    } catch (error) {
      console.error("Chat error:", error);
      Sentry.captureException(error);
      
      setMessages((prev) => 
        prev.map((msg) => 
            msg.id === aiMsgId 
            ? { ...msg, content: t("Sorry, I encountered an error. Please try again.") } 
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null); // Stop streaming effect
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-3xl mx-auto">
      <ScrollArea className="flex-1 pr-4">
        <div className="flex flex-col gap-4 py-4">
          {messages.map((message) => {
            const isAi = message.role === "ai";
            // Check if this specific message is the one currently streaming
            const isStreaming = message.id === streamingMessageId;

            return (
              <div
                key={message.id}
                className={cn(
                  "flex w-full gap-3",
                  !isAi ? "flex-row-reverse" : "flex-row"
                )}
              >
                <Avatar className={cn("h-10 w-10 border", isAi ? "bg-black" : "bg-muted")}>
                  {isAi ? (
                      <CatLogo className="h-4 w-4 text-white m-auto" />
                  ) : (
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                  )}
                </Avatar>
                
                <div
                  className={cn(
                    "relative max-w-[80%] px-4 py-3 text-sm rounded-2xl whitespace-pre-wrap leading-relaxed",
                    !isAi
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted text-foreground rounded-tl-sm"
                  )}
                >
                  {/* --- RENDER LOGIC --- */}
                  {/* If it's AI, use the Typewriter. If user, show plain text. */}
                  {isAi ? (
                    <Typewriter 
                        content={message.content} 
                        isStreaming={isStreaming} 
                    />
                  ) : (
                    message.content
                  )}
                  
                  {/* Fallback for initial loading before first chunk arrives */}
                  {isAi && isStreaming && message.content.length === 0 && "..."}
                </div>
              </div>
            );
          })}
          {/* Scroll Anchor */}
          <div ref={scrollRef} className="h-1" />
        </div>
      </ScrollArea>

      <div className="pt-4 border-t bg-background">
        <form onSubmit={handleSendMessage} className="relative flex items-center w-full">
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
            className="absolute right-1.5 rounded-full h-9 w-9 shrink-0 cursor-pointer"
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
        const audioExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.webm'];
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

  // const startPollingForQuiz = () => setIsPolling(true);

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
          <div className="flex flex-row items-center justify-between w-full mb-4">
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
                    <pre className="whitespace-pre-wrap mb-4">{textContent}</pre>
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
                    <div key={audio.name + index} className="w-full mt-4 mb-4">
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
           <Tabs
              value={activeTab}
              onValueChange={(val) => {
                posthog.capture("tab_clicked", { userId, email, tab: val });
                setActiveTab(val);
              }}
              className="w-full"
            >
              <div className="flex flex-row justify-between z-20">
                <TabsList className="relative w-full p-1 gap-2 bg-muted text-muted-foreground inline-flex h-12 items-center max-w-3xl justify-center m-auto rounded-xl">
                  
                  {/* --- REUSABLE TAB TRIGGER LOGIC --- */}
                  {[
                    { id: "overview", label: t("Overview"), icon: <NotepadText /> },
                    { id: "transcript", label: t("Transcript"), icon: <ScrollText /> },
                    { id: "chat", label: t("AI Chat"), icon: <AnimateIcon loop>
                    <MessageCircleMore />
                  </AnimateIcon> },
                   { id: "ai", label: t("AI Tools"), icon: noteQuery.data?.data?.quiz_status === "in_progress"  ?  <Lottie 
                    animationData={typingAnimation} 
                    loop={true} 
                    autoplay={true}
                    style={{ width: '20px' }}
                />  :<AnimateIcon loop>
                    <Sparkles />
                  </AnimateIcon> }
                  ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    
                    return (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        // Remove standard active/bg styles. We handle them manually.
                        className={cn(
                          "relative flex-1 flex flex-col items-center justify-center gap-2 px-4 py-2 cursor-pointer text-sm font-medium transition-colors rounded-lg",
                          "text-muted-foreground hover:text-foreground", // Inactive state
                          "data-[state=active]:text-foreground", // Active text color
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          // IMPORTANT: Reset default background styles to avoid conflict
                          "data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        )}
                        style={{ WebkitTapHighlightColor: "transparent" }}
                      >
                        {/* The Floating Background Pill */}
                        {isActive && (
                          <motion.div
                            layoutId="active-pill"
                            className="absolute inset-0 bg-background dark:bg-input/50 shadow-sm rounded-lg border border-black/5 dark:border-white/5"
                            initial={false}
                            transition={SPRING_TRANSITION}
                            style={{ borderRadius: 8 }} // Ensure radius matches parent
                          />
                        )}

                        {/* The Content (Text/Icon) - Must be Z-10 to sit on top */}
                        <span className="relative z-10 flex items-center gap-2 mix-blend-multiply dark:mix-blend-screen">
                          {tab.icon && <span>{tab.icon}</span>}
                          {tab.label}
                        </span>
                      </TabsTrigger>
                    );
                  })}

                </TabsList>

                {/* ... Your AI Modal Logic ... */}
                {!note?.processing_error_message && (
                  <AiModal
                    noteId={noteId}
                    noteQuery={noteQuery}
                    isPolling={isPolling}
                    setIsPolling={setIsPolling}
                    // startPollingForQuiz={startPollingForQuiz}
                  />
                )}
              </div>

              {/* ... The Rest of your Content ... */}
              <Card className="relative rounded-md border-t-inherit shadow-md z-10 -mt-[30px]">
                <TabsContent value="transcript" className="flex-1 mt-4 overflow-hidden">
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    <MarkdownView setTopics={handleSetTopics}>{note?.transcript}</MarkdownView>
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

                <TabsContent value="chat" className="flex-1 min-h-0 py-8 overflow-y-auto">
                  <CardContent className="p-0 border-none">
                    <ChatInterface noteName={note?.name} noteId={noteId} />
                  </CardContent>
                </TabsContent>

                 <TabsContent value="ai" className="flex-1 mt-4 overflow-hidden">
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    <StudyMaterials 
                      noteId={noteId}
                      noteQuery={noteQuery} // Pass the entire query object
                      setIsPolling={setIsPolling} // Pass the polling setter
                    />
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