"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AudioVisualizer } from "@/components/audio-visualiser";
import TextareaAutosize from "react-textarea-autosize";
import { motion, AnimatePresence } from "framer-motion";
import { usePostHog } from 'posthog-js/react';
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import * as Sentry from "@sentry/react";

// --- Services & Utils ---
import { axiosInstance, convertBlobToWav, createZip2, uploadFileToCF } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/lib/utils";

// --- Components ---
import { FilePreviewDialog } from "@/components/file-preview-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  File as FileIcon, Image as ImageIcon, X, Paperclip, StopCircle, UploadCloud,
  ChevronDown, Loader2, RefreshCw, Pause, Play, Trash2,
  MessageCircle, Layers, Plus, Send, Check
} from "lucide-react";
import { NoteCreationToast } from "./note-creation-toast";
import { useNavigate } from "react-router";
import FolderSelect from "@/components/select-folder";
import { useFolders } from "@/hooks/use-folders";

// ============================================================================
// YouTube URL helpers
// ============================================================================
const YOUTUBE_INLINE_REGEX =
  /(?:https?:\/\/)?(?:www\.|m\.)?(?:(?:youtube\.com\/(?:watch\?v=|v\/|embed\/|live\/))|(?:youtu\.be|y2u\.be)\/)([a-zA-Z0-9_-]{11})[a-zA-Z0-9_-]*(?:[?&]\S*)?/i;

function extractYouTubeUrl(text: string): { url: string; videoId: string } | null {
  const match = text.match(YOUTUBE_INLINE_REGEX);
  if (!match) return null;
  return { url: match[0], videoId: match[1] };
}

// ============================================================================
// 1. HOOK: useAudioRecorder
// ============================================================================
const useAudioRecorder = (onStopCallback: (blob: Blob) => void) => {
  const [status, setStatus] = useState<"idle" | "recording" | "paused">("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState("default");
  const [isBlocked, setIsBlocked] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(0);
  const accumulatedTimeRef = useRef(0);
  const mimeTypeRef = useRef("audio/webm");
  const shouldSaveRef = useRef(true);

  const getDevices = async (requestPerms = false) => {
    setIsFetching(true);
    setIsBlocked(false);
    try {
      if (requestPerms) {
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        tempStream.getTracks().forEach(t => t.stop());
      }
      const dev = await navigator.mediaDevices.enumerateDevices();
      setDevices(dev.filter(d => d.kind === "audioinput"));
    } catch (err: any) {
      if (err.name === "NotAllowedError") setIsBlocked(true);
    } finally {
      setIsFetching(false);
    }
  };

  const start = async () => {
    try {
      const constraints = { audio: { deviceId: selectedMicId !== "default" ? { exact: selectedMicId } : undefined } };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      let mimeType = "audio/webm";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/mp4")) mimeType = "audio/mp4";
        else if (MediaRecorder.isTypeSupported("audio/webm")) mimeType = "audio/webm";
      }
      mimeTypeRef.current = mimeType;

      mediaRecorderRef.current = new MediaRecorder(mediaStream, { mimeType });
      chunksRef.current = [];
      shouldSaveRef.current = true;

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        clearInterval(timerRef.current!);
       if (shouldSaveRef.current) {
          const type = mediaRecorderRef.current?.mimeType || mimeTypeRef.current;
          const blob = new Blob(chunksRef.current, { type });
          if (blob.size > 0) onStopCallback(blob);
        }
        chunksRef.current = [];
        setStatus("idle");
        setStream(null);
        setElapsedTime(0);
        accumulatedTimeRef.current = 0;
        mediaStream.getTracks().forEach(t => t.stop());
      };

      mediaRecorderRef.current.start(200);
      setStatus("recording");
      startTimeRef.current = Date.now();
      accumulatedTimeRef.current = 0;
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTimeRef.current);
      }, 100);

    } catch (err: any) {
      if (err.name === "NotAllowedError") setIsBlocked(true);
      console.error(err);
      Sentry.captureException(err, { tags: { section: "audio_recorder" } });
    }
  };

  const pause = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setStatus("paused");
      clearInterval(timerRef.current!);
      accumulatedTimeRef.current += Date.now() - startTimeRef.current;
    }
  };

  const resume = () => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setStatus("recording");
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedTime(accumulatedTimeRef.current + (Date.now() - startTimeRef.current));
      }, 100);
    }
  };

  const stop = (shouldSave = true) => {
    shouldSaveRef.current = shouldSave;
    if (!shouldSave) chunksRef.current = [];
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
  };

  return {
    status, stream, elapsedTime, devices, selectedMicId, isBlocked, isFetching,
    start, stop, pause, resume, getDevices, setSelectedMicId
  };
};

