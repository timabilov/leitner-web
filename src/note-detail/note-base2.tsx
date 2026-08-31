import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import JSZip from "jszip";

import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useUserStore } from "@/store/userStore";
import MarkdownView from "@/components/markdown-view";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FilePreviewDialog } from "@/components/file-preview-dialog";
import { StudyMaterials } from "./study-materials";
import * as Sentry from "@sentry/react";

import {
  ChevronLeft,
  CornerDownLeft,
  Loader2,
  Paperclip,
  ChevronDown,
  ImageIcon,
  FileAudioIcon,
  FileTextIcon,
  ScrollText,
  X,
  Play,
  FileIcon,
} from "lucide-react";
import AIIcon from "./assets/ai-icon";
import ChatInterface from "./chat-interface";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { usePostHog } from "posthog-js/react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// --- Inline SVG icons matching dc.html design ---
const StarHintIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M6 3.5 8 8l4.5 2L8 12l-2 4.5L4 12l-4.5-2L4 8z" transform="translate(6 3)" />
  </svg>
);

const QuizIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.4-3 4.4" />
    <circle cx="12" cy="12" r="9.2" />
    <circle cx="11.9" cy="17.8" r=".6" fill="currentColor" stroke="none" />
  </svg>
);

const ChatBubbleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
    <path d="M21 12a8 8 0 0 1-8 8H4.5l2-2.6A8 8 0 1 1 21 12z" />
  </svg>
);

const StudyBuddyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
    <path d="M11 21 8 8l12 5" fill="currentColor" />
    <path d="M37 21 40 8 28 13" fill="currentColor" />
    <circle cx="24" cy="28" r="15" fill="currentColor" />
  </svg>
);

const LayoutHalfIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <path d="M14.5 4v16" />
  </svg>
);

const LayoutFullIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
    <rect x="3" y="4" width="18" height="16" rx="3" />
  </svg>
);

// --- HELPERS ---
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
        word.length > 500 ? word.substring(0, 500) + "..." : word,
      )
      .join(" ");
  }
  return "";
};

