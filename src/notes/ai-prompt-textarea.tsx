import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import { AudioVisualizer } from "@/components/audio-visualiser";
import TextareaAutosize from "react-textarea-autosize";
import { motion, AnimatePresence } from "framer-motion";
import { usePostHog } from 'posthog-js/react';
import * as Sentry from "@sentry/react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

// --- Services & Store ---
import { axiosInstance, createZip2, uploadFileToCF } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useUserStore } from "@/store/userStore";

// --- UI Components ---
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FilePreviewDialog } from "@/components/file-preview-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// --- Icons ---
import {
  File, Image as ImageIcon, X, Paperclip, Mic, StopCircle, UploadCloud,
  Download, ChevronDown, Loader2, RefreshCw, Pause, Play, Trash2,
  ArrowUp, AudioLinesIcon
} from "lucide-react";

// ============================================================================
// HOOK: useAudioRecorder (Extracts logic from UI)
// ============================================================================
const useAudioRecorder = (onStopCallback) => {
  const [status, setStatus] = useState("idle"); // idle, recording, paused
  const [stream, setStream] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [devices, setDevices] = useState([]);
  const [selectedMicId, setSelectedMicId] = useState("default");
  const [isBlocked, setIsBlocked] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);
  const accumulatedTimeRef = useRef(0);

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
    } catch (err) {
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
      mediaRecorderRef.current = new MediaRecorder(mediaStream, { mimeType: "audio/webm" });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        clearInterval(timerRef.current);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size > 0) onStopCallback(blob);
        
        setStatus("idle");
        setStream(null);
        setElapsedTime(0);
        accumulatedTimeRef.current = 0;
        mediaStream.getTracks().forEach(t => t.stop());
      };

      mediaRecorderRef.current.start();
      setStatus("recording");
      
      // Timer Logic
      startTimeRef.current = Date.now();
      accumulatedTimeRef.current = 0;
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTimeRef.current);
      }, 100);

    } catch (err) {
      if (err.name === "NotAllowedError") setIsBlocked(true);
      console.error(err);
    }
  };

  const pause = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setStatus("paused");
      clearInterval(timerRef.current);
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
    if (!shouldSave) chunksRef.current = []; // Clear chunks if cancelling
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  return {
    status, stream, elapsedTime, devices, selectedMicId, isBlocked, isFetching,
    start, stop, pause, resume, getDevices, setSelectedMicId
  };
};

// ============================================================================
// COMPONENT: AudioPreview
// ============================================================================
const AudioPreview = ({ file, onRemove, portalContainer }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const { t } = useTranslation();

  const togglePlay = (e) => {
    e.stopPropagation();
    isPlaying ? audioRef.current?.pause() : audioRef.current?.play();
  };

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onPause);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onPause);
    };
  }, []);

  return (
    <motion.div 
      layout 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative flex items-center gap-2 bg-muted/50 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted"
    >
      <audio ref={audioRef} src={file.preview} preload="auto" />
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={togglePlay}>
        {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      </Button>
      <span className="max-w-[120px] truncate font-medium">{file.name}</span>
      <Button
        variant="ghost" size="icon"
        className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-background border opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </motion.div>
  );
};