// ============================================================================
// 2. SUB-COMPONENT: AudioPreview
// ============================================================================
const AudioPreview = ({ file, loading, onRemove }: { file: any, loading: boolean, onRemove: () => void }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = (e: any) => {
    e.stopPropagation();
    isPlaying ? audioRef.current?.pause() : audioRef.current?.play();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors"
      style={{ background: "var(--v2-panel2)", borderColor: "var(--v2-line)" }}
    >
      <audio ref={audioRef} src={file.preview} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} />
      <button className="h-6 w-6 rounded-full flex items-center justify-center border-none bg-transparent cursor-pointer text-[var(--v2-ink)]" onClick={togglePlay}>
        {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      </button>
      <span className="max-w-[120px] truncate font-medium text-[var(--v2-ink)]">{file.name}</span>
      {!loading && (
        <button
          className="absolute -right-2 -top-2 h-5 w-5 rounded-full border flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          style={{ background: "var(--v2-panel)", borderColor: "var(--v2-line)", color: "var(--v2-mut)" }}
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </motion.div>
  );
};

// ============================================================================
// 3. SUB-COMPONENT: YouTubePreviewCard
// ============================================================================
function YouTubePreviewCard({
  url,
  videoId,
  onRemove,
  linkStatus,
}: {
  url: string;
  videoId: string;
  onRemove: () => void;
  linkStatus: "checking" | "verified" | "failed";
}) {
  const { t } = useTranslation();

  const borderColor =
    linkStatus === "failed" ? "var(--v2-err, #ef4444)" :
    linkStatus === "verified" ? "var(--v2-ok)" :
    "var(--v2-line)";

  const bgMix =
    linkStatus === "failed" ? "color-mix(in srgb, var(--v2-err, #ef4444) 4%, var(--v2-panel))" :
    linkStatus === "verified" ? "color-mix(in srgb, var(--v2-ok) 4%, var(--v2-panel))" :
    "var(--v2-panel)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-3 rounded-2xl border-2 px-4 py-3 mx-1 mb-1"
      style={{ borderColor, background: bgMix }}
    >
      {/* Thumbnail with play overlay */}
      <div className="w-16 h-10 rounded-lg overflow-hidden relative shrink-0 bg-[var(--v2-ink)]">
        <img
          src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M8 5.5v13L19.5 12z" />
          </svg>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold text-[var(--v2-ink)]">{t("YouTube video")}</span>
          {linkStatus === "checking" && (
            <span className="flex items-center gap-1 text-[12px] font-semibold text-[var(--v2-mut)]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="yt-checking-dots">{t("Checking link")}</span>
            </span>
          )}
          {linkStatus === "verified" && (
            <span className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: "var(--v2-ok)" }}>
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
              {t("Link verified")}
            </span>
          )}
          {linkStatus === "failed" && (
            <span className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: "var(--v2-err, #ef4444)" }}>
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              {t("Invalid link")}
            </span>
          )}
        </div>
        <p className="text-[12px] text-[var(--v2-mut)] truncate mt-0.5">{url}</p>
      </div>
      <button
        onClick={onRemove}
        className="w-7 h-7 rounded-lg border-none bg-transparent text-[var(--v2-mut)] cursor-pointer grid place-items-center hover:text-[var(--v2-ink)] transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ============================================================================
