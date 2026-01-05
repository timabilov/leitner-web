import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";
import { usePostHog } from 'posthog-js/react';
import JSZip from "jszip";
import Zoom from "react-medium-image-zoom";

// --- Services & Store ---
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL  } from "@/services/config";
import { useUserStore } from "@/store/userStore";

// --- Components ---
import Layout from "@/components/layout";
import MarkdownView from "@/components/markdown-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AudioPlayer } from "@/components/AudioPlayer";
import { FilePreviewDialog } from "@/components/file-preview-dialog";
import { StudyMaterials } from "./study-materials";
import AiModal from "./ai-modal";

// --- Icons ---
import { 
  BellRing, BellOff, Calendar, Globe, Paperclip, Youtube, 
  MessageSquare, ScrollText, NotepadText, Sparkles, 
  ChevronDown, LayoutGrid, MoreVertical, Clock, CheckCircle2,
  Loader2,
  Send,
  User
} from "lucide-react";
import { getNoteLanguageIso, getTypeIcon } from "@/notes/note-utils";
import AIIcon from "./ai-icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import CatLogo from "./cat-logo";
import Typewriter from "./type-writter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Message } from "@/components/ui/chat-message";

// --- Sub-Components ---

/**
 * High-density metadata item
 */

const MetaItem = ({ icon, label, value, onClick, active }: any) => (
  <div 
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-2 py-1 rounded-md transition-colors whitespace-nowrap",
      onClick ? "hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer" : "cursor-default",
      active && "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50",
      "hover:bg-zinc-100 dark:hover:bg-zinc-800  bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
    )}
  >
    <span className="text-zinc-400">{icon}</span>
    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
    <span className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">{value}</span>
  </div>
);

/**
 * Animated Tab Trigger
 */
const StudioTabTrigger = ({ value, icon, label, active }: any) => (
  <TabsTrigger 
    value={value}
    className={cn(
      "relative h-9 px-4 gap-2 rounded-md transition-all font-medium text-sm tracking-tight",
      "data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-zinc-950 dark:data-[state=active]:text-zinc-50 data-[state=active]:shadow-sm",
      "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
    )}
  >
    {icon}
    {label}
    {/* {active && (
      <motion.div 
        layoutId="tab-indicator"
        className="absolute -bottom-[5px] left-2 right-2 h-[2px] bg-zinc-900 dark:bg-zinc-50 rounded-full"
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
    )} */}
  </TabsTrigger>
);

// --- MAIN COMPONENT ---

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
  const inputRef = useRef<HTMLInputElement>(null);

    // 2. Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);


  // 1. Auto-scroll logic (Improved)
  // We use a MutationObserver or a simple useEffect on messages length + loading state
  // But for typewriter, we want to scroll often. 
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, streamingMessageId]); 

    // 3. Auto-focus when loading finishes
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);


  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    
    // Add User Message
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: userText };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);
    inputRef.current?.focus();

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
      inputRef.current?.focus();
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
            ref={inputRef} // 6. Attach the ref here
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            // disabled={isLoading}
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

const sanitizeMarkdown = (text) => {
  if (text) {
    return text.split(' ').map(word => 
      word.length > 500 ? word.substring(0, 500) + "..." : word
    ).join(' ');
  }
  return ""
};