// ============================================================================
// MAIN COMPONENT: AIPromptInput
// ============================================================================
export function AIPromptInput({ portalContainer, setIsPolling }) {
  const { t } = useTranslation();
  const posthog = usePostHog();
  const { companyId, userId, email, selectedFolder } = useUserStore();
  
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  
  // Logic for Upload Flow
  const [noteId, setNoteId] = useState(null);
  const [zipData, setZipData] = useState(null);

  // --- 1. Audio Logic Integration ---
  const handleAudioStop = useCallback((audioBlob) => {
    audioBlob.name = `recording_${Date.now()}.webm`;
    audioBlob.lastModified = Date.now();
    setFiles((prev) => [...prev, Object.assign(audioBlob, { preview: URL.createObjectURL(audioBlob) })]);
  }, []);

  const recorder = useAudioRecorder(handleAudioStop);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  // --- 2. File Handling ---
  const onDrop = useCallback((acceptedFiles) => {
    setFiles((prev) => [...prev, ...acceptedFiles.map(f => Object.assign(f, { preview: URL.createObjectURL(f) }))]);
  }, []);

  const removeFile = (fileToRemove) => {
    setFiles(files.filter(f => f !== fileToRemove));
    URL.revokeObjectURL(fileToRemove.preview);
    posthog.capture('remove_file_clicked', { userId, email });
  };

  const { getRootProps, getInputProps, isDragActive, open: openFilePicker } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    accept: { "image/*": [], "application/pdf": [], "audio/*": [] },
  });

  // --- 3. Mutation Logic (API) ---
  const saveNote = async () => {
    if (!prompt.trim() && files.length === 0) return;
    try {
      posthog.capture('save_note_clicked', { userId, email, note_type: "multi" });
      const zip = await createZip2(files, prompt);
      setZipData(zip); // Triggers useEffect to start upload chain
      
      draftNoteMutation.mutate({
        note_type: "multi",
        name: t("New Recording"),
        file_name: zip?.fileName || "note.zip",
        transcript: t("Not transcribed yet"),
        language: "en",
        folder_id: selectedFolder?.id,
      });
    } catch (e) {
      Sentry.captureException(e);
      toast.error(t("Failed to prepare files"));
    }
  };

  const draftNoteMutation = useMutation({
    mutationFn: (newNote) => axiosInstance.post(`${API_BASE_URL}/company/${companyId}/notes/create`, newNote),
    onSuccess: (res) => setNoteId(res?.data.id),
    onError: (err) => console.error(err)
  });

  // Effect chain: Draft Created -> Generate Link -> Upload to CF -> Finalize
  useEffect(() => {
    if (zipData && noteId) {
      generateUploadLink.mutate({ noteId, file_name: zipData.fileName });
    }
  }, [zipData, noteId]);

  const generateUploadLink = useMutation({
    mutationFn: ({ file_name, noteId }) => axiosInstance.put(`${API_BASE_URL}/company/${companyId}/notes/${noteId}/generateFileUploadLink`, { file_name }),
    onSuccess: (res) => {
      uploadFileToCF(noteId, res.data.upload_url, zipData.zipBlob, zipData.fileName)
        .then(() => markUploadAsFinished.mutate(noteId));
    }
  });

  const markUploadAsFinished = useMutation({
    mutationFn: (nId) => axiosInstance.put(`${API_BASE_URL}/company/${companyId}/notes/${nId}/setAsUploaded`, {}),
    onSuccess: () => {
      setIsPolling(true);
      setNoteId(null);
      setPrompt("");
      setFiles([]);
      toast.success(t("Note has been created"));
    },
    onError: () => toast.error(t("Error processing note"))
  });

  const isSubmitting = draftNoteMutation.isPending || generateUploadLink.isPending || markUploadAsFinished.isPending;

  // --- 4. Animation Variants ---
  const containerVariants = {
    idle: { borderColor: "hsl(var(--input))", boxShadow: "none" },
    active: { borderColor: "hsl(var(--primary))", boxShadow: "0 0 0 2px hsl(var(--primary) / 0.1)" },
    recording: { borderColor: "#ef4444", boxShadow: "0 0 0 2px rgba(239, 68, 68, 0.2)" }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        {...getRootProps()}
        initial="idle"
        animate={recorder.status !== "idle" ? "recording" : "idle"}
        whileFocusWithin={recorder.status === "idle" ? "active" : undefined}
        variants={containerVariants}
        transition={{ duration: 0.3 }}
        className="relative rounded-xl border bg-background p-2 transition-colors overflow-hidden"
      >
        <input {...getInputProps()} />

        {/* --- Text Input --- */}
        <TextareaAutosize
          placeholder={t("Ask anything, drag files, or start recording...")}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
             if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveNote();
          }}
          minRows={2}
          maxRows={10}
          className="w-full resize-none border-0 bg-transparent shadow-none focus:ring-0 text-base py-2.5 px-2 outline-none"
        />

        {/* --- File List (Animated) --- */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-wrap gap-2 px-2 pb-3 mt-2 overflow-hidden"
            >
              {files.map((file, idx) => (
                file.type.startsWith("audio/") ? (
                  <AudioPreview key={file.name+idx} file={file} onRemove={() => removeFile(file)} />
                ) : (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    key={file.name + idx}
                    className="group relative flex items-center gap-2 bg-muted/50 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <div className="text-muted-foreground">
                      {file.type.startsWith("image/") ? <ImageIcon className="h-4 w-4" /> : <File className="h-4 w-4" />}
                    </div>
                    <span className="max-w-[120px] truncate font-medium cursor-pointer" onClick={() => file.type === "application/pdf" && setPreviewFile(file)}>
                      {file.name}
                    </span>
                    {file.type.startsWith("image/") && (
                      <Zoom>
                        <img src={file.preview} alt={file.name} className="h-6 w-6 rounded object-cover border ml-1" />
                      </Zoom>
                    )}
                    <Button variant="ghost" size="icon" className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-background border opacity-0 group-hover:opacity-100 transition-opacity shadow-sm" onClick={() => removeFile(file)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </motion.div>
                )
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Toolbar Area --- */}
        <div className="flex justify-between items-center border-t bg-transparent pt-2 px-2 mt-1 min-h-[44px]">
          
          <AnimatePresence mode="wait" initial={false}>
            {recorder.status === "idle" ? (
              // === IDLE TOOLBAR ===
              <motion.div 
                key="idle-tools"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-1"
              >
                <Tooltip>
                  <TooltipTrigger>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full" onClick={openFilePicker}>
                      <Paperclip className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{t("Attach file")}</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full" onClick={() => {
                        if (!recorder.devices.length) recorder.getDevices(true);
                        recorder.start();
                    }}>
                      <Mic className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{t("Start recording")}</p></TooltipContent>
                </Tooltip>

                {/* Mic Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full h-8 w-8">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[300px]">
                    <DropdownMenuLabel>{t("Microphone")}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {recorder.isFetching ? (
                      <DropdownMenuItem disabled><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("Fetching...")}</DropdownMenuItem>
                    ) : (
                      <DropdownMenuRadioGroup value={recorder.selectedMicId} onValueChange={recorder.setSelectedMicId}>
                        {recorder.devices.map(d => (
                          <DropdownMenuRadioItem key={d.deviceId} value={d.deviceId}>{d.label || "Mic"}</DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => recorder.getDevices(true)}><RefreshCw className="h-4 w-4 mr-2" /> {t("Refresh")}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {recorder.isBlocked && <p className="text-xs text-red-500 ml-2">{t("Mic blocked")}</p>}
              </motion.div>
            ) : (
              // === RECORDING TOOLBAR ===
              <motion.div 
                key="recording-tools"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 w-full mr-2"
              >
                <Tooltip>
                  <TooltipTrigger>
                    <Button variant="ghost" size="icon" onClick={() => recorder.stop(false)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{t("Discard")}</p></TooltipContent>
                </Tooltip>

                {/* Pulsing Timer */}
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full border border-red-100 dark:border-red-900/30">
                   <motion.div 
                     animate={{ opacity: recorder.status === "paused" ? 0.5 : [1, 0.4, 1] }}
                     transition={{ duration: 1.5, repeat: Infinity }}
                     className="h-2 w-2 bg-red-500 rounded-full" 
                   />
                   <span className="text-sm font-mono text-red-600 dark:text-red-400 min-w-[40px] text-center">
                      {formatTime(recorder.elapsedTime)}
                   </span>
                </div>

                {/* Visualizer */}
                <div className="flex-1 h-8 flex justify-center items-center">
                   {recorder.stream && <AudioVisualizer mediaStream={recorder.stream} isPaused={recorder.status !== 'recording'} />}
                </div>

                {recorder.status === "recording" ? (
                  <Button variant="ghost" size="icon" onClick={recorder.pause}><Pause className="h-5 w-5 text-muted-foreground" /></Button>
                ) : (
                  <Button variant="ghost" size="icon" onClick={recorder.resume}><Play className="h-5 w-5 text-muted-foreground" /></Button>
                )}

                <Tooltip>
                  <TooltipTrigger>
                    <Button variant="ghost" size="icon" onClick={() => recorder.stop(true)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <StopCircle className="h-6 w-6" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{t("Stop & Attach")}</p></TooltipContent>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>

          {/* === SEND BUTTON === */}
          <div className="flex-shrink-0 ml-auto">
            <Button
              onClick={saveNote}
              size="icon"
              disabled={isSubmitting || recorder.status === "recording"}
              className="rounded-full h-9 w-9 transition-all duration-300 shadow-sm"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : recorder.status !== "idle" ? (
                <AudioLinesIcon className="h-4 w-4 animate-pulse" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* --- Drag Overlay --- */}
        <AnimatePresence>
          {isDragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-xl bg-background/90 backdrop-blur-sm flex items-center justify-center z-20 border-2 border-primary border-dashed"
            >
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-2 text-primary font-medium">
                <div className="p-4 rounded-full bg-primary/10">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <p>{t("Drop files to attach")}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <FilePreviewDialog file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}