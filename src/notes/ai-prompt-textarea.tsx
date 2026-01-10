"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import { AudioVisualizer } from "@/components/audio-visualiser";
import TextareaAutosize from "react-textarea-autosize";
import { motion, AnimatePresence } from "framer-motion";
import { usePostHog } from 'posthog-js/react';
import * as Sentry from "@sentry/react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

// --- Services & Utils ---
import { axiosInstance, convertBlobToWav, createZip2, uploadFileToCF } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useUserStore } from "@/store/userStore";

// --- Components ---
import { Button } from "@/components/ui/button";
import { FilePreviewDialog } from "@/components/file-preview-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  File as FileIcon, Image as ImageIcon, X, Paperclip, Mic, StopCircle, UploadCloud,
  ChevronDown, Loader2, RefreshCw, Pause, Play, Trash2, ArrowUp, AudioLinesIcon
} from "lucide-react";
import { NoteCreationToast } from "./note-creation-toast";
import AIArrow from "./AiArrow";
import { useNavigate } from "react-router";
import Select from "@/components/select";

// Import your custom toast component

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

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        clearInterval(timerRef.current!);
        const type = mediaRecorderRef.current?.mimeType || mimeTypeRef.current;
        const blob = new Blob(chunksRef.current, { type });
        if (blob.size > 0) onStopCallback(blob);
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
const AudioPreview = ({ file, onRemove }: { file: any, onRemove: () => void }) => {
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
      className="group relative flex items-center gap-2 bg-background/50 backdrop-blur-sm rounded-xl border px-3 py-2 text-sm transition-colors hover:bg-background"
    >
      <audio ref={audioRef} src={file.preview} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} />
      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={togglePlay}>
        {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      </Button>
      <span className="max-w-[120px] truncate font-medium">{file.name}</span>
      <Button variant="ghost" size="icon" className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-background border opacity-0 group-hover:opacity-100 transition-opacity shadow-sm" onClick={onRemove}>
        <X className="h-3 w-3" />
      </Button>
    </motion.div>
  );
};

