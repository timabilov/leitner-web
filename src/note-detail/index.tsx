import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";
import { usePostHog } from "posthog-js/react";
import JSZip from "jszip";
import Zoom from "react-medium-image-zoom";
import { useSearchParams } from "react-router-dom";
// --- Services & Store ---
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useUserStore } from "@/store/userStore";

// --- Components ---
import Layout from "@/components/layout";
import MarkdownView from "@/components/markdown-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AudioPlayer } from "@/components/AudioPlayer";
import { FilePreviewDialog } from "@/components/file-preview-dialog";
import { StudyMaterials } from "./study-materials";


// --- Icons ---
import {
  BellRing,
  BellOff,
  Calendar,
  Globe,
  Paperclip,
  MessageSquare,
  ScrollText,
  NotepadText,
  LayoutGrid,
  MoreVertical,
  User,
  Send,
  Loader2,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getNoteLanguageIso, getTypeIcon } from "@/notes/note-utils";
import AIIcon from "./ai-icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import CatLogo from "./cat-logo";
import Typewriter from "./type-writter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Message } from "@/components/ui/chat-message";
import ChatInterface from "./chat-interface";

// --- Sub-Components ---

/**
 * High-density metadata item
 */

const MetaItem = ({ icon, label, value, onClick, active, iconEnd }: any) => (
  <div
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-2 py-1 rounded-md transition-colors whitespace-nowrap",
      onClick
        ? "hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
        : "cursor-default",
      active && "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50",
      "hover:bg-zinc-100 dark:hover:bg-zinc-800  bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
    )}
  >
    <span className="text-zinc-400">{icon}</span>
    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
      {label}
    </span>
    <span className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
      {value}
    </span>
    {iconEnd}
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