const NoteDetailBase = () => {
  const { t } = useTranslation(); 
  const { noteId } = useParams();
  const { companyId, userId, email, fullName } = useUserStore();
  const posthog = usePostHog();

  // Local UI State
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isMediaExpanded, setIsMediaExpanded] = useState(true);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<any>(null);
  
  // File State
  const [imagePaths, setImagePaths] = useState<any[]>([]);
  const [audioPaths, setAudioPaths] = useState<any[]>([]);
  const [pdfPaths, setPdfPaths] = useState<any[]>([]);
  const [textContent, setTextContent] = useState<string>("");
  const [isProcessingFiles, setProcessingFiles] = useState(false);

  // 1. Data Fetching: Note Detail
  const { data: noteQueryResponse, refetch } = useQuery({
    queryKey: [`notes-${noteId}`],
    queryFn: () => axiosInstance.get(`${API_BASE_URL}/company/${companyId}/notes/${noteId}`),
    enabled: !!companyId,
    refetchInterval: (query: any) => {
      console.log("1-isPolling", isPolling);
      const status = query.state?.data?.data?.quiz_status;
      return isPolling && (status === "in_progress" || status === "ready_to_generate") ? 3000 : false;
    }
  });


    useEffect(() => {
      console.log("2-isPolling", isPolling)
      if (isPolling && noteQueryResponse) refetch();
    }, [isPolling]);


  const note = noteQueryResponse?.data;

  // 2. Data Fetching: Files
  const { data: filesResponse } = useQuery({
    queryKey: [`notes`, noteId, "file"],
    queryFn: () => axiosInstance.get(`${API_BASE_URL}/company/${companyId}/notes/${noteId}/documents-url`),
    enabled: !!note && note.note_type !== "youtube",
  });

  // 3. Process Zip Files (Effect)
  useEffect(() => {
    if (filesResponse?.data?.file_url && !isProcessingFiles && imagePaths.length === 0) {
      handleUnzip(filesResponse.data.file_url);
    }
  }, [filesResponse]);

  const handleUnzip = async (url: string) => {
    setProcessingFiles(true);
    try {
      const res = await fetch(url);
      const zip = await JSZip.loadAsync(await res.blob());
      const imgs: any[] = [], auds: any[] = [], pdfs: any[] = [];
      let txt = "";

      const promises: any[] = [];
      zip.forEach((path, entry) => {
        promises.push((async () => {
          const blob = await entry.async("blob");
          const name = entry.name.toLowerCase();
          if (/\.(jpg|jpeg|png|webp|gif)$/.test(name)) imgs.push({ name: entry.name, url: URL.createObjectURL(blob) });
          else if (/\.(mp3|wav|m4a|ogg|webm)$/.test(name)) auds.push({ name: entry.name, url: URL.createObjectURL(blob) });
          else if (name.endsWith(".pdf")) pdfs.push({ name: entry.name, url: URL.createObjectURL(blob) });
          else if (name.endsWith(".txt")) txt += await entry.async("string") + "\n";
        })());
      });
      await Promise.all(promises);
      setImagePaths(imgs); setAudioPaths(auds); setPdfPaths(pdfs); setTextContent(txt);
    } finally { setProcessingFiles(false); }
  };

  const attachmentCount = imagePaths.length + audioPaths.length + pdfPaths.length + (textContent ? 1 : 0);

  return (
    <Layout title={note?.name} noGap>
      <div className="flex flex-col min-h-screen bg-transparent">
        
        {/* --- 1. STUDIO HEADER: High-Density Utility --- */}
        <div className="border-b border-zinc-200/50 bg-white dark:bg-zinc-950 px-6 py-4 sticky top-0 z-40 backdrop-blur-md">
          <div className=" mx-auto">
            <div className="flex items-center justify-between mb-4">
              {/* Breadcrumb Logic */}
              <div className="flex items-center gap-2 text-zinc-400">
                <Link to="/notes" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  <LayoutGrid size={16} />
                </Link>
                <span className="text-zinc-300 dark:text-zinc-800">/</span>
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold  text-lg">
                   {getTypeIcon(note?.note_type, 6)}
                   {note?.name || t("Loading...")}
                </div>
              </div>
              
              <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500">
                <MoreVertical size={16} />
              </button>
            </div>

            {/* Unified Metadata Bar */}
            <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
              <MetaItem icon={<Calendar size={12} />} label={t("Created")} value={new Date(note?.created_at).toLocaleDateString()} />
              <MetaItem icon={<Globe size={12} />} label={t("Language")} value={getNoteLanguageIso(note?.language)} />
              <MetaItem 
                icon={<Paperclip size={12} />} 
                label={t("Resources")} 
                value={`${attachmentCount} items`}
                onClick={() => setIsMediaExpanded(!isMediaExpanded)}
                active={isMediaExpanded}
              />
              <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0" />
              
              {/* Alert Toggle Integrated */}
              <div className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full border transition-all shrink-0",
                note?.quiz_alerts_enabled 
                  ? "bg-zinc-900 border-zinc-900 text-white shadow-sm" 
                  : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-400"
              )}>
                {note?.quiz_alerts_enabled ? <BellRing size={12} strokeWidth={3} /> : <BellOff size={12} />}
                <span className="text-[10px] font-black uppercase tracking-widest">{note?.quiz_alerts_enabled ? "Alerts On" : "Alerts Off"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full mx-auto px-6 py-8">
          
          {/* --- 2. RESOURCE TRAY: Collapsible Media --- */}
          <AnimatePresence>
            {isMediaExpanded && attachmentCount > 0 && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="mb-10 overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {note?.youtube_url && (
                    <div className="aspect-video rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm bg-black">
                       <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${note.youtube_url.split('v=')[1]}`} allowFullScreen />
                    </div>
                  )}
                  {imagePaths.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 bg-zinc-50/50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                       {imagePaths.map((img, i) => (
                         <Zoom key={i}><img src={img.url} className="aspect-square object-cover rounded-md border border-zinc-200" /></Zoom>
                       ))}
                    </div>
                  )}
                  {audioPaths.map((aud, i) => <AudioPlayer key={i} audio={aud} />)}
                  {pdfPaths.map((pdf, i) => (
                    <button key={i} onClick={() => setPreviewFile(pdf)} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-300 transition-all">
                      <div className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-600"><ScrollText size={16} /></div>
                      <span className="text-sm font-semibold truncate">{pdf.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* --- 3. WORKSPACE: Tabs Switcher --- */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-8 overflow-x-auto no-scrollbar">
              <TabsList className="bg-zinc-100/50 dark:bg-zinc-900/50 p-1 border border-zinc-200/50 dark:border-zinc-800/50 h-11 w-full">
                <StudioTabTrigger value="overview" icon={<NotepadText size={14} />} label={t("Overview")} active={activeTab === "overview"} />
                <StudioTabTrigger value="transcript" icon={<ScrollText size={14} />} label={t("Transcript")} active={activeTab === "transcript"} />
                <StudioTabTrigger value="chat" icon={<MessageSquare size={14} />} label={t("AI Chat")} active={activeTab === "chat"} />
                <StudioTabTrigger value="ai" icon={<AIIcon size={30} className="w-28 h-28"/>} label={t("AI Tools")} active={activeTab === "ai"} />
              </TabsList>
              
              {!note?.processing_error_message && (
                <AiModal noteId={noteId} noteQuery={noteQueryResponse} isPolling={isPolling} setIsPolling={setIsPolling} />
              )}
            </div>

            {/* --- 4. CONTENT VIEWPORTS --- */}
            <div className="relative min-h-[500px]">
              <TabsContent value="overview" className="mt-0 focus-visible:ring-0">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="prose prose-zinc dark:prose-invert max-w-none">
                  {note?.processing_error_message ? (
                    <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 font-medium">{note.processing_error_message}</div>
                  ) : (
                    <MarkdownView>{sanitizeMarkdown(note?.md_summary_ai)}</MarkdownView>
                  )}
                </motion.div>
              </TabsContent>

              <TabsContent value="transcript" className="mt-0 focus-visible:ring-0">
                <div className="bg-zinc-50/50 dark:bg-zinc-900/30 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800">
                  <MarkdownView>{note?.transcript}</MarkdownView>
                </div>
              </TabsContent>

              <TabsContent value="chat" className="mt-0 focus-visible:ring-0">
                <ChatInterface noteName={note?.name} noteId={noteId!} />
              </TabsContent>

              <TabsContent value="ai" className="mt-0 focus-visible:ring-0">
                <StudyMaterials noteId={noteId!} noteQuery={noteQueryResponse} setIsPolling={setIsPolling} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {previewFile && (
        <FilePreviewDialog renderAsBlobUrl url={previewFile.url} name={previewFile.name} onClose={() => setPreviewFile(null)} />
      )}
    </Layout>
  );
};


export default NoteDetailBase;

// Helper function for conditional classes
function cn(...inputs: any) {
  return inputs.filter(Boolean).join(" ");
}