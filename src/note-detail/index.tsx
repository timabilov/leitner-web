import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import JSZip from "jszip";
import Zoom from "react-medium-image-zoom";

// --- RESIZABLE PANELS ---
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";

// --- Services & Store ---
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useUserStore } from "@/store/userStore";

// --- Components ---
import Layout from "@/components/layout";
import MarkdownView from "@/components/markdown-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ChevronDown,
  ChevronUp,
  Pencil,
  CornerDownLeft,
  Loader2,
  FileText,
  GripHorizontal, 
} from "lucide-react";
import { getNoteLanguageIso, getTypeIcon } from "@/notes/note-utils";
import AIIcon from "./assets/ai-icon";
import ChatInterface from "./chat-interface";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// --- Sub-Components ---
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

const StudioTabTrigger = ({ value, icon, label, active }: any) => (
  <TabsTrigger
    value={value}
    className={cn(
      "relative h-9 px-3 sm:px-4 gap-2 rounded-md transition-all font-medium text-sm tracking-tight",
      "data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-zinc-950 dark:data-[state=active]:text-zinc-50 data-[state=active]:shadow-sm",
      "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
    )}
    title={label}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </TabsTrigger>
);

// --- HELPER FUNCTIONS ---
const extractYouTubeID = (url: string) => {
  if (!url) return null;
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const sanitizeMarkdown = (text: string) => {
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
  const { companyId } = useUserStore();

  // Local UI State
  const [isMediaExpanded, setIsMediaExpanded] = useState(false);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [noteName, setNoteName] = useState<string>("");
  const [editNameMode, toggleEditNameMode] = useState<boolean>(false);

  // File State
  const [imagePaths, setImagePaths] = useState<any[]>([]);
  const [audioPaths, setAudioPaths] = useState<any[]>([]);
  const [pdfPaths, setPdfPaths] = useState<any[]>([]);
  const [textContent, setTextContent] = useState<string>("");
  const [isProcessingFiles, setProcessingFiles] = useState(false);
  
  // Pending Action
  const [pendingAiAction, setPendingAiAction] = useState<{
    type: "explain" | "quiz";
    text: string;
  } | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const handleTabChange = (value: string) => {
    setSearchParams(
      (prev) => {
        prev.set("tab", value);
        return prev;
      },
      { replace: true }
    );
  };

  const handleMarkdownAction = (text: string, type: "explain" | "quiz") => {
    setPendingAiAction({ type, text });
    setSearchParams(
      (prev) => {
        prev.set("tab", "chat");
        return prev;
      },
      { replace: true }
    );
  };

  // 1. Data Fetching
  const { data: noteQueryResponse, refetch } = useQuery({
    queryKey: [`notes-${noteId}`],
    queryFn: () =>
      axiosInstance.get(`${API_BASE_URL}/company/${companyId}/notes/${noteId}`),
    enabled: !!companyId,
    refetchInterval: (query: any) => {
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
    if (
      noteQueryResponse?.data?.status !== "failed" &&
      noteQueryResponse?.data?.status !== "transcribed" &&
      noteQueryResponse?.data?.status !== "draft"
    ) {
      setIsPolling(true);
      return true;
    } else {
      setIsPolling(false);
      return false;
    }
  }, [noteQueryResponse]);

  const note = useMemo(() => {
    if (noteQueryResponse?.data?.name)
      setNoteName(noteQueryResponse?.data?.name);
    return noteQueryResponse?.data || {};
  }, [noteQueryResponse]);

  const { data: filesResponse } = useQuery({
    queryKey: [`notes`, noteId, "file"],
    queryFn: () =>
      axiosInstance.get(
        `${API_BASE_URL}/company/${companyId}/notes/${noteId}/documents-url`
      ),
    enabled: !!note && note.note_type !== "youtube",
  });

  useEffect(() => {
    if (
      filesResponse?.data?.file_url &&
      !isProcessingFiles &&
      imagePaths.length === 0
    ) {
      handleUnzip(filesResponse.data.file_url);
    }
  }, [filesResponse]);

  const saveNameMutation = useMutation({
    mutationFn: async (newName: string) => {
      return axiosInstance.put(
        `${API_BASE_URL}/company/${companyId}/notes/${noteId}/name`,
        { name: newName }
      );
    },
    onSuccess: (res) => {
      toggleEditNameMode(false);
      setNoteName(res.data.name);
      refetch();
      toast.success(t("Note name updated"));
    },
    onError: () => {
      toast.error(t("Failed to update name"));
    },
  });

  const handleSaveName = () => {
    if (!noteName.trim()) {
      toast.error(t("Name cannot be empty"));
      return;
    }
    if (noteName === note.name) {
      toggleEditNameMode(false);
      return;
    }
    saveNameMutation.mutate(noteName);
  };

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

  const hasMedia = attachmentCount > 0 || note?.youtube_url;

  return (
    <Layout title={note?.name} noGap>
      <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-transparent">
        
        {/* --- FIXED HEADER --- */}
        <div className="flex-none bg-white dark:bg-zinc-950 z-40 border-b border-zinc-200/50">
          <div className="px-6 py-4">
            <div className="mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-zinc-400 max-w-3xl">
                  <Link to="/notes" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                    <LayoutGrid size={16} />
                  </Link>
                  <span className="text-zinc-300 dark:text-zinc-800">/</span>
                  <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold text-lg">
                    {note?.note_type === "youtube" ? <div className="w-6 h-6">{getTypeIcon(note?.note_type)}</div> : getTypeIcon(note?.note_type, 6)}
                    {editNameMode ? (
                      <Input
                        placeholder="Type here..."
                        className="border-none md:text-xl/4 md:max-h-[26px] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 py-0 px-0 w-[200px] sm:w-[400px] md:w-[600px]"
                        value={noteName}
                        onChange={(e) => setNoteName(e.target.value)}
                        name="noteName"
                        type="text"
                        autoFocus
                        disabled={saveNameMutation.isPending}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); handleSaveName(); }
                          if (e.key === "Escape") { e.currentTarget.blur(); setNoteName(note.name); toggleEditNameMode(false); }
                        }}
                      />
                    ) : isNoteProcessing ? (
                      t("Loading...")
                    ) : (
                      <span className="md:text-xl h-auto w-auto py-0 px-0 truncate max-w-[200px] sm:max-w-[400px] md:max-w-[600px]">
                        {note?.name || "-"}
                      </span>
                    )}
                    {!isNoteProcessing && (
                      <Tooltip delayDuration={300}>
                        <TooltipContent>{editNameMode ? "Save (Enter)" : "Edit name"}</TooltipContent>
                        <TooltipTrigger>
                          <button onClick={() => editNameMode ? handleSaveName() : toggleEditNameMode(true)} disabled={saveNameMutation.isPending} className="relative flex items-center justify-center h-8 w-8 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50">
                            <AnimatePresence mode="wait" initial={false}>
                              {saveNameMutation.isPending ? <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" /></motion.div>
                              : editNameMode ? <motion.div key="save" initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -5, opacity: 0 }}><CornerDownLeft className="w-3 h-3 text-zinc-900 dark:text-zinc-100" /></motion.div>
                              : <motion.div key="edit" initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -5, opacity: 0 }}><Pencil className="w-3.5 h-3.5 text-zinc-400" /></motion.div>}
                            </AnimatePresence>
                          </button>
                        </TooltipTrigger>
                      </Tooltip>
                    )}
                  </div>
                </div>
                {note?.youtube_url && (
                  <Tooltip>
                    <TooltipTrigger>
                      <button className={cn("h-8 w-8 flex items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors", isMediaExpanded ? "text-primary" : "text-zinc-500")} onClick={() => setIsMediaExpanded(!isMediaExpanded)}>
                        <MoreVertical size={16} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent><p className="text-background">{t("Toggle Media Tray")}</p></TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Meta Stats Row */}
              <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
                <MetaItem icon={<Calendar size={12} />} label={t("Created")} value={new Date(note?.created_at).toLocaleDateString()} />
                <MetaItem icon={<Globe size={12} />} label={t("Language")} value={getNoteLanguageIso(note?.language)} />
                <MetaItem icon={<Paperclip size={12} />} label={t("Attachments")} value={`${attachmentCount} items`} onClick={() => attachmentCount > 0 ? setIsMediaExpanded(!isMediaExpanded) : null} active={isMediaExpanded} iconEnd={attachmentCount ? (isMediaExpanded ? <ChevronUp /> : <ChevronDown />) : null} />
                <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                <Tooltip>
                  <TooltipContent><p>{note?.quiz_alerts_enabled ? t("Quiz reminders enabled") : t("Quiz reminders disabled")}</p></TooltipContent>
                  <TooltipTrigger>
                    <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full border transition-all shrink-0", note?.quiz_alerts_enabled ? "bg-zinc-900 border-zinc-900 text-white" : "bg-white border-zinc-200 text-zinc-400")}>
                      {note?.quiz_alerts_enabled ? <BellRing size={12} strokeWidth={3} /> : <BellOff size={12} />}
                      <span className="text-[10px] font-black uppercase tracking-widest">{note?.quiz_alerts_enabled ? "Alerts On" : "Alerts Off"}</span>
                    </div>
                  </TooltipTrigger>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        {/* --- RESIZABLE PANEL GROUP --- */}
        <div className="flex-1 min-h-0 flex flex-col">
          <PanelGroup direction="vertical">
            
            {/* PANEL 1: MEDIA TRAY */}
            {isMediaExpanded && hasMedia && (
              <>
                <Panel 
                  defaultSize={40} 
                  minSize={15} 
                  maxSize={80} 
                  order={1}
                  className="bg-zinc-50/50 dark:bg-zinc-900/20 border-b border-zinc-200/50"
                >
                  <div className="w-full h-full flex flex-col px-6 py-4">
                    {/* The Video Area */}
                    <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden">
                      <div className="w-full max-w-5xl flex flex-col gap-4 h-full">
                        
                        {/* 
                           UPDATED CSS for YOUTUBE VIDEO:
                           We use 'h-full', 'w-auto' and 'max-w-full' along with aspect-video.
                           This ensures that as the panel gets taller (drag down), the video height increases,
                           and the width scales accordingly.
                        */}
                        {note?.youtube_url && (
                          <div className="flex-1 min-h-0 flex items-center justify-center">
                             <div className="relative h-full w-auto max-w-full aspect-video rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm bg-black mx-auto">
                                <iframe 
                                  className="w-full h-full" 
                                  src={`https://www.youtube.com/embed/${extractYouTubeID(note.youtube_url)}`} 
                                  allowFullScreen 
                                  title="YouTube Video" 
                                />
                             </div>
                          </div>
                        )}

                        {/* Attachments at bottom of tray (fixed height) */}
                        {(imagePaths.length > 0 || audioPaths.length > 0 || pdfPaths.length > 0 || textContent) && (
                           <div className="shrink-0 max-h-[120px] overflow-y-auto space-y-2 pr-2 pt-2 border-t border-zinc-200/50">
                              {imagePaths.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 bg-zinc-50/50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                  {imagePaths.map((img, i) => <Zoom key={i}><img src={img.url} className="aspect-square object-cover rounded-md border border-zinc-200" /></Zoom>)}
                                </div>
                              )}
                              <div className="flex flex-wrap gap-2">
                                {audioPaths.map((aud, i) => <div key={i} className="min-w-[200px]"><AudioPlayer audio={aud} /></div>)}
                                {pdfPaths.map((pdf, i) => (
                                    <button key={i} onClick={() => setPreviewFile(pdf)} className="flex items-center gap-3 p-2 rounded-xl border border-zinc-200 bg-white hover:border-zinc-400 transition-all">
                                    <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600"><ScrollText size={16} /></div>
                                    <span className="text-sm font-semibold truncate max-w-[150px]">{pdf.name}</span>
                                    </button>
                                ))}
                              </div>
                              {textContent && (
                                <div className="mt-2 p-3 bg-zinc-50 border rounded-lg"><pre className="text-xs whitespace-pre-wrap">{textContent}</pre></div>
                              )}
                           </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Panel>
                
                {/* DRAG HANDLE */}
                <PanelResizeHandle className="h-4 bg-zinc-100/50 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center border-t border-zinc-200/20 cursor-row-resize">
                   <GripHorizontal className="h-3 w-3 text-zinc-400" />
                </PanelResizeHandle>
              </>
            )}

            {/* PANEL 2: TABS & CONTENT */}
            <Panel defaultSize={60} minSize={30} order={2}>
              <div className="flex flex-col h-full bg-transparent">
                
                {/* Tabs Header */}
                <div className="px-6 py-2 border-b border-zinc-200/50 bg-white dark:bg-zinc-950">
                  <Tabs value={activeTab} onValueChange={handleTabChange} asChild={false}>
                    <TabsList className="bg-zinc-100/50 dark:bg-zinc-900/50 p-1 border border-zinc-200/50 dark:border-zinc-800/50 h-11 w-full justify-start overflow-x-auto no-scrollbar">
                      <StudioTabTrigger value="overview" icon={<NotepadText size={14} />} label={t("Overview")} active={activeTab === "overview"} />
                      <StudioTabTrigger value="transcript" icon={<ScrollText size={14} />} label={t("Transcript")} active={activeTab === "transcript"} />
                      {!note?.processing_error_message && (
                        <>
                          <StudioTabTrigger value="chat" icon={<MessageSquare size={14} />} label={t("AI Chat")} active={activeTab === "chat"} />
                          <StudioTabTrigger value="ai" icon={<AIIcon size={31} className="w-31 h-31" />} label={t("AI Tools")} active={activeTab === "ai"} />
                        </>
                      )}
                    </TabsList>
                  </Tabs>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-0 overflow-hidden relative">
                  <Tabs value={activeTab} className="h-full flex flex-col">
                    {isNoteProcessing ? (
                      <div className="flex flex-col mt-20 h-full overflow-y-auto">
                        <div className="mx-auto my-10 flex flex-col items-center">
                          <AIIcon hideStar className="h-10 w-10 animate-spin-slow " />
                          <p className="text-xl mt-5" style={{ backgroundImage: "linear-gradient(to right, #71717a, #e4e4e7, #71717a)", backgroundSize: "200% auto", backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent", animation: "gradient-flow 4s linear infinite" }}>Processing</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <TabsContent value="overview" className="h-full overflow-y-auto p-6 mt-0 focus-visible:ring-0">
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="prose prose-zinc dark:prose-invert max-w-none pb-20">
                            {note?.processing_error_message ? (
                              <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 font-medium">{note.processing_error_message}</div>
                            ) : (
                              <MarkdownView onExplain={(text) => handleMarkdownAction(text, 'explain')} onQuiz={(text) => handleMarkdownAction(text, 'quiz')}>
                                {sanitizeMarkdown(note?.md_summary_ai)}
                              </MarkdownView>
                            )}
                          </motion.div>
                        </TabsContent>

                        <TabsContent value="transcript" className="h-full overflow-y-auto p-6 mt-0 focus-visible:ring-0">
                          <div className="bg-zinc-50/50 dark:bg-zinc-900/30 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 pb-20">
                            <MarkdownView onExplain={(text) => handleMarkdownAction(text, 'explain')} onQuiz={(text) => handleMarkdownAction(text, 'quiz')}>
                                {note?.transcript}
                            </MarkdownView>
                          </div>
                        </TabsContent>

                        <TabsContent value="chat" className="h-full flex flex-col mt-0 p-0 focus-visible:ring-0 overflow-hidden">
                          <ChatInterface 
                            noteName={note?.name}
                            noteId={noteId!}
                            pendingAction={pendingAiAction}
                            onActionComplete={() => setPendingAiAction(null)}
                          />
                        </TabsContent>

                        <TabsContent value="ai" className="h-full overflow-y-auto p-6 mt-0 focus-visible:ring-0">
                          <div className="pb-20">
                            <StudyMaterials noteId={noteId!} noteQuery={noteQueryResponse} setIsPolling={setIsPolling} />
                          </div>
                        </TabsContent>
                      </>
                    )}
                  </Tabs>
                </div>

              </div>
            </Panel>

          </PanelGroup>
        </div>
      </div>

      {previewFile && (
        <FilePreviewDialog renderAsBlobUrl url={previewFile.url} name={previewFile.name} onClose={() => setPreviewFile(null)} />
      )}
      <style dangerouslySetInnerHTML={{ __html: ` .perspective-1000 { perspective: 1000px; } .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; } .animate-spin-slow { animation: spin 2s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes gradient-flow { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } } `}} />
    </Layout>
  );
};

export default NoteDetailBase;

function cn(...inputs: any) {
  return inputs.filter(Boolean).join(" ");
}