const extractYouTubeID = (url: string) => {
  if (!url) return null;
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const sanitizeMarkdown = (text) => {
  if (text) {
    return text
      .split(" ")
      .map((word) =>
        word.length > 500 ? word.substring(0, 500) + "..." : word
      )
      .join(" ");
  }
  return "";
};

const NoteDetailBase = () => {
  const { t } = useTranslation();
  const { noteId } = useParams();
  const { companyId, userId, email, fullName } = useUserStore();
  const posthog = usePostHog();

  // Local UI State
  const [isMediaExpanded, setIsMediaExpanded] = useState(true);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<any>(null);

  // File State
  const [imagePaths, setImagePaths] = useState<any[]>([]);
  const [audioPaths, setAudioPaths] = useState<any[]>([]);
  const [pdfPaths, setPdfPaths] = useState<any[]>([]);
  const [textContent, setTextContent] = useState<string>("");
  const [isProcessingFiles, setProcessingFiles] = useState(false);
  // 1. Initialize search params
  const [searchParams, setSearchParams] = useSearchParams();

  // 2. Get active tab from URL, fallback to "overview" if missing
  const activeTab = searchParams.get("tab") || "overview";

    // 3. Handler to update URL when tab changes
  const handleTabChange = (value: string) => {
    setSearchParams(
      (prev) => {
        prev.set("tab", value);
        return prev;
      },
      { replace: true } // Uses 'replace' to prevent cluttering browser history
    );
  };


  // 1. Data Fetching: Note Detail
  const { data: noteQueryResponse, refetch } = useQuery({
    queryKey: [`notes-${noteId}`],
    queryFn: () =>
      axiosInstance.get(`${API_BASE_URL}/company/${companyId}/notes/${noteId}`),
    enabled: !!companyId,
    refetchInterval: (query: any) => {
      console.log("1-isPolling", isPolling);
      const quiz_status = query.state?.data?.data?.quiz_status;
      const isNoteProcessing =
        query.state?.data?.data?.status !== "failed" &&
        query.state?.data?.data?.status !== "transcribed" &&
        query.state?.data?.data?.status !== "draft";
      return (isPolling &&
        (quiz_status === "in_progress" ||
          quiz_status === "ready_to_generate")) ||
        isNoteProcessing
        ? 3000
        : false;
    },
  });

  const isNoteProcessing = useMemo(() => {
    if (noteQueryResponse?.data?.status !== "failed" && noteQueryResponse?.data?.status  !== "transcribed" &&  noteQueryResponse?.data?.status !== "draft") {
      setIsPolling(true);
      return true
    } else {
      setIsPolling(false);
      return false;
    }
  }, [noteQueryResponse]);

  // useEffect(() => {
  //   if (isPolling || isNoteProcessing) refetch();
  // }, [isPolling, isNoteProcessing]);

  const note = noteQueryResponse?.data;

  // 2. Data Fetching: Files
  const { data: filesResponse } = useQuery({
    queryKey: [`notes`, noteId, "file"],
    queryFn: () =>
      axiosInstance.get(
        `${API_BASE_URL}/company/${companyId}/notes/${noteId}/documents-url`
      ),
    enabled: !!note && note.note_type !== "youtube",
  });

  // 3. Process Zip Files (Effect)
  useEffect(() => {
    if (
      filesResponse?.data?.file_url &&
      !isProcessingFiles &&
      imagePaths.length === 0
    ) {
      handleUnzip(filesResponse.data.file_url);
    }
  }, [filesResponse]);

  const handleUnzip = async (url: string) => {
    setProcessingFiles(true);
    try {
      const res = await fetch(url);
      const zip = await JSZip.loadAsync(await res.blob());
      const imgs: any[] = [],
        auds: any[] = [],
        pdfs: any[] = [];
      let txt = "";

      const promises: any[] = [];
      zip.forEach((path, entry) => {
        promises.push(
          (async () => {
            const blob = await entry.async("blob");
            const name = entry.name.toLowerCase();
            if (/\.(jpg|jpeg|png|webp|gif)$/.test(name))
              imgs.push({ name: entry.name, url: URL.createObjectURL(blob) });
            else if (/\.(mp3|wav|m4a|ogg|webm)$/.test(name))
              auds.push({ name: entry.name, url: URL.createObjectURL(blob) });
            else if (name.endsWith(".pdf"))
              pdfs.push({ name: entry.name, url: URL.createObjectURL(blob) });
            else if (name.endsWith(".txt"))
              txt += (await entry.async("string")) + "\n";
          })()
        );
      });
      await Promise.all(promises);
      setImagePaths(imgs);
      setAudioPaths(auds);
      setPdfPaths(pdfs);
      setTextContent(txt);
    } finally {
      setProcessingFiles(false);
    }
  };

  const attachmentCount =
    imagePaths.length +
    audioPaths.length +
    pdfPaths.length +
    (textContent ? 1 : 0);

  return (
    <Layout title={note?.name} noGap>
      <div className="flex flex-col min-h-screen bg-transparent">
        {/* --- 1. STUDIO HEADER: High-Density Utility --- */}
        <div className="border-b border-zinc-200/50 bg-white dark:bg-zinc-950 px-6 py-4 sticky top-0 z-40 backdrop-blur-md">
          <div className=" mx-auto">
            <div className="flex items-center justify-between mb-4">
              {/* Breadcrumb Logic */}
              <div className="flex items-center gap-2 text-zinc-400">
                <Link
                  to="/notes"
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  <LayoutGrid size={16} />
                </Link>
                <span className="text-zinc-300 dark:text-zinc-800">/</span>
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold  text-lg">
                  {
                    note?.note_type === "youtube" ? (
                      <div className="w-6 h-6">
                        {getTypeIcon(note?.note_type)}
                      </div>
                    ) : getTypeIcon(note?.note_type, 6)
                  }
                  {isNoteProcessing ?  t("Loading...") : note?.name || "-" }
                </div>
              </div>

              <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500">
                <MoreVertical size={16} />
              </button>
            </div>

            {/* Unified Metadata Bar */}
            <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
              <MetaItem
                icon={<Calendar size={12} />}
                label={t("Created")}
                value={new Date(note?.created_at).toLocaleDateString()}
              />
              <MetaItem
                icon={<Globe size={12} />}
                label={t("Language")}
                value={getNoteLanguageIso(note?.language)}
              />
              <MetaItem
                icon={<Paperclip size={12} />}
                label={t("Attachments")}
                value={`${attachmentCount} items`}
                onClick={() => attachmentCount > 0 ? setIsMediaExpanded(!isMediaExpanded) : null}
                active={isMediaExpanded}
                iconEnd={isMediaExpanded ?  <ChevronUp />:  <ChevronDown />}
              />
              <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0" />

              {/* Alert Toggle Integrated */}
                 <Tooltip>
                  <TooltipContent>
                    <p>{note?.quiz_alerts_enabled ? t("Quiz reminders are enabled, so we're targeting this area.") + "🎯" : t("It's totally okay to find this tricky. Get reminders and alerts to help boost your score.") }</p>
                  </TooltipContent>
                  <TooltipTrigger>
                       <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full border transition-all shrink-0",
                  note?.quiz_alerts_enabled
                    ? "bg-zinc-900 border-zinc-900 text-white shadow-sm"
                    : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-400"
                )}
              >
                {note?.quiz_alerts_enabled ? (
                  <BellRing size={12} strokeWidth={3} />
                ) : (
                  <BellOff size={12} />
                )}
             
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {note?.quiz_alerts_enabled ? "Alerts On" : "Alerts Off"}
                </span>
              </div>
                  </TooltipTrigger>
                </Tooltip>


             
            </div>
          </div>
        </div>

        <div className="w-full mx-auto px-6 py-8">
          {/* --- 2. RESOURCE TRAY: Collapsible Media --- */}
          <AnimatePresence>
            {isMediaExpanded && attachmentCount > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-10 overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {note?.youtube_url && (
                    <div className="aspect-video rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm bg-black">
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${
                          note.youtube_url.split("v=")[1]
                        }`}
                        allowFullScreen
                      />
                    </div>
                  )}
                  {imagePaths.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 bg-zinc-50/50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      {imagePaths.map((img, i) => (
                        <Zoom key={i}>
                          <img
                            src={img.url}
                            className="aspect-square object-cover rounded-md border border-zinc-200"
                          />
                        </Zoom>
                      ))}
                    </div>
                  )}
                  {audioPaths.map((aud, i) => (
                    <AudioPlayer key={i} audio={aud} />
                  ))}
                  {pdfPaths.map((pdf, i) => (
                    <button
                      key={i}
                      onClick={() => setPreviewFile(pdf)}
                      className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-300 transition-all"
                    >
                      <div className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-600">
                        <ScrollText size={16} />
                      </div>
                      <span className="text-sm font-semibold truncate">
                        {pdf.name}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* --- 3. WORKSPACE: Tabs Switcher --- */}
          <Tabs
          value={activeTab} onValueChange={handleTabChange}
            className="w-full"
          >
            <div className="flex items-center justify-between mb-8 overflow-x-auto no-scrollbar">
              <TabsList className="bg-zinc-100/50 dark:bg-zinc-900/50 p-1 border border-zinc-200/50 dark:border-zinc-800/50 h-11 w-full">
                <StudioTabTrigger
                  value="overview"
                  icon={<NotepadText size={14} />}
                  label={t("Overview")}
                  active={activeTab === "overview"}
                />
                <StudioTabTrigger
                  value="transcript"
                  icon={<ScrollText size={14} />}
                  label={t("Transcript")}
                  active={activeTab === "transcript"}
                />
                <StudioTabTrigger
                  value="chat"
                  icon={<MessageSquare size={14} />}
                  label={t("AI Chat")}
                  active={activeTab === "chat"}
                />
                <StudioTabTrigger
                  value="ai"
                  icon={<AIIcon size={30} className="w-28 h-28" />}
                  label={t("AI Tools")}
                  active={activeTab === "ai"}
                />
              </TabsList>
            </div>

            {/* --- 4. CONTENT VIEWPORTS --- */}
            <div className="relative min-h-[500px]">
              {isNoteProcessing ? (
                <div className="flex flex-col  mt-20">
                  <div className="mx-auto my-10 flex flex-col items-center">
                    <AIIcon hideStar className="h-10 w-10 animate-spin-slow " />

                    {/* <p className="animate-puls-long mt-5 text-xl text-zinc-400">
                      Processing...
                    </p> */}
                    <p
                      className="text-xl mt-5"
                      style={{
                        // 1. Use backgroundImage for gradients
                        backgroundImage:
                          "linear-gradient(to right, #71717a, #e4e4e7, #71717a)",
                        // 2. Size must be larger than 100% to allow movement
                        backgroundSize: "200% auto",
                        // 3. Clip the background to the text
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        // 4. Make text transparent so background shows through
                        color: "transparent",
                        // 5. Linear timing ensures constant speed, Infinite loops it
                        animation: "gradient-flow 4s linear infinite",
                      }}
                    >
                      Processing
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <TabsContent
                    value="overview"
                    className="mt-0 focus-visible:ring-0"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="prose prose-zinc dark:prose-invert max-w-none"
                    >
                      {note?.processing_error_message ? (
                        <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 font-medium">
                          {note.processing_error_message}
                        </div>
                      ) : (
                        <MarkdownView>
                          {sanitizeMarkdown(note?.md_summary_ai)}
                        </MarkdownView>
                      )}
                    </motion.div>
                  </TabsContent>

                  <TabsContent
                    value="transcript"
                    className="mt-0 focus-visible:ring-0"
                  >
                    <div className="bg-zinc-50/50 dark:bg-zinc-900/30 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800">
                      <MarkdownView>{note?.transcript}</MarkdownView>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="chat"
                    className="mt-0 focus-visible:ring-0"
                  >
                    <ChatInterface noteName={note?.name} noteId={noteId!} />
                  </TabsContent>

                  <TabsContent value="ai" className="mt-0 focus-visible:ring-0">
                    <StudyMaterials
                      noteId={noteId!}
                      noteQuery={noteQueryResponse}
                      setIsPolling={setIsPolling}
                    />
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </div>
      </div>

      {previewFile && (
        <FilePreviewDialog
          renderAsBlobUrl
          url={previewFile.url}
          name={previewFile.name}
          onClose={() => setPreviewFile(null)}
        />
      )}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .perspective-1000 { perspective: 1000px; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .animate-spin-slow { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
         @keyframes gradient-flow {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
      `,
        }}
      />
    </Layout>
  );
};

export default NoteDetailBase;

// Helper function for conditional classes
function cn(...inputs: any) {
  return inputs.filter(Boolean).join(" ");
}