// 4. MAIN COMPONENT: AIPromptInput
// ============================================================================
export function AIPromptInput({ openFilePicker, files, setFiles, getInputProps, getRootProps, isDragActive, refetch }: any) {
  const { t } = useTranslation();
  const posthog = usePostHog();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { companyId, selectedFolder } = useUserStore();
  const { data } = useFolders();

  const [prompt, setPrompt] = useState("");
  const [composerFocused, setComposerFocused] = useState(false);
  const [mode, setMode] = useState<"note" | "answer">("note");
  const [youtubeMatch, setYoutubeMatch] = useState<{ url: string; videoId: string } | null>(null);
  const [ytDismissed, setYtDismissed] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [linkStatus, setLinkStatus] = useState<"checking" | "verified" | "failed">("checking");

  // Detect YouTube URLs in prompt — strip the URL from text on match
  const strippedRef = useRef(false);
  useEffect(() => {
    if (ytDismissed) return;
    // Skip re-detection right after we stripped the URL ourselves
    if (strippedRef.current) {
      strippedRef.current = false;
      return;
    }
    const match = extractYouTubeUrl(prompt);
    if (match) {
      setYoutubeMatch(match);
      // Remove the YouTube URL from the prompt text
      const cleaned = prompt.replace(match.url, "").trim();
      if (cleaned !== prompt.trim()) {
        strippedRef.current = true;
        setPrompt(cleaned);
      }
    } else if (!youtubeMatch) {
      // Only clear match if we don't already have one (avoid clearing after strip)
      setYoutubeMatch(null);
    }
  }, [prompt, ytDismissed]);

  // Probe YouTube oEmbed to verify the video actually exists
  useEffect(() => {
    if (!youtubeMatch) return;
    setLinkStatus("checking");
    const controller = new AbortController();
    fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeMatch.videoId}&format=json`,
      { signal: controller.signal }
    )
      .then((res) => {
        setLinkStatus(res.ok ? "verified" : "failed");
      })
      .catch((err) => {
        if (err.name !== "AbortError") setLinkStatus("failed");
      });
    return () => controller.abort();
  }, [youtubeMatch?.videoId]);

  const clearYouTube = () => {
    setYoutubeMatch(null);
    setYtDismissed(true);
  };

  // Reset dismiss when prompt changes significantly
  useEffect(() => {
    if (ytDismissed && !YOUTUBE_INLINE_REGEX.test(prompt)) {
      setYtDismissed(false);
    }
  }, [prompt, ytDismissed]);

  const flowContext = useRef<{
    toastId: string | number | null;
    progressInterval: NodeJS.Timeout | null;
    zipData: any | null;
    noteId: string | null;
    name: string | null
  }>({
    toastId: null,
    progressInterval: null,
    zipData: null,
    noteId: null,
    name: null
  });

  const updateToast = (step: string, progress: number, status: "loading" | "success" | "error" = "loading", noteId?: string) => {
    const nId = noteId || flowContext.current.noteId;
    const handleClick = () => {
      if (nId) {
        navigate(`/notes/${nId}`);
        if (status === "success") toast.dismiss(flowContext.current.toastId!);
      }
    };
    if (flowContext.current.toastId) {
      toast.custom(
        () => <NoteCreationToast step={step} progress={progress} status={status} onClick={handleClick} />,
        { id: flowContext.current.toastId, duration: status === "success" ? Infinity : Infinity }
      );
    } else {
      const id = toast.custom(
        () => <NoteCreationToast step={step} progress={progress} status={status} onClick={handleClick} />,
        { duration: Infinity }
      );
      flowContext.current.toastId = id;
    }
  };

  const startSimulatedProgress = (stepName: string, startFrom = 0) => {
    if (flowContext.current.progressInterval) clearInterval(flowContext.current.progressInterval);
    let current = startFrom;
    updateToast(stepName, current, "loading");
    flowContext.current.progressInterval = setInterval(() => {
      current = Math.min(current + (Math.random() * 5), 90);
      updateToast(stepName, current, "loading");
    }, 400);
  };

  const stopProgress = () => {
    if (flowContext.current.progressInterval) clearInterval(flowContext.current.progressInterval);
  };

  const handleError = (error: any, stepName: string) => {
    stopProgress();
    console.error(error);
    Sentry.captureException(error, {
      tags: { section: "note_creation", step: stepName },
      extra: { companyId }
    });
    posthog.capture('note_creation_failed', {
      step: stepName,
      error_message: error?.message || 'Unknown',
      is_plan_limit: error?.status === 403
    });
    const isPlanLimit = error?.status === 403;
    const msg = isPlanLimit ? t("Please upgrade your subscription plan") : t("Failed to prepare note");
    updateToast(msg, 0, "error");
    setTimeout(() => {
      toast.dismiss(flowContext.current.toastId!);
      flowContext.current.toastId = null;
    }, 4000);
  };

  const handleAudioStop = useCallback(async (audioBlob: Blob) => {
    posthog.capture('audio_recorded', { size: audioBlob.size });
    let finalBlob = audioBlob;
    let extension = "webm";
    let mimeType = audioBlob.type;

    if (audioBlob.type.includes("mp4")) {
      extension = "m4a"; mimeType = "audio/m4a";
    } else if (audioBlob.type.includes("webm")) {
      try {
        finalBlob = await convertBlobToWav(audioBlob);
        extension = "wav"; mimeType = "audio/wav";
      } catch (error) {
        Sentry.captureException(error, { tags: { section: "audio_conversion" } });
        toast.error(t("Audio conversion failed"));
        return;
      }
    }

    const fileName = `recording_${Date.now()}.${extension}`;
    const audioFile = new File([finalBlob], fileName, { type: mimeType });
    Object.assign(audioFile, { preview: URL.createObjectURL(finalBlob) });
    setFiles((prev: any) => [...prev, audioFile]);
  }, [t, setFiles, posthog]);

  const recorder = useAudioRecorder(handleAudioStop);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const removeFile = (fileToRemove: any) => {
    setFiles(files.filter((f: any) => f !== fileToRemove));
    URL.revokeObjectURL(fileToRemove.preview);
  };

  // --- Note creation mutations (file-based) ---
  const draftNoteMutation = useMutation({
    mutationFn: (newNote: any) => axiosInstance.post(`${API_BASE_URL}/company/${companyId}/notes/create`, newNote),
    onSuccess: (res) => {
      stopProgress();
      flowContext.current.noteId = res?.data.id;
      if (flowContext.current.zipData) {
        generateUploadLinkMutation.mutate({ noteId: res?.data.id, file_name: flowContext.current.zipData.fileName });
      } else {
        // YouTube note — mark as uploaded directly
        ytMarkUploadMutation.mutate(res?.data.id);
      }
    },
    onError: (e: any) => handleError(e, "Draft creation")
  });

  const generateUploadLinkMutation = useMutation({
    mutationFn: ({ file_name, noteId }: any) => {
      startSimulatedProgress(t("Preparing upload..."), 5);
      return axiosInstance.put(`${API_BASE_URL}/company/${companyId}/notes/${noteId}/generateFileUploadLink`, { file_name });
    },
    onSuccess: async (res) => {
      stopProgress();
      const { noteId, zipData } = flowContext.current;
      try {
        updateToast(t("Uploading files"), 0, "loading");
        await uploadFileToCF(
          noteId, res.data.upload_url, zipData.zipBlob, zipData.fileName,
          (percentage) => updateToast(t("Uploading files"), percentage, "loading")
        );
        markUploadAsFinishedMutation.mutate(noteId!);
      } catch (e) {
        handleError(e, t("Upload failed"));
      }
    },
    onError: (e: any) => handleError(e, t("Upload link generation"))
  });

  const markUploadAsFinishedMutation = useMutation({
    mutationFn: (nId: string) => {
      startSimulatedProgress(t("Transcribing audio"), 90);
      return axiosInstance.put(`${API_BASE_URL}/company/${companyId}/notes/${nId}/setAsUploaded`, {});
    },
    onSuccess: (_, noteId) => {
      stopProgress();
      posthog.capture('note_creation_completed', { note_id: noteId });
      updateToast(t("Everything is ready"), 100, "success", noteId);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["folders", companyId] });
      setTimeout(() => {
        setPrompt("");
        setFiles([]);
        setYoutubeMatch(null);
        setYtDismissed(false);
        flowContext.current = { toastId: null, progressInterval: null, zipData: null, noteId: null, name: null };
      }, 1000);
    },
    onError: (e: any) => handleError(e, t("Finalization"))
  });

  // --- YouTube note creation mutation ---
  const ytMarkUploadMutation = useMutation({
    mutationFn: (nId: string) => {
      startSimulatedProgress(t("Processing video..."), 10);
      return axiosInstance.put(`${API_BASE_URL}/company/${companyId}/notes/${nId}/setAsUploaded`, {});
    },
    onSuccess: (_, noteId) => {
      stopProgress();
      posthog.capture('youtube_note_creation_completed', { note_id: noteId });
      updateToast(t("Everything is ready"), 100, "success", noteId);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["folders", companyId] });
      setTimeout(() => {
        setPrompt("");
        setFiles([]);
        setYoutubeMatch(null);
        setYtDismissed(false);
        flowContext.current = { toastId: null, progressInterval: null, zipData: null, noteId: null, name: null };
      }, 1000);
    },
    onError: (e: any) => handleError(e, t("Finalization"))
  });

  const saveYouTubeNote = () => {
    if (!youtubeMatch) return;
    posthog.capture('youtube_create_clicked', { url: youtubeMatch.url });

    const id = toast.custom(
      () => <NoteCreationToast step={t("Creating note from video...")} progress={0} status="loading" />,
      { duration: Infinity }
    );
    flowContext.current.toastId = id;
    flowContext.current.name = t("YouTube Note");
    flowContext.current.zipData = null;

    startSimulatedProgress(t("Creating note draft..."), 0);
    draftNoteMutation.mutate({
      note_type: "youtube",
      name: t("Youtube Note"),
      file_name: "",
      transcript: t("Not transcribed yet"),
      language: "en",
      youtube_url: youtubeMatch.url,
      folder_id: selectedFolder?.id,
    });
  };

  const saveNote = async () => {
    // YouTube note path
    if (youtubeMatch && mode === "note") {
      saveYouTubeNote();
      return;
    }

    if (!prompt.trim() && files.length === 0) return;

    posthog.capture('note_creation_started', {
      input_type: files.length > 0 ? (prompt ? 'mixed' : 'files_only') : 'text_only',
      file_count: files.length,
      has_audio: files.some((f: any) => f.type.startsWith('audio/'))
    });

    const id = toast.custom(
      () => <NoteCreationToast step={t("Preparing content...")} progress={0} status="loading" />,
      { duration: Infinity }
    );
    flowContext.current.toastId = id;
    flowContext.current.name = t("New Note");

    try {
      startSimulatedProgress(t("Compressing files..."), 0);
      const zip = await createZip2(files, prompt);
      stopProgress();
      if (!zip) throw new Error(t("Compression failed"));
      flowContext.current.zipData = zip;
      startSimulatedProgress(t("Creating note draft..."), 10);
      draftNoteMutation.mutate({
        note_type: "multi",
        name: "New Note",
        file_name: zip.fileName,
        transcript: t("Not transcribed yet"),
        language: "en",
        folder_id: selectedFolder?.id
      });
    } catch (e) {
      handleError(e, t("Preparation"));
    }
  };

  const isSubmitting = draftNoteMutation.isPending || generateUploadLinkMutation.isPending || markUploadAsFinishedMutation.isPending || ytMarkUploadMutation.isPending;

  // Determine button label & helper text
  const hasYT = !!youtubeMatch && mode === "note";
  const buttonLabel = useMemo(() => {
    if (mode === "answer") return t("Ask");
    if (hasYT) return t("Create note from video");
    return t("Create note");
  }, [mode, hasYT, t]);

  const helperText = useMemo(() => {
    if (mode === "answer") return t("Pinned to Answer — Enter opens an instant answer. Nothing is saved unless you keep it.");
    if (hasYT) return t("We'll pull the transcript from the video, then build the summary, quiz & flashcards. Add a question below — it'll be answered in the note's chat.");
    return t("Enter creates a note: summary, transcript, quiz & flashcards. Add a question — it'll be answered in the note's chat.");
  }, [mode, hasYT, t]);

  const canSubmit = mode === "note"
    ? (hasYT ? linkStatus === "verified" : (prompt.trim() || files.length > 0))
    : prompt.trim().length > 0;

  return (
    <div className="w-full relative">
      <div
        {...getRootProps()}
        className="relative rounded-[20px] overflow-hidden transition-all outline-none"
        style={{
          background: "var(--v2-panel)",
          border: `1.5px solid ${recorder.status !== "idle" ? "#ef4444" : composerFocused ? "var(--v2-ink)" : "var(--v2-line)"}`,
          boxShadow: "var(--v2-shadow)",
        }}
        onFocusCapture={() => setComposerFocused(true)}
        onBlurCapture={() => setComposerFocused(false)}
      >
        <input {...getInputProps()} />

        {/* --- Textarea --- */}
        <div className="px-[18px] pt-[18px]">
          <TextareaAutosize
            placeholder={t("Paste a YouTube link, drop files, or just start typing...")}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveNote();
            }}
            minRows={2}
            maxRows={10}
            className="w-full resize-none border-0 bg-transparent shadow-none focus:ring-0 text-[16px] leading-relaxed outline-none placeholder:text-[var(--v2-mut)] placeholder:font-normal"
            style={{ color: "var(--v2-ink)" }}
          />
        </div>

        {/* --- YouTube inline preview --- */}
        <AnimatePresence>
          {youtubeMatch && !ytDismissed && (
            <div className="px-[14px] pb-1 pt-2">
              <YouTubePreviewCard url={youtubeMatch.url} videoId={youtubeMatch.videoId} onRemove={clearYouTube} linkStatus={linkStatus} />
            </div>
          )}
        </AnimatePresence>

        {/* --- File previews --- */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-wrap gap-2 px-[18px] pb-2 pt-1"
            >
              {files.map((file: any, idx: number) => (
                file.type.startsWith("audio/") ? (
                  <AudioPreview key={file.name + idx} file={file} loading={isSubmitting} onRemove={() => removeFile(file)} />
                ) : (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    key={file.name + idx}
                    className="group relative flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors"
                    style={{ background: "var(--v2-panel2)", borderColor: "var(--v2-line)" }}
                  >
                    <div style={{ color: "var(--v2-mut)" }}>
                      {file.type.startsWith("image/") ? <ImageIcon className="h-4 w-4" /> : <FileIcon className="h-4 w-4" />}
                    </div>
                    <span
                      className="max-w-[120px] truncate font-medium cursor-pointer text-[var(--v2-ink)]"
                      onClick={() => file.type === "application/pdf" && setPreviewFile(file)}
                    >
                      {file.name}
                    </span>
                    {file.type.startsWith("image/") && (
                      <Zoom><img src={file.preview} alt={file.name} className="h-6 w-6 rounded object-cover border ml-1" /></Zoom>
                    )}
                    {!isSubmitting && (
                      <button
                        className="absolute -right-2 -top-2 h-5 w-5 rounded-full border flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        style={{ background: "var(--v2-panel)", borderColor: "var(--v2-line)", color: "var(--v2-mut)" }}
                        onClick={() => removeFile(file)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </motion.div>
                )
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Separator --- */}
        <div className="mx-[18px] h-px" style={{ background: "var(--v2-line)" }} />

        {/* --- Bottom toolbar --- */}
        <div className="flex items-center gap-1.5 px-[14px] py-[10px] flex-wrap">
          <AnimatePresence mode="wait" initial={false}>
            {recorder.status === "idle" ? (
              <motion.div
                key="idle-tools"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-1.5"
              >
                {/* Attach */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={openFilePicker}
                      className="w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-colors bg-transparent hover:bg-[var(--v2-panel2)]"
                      style={{ borderColor: "var(--v2-line)", color: "var(--v2-mut)" }}
                    >
                      <Paperclip className="w-[16px] h-[16px]" strokeWidth={1.8} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{t("Attach file")}</TooltipContent>
                </Tooltip>

                {/* Record */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        if (!recorder.devices.length) recorder.getDevices(true);
                        posthog.capture('audio_recording_started');
                        recorder.start();
                      }}
                      className="w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-colors bg-transparent hover:bg-[var(--v2-panel2)]"
                      style={{ borderColor: "var(--v2-line)", color: "var(--v2-mut)" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="12" cy="12" r="8.4" />
                        <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
                      </svg>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{t("Start recording")}</TooltipContent>
                </Tooltip>

                {/* Mic dropdown (hidden, accessible from record) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="hidden">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[300px] rounded-2xl p-2">
                    <DropdownMenuLabel>{t("Microphone")}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {recorder.isFetching ? (
                      <DropdownMenuItem disabled><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("Fetching...")}</DropdownMenuItem>
                    ) : (
                      <DropdownMenuRadioGroup value={recorder.selectedMicId} onValueChange={recorder.setSelectedMicId}>
                        {recorder.devices.map(d => (
                          <DropdownMenuRadioItem key={d.deviceId} value={d.deviceId} className="rounded-lg">
                            {d.label || "Mic"}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="rounded-lg" onSelect={() => recorder.getDevices(true)}>
                      <RefreshCw className="h-4 w-4 mr-2" /> {t("Update microphone list")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Folder select */}
                <div className="shrink-0">
                  <FolderSelect data={data?.folders || []} />
                </div>

                {recorder.isBlocked && (
                  <p className="text-xs text-red-500 whitespace-nowrap">{t("Mic blocked")}</p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="recording-tools"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1 sm:gap-3 w-full px-1"
              >
                <button
                  onClick={() => recorder.stop(false)}
                  className="shrink-0 w-8 h-8 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center text-[var(--v2-mut)] hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20 shrink-0">
                  <motion.div animate={{ opacity: recorder.status === "paused" ? 0.5 : [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="h-2 w-2 bg-red-500 rounded-full" />
                  <span className="text-xs font-mono text-red-600 font-bold min-w-[40px] text-center">{formatTime(recorder.elapsedTime)}</span>
                </div>
                <div className="flex-1 h-8 hidden sm:flex justify-center items-center overflow-hidden">
                  {recorder.stream && <AudioVisualizer mediaStream={recorder.stream} isPaused={recorder.status !== 'recording'} />}
                </div>
                <button
                  className="shrink-0 w-8 h-8 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center text-[var(--v2-mut)]"
                  onClick={recorder.status === "recording" ? recorder.pause : recorder.resume}
                >
                  {recorder.status === "recording" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => recorder.stop(true)}
                      className="shrink-0 w-8 h-8 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center text-red-500"
                    >
                      <StopCircle className="h-6 w-6" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{t("Stop & Attach")}</TooltipContent>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1" />

          {/* --- Mode toggle (Answer / Note) --- */}
          {recorder.status === "idle" && (
            <div className="flex items-center gap-1.5">
              <div
                className="flex items-center rounded-xl border p-0.5"
                style={{ borderColor: "var(--v2-line)", background: "var(--v2-panel2)" }}
              >
                <button
                  onClick={() => setMode("answer")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[12px] font-semibold border-none cursor-pointer transition-all",
                    mode === "answer"
                      ? "bg-[var(--v2-panel)] text-[var(--v2-ink)] shadow-sm"
                      : "bg-transparent text-[var(--v2-mut)]"
                  )}
                >
                  <MessageCircle className="w-3 h-3" strokeWidth={1.8} />
                  {t("Answer")}
                </button>
                <button
                  onClick={() => setMode("note")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[12px] font-semibold border-none cursor-pointer transition-all",
                    mode === "note"
                      ? "bg-[var(--v2-panel)] text-[var(--v2-ink)] shadow-sm"
                      : "bg-transparent text-[var(--v2-mut)]"
                  )}
                >
                  <Layers className="w-3 h-3" strokeWidth={1.8} />
                  {t("Note")}
                </button>
              </div>

              {/* AUTO label */}
              <span
                className="hidden sm:inline-block text-[11px] font-bold tracking-[0.06em] px-2.5 py-1 rounded-full"
                style={{ background: "var(--v2-panel2)", color: "var(--v2-ink)" }}
              >
                AUTO
              </span>

              {/* Shortcut hint */}
              <span className="hidden md:inline-block text-[11px] text-[var(--v2-mut)] font-medium select-none whitespace-nowrap">
                ⌘ + Enter
              </span>

              {/* Submit button */}
              <button
                onClick={() => {
                  if (!canSubmit) {
                    toast(t("Add some text or files first"), { duration: 2000 });
                    return;
                  }
                  saveNote();
                }}
                disabled={isSubmitting}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-5 h-[42px] border-none text-[13px] font-bold cursor-pointer transition-all active:scale-[0.97]",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                style={{ background: "var(--v2-ink)", color: "var(--v2-bg)" }}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === "answer" ? (
                  <Send className="w-4 h-4" strokeWidth={2} />
                ) : (
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                )}
                {isSubmitting ? t("Working...") : buttonLabel}
              </button>
            </div>
          )}
        </div>

        {/* --- Helper text --- */}
        <div className="px-[18px] pb-[14px] pt-0.5">
          <p className="text-[12.5px] text-[var(--v2-mut)] leading-relaxed">
            <span className="font-bold mr-1 text-[11px]">✦</span>
            {helperText}
          </p>
        </div>

        {/* --- Drag overlay --- */}
        <AnimatePresence>
          {isDragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-[20px] flex items-center justify-center z-30 border-2 border-dashed"
              style={{
                background: "color-mix(in srgb, var(--v2-panel) 90%, transparent)",
                borderColor: "var(--v2-accent)"
              }}
            >
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-2 font-bold" style={{ color: "var(--v2-accent)" }}>
                <div className="p-4 rounded-full" style={{ background: "color-mix(in srgb, var(--v2-accent) 10%, transparent)" }}>
                  <UploadCloud className="h-8 w-8" />
                </div>
                <p>{t("Drop files to attach")}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <FilePreviewDialog file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
