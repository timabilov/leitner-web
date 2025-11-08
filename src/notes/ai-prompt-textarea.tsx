import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { AudioVisualizer } from '@/components/audio-visualiser'; // Adjust path if needed

// --- Shadcn UI Imports ---
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// --- Lucide Icon Imports ---
import { 
  File, Image, X, Paperclip, CornerDownLeft, Mic, 
  StopCircle, UploadCloud, Download, ChevronDown, Loader2, RefreshCw, Pause, Play, Trash2,
  ChevronUp,
  ArrowUp,
  FileText
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'
import { cn } from "@/lib/utils";
import { axiosInstance, createZip, uploadFileToCF } from '@/services/auth';
import { API_BASE_URL } from '@/services/config';
import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '@/store/userStore';
import { toast } from 'sonner';


// --- AudioPreview Sub-Component (for completed recordings) ---
const AudioPreview = ({ file, onRemove, portalContainer }) => {
  const [isPlaying, setIsPlaying] = useState(false);

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
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handlePause);
    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handlePause);
    };
  }, []);

  return (
    <div className="group relative flex items-center gap-2 bg-muted/50 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted">
      <audio ref={audioRef} src={file.preview} preload="auto" />
      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={togglePlayPause}>
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <span className="max-w-[120px] truncate font-medium">{file.name}</span>
      <Tooltip>
        <TooltipTrigger >
          <a href={file.preview} download={file.name}>
            <Download className="h-4 w-4 text-muted-foreground hover:text-foreground ml-1" />
          </a>
        </TooltipTrigger>
        <TooltipContent container={portalContainer}><p>Download</p></TooltipContent>
      </Tooltip>
      <Button variant="ghost" size="icon" className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-background border opacity-0 group-hover:opacity-100 transition-opacity shadow-sm" onClick={onRemove}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};


// --- Main AIPromptInput Component ---
export function AIPromptInput({ portalContainer }) {
    const { companyId, userId, email, isLoggedIn, photo, fullName } =
      useUserStore();
  const selectedFolder = useUserStore(store => store.selectedFolder);

  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState([]);
  const [recordingStatus, setRecordingStatus] = useState('idle'); // 'idle', 'recording', 'paused'
  const [audioStream, setAudioStream] = useState(null);
  const [isRecorderBlocked, setIsRecorderBlocked] = useState(false);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedMicId, setSelectedMicId] = useState('default');
  const [isFetchingMics, setIsFetchingMics] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [previewFile, setPreviewFile] = useState<File | null>(null); // For PDF preview dialog
  const [zipPath, setZipPath] = useState<string | null>(null);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [zipBlob, setZipBlob] = useState<string>();
  const [zipData, setZipData] = useState<any>();

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const hasFetchedMics = useRef(false);
  const isDeletingRef = useRef(false); // NEW: The flag to signal deletion intent
 const timerIntervalRef = useRef(null);
  const startTimeRef = useRef(0);
 // --- NEW: Robust Timer Refs (Accumulator Pattern) ---
  const lastStartTimeRef = useRef(0);
  const previouslyElapsedTimeRef = useRef(0);

  const getAudioDevices = useCallback(async (requestPermission = false) => {
    setIsFetchingMics(true);
    setIsRecorderBlocked(false);
    try {
      if (requestPermission) {
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        tempStream.getTracks().forEach(track => track.stop());
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter(device => device.kind === 'audioinput');
      setAudioDevices(mics);
      hasFetchedMics.current = true;
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') setIsRecorderBlocked(true);
    } finally {
      setIsFetchingMics(false);
    }
  }, []);

   const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    const milliseconds = Math.floor((ms % 1000) / 100).toString();
    return `${minutes}:${seconds}.${milliseconds}`;
  };



  const startRecording = async () => {
    try {
      const constraints = { audio: { deviceId: selectedMicId !== 'default' ? { exact: selectedMicId } : undefined } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setAudioStream(stream);
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      recorder.onstart = () => setRecordingStatus('recording');
        recorder.onstop = () => {
        clearInterval(timerIntervalRef.current);
        setElapsedTime(0);
        previouslyElapsedTimeRef.current = 0;
        lastStartTimeRef.current = 0;


        if (isDeletingRef.current) {
          audioChunksRef.current = []; // Ensure chunks are cleared
          isDeletingRef.current = false; // Reset the flag
        } else if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          audioBlob.name = `recording_${Date.now()}.webm`;
          audioBlob.lastModified = Date.now();
          setFiles(prevFiles => [...prevFiles, Object.assign(audioBlob, { preview: URL.createObjectURL(audioBlob) })]);
        }
        

        setRecordingStatus('idle');
        setAudioStream(null);
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      };
      recorder.start();
        // Start timer from scratch
      previouslyElapsedTimeRef.current = 0;
      lastStartTimeRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        setElapsedTime(previouslyElapsedTimeRef.current + (Date.now() - lastStartTimeRef.current));
      }, 100);
    } catch (err) { if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') setIsRecorderBlocked(true); }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingStatus('paused');
      clearInterval(timerIntervalRef.current);
      previouslyElapsedTimeRef.current = elapsedTime;
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingStatus('recording');
     lastStartTimeRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        // The new elapsed time is the previously stored time plus the new segment's time
        setElapsedTime(previouslyElapsedTimeRef.current + (Date.now() - lastStartTimeRef.current));
      }, 100);
    }
  };

 const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // const deleteRecording = () => {
  //   audioChunksRef.current = []; // Discard any captured audio
  //   stopRecording(); // Use the same stop logic to clean up the stream and state
  // };


  // MODIFIED: Delete function now sets the flag before stopping
  const deleteRecording = () => {
    isDeletingRef.current = true;
    stopRecording(); // Trigger the onstop event, which will now see the flag
  };



  const handleRecordButtonClick = async () => {
    if (recordingStatus === 'idle') {
      if (!hasFetchedMics.current) await getAudioDevices(true);
      startRecording();
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles.map(file => Object.assign(file, { preview: URL.createObjectURL(file) }))]);
  }, []);

  const removeFile = (fileToRemove) => (e) => {
    e.stopPropagation();
    setFiles(files.filter(file => file !== fileToRemove));
    URL.revokeObjectURL(fileToRemove.preview);
  };

  useEffect(() => () => { files.forEach(file => URL.revokeObjectURL(file.preview)); mediaStreamRef.current?.getTracks().forEach(track => track.stop()); }, [files]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ onDrop, noClick: true, noKeyboard: true, accept: { 'image/*': [], 'application/pdf': [], 'audio/*': [] } });


  const saveNote = async () => {
     const zipData  = await createZip(files, prompt);
     setZipData(zipData)
     const fileName =  `archive-${Date.now()}.zip`;
    if (zipData) {
       draftNoteMutation.mutate({
        note_type: 'multi',
        name: 'New Recording',
        file_name: `archive-.zip`,
        transcript: 'Not transcribed yet',
        language: 'en',
        youtube_url: null,
        folder_id: selectedFolder?.id,
      });
    }
  }

  useEffect(() => {
    if (zipData && noteId) generateUploadLink.mutate({noteId, file_name: "archive-123.zip" })
  }, [zipData, noteId]);


  const draftNoteMutation = useMutation({
    mutationFn: (newNote: any) => {
      return axiosInstance.post(`${API_BASE_URL}/company/${companyId}/notes/create`, newNote);
    },
    onSuccess: (response) => {
      console.log('Draft Note Success:', response.data);
      setNoteId(response?.data.id);
      // generateUploadLink.mutate({zipPath: zipPath, noteId: response?.data.id})
    },
    onError: (error: any) => {
      console.error('Draft Note Error:', error.response?.data);
    }
  });


  const generateUploadLink = useMutation({
    mutationFn: ({file_name, noteId }) => {
      return axiosInstance.put(API_BASE_URL + `/company/${companyId}/notes/${noteId}/generateFileUploadLink`, {
        file_name,
        // file_type: 'application/zip',
      });
    },
    onSuccess: (response) => {
      const uploadUrl = response.data.upload_url;
      console.log('Upload URL generated:', uploadUrl);
      try {
        uploadFileToCF(noteId, uploadUrl, zipData).then(() => {
          console.log('Upload to CF completed');
          markUploadAsFinished.mutate(noteId);
          
        }).catch(error => {
          // handleFailedGenerateUploadLink(uploadUrl);
          console.log(error)
        });
      } catch (error) {
          console.log(error)
      }
    },
    onError: (error) => {
      console.log('Generate upload link error:', error.response?.data);
      //  Sentry.captureException("Failed while uploadToCFFromPath ", {
      //   extra: {  noteId, materialZipUri, error },
      // })
    },
  });