// ============================================================
// COMPONENT
// ============================================================
const NoteDetailBase = () => {
  const { t } = useTranslation();
  const { noteId } = useParams();
  const { companyId } = useUserStore();
  const posthog = usePostHog();

  // --- UI State ---
  const [isMediaExpanded, setIsMediaExpanded] = useState(false);
  const [chatMode, setChatMode] = useState<"closed" | "half" | "full">("closed");
  const [sidebarActiveTab, setSidebarActiveTab] = useState("chat");
  const [isPolling, setIsPolling] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [noteName, setNoteName] = useState("");
  const [editNameMode, toggleEditNameMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // --- File State ---
  const [imagePaths, setImagePaths] = useState<any[]>([]);
  const [audioPaths, setAudioPaths] = useState<any[]>([]);
  const [pdfPaths, setPdfPaths] = useState<any[]>([]);
  const [textContent, setTextContent] = useState("");
  const [isProcessingFiles, setProcessingFiles] = useState(false);

  // --- Pending AI Action ---
  const [pendingAiAction, setPendingAiAction] = useState<{
    type: "explain" | "quiz";
    text: string;
  } | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const chatOpen = chatMode !== "closed";

  // --- Effects ---
  useEffect(() => {
    if (activeTab === "chat") {
      setChatMode((prev) => (prev === "closed" ? "half" : prev));
      setSidebarActiveTab("chat");
      setSearchParams(
        (prev) => {
          prev.set("tab", "overview");
          return prev;
        },
        { replace: true },
      );
    }
  }, [activeTab, setSearchParams]);

  useEffect(() => {
    if (selectedImage?.startsWith("blob:")) {
      return () => {
        URL.revokeObjectURL(selectedImage);
      };
    }
  }, [selectedImage]);

  useEffect(() => {
    if (noteId) posthog.capture("note_viewed", { note_id: noteId });
  }, [noteId, posthog]);

  // --- Handlers ---
  const handleTabChange = (value: string) => {
    posthog.capture("note_tab_changed", { note_id: noteId, tab: value });
    setSearchParams(
      (prev) => {
        prev.set("tab", value);
        return prev;
      },
      { replace: true },
    );
  };

  const handleMarkdownAction = (text: string, type: "explain" | "quiz") => {
    posthog.capture("markdown_action_clicked", {
      note_id: noteId,
      action_type: type,
    });
    setPendingAiAction({ type, text });
    setChatMode((prev) => (prev === "closed" ? "half" : prev));
    setSidebarActiveTab("chat");
  };

  const handleQuizMe = () => {
    posthog.capture("quiz_me_clicked", { note_id: noteId });
    setPendingAiAction({
      type: "quiz",
      text: t("Can you generate hard quiz for me?"),
    });
    setChatMode((prev) => (prev === "closed" ? "half" : prev));
    setSidebarActiveTab("chat");
  };

  // --- Data Fetching ---
  const { data: noteQueryResponse, refetch } = useQuery({
    queryKey: [`notes-${noteId}`],
    queryFn: () =>
      axiosInstance.get(`${API_BASE_URL}/company/${companyId}/notes/${noteId}`),
    enabled: !!companyId,
    refetchInterval: (query: any) => {
      try {
        const quiz_status = query.state?.data?.data?.quiz_status;
        const isNoteProcessing =
          query.state?.data?.data?.status !== "failed" &&
          query.state?.data?.data?.status !== "transcribed" &&
          query.state?.data?.data?.status !== "draft";
        return (isPolling && quiz_status === "in_progress") || isNoteProcessing
          ? 3000
          : false;
      } catch (e) {
        Sentry.captureException(e, { tags: { area: "note_polling_logic" } });
        return false;
      }
    },
  });

  useEffect(() => {
    if (isPolling) refetch();
  }, [isPolling, refetch]);

  const isNoteProcessing = useMemo(() => {
    if (
      noteQueryResponse?.data?.status !== "failed" &&
      noteQueryResponse?.data?.status !== "transcribed" &&
      noteQueryResponse?.data?.status !== "draft"
    ) {
      setIsPolling(true);
      return true;
    } else if (!isPolling) {
      setIsPolling(false);
      return false;
    }
  }, [noteQueryResponse, isPolling]);

  const note = useMemo(() => {
    if (noteQueryResponse?.data?.name)
      setNoteName(noteQueryResponse?.data?.name);
    return noteQueryResponse?.data || {};
  }, [noteQueryResponse]);

  const { data: filesResponse } = useQuery({
    queryKey: [`notes`, noteId, "file", note],
    queryFn: () =>
      axiosInstance.get(
        `${API_BASE_URL}/company/${companyId}/notes/${noteId}/documents-url`,
      ),
    enabled: note && note.note_type !== "youtube",
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

  // --- Name Editing ---
  const saveNameMutation = useMutation({
    mutationFn: async (newName: string) => {
      return axiosInstance.put(
        `${API_BASE_URL}/company/${companyId}/notes/${noteId}/name`,
        { name: newName },
      );
    },
    onSuccess: (res) => {
      toggleEditNameMode(false);
      setNoteName(res.data.name);
      refetch();
      toast.success(t("Note name updated"));
      posthog.capture("note_renamed", { note_id: noteId });
    },
    onError: (error) => {
      toast.error(t("Failed to update name"));
      Sentry.captureException(error, {
        tags: { query: "note_renamed_failed" },
      });
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

  // --- File Unzip ---
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
      zip.forEach((_path, entry) => {
        promises.push(
          (async () => {
            const rawBlob = await entry.async("blob");
            const name = entry.name.toLowerCase();
            if (/\.(jpg|jpeg|png|webp|gif)$/.test(name))
              imgs.push({
                name: entry.name,
                url: URL.createObjectURL(rawBlob),
              });
            else if (/\.(mp3|wav|m4a|ogg|webm)$/.test(name))
              auds.push({
                name: entry.name,
                url: URL.createObjectURL(rawBlob),
              });
            else if (name.endsWith(".pdf")) {
              const pdfBlob = new Blob([rawBlob], { type: "application/pdf" });
              pdfs.push({
                name: entry.name,
                url: URL.createObjectURL(pdfBlob),
              });
            } else if (name.endsWith(".txt"))
              txt += (await entry.async("string")) + "\n";
          })(),
        );
      });
      await Promise.all(promises);
      setImagePaths(imgs);
      setAudioPaths(auds);
      setPdfPaths(pdfs);
      setTextContent(txt);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: "unzip_files" },
        extra: { noteId, url },
      });
      toast.error(t("Failed to load attachments"));
    } finally {
      setProcessingFiles(false);
    }
  };

  const attachmentCount =
    imagePaths.length +
    audioPaths.length +
    pdfPaths.length +
    (textContent ? 1 : 0);

  // --- Grid columns based on chat mode ---
  const gridCols =
    chatMode === "closed"
      ? "minmax(0,1fr)"
      : chatMode === "full"
        ? "1fr"
        : "minmax(0,1fr) minmax(300px,380px)";

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      <div
        className="v2-note-page-pad"
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "26px 34px 60px",
          fontSize: 14,
          lineHeight: 1.55,
        }}
      >
        {/* ====== HEADER ROW ====== */}
        <div
          className="v2-note-header"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          {/* Back button */}
          <Link
            to="/notes"
            title={t("Back")}
            className="v2-back-btn"
            style={{
              width: 34,
              height: 34,
              borderRadius: 11,
              border: "1px solid var(--v2-line)",
              background: "var(--v2-panel)",
              color: "var(--v2-ink)",
              display: "grid",
              placeItems: "center",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={16} />
          </Link>

          {/* Title + edit */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
            }}
          >
            {editNameMode ? (
              <Input
                placeholder="Type here..."
                value={noteName}
                onChange={(e) => setNoteName(e.target.value)}
                autoFocus
                disabled={saveNameMutation.isPending}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.currentTarget.blur();
                    handleSaveName();
                  }
                  if (e.key === "Escape") {
                    e.currentTarget.blur();
                    setNoteName(note.name);
                    toggleEditNameMode(false);
                  }
                }}
                className="font-heading border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  background: "transparent",
                  padding: 0,
                  width: "100%",
                  maxWidth: 500,
                }}
              />
            ) : (
              <h1
                className="font-heading"
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {isNoteProcessing ? t("Loading...") : note?.name || "-"}
              </h1>
            )}

            {/* Retitle / Save button */}
            {!isNoteProcessing && (
              <button
                onClick={() =>
                  editNameMode ? handleSaveName() : toggleEditNameMode(true)
                }
                disabled={saveNameMutation.isPending}
                title={editNameMode ? t("Save (Enter)") : t("AI title ideas")}
                style={{
                  height: 30,
                  padding: "0 11px",
                  borderRadius: 999,
                  border: "1px solid var(--v2-line)",
                  background: "var(--v2-panel2)",
                  color: "var(--v2-ink)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  flex: "0 0 auto",
                }}
              >
                {saveNameMutation.isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : editNameMode ? (
                  <CornerDownLeft size={13} />
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.4 6.1 6.1 2.4-6.1 2.4L12 19.5 9.6 13.4 3.5 11l6.1-2.4z" /></svg>
                )}
                {editNameMode ? t("Save") : t("Retitle")}
              </button>
            )}
          </div>

          <div style={{ flex: 1 }} />

          {/* Date pill */}
          <span
            data-v2-hide-sm=""
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "var(--v2-mut)",
              border: "1px solid var(--v2-line)",
              borderRadius: 999,
              padding: "5px 11px",
              background: "var(--v2-panel)",
            }}
          >
            {note?.created_at
              ? new Date(note.created_at).toLocaleDateString()
              : ""}
          </span>

          {/* Attachments pill / dropdown */}
          {!note?.youtube_url && attachmentCount > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-v2-hide-sm=""
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: "var(--v2-mut)",
                    border: "1px solid var(--v2-line)",
                    borderRadius: 999,
                    padding: "5px 11px",
                    background: "var(--v2-panel)",
                    cursor: "pointer",
                  }}
                >
                  <Paperclip size={12} />
                  {attachmentCount} {t("files")}
                  <ChevronDown size={12} style={{ opacity: 0.5 }} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-64 p-1 rounded-xl shadow-xl z-50"
                style={{
                  background: "var(--v2-panel)",
                  border: "1px solid var(--v2-line)",
                }}
              >
                {pdfPaths.map((pdf, i) => (
                  <DropdownMenuItem
                    key={`pdf-${i}`}
                    onClick={() => setPreviewFile(pdf)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                    style={{ color: "var(--v2-ink)" }}
                  >
                    <ScrollText size={16} className="text-red-500 shrink-0" />
                    <span className="truncate font-medium">{pdf.name}</span>
                  </DropdownMenuItem>
                ))}
                {imagePaths.map((img, i) => (
                  <DropdownMenuItem
                    key={`img-${i}`}
                    onClick={() => setSelectedImage(img.url)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                    style={{ color: "var(--v2-ink)" }}
                  >
                    <ImageIcon size={16} className="text-blue-500 shrink-0" />
                    <span className="truncate font-medium">{img.name}</span>
                  </DropdownMenuItem>
                ))}
                {audioPaths.map((aud, i) => (
                  <DropdownMenuItem
                    key={`aud-${i}`}
                    onClick={() => window.open(aud.url, "_blank")}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                    style={{ color: "var(--v2-ink)" }}
                  >
                    <FileAudioIcon
                      size={16}
                      className="text-amber-500 shrink-0"
                    />
                    <span className="truncate font-medium">{aud.name}</span>
                  </DropdownMenuItem>
                ))}
                {textContent && (
                  <DropdownMenuItem
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                    style={{ color: "var(--v2-mut)" }}
                  >
                    <FileTextIcon size={16} className="shrink-0" />
                    <span className="truncate font-medium">
                      {t("Extracted Text")}
                    </span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            !note?.youtube_url && (
              <span
                data-v2-hide-sm=""
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "var(--v2-mut)",
                  border: "1px solid var(--v2-line)",
                  borderRadius: 999,
                  padding: "5px 11px",
                  background: "var(--v2-panel)",
                }}
              >
                <Paperclip size={12} /> 0 {t("files")}
              </span>
            )
          )}

          {/* YouTube toggle */}
          {note?.youtube_url && (
            <button
              onClick={() => setIsMediaExpanded(!isMediaExpanded)}
              title={
                isMediaExpanded ? t("Hide video") : t("Show video")
              }
              style={{
                height: 34,
                padding: "0 12px",
                borderRadius: 11,
                border: "1px solid var(--v2-line)",
                background: isMediaExpanded
                  ? "rgba(128,128,128,0.12)"
                  : "transparent",
                color: "var(--v2-mut)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 500,
                transition: "background .15s, color .15s",
              }}
            >
              <Play size={13} />
              {!isMediaExpanded && <span>{t("Watch video")}</span>}
              {isMediaExpanded && <span>{t("Hide video")}</span>}
            </button>
          )}
        </div>

        {/* ====== YOUTUBE EMBED ====== */}
        {note?.youtube_url && isMediaExpanded && (
          <div
            style={{
              margin: "0 0 16px",
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid var(--v2-line)",
              aspectRatio: "16/9",
              maxHeight: 400,
              background: "#000",
            }}
          >
            <iframe
              style={{ width: "100%", height: "100%", border: "none" }}
              src={`https://www.youtube.com/embed/${extractYouTubeID(note.youtube_url)}`}
              allowFullScreen
              title="YouTube Video"
            />
          </div>
        )}

        {/* ====== PROCESSING STATE (old UI) ====== */}
        {isNoteProcessing ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minHeight: 400,
              paddingTop: 80,
            }}
          >
            <AIIcon hideStar className="h-10 w-10 v2-animate-spin-slow" />
            <p
              className="text-xl mt-5"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #71717a, #e4e4e7, #71717a)",
                backgroundSize: "200% auto",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                animation: "v2-gradient-flow-text 4s linear infinite",
              }}
            >
              {t("Processing")}
            </p>

            {note?.attachments?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="w-full max-w-xl mx-auto px-6 flex flex-col gap-4"
                style={{ marginTop: 24 }}
              >
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--v2-mut)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    textAlign: "center",
                    marginBottom: 4,
                  }}
                >
                  {
                    note.attachments.filter((a: any) => a.progress >= 1)
                      .length
                  }{" "}
                  / {note.attachments.length} {t("files ready")}
                </p>
                {(() => {
                  const sorted = [...note.attachments].sort(
                    (a: any, b: any) => a.id - b.id,
                  );
                  return sorted.map((attachment: any, idx: number) => {
                    const pct = Math.round(
                      (attachment.progress ?? 0) * 100,
                    );
                    const done = pct >= 100;
                    const label = (() => {
                      const ft = attachment.file_type || "file";
                      const key = ft.toLowerCase();
                      let count = 1;
                      for (let i = 0; i < idx; i++) {
                        if (
                          (sorted[i].file_type || "file").toLowerCase() ===
                          key
                        )
                          count++;
                      }
                      return `${key.charAt(0).toUpperCase() + key.slice(1)} ${count}`;
                    })();
                    const confettiParticles = done
                      ? Array.from({ length: 8 }, (_, i) => ({
                          id: i,
                          x: (Math.random() - 0.5) * 120,
                          y: -(Math.random() * 40 + 15),
                          rotate: Math.random() * 360,
                          scale: Math.random() * 0.5 + 0.5,
                          color: [
                            "#FE5E5F",
                            "#C04796",
                            "#F9A8D4",
                            "#FDA4AF",
                            "#71717A",
                            "#A1A1AA",
                          ][i % 6],
                        }))
                      : [];
                    return (
                      <motion.div
                        key={attachment.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.35,
                          delay: 0.4 + idx * 0.1,
                        }}
                        className="flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="flex items-center gap-2 text-sm font-medium"
                            style={{ color: "var(--v2-ink)" }}
                          >
                            {(
                              attachment.file_type || ""
                            ).toLowerCase() === "audio" ? (
                              <Play
                                size={15}
                                style={{ color: "var(--v2-mut)" }}
                              />
                            ) : (
                              <FileIcon
                                size={15}
                                style={{ color: "var(--v2-mut)" }}
                              />
                            )}
                            {label}
                          </span>
                          <span
                            className="tabular-nums text-sm font-semibold ml-2 shrink-0"
                            style={{
                              color: done
                                ? "var(--v2-ink)"
                                : "var(--v2-mut)",
                              transition: "color 0.5s",
                            }}
                          >
                            {done ? t("Done") : `${pct}%`}
                          </span>
                        </div>
                        <div className="relative">
                          <div
                            className="h-2.5 w-full rounded-full overflow-hidden relative"
                            style={{ background: "var(--v2-panel2)" }}
                          >
                            <motion.div
                              className="h-full rounded-full"
                              style={{
                                background: done
                                  ? "var(--v2-ink)"
                                  : "var(--v2-mut)",
                                transition: "background-color 0.7s",
                              }}
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.max(pct, 2)}%`,
                              }}
                              transition={{
                                duration: 0.8,
                                ease: [0.4, 0, 0.2, 1],
                              }}
                            />
                            {!done && (
                              <div
                                className="absolute inset-0 rounded-full pointer-events-none"
                                style={{
                                  backgroundImage:
                                    "linear-gradient(90deg, transparent 0%, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%, transparent 100%)",
                                  backgroundSize: "200% 100%",
                                  animation:
                                    "v2-shimmer 2s ease-in-out infinite",
                                }}
                              />
                            )}
                          </div>
                          {done &&
                            confettiParticles.map((p) => (
                              <motion.div
                                key={p.id}
                                initial={{
                                  opacity: 1,
                                  x: 0,
                                  y: 0,
                                  scale: 0,
                                }}
                                animate={{
                                  opacity: 0,
                                  x: p.x,
                                  y: p.y,
                                  scale: p.scale,
                                  rotate: p.rotate,
                                }}
                                transition={{
                                  duration: 0.7,
                                  ease: "easeOut",
                                }}
                                className="absolute pointer-events-none"
                                style={{
                                  left: "50%",
                                  top: "50%",
                                  width: 5,
                                  height: 5,
                                  borderRadius:
                                    p.id % 2 === 0 ? "50%" : "1px",
                                  backgroundColor: p.color,
                                }}
                              />
                            ))}
                        </div>
                      </motion.div>
                    );
                  });
                })()}
              </motion.div>
            )}
          </div>
        ) : (
          <>
            {/* ====== STICKY TOOLBAR (hidden in full chat mode) ====== */}
            <div
              className="v2-note-toolbar"
            >
              {/* Tab group */}
              <div
                style={{
                  display: "inline-flex",
                  background: "var(--v2-panel)",
                  border: "1px solid var(--v2-line)",
                  borderRadius: 13,
                  padding: 4,
                  gap: 2,
                  boxShadow: "var(--v2-shadow)",
                }}
              >
                <button
                  onClick={() => handleTabChange("overview")}
                  style={{
                    height: 32,
                    padding: "0 16px",
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    background:
                      activeTab === "overview"
                        ? "var(--v2-ink)"
                        : "transparent",
                    color:
                      activeTab === "overview"
                        ? "var(--v2-bg)"
                        : "var(--v2-mut)",
                    transition: "all .15s",
                  }}
                >
                  {t("Overview")}
                </button>
                <button
                  onClick={() => handleTabChange("transcript")}
                  style={{
                    height: 32,
                    padding: "0 16px",
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    background:
                      activeTab === "transcript"
                        ? "var(--v2-ink)"
                        : "transparent",
                    color:
                      activeTab === "transcript"
                        ? "var(--v2-bg)"
                        : "var(--v2-mut)",
                    transition: "all .15s",
                  }}
                >
                  {t("Transcript")}
                </button>
              </div>

              {/* Selection hint */}
              <span
                data-v2-hide-sm=""
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12.5,
                  color: "var(--v2-mut)",
                  background: "var(--v2-panel)",
                  border: "1px solid var(--v2-line)",
                  borderRadius: 999,
                  padding: "7px 13px",
                  fontWeight: 500,
                }}
              >
                <StarHintIcon />
                {t("Select any text to ask or quiz")}
              </span>

              <div style={{ flex: 1 }} />

              {/* Quiz me button — opens chat */}
              <button
                onClick={handleQuizMe}
                data-v2-hit=""
                style={{
                  height: 36,
                  padding: "0 14px",
                  borderRadius: 12,
                  border: "1px solid var(--v2-line)",
                  background: "var(--v2-panel)",
                  color: "var(--v2-ink)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <QuizIcon />
                {t("Quiz me")}
              </button>

              {/* Chat toggle */}
              <button
                onClick={() =>
                  setChatMode(chatOpen ? "closed" : "half")
                }
                data-v2-hit=""
                style={{
                  height: 36,
                  padding: "0 15px",
                  borderRadius: 12,
                  border: chatOpen
                    ? "1px solid var(--v2-line)"
                    : "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  background: chatOpen
                    ? "var(--v2-panel2)"
                    : "var(--v2-ink)",
                  color: chatOpen ? "var(--v2-ink)" : "var(--v2-bg)",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  transition: "transform .15s",
                }}
              >
                <ChatBubbleIcon />
                {chatOpen ? t("Chat on") : t("Chat")}
              </button>
            </div>

            {/* ====== CONTENT GRID ====== */}
            <div
              className="v2-note-grid"
              style={{
                gridTemplateColumns: gridCols,
                gap: chatMode === "full" ? 0 : 18,
              }}
            >
              {/* --- Content Panel --- */}
              <div
                style={{
                  position: "relative",
                  background: "var(--v2-panel)",
                  border: "1px solid var(--v2-line)",
                  borderRadius: 18,
                  boxShadow: "var(--v2-shadow)",
                  padding: "34px 40px 44px",
                  minWidth: 0,
                  overflow: "hidden",
                  display: chatMode === "full" ? "none" : undefined,
                }}
              >
                {activeTab === "overview" && (
                  <article
                    className="v2-fade-up"
                    style={{ maxWidth: 760, fontSize: 15 }}
                  >
                    {note?.processing_error_message ? (
                      <div
                        style={{
                          padding: 16,
                          borderRadius: 12,
                          background: "rgba(210,69,59,.08)",
                          border: "1px solid rgba(210,69,59,.2)",
                          color: "var(--v2-bad)",
                          fontWeight: 500,
                        }}
                      >
                        {note.processing_error_message}
                      </div>
                    ) : (
                      <div className="prose prose-zinc dark:prose-invert max-w-none">
                        <MarkdownView
                          onExplain={(text) =>
                            handleMarkdownAction(text, "explain")
                          }
                          onQuiz={(text) =>
                            handleMarkdownAction(text, "quiz")
                          }
                        >
                          {sanitizeMarkdown(note?.md_summary_ai)}
                        </MarkdownView>
                      </div>
                    )}
                  </article>
                )}

                {activeTab === "transcript" && (
                  <article
                    className="v2-fade-up"
                    style={{
                      maxWidth: 760,
                      fontSize: 15,
                      lineHeight: 1.75,
                    }}
                  >
                    <MarkdownView
                      onExplain={(text) =>
                        handleMarkdownAction(text, "explain")
                      }
                      onQuiz={(text) =>
                        handleMarkdownAction(text, "quiz")
                      }
                    >
                      {note?.transcript}
                    </MarkdownView>
                  </article>
                )}
              </div>

              {/* --- Chat Panel --- */}
              {chatOpen && (
                <aside
                  className="v2-chat-panel"
                  data-mode={chatMode}
                  style={{
                    background: "var(--v2-panel)",
                    border: "1px solid var(--v2-line)",
                    borderRadius: 18,
                    boxShadow: "var(--v2-shadow)",
                    height: "calc(100dvh - 170px)",
                    justifySelf: "stretch",
                  }}
                >
                  {/* Chat header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "11px 13px",
                      borderBottom: "1px solid var(--v2-line)",
                      flexShrink: 0,
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 11,
                        background: "var(--v2-ink)",
                        display: "grid",
                        placeItems: "center",
                        color: "var(--v2-bg)",
                      }}
                    >
                      <StudyBuddyIcon />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <strong
                        style={{ fontSize: 13.5, display: "block" }}
                      >
                        {t("Study buddy")}
                      </strong>
                      <span
                        style={{
                          fontSize: 11.5,
                          color: "var(--v2-ok)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "var(--v2-ok)",
                          }}
                        />
                        {t("knows this note")}
                      </span>
                    </div>

                    <div
                      style={{
                        marginLeft: "auto",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {/* Layout toggle */}
                      <div
                        style={{
                          display: "inline-flex",
                          background: "var(--v2-panel2)",
                          borderRadius: 10,
                          padding: 2,
                          gap: 2,
                        }}
                      >
                        <button
                          onClick={() => setChatMode("half")}
                          title={t("Side-by-side")}
                          style={{
                            width: 30,
                            height: 26,
                            border: "none",
                            borderRadius: 8,
                            cursor: "pointer",
                            display: "grid",
                            placeItems: "center",
                            background:
                              chatMode === "half"
                                ? "var(--v2-panel)"
                                : "transparent",
                            color:
                              chatMode === "half"
                                ? "var(--v2-ink)"
                                : "var(--v2-mut)",
                            boxShadow:
                              chatMode === "half"
                                ? "var(--v2-shadow-sm)"
                                : "none",
                            transition: "all .15s",
                          }}
                        >
                          <LayoutHalfIcon />
                        </button>
                        <button
                          onClick={() => setChatMode("full")}
                          title={t("Full chat")}
                          style={{
                            width: 30,
                            height: 26,
                            border: "none",
                            borderRadius: 8,
                            cursor: "pointer",
                            display: "grid",
                            placeItems: "center",
                            background:
                              chatMode === "full"
                                ? "var(--v2-panel)"
                                : "transparent",
                            color:
                              chatMode === "full"
                                ? "var(--v2-ink)"
                                : "var(--v2-mut)",
                            boxShadow:
                              chatMode === "full"
                                ? "var(--v2-shadow-sm)"
                                : "none",
                            transition: "all .15s",
                          }}
                        >
                          <LayoutFullIcon />
                        </button>
                      </div>

                      {/* Close */}
                      <button
                        onClick={() => setChatMode("closed")}
                        title={t("Close chat")}
                        data-v2-hit=""
                        style={{
                          width: 28,
                          height: 28,
                          border: "none",
                          borderRadius: 9,
                          background: "transparent",
                          color: "var(--v2-mut)",
                          cursor: "pointer",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Full-mode breadcrumb */}
                  {chatMode === "full" && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 14px",
                        borderBottom: "1px solid var(--v2-line)",
                        background: "var(--v2-panel2)",
                        fontSize: 12,
                        color: "var(--v2-mut)",
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      >
                        <path d="M12 3 3 8l9 5 9-5zM3 12.5l9 5 9-5" />
                      </svg>
                      {t("Full chat over")}{" "}
                      <strong
                        style={{
                          color: "var(--v2-ink)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {note?.name}
                      </strong>
                      <button
                        onClick={() => setChatMode("half")}
                        style={{
                          marginLeft: "auto",
                          border: "none",
                          background: "transparent",
                          color: "var(--v2-ink)",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        {t("Show note")}
                      </button>
                    </div>
                  )}

                  {/* Panel content tabs (Chat / AI Tools) */}
                  <div
                    style={{
                      display: "flex",
                      gap: 2,
                      padding: "6px 13px",
                      borderBottom: "1px solid var(--v2-line)",
                      flexShrink: 0,
                    }}
                  >
                    <button
                      onClick={() => setSidebarActiveTab("chat")}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 8,
                        border: "none",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        background:
                          sidebarActiveTab === "chat"
                            ? "var(--v2-accent-soft)"
                            : "transparent",
                        color:
                          sidebarActiveTab === "chat"
                            ? "var(--v2-ink)"
                            : "var(--v2-mut)",
                      }}
                    >
                      {t("Chat")}
                    </button>
                    {!note?.processing_error_message && (
                      <button
                        onClick={() => setSidebarActiveTab("ai")}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 8,
                          border: "none",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          background:
                            sidebarActiveTab === "ai"
                              ? "var(--v2-accent-soft)"
                              : "transparent",
                          color:
                            sidebarActiveTab === "ai"
                              ? "var(--v2-ink)"
                              : "var(--v2-mut)",
                        }}
                      >
                        {t("AI Tools")}
                      </button>
                    )}
                  </div>

                  {/* Chat / AI content */}
                  <div
                    style={{
                      flex: 1,
                      minHeight: 0,
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {sidebarActiveTab === "chat" ? (
                      <ChatInterface
                        noteName={note?.name}
                        noteId={noteId!}
                        pendingAction={pendingAiAction}
                        onActionComplete={() =>
                          setPendingAiAction(null)
                        }
                        chatOpen={chatOpen}
                      />
                    ) : !note?.processing_error_message ? (
                      <div
                        style={{
                          height: "100%",
                          overflowY: "auto",
                          padding: 16,
                        }}
                      >
                        <StudyMaterials
                          noteId={noteId!}
                          noteQuery={noteQueryResponse}
                          setIsPolling={setIsPolling}
                        />
                      </div>
                    ) : null}
                  </div>
                </aside>
              )}
            </div>
          </>
        )}
      </div>

      {/* ====== DIALOGS ====== */}
      {previewFile && (
        <FilePreviewDialog
          name={previewFile?.name || ""}
          file={previewFile}
          url={previewFile.url}
          onClose={() => setPreviewFile(null)}
        />
      )}
      <Dialog
        open={!!selectedImage}
        onOpenChange={(open) => !open && setSelectedImage(null)}
      >
        <DialogContent className="max-w-[95vw] md:max-w-3xl lg:max-w-5xl p-2 md:p-6 overflow-hidden">
          <div className="relative flex items-center justify-center w-full max-h-[85vh]">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Preview"
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-sm"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ====== SCOPED STYLES ====== */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .v2-note-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 14px 0 16px;
          position: sticky;
          top: 10px;
          z-index: 20;
        }
        .v2-note-grid {
          display: grid;
          align-items: start;
          transition: grid-template-columns 0.3s ease, gap 0.3s ease;
        }
        .v2-chat-panel {
          position: sticky;
          top: 74px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: v2-popIn 0.2s ease both;
          width: 100%;
          min-height: 420px;
        }
        .v2-back-btn:hover {
          border-color: var(--v2-ink) !important;
        }
        .v2-animate-spin-slow {
          animation: v2-spin 2s linear infinite;
        }
        @keyframes v2-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes v2-gradient-flow-text {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes v2-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @media (max-width: 980px) {
          .v2-note-grid { grid-template-columns: 1fr !important; }
          .v2-chat-panel {
            position: fixed !important;
            top: auto !important;
            inset: auto 6px 6px 6px !important;
            height: 82dvh !important;
            min-height: 0 !important;
            max-width: none !important;
            margin: 0 !important;
            z-index: 75;
            box-shadow: 0 -10px 44px -10px rgba(0,0,0,.35) !important;
          }
          .v2-chat-panel[data-mode="full"] {
            inset: 0 !important;
            height: 100dvh !important;
            border-radius: 0 !important;
          }
          .v2-note-page-pad { padding: 22px 18px 90px !important; }
          .v2-note-header { flex-wrap: wrap; }
          .v2-note-toolbar { flex-wrap: wrap; position: static !important; }
        }
      `,
        }}
      />
    </>
  );
};

export default NoteDetailBase;
