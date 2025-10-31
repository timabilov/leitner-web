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
  StopCircle, UploadCloud, Download, ChevronDown, Loader2, RefreshCw, Pause, Play, Trash2
} from 'lucide-react';

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
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState([]);
  const [recordingStatus, setRecordingStatus] = useState('idle'); // 'idle', 'recording', 'paused'
  const [audioStream, setAudioStream] = useState(null);
  const [isRecorderBlocked, setIsRecorderBlocked] = useState(false);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedMicId, setSelectedMicId] = useState('default');
  const [isFetchingMics, setIsFetchingMics] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const hasFetchedMics = useRef(false);
  const isDeletingRef = useRef(false); // NEW: The flag to signal deletion intent

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
    } catch (err) { if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') setIsRecorderBlocked(true); }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingStatus('paused');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingStatus('recording');
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
                <div key={file.name + index} className="group relative flex items-center gap-2 bg-muted/50 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted">
                  <div className="text-muted-foreground">{file.type.startsWith('image/') ? <Image className="h-4 w-4" /> : <File className="h-4 w-4" />}</div>
                  <span className="max-w-[120px] truncate font-medium">{file.name}</span>
                  {file.type.startsWith('image/') && <img src={file.preview} alt={file.name} className="h-8 w-8 rounded object-cover border ml-1" />}
                  <Button variant="ghost" size="icon" className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-background border opacity-0 group-hover:opacity-100 transition-opacity shadow-sm" onClick={removeFile(file)}><X className="h-3 w-3" /></Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-between items-center border-t bg-transparent pt-2 px-2 mt-1 min-h-[44px]">
          <div className="flex items-center gap-1">
            {recordingStatus === 'idle' && (
              <>
                <Tooltip><TooltipTrigger ><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full" onClick={open} type="button"><Paperclip className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent container={portalContainer}><p>Attach file</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger ><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full" onClick={handleRecordButtonClick} type="button" disabled={isRecorderBlocked}><Mic className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent container={portalContainer}><p>Start recording</p></TooltipContent></Tooltip>
                <DropdownMenu><Tooltip><TooltipTrigger ><DropdownMenuTrigger ><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full w-7 h-7" disabled={recordingStatus !== 'idle'}><ChevronDown className="h-4 w-4" /></Button></DropdownMenuTrigger></TooltipTrigger><TooltipContent container={portalContainer}><p>Select Mic</p></TooltipContent></Tooltip><DropdownMenuContent container={portalContainer} align="start" className="w-[250px]"><DropdownMenuLabel>Microphone</DropdownMenuLabel><DropdownMenuSeparator />{isFetchingMics && <DropdownMenuItem disabled><Loader2 className="h-4 w-4 mr-2 animate-spin" />Fetching...</DropdownMenuItem>}{!isFetchingMics && audioDevices.length > 0 && (<DropdownMenuRadioGroup value={selectedMicId} onValueChange={setSelectedMicId}>{audioDevices.map(mic => <DropdownMenuRadioItem key={mic.deviceId} value={mic.deviceId} className="truncate">{mic.label || `Microphone ${audioDevices.indexOf(mic) + 1}`}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup>)}{!isFetchingMics && audioDevices.length === 0 && <DropdownMenuItem disabled>{isRecorderBlocked ? 'Permission denied' : 'No mics found'}</DropdownMenuItem>}<DropdownMenuSeparator /><DropdownMenuItem onSelect={() => getAudioDevices(true)}><RefreshCw className="h-4 w-4 mr-2" /> Refresh List</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                {isRecorderBlocked && <p className="text-xs text-red-500 ml-2">Mic access denied.</p>}
              </>
            )}

            {recordingStatus !== 'idle' && (
              <>
                <Tooltip><TooltipTrigger ><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={deleteRecording}><Trash2 className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent container={portalContainer}><p>Delete</p></TooltipContent></Tooltip>
                {recordingStatus === 'recording' && (<Tooltip><TooltipTrigger ><Button variant="ghost" size="icon" className="text-muted-foreground" onClick={pauseRecording}><Pause className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent container={portalContainer}><p>Pause</p></TooltipContent></Tooltip>)}
                {recordingStatus === 'paused' && (<Tooltip><TooltipTrigger ><Button variant="ghost" size="icon" className="text-muted-foreground" onClick={resumeRecording}><Play className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent container={portalContainer}><p>Resume</p></TooltipContent></Tooltip>)}
                 {recordingStatus !== 'idle' && (
                <Tooltip><TooltipTrigger ><Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 rounded-full" onClick={stopRecording}><StopCircle className="h-6 w-6" /></Button></TooltipTrigger><TooltipContent container={portalContainer}><p>Stop & Save</p></TooltipContent></Tooltip>
            )}
              </>
            )}
          </div>

          <div className="flex-1 flex items-center justify-center gap-2">
             {recordingStatus === 'recording' && audioStream  && <AudioVisualizer mediaStream={audioStream} isPaused={false}/>}
          </div>

          <div className="flex-shrink-0">
            {recordingStatus !== 'idle' ? (
               null
            ) : (
                <Button size="icon" disabled={!prompt && files.length === 0} className="rounded-full h-8 w-8 md:h-9 md:w-9"><CornerDownLeft className="h-4 w-4" /></Button>
            )}
          </div>
        </div>
        
        {isDragActive && (<div className="absolute inset-0 rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 border-2 border-primary border-dashed"><div className="flex flex-col items-center gap-2 text-primary font-medium"><div className="p-4 rounded-full bg-primary/10"><UploadCloud className="h-8 w-8" /></div><p>Drop files to attach</p></div></div>)}
      </div>
    </div>
  );
}