const markUploadAsFinished = useMutation({
    mutationFn: (noteId: string) => {
      return axiosInstance.put(API_BASE_URL + `/company/${companyId}/notes/${noteId}/setAsUploaded`, {});
    },
    onSuccess: () => {
      console.log('Note marked as finished!');
      toast.success("Note has been created");
    },
    onError: (error) => {
      console.log('Mark upload as finished error:', error.response?.data);
    //   Sentry.captureException(error,
    //     {
    //       extra: {
    //         noteId,
    //         companyId,
    //         materialZipUri,
    //       },
    //     }
    //   );
      console.log("Sorry, couldn't start processing your note. Please try again by creating new one.")
    //   queryClient.invalidateQueries(['notes'])
    //   queryClient.invalidateQueries(['profile'])
    //   setTimeout(() => {
    //     router.dismissAll();
    //   }, 1000);
      // noteLogger.error(noteId, `Error marking upload as finished: ${error.response?.data}`)
    },
  });





  return (
    <div className="w-full max-w-2xl mx-auto">
      <div {...getRootProps()} className={`relative rounded-xl border bg-background p-2 transition-all ${recordingStatus !== 'idle' ? 'border-primary ring-2 ring-primary/20' : 'border-input focus-within:ring-2 focus-within:ring-ring focus-within:border-primary'}`}>
        <input {...getInputProps()} />
        <Textarea placeholder="Ask anything, drag files, or start recording..." value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-[60px] w-full resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 text-base py-2.5" />

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pb-3 mt-2">
            {files.map((file, index) => {
              if (file.type.startsWith('audio/')) {
                return <AudioPreview key={file.name + index} file={file} onRemove={removeFile(file)} portalContainer={portalContainer} />;
              }
              return (
                <div onClick={() => {
                  if (file.type === "application/pdf") setPreviewFile(file)
                }} key={file.name + index} className={(file.type === "application/pdf" ? " cursor-pointer ": " ") +  "group relative flex items-center gap-2 bg-muted/50 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted"}>
                  <div className="text-muted-foreground">{file.type.startsWith('image/') ? <Image className="h-4 w-4" /> : <File className="h-4 w-4"/>}</div>
                  <span className="max-w-[120px] truncate font-medium">{file.name}</span>
                  {file.type.startsWith('image/') && (
                     <Zoom>
                      <img src={file.preview} alt={file.name} className="h-8 w-8 rounded object-cover border ml-1" />
                    </Zoom>

        
                  )}
                  <Button variant="ghost" size="icon" className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-background border opacity-0 group-hover:opacity-100 transition-opacity shadow-sm" onClick={removeFile(file)}><X className="h-3 w-3" /></Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-between items-center border-t bg-transparent pt-2 px-2 mt-1 min-h-[44px]">
          <div className="flex items-center gap-1">
            {/* {recordingStatus === 'idle' && ( */}
              <>
                <Tooltip><TooltipTrigger ><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full" onClick={open} type="button"><Paperclip className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent container={portalContainer}><p>Attach file</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger ><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full" onClick={handleRecordButtonClick} type="button" disabled={isRecorderBlocked}><Mic className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent container={portalContainer}><p>Start recording</p></TooltipContent></Tooltip>
                <DropdownMenu><Tooltip><TooltipTrigger ><DropdownMenuTrigger ><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full w-8 h-8" disabled={recordingStatus !== 'idle'}><ChevronDown className="h-4 w-4" /></Button></DropdownMenuTrigger></TooltipTrigger><TooltipContent container={portalContainer}><p>Select Mic</p></TooltipContent></Tooltip><DropdownMenuContent container={portalContainer} align="start" className="w-[350px]"><DropdownMenuLabel>Microphone</DropdownMenuLabel><DropdownMenuSeparator />{isFetchingMics && <DropdownMenuItem disabled><Loader2 className="h-4 w-4 mr-2 animate-spin" />Fetching...</DropdownMenuItem>}{!isFetchingMics && audioDevices.length > 0 && (<DropdownMenuRadioGroup value={selectedMicId} onValueChange={setSelectedMicId}>{audioDevices.map(mic => <DropdownMenuRadioItem key={mic.deviceId} value={mic.deviceId} className="truncate">{mic.label || `Microphone ${audioDevices.indexOf(mic) + 1}`}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup>)}{!isFetchingMics && audioDevices.length === 0 && <DropdownMenuItem disabled>{isRecorderBlocked ? 'Permission denied' : 'No mics found'}</DropdownMenuItem>}<DropdownMenuSeparator /><DropdownMenuItem onSelect={() => getAudioDevices(true)}><RefreshCw className="h-4 w-4 mr-2" /> Refresh List</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                {isRecorderBlocked && <p className="text-xs text-red-500 ml-2">Mic access denied.</p>}
                
              </>
            {/* )} */}

            {recordingStatus !== 'idle' && (
              <>
                <Tooltip><TooltipTrigger ><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={deleteRecording}><Trash2 className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent container={portalContainer}><p>Delete</p></TooltipContent></Tooltip>
                {recordingStatus === 'recording' && (<Tooltip><TooltipTrigger ><Button variant="ghost" size="icon" className="text-muted-foreground" onClick={pauseRecording}><Pause className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent container={portalContainer}><p>Pause</p></TooltipContent></Tooltip>)}
                {recordingStatus === 'paused' && (<Tooltip><TooltipTrigger ><Button variant="ghost" size="icon" className="text-muted-foreground" onClick={resumeRecording}><Play className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent container={portalContainer}><p>Resume</p></TooltipContent></Tooltip>)}
                 {recordingStatus !== 'idle' && (
                <Tooltip><TooltipTrigger ><Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 rounded-full" onClick={stopRecording}><StopCircle className="h-6 w-6" /></Button></TooltipTrigger><TooltipContent container={portalContainer}><p>Stop & Save</p></TooltipContent></Tooltip>
            )}
             <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                    <p className="text-sm font-mono text-muted-foreground w-[60px]">{formatTime(elapsedTime)}</p>
                  </div>

              </>
            )}
          </div>

          <div className="flex-1 flex items-center justify-center gap-2">
             { audioStream  && <AudioVisualizer mediaStream={audioStream} isPaused={recordingStatus !== 'recording'}/>}
          </div>

          <div className="flex-shrink-0">
            <Button onClick={() => saveNote()} size="icon" /*disabled={!prompt && files.length === 0}*/ className="rounded-full h-8 w-8 md:h-9 md:w-9"><ArrowUp className="h-4 w-4" /></Button>
          </div>
        </div>
        
        {isDragActive && (<div className="absolute inset-0 rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 border-2 border-primary border-dashed"><div className="flex flex-col items-center gap-2 text-primary font-medium"><div className="p-4 rounded-full bg-primary/10"><UploadCloud className="h-8 w-8" /></div><p>Drop files to attach</p></div></div>)}
      </div>
       <FilePreviewDialog
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />

    </div>
  );
}


const FilePreview = ({ file, onRemove, onPreview }: { file: File; onRemove: () => void; onPreview: () => void; }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isPdf = file.type === "application/pdf";
  const isImage = file.type.startsWith("image/");

  useEffect(() => {
    if (isImage || file.type.startsWith("audio/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const renderPreview = () => {
    if (isImage && previewUrl) {
      return ( 
        <Zoom>
          <img src={previewUrl} alt={file.name} className="w-16 h-16 object-cover rounded-md" />
        </Zoom>
      );
    }
    if (file.type.startsWith("audio/") && previewUrl) {
      return <audio src={previewUrl} controls className="h-10 w-full max-w-xs" />;
    }
    const Icon = isPdf ? FileText : File;
    return (
      <div 
        onClick={isPdf ? onPreview : undefined}
        className={cn("w-16 h-16 flex items-center justify-center bg-secondary rounded-md", isPdf && "cursor-pointer hover:bg-secondary/80")}
      >
        <Icon className="w-8 h-8 text-secondary-foreground" />
      </div>
    );
  };

  return (
    <li className="flex items-center justify-between p-2 bg-muted rounded-lg gap-4">
      <div className="shrink-0">{renderPreview()}</div>
      <div className="flex-grow min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Remove file</p></TooltipContent>
      </Tooltip>
    </li>
  );
};

const FilePreviewDialog = ({ file, onClose }: { file: File | null; onClose: () => void; }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file && file.type === "application/pdf") {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  if (!file || !previewUrl || file.type !== "application/pdf") return null;

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-6xl w-6xl h-[90vh] flex flex-col">
        <DialogHeader><DialogTitle className="truncate">{file.name}</DialogTitle></DialogHeader>
        <div className="py-4 flex-1 h-0">
          <embed src={previewUrl} type="application/pdf" className="w-full h-full z-50" />
         </div>
       </DialogContent>
        </Dialog>
  );
};
