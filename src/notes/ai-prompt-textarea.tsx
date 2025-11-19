import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next"; // Import the hook
import { AudioVisualizer } from "@/components/audio-visualiser";

// --- Shadcn UI Imports ---
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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

// --- Lucide Icon Imports ---
import {
  File,
  Image,
  X,
  Paperclip,
  Mic,
  StopCircle,
  UploadCloud,
  Download,
  ChevronDown,
  Loader2,
  RefreshCw,
  Pause,
  Play,
  Trash2,
  ArrowUp,
  AudioLinesIcon,
} from "lucide-react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { axiosInstance, createZip2, uploadFileToCF } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useMutation } from "@tanstack/react-query";
import { useUserStore } from "@/store/userStore";
import { toast } from "sonner";
import { FilePreviewDialog } from "@/components/file-preview-dialog";
import { Spinner } from "@/components/ui/spinner";

// --- AudioPreview Sub-Component (for completed recordings) ---
const AudioPreview = ({ file, onRemove, portalContainer }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { t } = useTranslation(); // Add translation hook
  const audioRef = useRef(null);

  const togglePlayPause = (e) => {
    e.stopPropagation();
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handlePause);
    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handlePause);
    };
  }, []);

  return (
    <div className="group relative flex items-center gap-2 bg-muted/50 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted">
      <audio ref={audioRef} src={file.preview} preload="auto" />
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-foreground"
        onClick={togglePlayPause}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      <span className="max-w-[120px] truncate font-medium">{file.name}</span>
      <Tooltip>
        <TooltipTrigger>
          <a href={file.preview} download={file.name}>
            <Download className="h-4 w-4 text-muted-foreground hover:text-foreground ml-1" />
          </a>
        </TooltipTrigger>
        <TooltipContent container={portalContainer}>
          <p>{t("Download")}</p>
        </TooltipContent>
      </Tooltip>
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-background border opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};