// ============================================================================
// 3. MAIN COMPONENT: AIPromptInput
// ============================================================================
export function AIPromptInput({  openFilePicker, files, setFiles, getInputProps, getRootProps, isDragActive, refetch }: any) {
  const { t } = useTranslation();
  const posthog = usePostHog();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { companyId, userId, email, selectedFolder } = useUserStore();

  // --- FOLDER QUERY ---
  const { data: foldersQuery, isLoading: isLoadingFolders } = useQuery({
    queryKey: ['folders'],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    queryFn: async () => {
      return axiosInstance.get(API_BASE_URL + `/company/${companyId}/notes/folder`);
    },
    enabled: !!companyId,
  });

  const [prompt, setPrompt] = useState("");
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  // --- FLOW CONTEXT (For Progress Tracking) ---
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

  // --- PROGRESS HELPERS ---
  // Helper to render/update your custom toast
  const updateToast = (step: string, progress: number, status: "loading" | "success" | "error" = "loading", noteId?: string) => {
    // If we have an ID, we dismiss specifically or let Sonner handle replacement
    // Sonner's toast.custom returns an ID we can use to update
    if (flowContext.current.toastId) {
      toast.custom(
        () => <NoteCreationToast step={step} progress={progress} status={status} noteId={noteId} name={flowContext.current.name}  onClick={() => status === 'success' ?  navigate(`/notes/${noteId}`) : null} />, 
        { 
          id: flowContext.current.toastId, 
          duration: 3000 // Auto dismiss on success only
        }
      );
    } else {
       const id = toast.custom(
        () => <NoteCreationToast step={step} progress={progress} status={status} noteId={noteId}/>, 
        { duration: Infinity }
      );
      flowContext.current.toastId = id;
    }
  };

  const startSimulatedProgress = (stepName: string, startFrom = 0) => {
    if (flowContext.current.progressInterval) clearInterval(flowContext.current.progressInterval);
    let current = startFrom;
    
    // Initial update
    updateToast(stepName, current, "loading");
    
    flowContext.current.progressInterval = setInterval(() => {
      // Increment randomly to look natural, cap at 90% until next step actually finishes
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
    
    const isPlanLimit = error?.status === 403;
    const msg = isPlanLimit ? "Please upgrade your subscription plan" : "Failed to prepare note";

    updateToast(msg, 0, "error");
    
    // Cleanup after error display
    setTimeout(() => {
        toast.dismiss(flowContext.current.toastId!);
        flowContext.current.toastId = null;
    }, 4000);
  };

  // --- AUDIO LOGIC ---
  const handleAudioStop = useCallback(async (audioBlob: Blob) => {
    let finalBlob = audioBlob;
    let extension = "webm";
    let mimeType = audioBlob.type;

    if (audioBlob.type.includes("mp4")) {
      extension = "m4a"; mimeType = "audio/m4a"; 
    } else if (audioBlob.type.includes("webm")) {
      try {
        finalBlob = await convertBlobToWav(audioBlob); 
        extension = "wav"; mimeType = "audio/wav";
      } catch (error) { toast.error(t("Audio conversion failed")); return; }
    }

    const fileName = `recording_${Date.now()}.${extension}`;
    const audioFile = new File([finalBlob], fileName, { type: mimeType });
    Object.assign(audioFile, { preview: URL.createObjectURL(finalBlob) });
    setFiles((prev) => [...prev, audioFile]);
  }, [t]);

  const recorder = useAudioRecorder(handleAudioStop);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };


  const removeFile = (fileToRemove: any) => {
    setFiles(files.filter(f => f !== fileToRemove));
    URL.revokeObjectURL(fileToRemove.preview);
  };



  // --- MUTATIONS ---
  const draftNoteMutation = useMutation({
    mutationFn: (newNote: any) => axiosInstance.post(`${API_BASE_URL}/company/${companyId}/notes/create`, newNote),
    onSuccess: (res) => {
      stopProgress();
      flowContext.current.noteId = res?.data.id;
      // Start next step visual
      generateUploadLinkMutation.mutate({ noteId: res?.data.id, file_name: flowContext.current.zipData.fileName });
    },
    onError: (e: any) => handleError(e, "Draft creation")
  });

  const generateUploadLinkMutation = useMutation({
    mutationFn: ({ file_name, noteId }: any) => {
        startSimulatedProgress(t("Preparing upload..."), 5);
        return axiosInstance.put(`${API_BASE_URL}/company/${companyId}/notes/${noteId}/generateFileUploadLink`, { file_name })
    },
    onSuccess: async (res) => {
      stopProgress(); // Stop simulation, start real upload tracking
      
      const { noteId, zipData } = flowContext.current;
      
      try {
          updateToast(t("Uploading files..."), 0, "loading");
          
          await uploadFileToCF(
              noteId, 
              res.data.upload_url, 
              zipData.zipBlob, 
              zipData.fileName, 
              (percentage) => {
                 // Update toast with REAL progress
                 updateToast(t("Uploading files..."), percentage, "loading");
              }
          );
          
          markUploadAsFinishedMutation.mutate(noteId!);
      } catch (e) {
          handleError(e, "Upload failed");
      }
    },
    onError: (e: any) => handleError(e, "Upload link generation")
  });

  const markUploadAsFinishedMutation = useMutation({
    mutationFn: (nId: string) => {
        startSimulatedProgress(t("Finalizing..."), 90);
        return axiosInstance.put(`${API_BASE_URL}/company/${companyId}/notes/${nId}/setAsUploaded`, {})
    },
    onSuccess: (_, noteId) => {
      stopProgress();
      // Show Success State with Lottie
      updateToast("Please wait a bit...", 100, "success", noteId );
      refetch();
      // Invalidate folders query to update folder counts
      queryClient.invalidateQueries({ queryKey: ["folders", companyId] });

      // Delay clearing inputs slightly so user sees success state
      setTimeout(() => {
          setPrompt("");
          setFiles([]);
          flowContext.current = { toastId: null, progressInterval: null, zipData: null, noteId: null, name: null };
      }, 1000);
    },
    onError: (e: any) => handleError(e, "Finalization")
  });

  // --- TRIGGER ---
  const saveNote = async () => {
    if (!prompt.trim() && files.length === 0) return;
    
    // 1. Initialize Toast
    const id = toast.custom(
        () => <NoteCreationToast step={t("Preparing content...")} progress={0} status="loading" />, 
        { duration: Infinity }
    );
    flowContext.current.toastId = id;
     flowContext.current.name = t("New Recording");

    try {
      startSimulatedProgress(t("Compressing files..."), 0);
      
      const zip = await createZip2(files, prompt);
      
      stopProgress();
      
      if (!zip) throw new Error("Compression failed");
      
      flowContext.current.zipData = zip;
      
      startSimulatedProgress(t("Creating note draft..."), 10);
      
      draftNoteMutation.mutate({ 
          note_type: "multi", 
          name: t("New Recording"), 
          file_name: zip.fileName, 
          transcript: t("Not transcribed yet"), 
          language: "en", 
          folder_id: selectedFolder?.id 
      });
      
    } catch (e) { 
        handleError(e, "Preparation"); 
    }
  };

  const isSubmitting = draftNoteMutation.isPending || generateUploadLinkMutation.isPending || markUploadAsFinishedMutation.isPending;

  // --- STYLING VARIANTS ---
  const containerVariants = {
    idle: { boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.05)" },
    active: { borderColor: "transparent", boxShadow: "0 0 0 4px rgba(245, 158, 11, 0.1)" },
    recording: { borderColor: "#ef4444", boxShadow: "0 0 0 4px rgba(239, 68, 68, 0.1)" }
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative group">
      <style>{`
        @keyframes border-beam {
          0% { stroke-dashoffset: 1000; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-border-beam {
          animation: border-beam 2.5s linear infinite;
        }
      `}</style>

      {/* Decorative Glow background */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-500/5 blur-3xl group-focus-within:bg-amber-500/10 transition-all pointer-events-none hover:shadow-lg" />
      
      <motion.div
        {...getRootProps()}
        initial="idle"
        animate={recorder.status !== "idle" ? "recording" : "idle"}
        whileFocusWithin={recorder.status === "idle" ? "active" : undefined}
        variants={containerVariants}
        transition={{ duration: 0.3 }}
        className="relative rounded-[1rem] border bg-gradient-to-b from-card to-muted/40 p-3 transition-all overflow-hidden hover:border-black hover:shadow-lg"
      >
        <input {...getInputProps()} />

        <TextareaAutosize
          placeholder={t("Ask anything, drag files, or start recording...")}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveNote(); }}
          minRows={2} maxRows={10}
          className="relative z-20 w-full resize-none border-0 bg-transparent shadow-none focus:ring-0 text-base py-3 px-3 outline-none placeholder:text-muted-foreground/50"
        />

        {/* File Previews Area */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="relative z-20 flex flex-wrap gap-2 px-3 pb-3 mt-1">
              {files.map((file, idx) => (
                file.type.startsWith("audio/") ? (
                  <AudioPreview key={file.name+idx} file={file} onRemove={() => removeFile(file)} />
                ) : (
                  <motion.div layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} key={file.name + idx} className="group relative flex items-center gap-2 bg-background/50 rounded-xl border px-3 py-2 text-sm transition-colors hover:bg-background">
                    <div className="text-muted-foreground">
                      {file.type.startsWith("image/") ? <ImageIcon className="h-4 w-4" /> : <FileIcon className="h-4 w-4" />}
                    </div>
                    <span className="max-w-[120px] truncate font-medium cursor-pointer" onClick={() => file.type === "application/pdf" && setPreviewFile(file)}>{file.name}</span>
                    {file.type.startsWith("image/") && (
                      <Zoom><img src={file.preview} alt={file.name} className="h-6 w-6 rounded object-cover border ml-1" /></Zoom>
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

        {/* Nested Organic Action Bar */}
        <div className="relative z-20 flex justify-between items-center rounded-[1rem] bg-background/50 backdrop-blur-sm border border-border/40 p-1.5 mt-2 min-h-[48px]">
          <AnimatePresence mode="wait" initial={false}>
            {recorder.status === "idle" ? (
              <motion.div key="idle-tools" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex items-center gap-1 ml-1">
                
                <Tooltip>
                  <TooltipTrigger >
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-pink-600 rounded-full h-9 w-9" onClick={openFilePicker}><Paperclip className="h-5 w-5" /></Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{t("Attach file")}</p></TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger >
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-pink-600 rounded-full h-9 w-9" onClick={() => { if (!recorder.devices.length) recorder.getDevices(true); recorder.start(); }}><Mic className="h-5 w-5" /></Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{t("Start recording")}</p></TooltipContent>
                </Tooltip>

                <DropdownMenu>
                  <DropdownMenuTrigger >
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-pink-600 rounded-full h-8 w-8"><ChevronDown className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[300px] rounded-2xl p-2">
                    <DropdownMenuLabel>{t("Microphone")}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {recorder.isFetching ? <DropdownMenuItem disabled><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("Fetching...")}</DropdownMenuItem> :
                      <DropdownMenuRadioGroup value={recorder.selectedMicId} onValueChange={recorder.setSelectedMicId}>
                        {recorder.devices.map(d => <DropdownMenuRadioItem key={d.deviceId} value={d.deviceId} className="rounded-lg">{d.label || "Mic"}</DropdownMenuRadioItem>)}
                      </DropdownMenuRadioGroup>
                    }
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="rounded-lg" onSelect={() => recorder.getDevices(true)}><RefreshCw className="h-4 w-4 mr-2" /> {t("Update microphone list")}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="ml-2">
                  <Select data={foldersQuery?.data?.folders || []} loading={isLoadingFolders} />
                </div>

                {recorder.isBlocked && <p className="text-xs text-red-500 ml-2">{t("Mic blocked")}</p>}
              </motion.div>
            ) : (
              <motion.div key="recording-tools" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 w-full mr-2 ml-2">
                <Button variant="ghost" size="icon" onClick={() => recorder.stop(false)} className="text-muted-foreground hover:text-destructive rounded-full"><Trash2 className="h-5 w-5" /></Button>
                
                <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
                   <motion.div animate={{ opacity: recorder.status === "paused" ? 0.5 : [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="h-2 w-2 bg-red-500 rounded-full" />
                   <span className="text-sm font-mono text-red-600 font-bold min-w-[40px] text-center">{formatTime(recorder.elapsedTime)}</span>
                </div>
                
                <div className="flex-1 h-8 flex justify-center items-center">
                   {recorder.stream && <AudioVisualizer mediaStream={recorder.stream} isPaused={recorder.status !== 'recording'} />}
                </div>

                <Button variant="ghost" size="icon" className="rounded-full" onClick={recorder.status === "recording" ? recorder.pause : recorder.resume}>
                  {recorder.status === "recording" ? <Pause className="h-5 w-5 text-muted-foreground" /> : <Play className="h-5 w-5 text-muted-foreground" />}
                </Button>

                <Tooltip>
                  <TooltipTrigger >
                    <Button variant="ghost" size="icon" onClick={() => recorder.stop(true)} className="text-red-500 hover:bg-red-50 rounded-full h-8 w-8 flex items-center justify-center"><StopCircle className="h-7 w-7" /></Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{t("Stop & Attach")}</p></TooltipContent>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex-shrink-0 ml-auto">
            <AnimatePresence>
                <motion.span 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="hidden sm:inline-block mr-3 text-[10px] text-muted-foreground/90 font-medium select-none"
                >
                  ⌘ + Enter
                </motion.span>
            </AnimatePresence>

            <Button 
              onClick={saveNote} 
              size="icon" 
              disabled={isSubmitting || recorder.status === "recording"} 
              className="rounded-full h-10 w-10 bg-black hover:bg-black-600 text-white shadow-lg shadow-black/20 transition-all active:scale-95"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : recorder.status !== "idle" ? <AudioLinesIcon className="h-4 w-4 animate-pulse" /> : /*<AIArrow className="h-5 w-5" strokeWidth={5} />*/ <ArrowUp />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {isDragActive && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 rounded-[2rem] bg-background/90 backdrop-blur-sm flex items-center justify-center z-30 border-2 border-amber-500 border-dashed">
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-2 text-pink-600 font-bold">
                <div className="p-4 rounded-full bg-pink-500/10"><UploadCloud className="h-8 w-8" /></div>
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