// --- Main AIPromptInput Component ---
export function AIPromptInput({ portalContainer, setIsPolling }) {
  const { t } = useTranslation(); // Initialize translation hook
  const { companyId } = useUserStore();
  const selectedFolder = useUserStore((store) => store.selectedFolder);

  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState([]);
  const [recordingStatus, setRecordingStatus] = useState("idle");
  const [audioStream, setAudioStream] = useState(null);
  const [isRecorderBlocked, setIsRecorderBlocked] = useState(false);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedMicId, setSelectedMicId] = useState("default");
  const [isFetchingMics, setIsFetchingMics] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [zipData, setZipData] = useState<any>();

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const hasFetchedMics = useRef(false);
  const isDeletingRef = useRef(false);
  const timerIntervalRef = useRef(null);
  const lastStartTimeRef = useRef(0);
  const previouslyElapsedTimeRef = useRef(0);

  const getAudioDevices = useCallback(async (requestPermission = false) => {
    setIsFetchingMics(true);
    setIsRecorderBlocked(false);
    try {
      if (requestPermission) {
        const tempStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        tempStream.getTracks().forEach((track) => track.stop());
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter((device) => device.kind === "audioinput");
      setAudioDevices(mics);
      hasFetchedMics.current = true;
    } catch (err) {
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      )
        setIsRecorderBlocked(true);
    } finally {
      setIsFetchingMics(false);
    }
  }, []);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    const milliseconds = Math.floor((ms % 1000) / 100).toString();
    return `${minutes}:${seconds}.${milliseconds}`;
  };

  const startRecording = async () => {
    try {
      const constraints = {
        audio: {
          deviceId:
            selectedMicId !== "default" ? { exact: selectedMicId } : undefined,
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setAudioStream(stream);
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstart = () => setRecordingStatus("recording");
      recorder.onstop = () => {
        clearInterval(timerIntervalRef.current);
        setElapsedTime(0);
        previouslyElapsedTimeRef.current = 0;
        lastStartTimeRef.current = 0;

        if (isDeletingRef.current) {
          audioChunksRef.current = [];
          isDeletingRef.current = false;
        } else if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          audioBlob.name = `recording_${Date.now()}.webm`;
          audioBlob.lastModified = Date.now();
          setFiles((prevFiles) => [
            ...prevFiles,
            Object.assign(audioBlob, {
              preview: URL.createObjectURL(audioBlob),
            }),
          ]);
        }

        setRecordingStatus("idle");
        setAudioStream(null);
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      previouslyElapsedTimeRef.current = 0;
      lastStartTimeRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        setElapsedTime(
          previouslyElapsedTimeRef.current +
            (Date.now() - lastStartTimeRef.current)
        );
      }, 100);
    } catch (err) {
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      )
        setIsRecorderBlocked(true);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingStatus("paused");
      clearInterval(timerIntervalRef.current);
      previouslyElapsedTimeRef.current = elapsedTime;
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingStatus("recording");
      lastStartTimeRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        setElapsedTime(
          previouslyElapsedTimeRef.current +
            (Date.now() - lastStartTimeRef.current)
        );
      }, 100);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const deleteRecording = () => {
    isDeletingRef.current = true;
    stopRecording();
  };

  const handleRecordButtonClick = async () => {
    if (recordingStatus === "idle") {
      if (!hasFetchedMics.current) await getAudioDevices(true);
      startRecording();
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    setFiles((prevFiles) => [
      ...prevFiles,
      ...acceptedFiles.map((file) =>
        Object.assign(file, { preview: URL.createObjectURL(file) })
      ),
    ]);
  }, []);

  const removeFile = (fileToRemove) => (e) => {
    e.stopPropagation();
    setFiles(files.filter((file) => file !== fileToRemove));
    URL.revokeObjectURL(fileToRemove.preview);
  };

  useEffect(
    () => () => {
      files.forEach((file) => URL.revokeObjectURL(file.preview));
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [files]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    accept: { "image/*": [], "application/pdf": [], "audio/*": [] },
  });

  const saveNote = async () => {
    const zipData = await createZip2(files, prompt);
    setZipData(zipData);
    if (zipData) {
      draftNoteMutation.mutate({
        note_type: "multi",
        name: t("New Recording"),
        file_name: zipData.fileName,
        transcript: t("Not transcribed yet"),
        language: "en",
        youtube_url: null,
        folder_id: selectedFolder?.id,
      });
    }
  };

  useEffect(() => {
    if (zipData && noteId)
      generateUploadLink.mutate({ noteId, file_name: zipData?.fileName });
  }, [zipData, noteId]);

  const draftNoteMutation = useMutation({
    mutationFn: (newNote: any) => {
      return axiosInstance.post(
        `${API_BASE_URL}/company/${companyId}/notes/create`,
        newNote
      );
    },
    onSuccess: (response) => setNoteId(response?.data.id),
    onError: (error: any) => console.error(error.response?.data),
  });

  const generateUploadLink = useMutation({
    mutationFn: ({ file_name, noteId }) => {
      return axiosInstance.put(
        API_BASE_URL +
          `/company/${companyId}/notes/${noteId}/generateFileUploadLink`,
        { file_name }
      );
    },
    onSuccess: (response) => {
      const uploadUrl = response.data.upload_url;
      uploadFileToCF(noteId, uploadUrl, zipData.zipBlob, zipData.fileName)
        .then(() => markUploadAsFinished.mutate(noteId))
        .catch((error) => console.log(error));
    },
    onError: (error) => console.log(error.response?.data),
  });

  const markUploadAsFinished = useMutation({
    mutationFn: (noteId: string) => {
      return axiosInstance.put(
        API_BASE_URL + `/company/${companyId}/notes/${noteId}/setAsUploaded`,
        {}
      );
    },
    onSuccess: () => {
      setIsPolling(true);
      setNoteId(null);
      setAudioStream(null);
      setPrompt("");
      setFiles([]);
      toast.success(t("Note has been created"));
    },
    onError: (error) => {
      console.log(error.response?.data);
      console.log(
        t(
          "Sorry, couldn't start processing your note. Please try again by creating new one."
        )
      );
    },
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`relative rounded-xl border bg-background p-2 transition-all ${
          recordingStatus !== "idle"
            ? "border-primary ring-2 ring-primary/20"
            : "border-input focus-within:ring-2 focus-within:ring-ring focus-within:border-primary"
        }`}
      >
        <input {...getInputProps()} />
        <Textarea
          placeholder={t("Ask anything, drag files, or start recording...")}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[60px] w-full resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 text-base py-2.5"
          rows={5}
        />

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pb-3 mt-2">
            {files.map((file, index) => {
              if (file.type.startsWith("audio/")) {
                return (
                  <AudioPreview
                    key={file.name + index}
                    file={file}
                    onRemove={removeFile(file)}
                    portalContainer={portalContainer}
                  />
                );
              }
              return (
                <div
                  onClick={() => {
                    if (file.type === "application/pdf") setPreviewFile(file);
                  }}
                  key={file.name + index}
                  className={
                    (file.type === "application/pdf"
                      ? " cursor-pointer "
                      : " ") +
                    "group relative flex items-center gap-2 bg-muted/50 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted"
                  }
                >
                  <div className="text-muted-foreground">
                    {file.type.startsWith("image/") ? (
                      <Image className="h-4 w-4" />
                    ) : (
                      <File className="h-4 w-4" />
                    )}
                  </div>
                  <span className="max-w-[120px] truncate font-medium">
                    {file.name}
                  </span>
                  {file.type.startsWith("image/") && (
                    <Zoom>
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="h-8 w-8 rounded object-cover border ml-1"
                      />
                    </Zoom>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-background border opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    onClick={removeFile(file)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-between items-center border-t bg-transparent pt-2 px-2 mt-1 min-h-[44px]">
          <div className="flex items-center gap-1">
            <>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground rounded-full"
                    onClick={open}
                    type="button"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent container={portalContainer}>
                  <p>{t("Attach file")}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground rounded-full"
                    onClick={handleRecordButtonClick}
                    type="button"
                    disabled={isRecorderBlocked}
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent container={portalContainer}>
                  <p>{t("Start recording")}</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger>
                    <DropdownMenuTrigger>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground rounded-full w-8 h-8"
                        disabled={recordingStatus !== "idle"}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent container={portalContainer}>
                    <p>{t("Select Mic")}</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent
                  container={portalContainer}
                  align="start"
                  className="w-[350px]"
                >
                  <DropdownMenuLabel>{t("Microphone")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isFetchingMics && (
                    <DropdownMenuItem disabled>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("Fetching...")}
                    </DropdownMenuItem>
                  )}
                  {!isFetchingMics && audioDevices.length > 0 && (
                    <DropdownMenuRadioGroup
                      value={selectedMicId}
                      onValueChange={setSelectedMicId}
                    >
                      {audioDevices.map((mic) => (
                        <DropdownMenuRadioItem
                          key={mic.deviceId}
                          value={mic.deviceId}
                          className="truncate"
                        >
                          {mic.label ||
                            t("Microphone {{number}}", {
                              number: audioDevices.indexOf(mic) + 1,
                            })}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  )}
                  {!isFetchingMics && audioDevices.length === 0 && (
                    <DropdownMenuItem disabled>
                      {isRecorderBlocked
                        ? t("Permission denied")
                        : t("No mics found")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => getAudioDevices(true)}>
                    <RefreshCw className="h-4 w-4 mr-2" /> {t("Refresh List")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {isRecorderBlocked && (
                <p className="text-xs text-red-500 ml-2">
                  {t("Mic access denied.")}
                </p>
              )}
            </>

            {recordingStatus !== "idle" && (
              <>
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={deleteRecording}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent container={portalContainer}>
                    <p>{t("Delete")}</p>
                  </TooltipContent>
                </Tooltip>
                {recordingStatus === "recording" && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground"
                        onClick={pauseRecording}
                      >
                        <Pause className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent container={portalContainer}>
                      <p>{t("Pause")}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {recordingStatus === "paused" && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground"
                        onClick={resumeRecording}
                      >
                        <Play className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent container={portalContainer}>
                      <p>{t("Resume")}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {recordingStatus !== "idle" && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 rounded-full"
                        onClick={stopRecording}
                      >
                        <StopCircle className="h-6 w-6" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent container={portalContainer}>
                      <p>{t("Stop & Save")}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                  <p className="text-sm font-mono text-muted-foreground w-[60px]">
                    {formatTime(elapsedTime)}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex-1 flex items-center justify-center gap-2">
            {audioStream && (
              <AudioVisualizer
                mediaStream={audioStream}
                isPaused={recordingStatus !== "recording"}
              />
            )}
          </div>

          <div className="flex-shrink-0">
            <Button
              onClick={() => saveNote()}
              size="icon"
              disabled={
                draftNoteMutation.isPending ||
                markUploadAsFinished.isPending ||
                generateUploadLink.isPending ||
                recordingStatus === "recording"
              }
              className="rounded-full h-8 w-8 md:h-9 md:w-9"
            >
              {draftNoteMutation.isPending ||
              markUploadAsFinished.isPending ||
              generateUploadLink.isPending ? (
                <Spinner color="#C04796" />
              ) : recordingStatus === "recording" ? (
                <AudioLinesIcon />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        {isDragActive && (
          <div className="absolute inset-0 rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 border-2 border-primary border-dashed">
            <div className="flex flex-col items-center gap-2 text-primary font-medium">
              <div className="p-4 rounded-full bg-primary/10">
                <UploadCloud className="h-8 w-8" />
              </div>
              <p>{t("Drop files to attach")}</p>
            </div>
          </div>
        )}
      </div>
      <FilePreviewDialog
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}