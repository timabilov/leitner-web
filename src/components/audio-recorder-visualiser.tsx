"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download, Mic, Trash, Pause, Play, Square, Repeat, Volume2
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  onRecordingComplete?: (audioBlob: Blob) => void;
  onStatusChange?: (status: "recording" | "paused" | "inactive") => void;
};

const mimeType = "audio/webm";

// --- Utility Functions ---
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const padWithLeadingZeros = (num: number, length: number): string => {
  return String(num).padStart(length, "0");
};

// --- Child Components (Wrapped with React.forwardRef) ---

const Timer = React.memo(React.forwardRef<HTMLDivElement, { hours: number; minutes: number; seconds: number; className?: string; }>(
  ({ hours, minutes, seconds, className }, ref) => {
    const [h1, h2] = useMemo(() => padWithLeadingZeros(hours, 2).split(""), [hours]);
    const [m1, m2] = useMemo(() => padWithLeadingZeros(minutes, 2).split(""), [minutes]);
    const [s1, s2] = useMemo(() => padWithLeadingZeros(seconds, 2).split(""), [seconds]);

    return (
        <div ref={ref} className={cn("flex items-center justify-center gap-0.5 rounded-md font-mono font-medium text-foreground bg-background", className)}>
            <span>{h1}</span><span>{h2}</span>:<span>{m1}</span><span>{m2}</span>:<span>{s1}</span><span>{s2}</span>
        </div>
    );
  }
));
Timer.displayName = "Timer";

const Timeline = React.memo(React.forwardRef<HTMLDivElement, { currentTime: number, duration: number, onSeek: (time: number) => void }>(
  ({ currentTime, duration, onSeek }, ref) => {
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if(duration <= 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const seekTime = (clickX / width) * duration;
        onSeek(seekTime);
    };

    return (
        <div ref={ref} className="w-full h-2 bg-muted rounded-full cursor-pointer group" onClick={handleClick}>
            <div className="h-full bg-primary rounded-full relative" style={{ width: `${progress}%` }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </div>
    );
  }
));
Timeline.displayName = "Timeline";

const VolumeControl = React.memo(React.forwardRef<HTMLDivElement, { volume: number, onVolumeChange: (value: number[]) => void }>(
  ({ volume, onVolumeChange }, ref) => {
    return (
        <div ref={ref} className="flex items-center gap-2 group">
            <Volume2 className="text-muted-foreground group-hover:text-foreground" size={18} />
            <Slider
                min={0} max={1} step={0.01}
                value={[volume]}
                onValueChange={onVolumeChange}
                className="w-24"
            />
        </div>
    );
  }
));
VolumeControl.displayName = "VolumeControl";

const MicSelect = React.memo(React.forwardRef<HTMLDivElement, { mics: MediaDeviceInfo[]; selectedMicId: string; onMicChange: (id: string) => void; disabled: boolean; }>(
  ({ mics, selectedMicId, onMicChange, disabled }, ref) => {
    return (
      <div ref={ref} className="w-full flex flex-col gap-2">
        <Label htmlFor="mic-select">Input device</Label>
        <Select onValueChange={onMicChange} value={selectedMicId} disabled={disabled}>
          <SelectTrigger id="mic-select" className="w-full">
            <SelectValue placeholder="Select a microphone" />
          </SelectTrigger>
          <SelectContent>
            {mics.map(mic => (
              <SelectItem key={mic.deviceId} value={mic.deviceId}>
                {mic.label || `Microphone ${mics.indexOf(mic) + 1}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }
));
MicSelect.displayName = "MicSelect";


// --- Main Component ---

export const AudioRecorderWithVisualizer = ({ className, onRecordingComplete, onStatusChange }: Props) => {
  const { theme } = useTheme();

  const [recordingStatus, setRecordingStatus] = useState<"recording" | "paused" | "inactive">("inactive");
  const [playbackStatus, setPlaybackStatus] = useState<"playing" | "paused" | "inactive">("inactive");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [availableMics, setAvailableMics] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>('');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [timer, setTimer] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const timerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const webAudioRefs = useRef<{
    audioContext: AudioContext | null; sourceNode: AudioNode | null;
    gainNode: GainNode | null; analyser: AnalyserNode | null;
    animationFrameId: number | null; startTime: number; pausedTime: number;
  }>({
    audioContext: null, sourceNode: null, gainNode: null, analyser: null,
    animationFrameId: null, startTime: 0, pausedTime: 0
  });

   useEffect(() => {
    if (onStatusChange) { onStatusChange(recordingStatus); }
  }, [recordingStatus, onStatusChange]);

  const getAvailableMics = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputDevices = devices.filter(d => d.kind === 'audioinput');
      setAvailableMics(audioInputDevices);
      if (audioInputDevices.length > 0 && !selectedMicId) {
        setSelectedMicId(audioInputDevices[0].deviceId);
      }
    } catch (err) { console.error("Error enumerating audio devices:", err); }
  };
  
  useEffect(() => { getAvailableMics(); }, []);

  const getMicrophoneStream = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      await getAvailableMics();
      return stream;
    } catch (err) {
      alert("Microphone access was denied or the selected device is not available.");
      console.error(err);
      return null;
    }
  };

  const startRecording = async () => {
    cleanupAllResources();
    const stream = await getMicrophoneStream();
    if (!stream) return;

    setRecordingStatus("recording");
    audioChunksRef.current = [];

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const sourceNode = audioContext.createMediaStreamSource(stream);
    
    sourceNode.connect(analyser);
    webAudioRefs.current = { ...webAudioRefs.current, audioContext, analyser, sourceNode };

    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(track => track.stop());
      cleanupWebAudioNodes(); 

      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        if (onRecordingComplete) onRecordingComplete(audioBlob);

        const arrayBuffer = await audioBlob.arrayBuffer();
        const decodingContext = new AudioContext();
        const decodedAudio = await decodingContext.decodeAudioData(arrayBuffer);
        audioBufferRef.current = decodedAudio;
        setDuration(decodedAudio.duration);
        await decodingContext.close();
      }
      setRecordingStatus("inactive");
    };
    mediaRecorder.start();
  };
  
  const stopRecording = () => { if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current?.stop(); };
  const pauseRecording = () => { if (mediaRecorderRef.current?.state === "recording") { mediaRecorderRef.current.pause(); setRecordingStatus("paused"); } };
  const resumeRecording = () => { if (mediaRecorderRef.current?.state === "paused") { mediaRecorderRef.current.resume(); setRecordingStatus("recording"); } };
  
  const playAudio = (offset = webAudioRefs.current.pausedTime) => {
    if (!audioBufferRef.current) return;
    cleanupWebAudioNodes(); 
    const audioContext = new AudioContext();
    const sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = audioBufferRef.current;
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    const analyser = audioContext.createAnalyser();
    sourceNode.connect(gainNode).connect(analyser).connect(audioContext.destination);
    sourceNode.loop = isLooping;
    webAudioRefs.current = { ...webAudioRefs.current, audioContext, sourceNode, gainNode, analyser, startTime: audioContext.currentTime - offset };
    sourceNode.onended = () => { if (webAudioRefs.current.sourceNode === sourceNode) pauseAudio(true); };
    sourceNode.start(0, offset);
    setPlaybackStatus("playing");
  };

  const pauseAudio = (isEnded = false) => {
    const { sourceNode, audioContext, startTime } = webAudioRefs.current;
    if (!sourceNode || !audioContext) return;
    webAudioRefs.current.pausedTime = isEnded ? 0 : audioContext.currentTime - startTime;
    sourceNode.stop();
    setPlaybackStatus("paused");
    cleanupWebAudioNodes();
    if (isEnded) setCurrentTime(0);
  };

  const handlePlaybackToggle = () => { if (playbackStatus === "playing") pauseAudio(); else playAudio(); };
  const handleSeek = (time: number) => {
    if (duration <= 0) return;
    const clampedTime = Math.max(0, Math.min(time, duration));
    if (playbackStatus === "playing") { pauseAudio(); playAudio(clampedTime); } 
    else { webAudioRefs.current.pausedTime = clampedTime; setCurrentTime(clampedTime); }
  };
  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolume(vol);
    if (webAudioRefs.current.gainNode && webAudioRefs.current.audioContext) {
      webAudioRefs.current.gainNode.gain.setValueAtTime(vol, webAudioRefs.current.audioContext.currentTime);
    }
  };
  const toggleLooping = () => {
    const newLooping = !isLooping;
    setIsLooping(newLooping);
    if (webAudioRefs.current.sourceNode instanceof AudioBufferSourceNode) {
      webAudioRefs.current.sourceNode.loop = newLooping;
    }
  };
  const discardRecording = () => { if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current?.stop(); cleanupAllResources(); };
  
  const cleanupWebAudioNodes = () => {
    const { audioContext, animationFrameId } = webAudioRefs.current;
    if (audioContext && audioContext.state !== "closed") audioContext.close();
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    webAudioRefs.current = { ...webAudioRefs.current, audioContext: null, sourceNode: null, gainNode: null, analyser: null, animationFrameId: null };
  };

  const cleanupAllResources = () => {
    if (playbackStatus !== 'inactive') setPlaybackStatus('inactive');
    cleanupWebAudioNodes();
    setRecordingStatus("inactive");
    setTimer(0);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    audioBufferRef.current = null;
    setCurrentTime(0);
    setDuration(0);
    webAudioRefs.current.pausedTime = 0;
  };
  
  const handleDownload = () => {
    if (audioUrl) {
      const a = document.createElement("a");
      a.href = audioUrl; a.download = `recording_${Date.now()}.webm`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
  };

  useEffect(() => {
    if (recordingStatus === "recording") timerTimeoutRef.current = setTimeout(() => setTimer((prev) => prev + 1), 1000);
    return () => { if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current); };
  }, [recordingStatus, timer]);
  
  useEffect(() => {
    const drawWaveform = (dataArray: Uint8Array) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { width: WIDTH, height: HEIGHT } = canvas;
      const canvasCtx = canvas.getContext("2d");
      if (!canvasCtx) return;
      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
      canvasCtx.fillStyle = theme === "dark" ? "#E5E7EB" : "#374151";
      const barWidth = 2, spacing = 1, numBars = Math.floor(WIDTH / (barWidth + spacing));
      let x = 0;
      for (let i = 0; i < numBars; i++) {
        const barHeight = (dataArray[i] / 128.0) * (HEIGHT / 1.5);
        canvasCtx.fillRect(x, HEIGHT / 2 - barHeight / 2, barWidth, barHeight);
        x += barWidth + spacing;
      }
    };
    const visualize = () => {
      const { analyser } = webAudioRefs.current;
      if (!analyser) return;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const draw = () => {
        if (!webAudioRefs.current.analyser) return;
        webAudioRefs.current.animationFrameId = requestAnimationFrame(draw);
        webAudioRefs.current.analyser.getByteTimeDomainData(dataArray);
        drawWaveform(dataArray);
        if (playbackStatus === 'playing') {
          const { audioContext, startTime } = webAudioRefs.current;
          const newTime = webAudioRefs.current.pausedTime + (audioContext!.currentTime - startTime);
          if (newTime <= duration) setCurrentTime(newTime);
        }
      };
      draw();
    };
    if (recordingStatus === 'recording' || playbackStatus === 'playing') visualize();
    return () => { if (webAudioRefs.current.animationFrameId) cancelAnimationFrame(webAudioRefs.current.animationFrameId); };
  }, [recordingStatus, playbackStatus, theme, duration]);
  
  const { hours, minutes, seconds } = useMemo(() => ({
      hours: Math.floor(timer / 3600),
      minutes: Math.floor((timer % 3600) / 60),
      seconds: timer % 60,
  }), [timer]);

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 w-full", className)}>
      <div className={cn("flex h-16 rounded-lg relative w-full items-center justify-center gap-2 max-w-5xl", { "border": recordingStatus !== "inactive" || audioUrl })}>
        {recordingStatus !== "inactive" || (audioUrl && playbackStatus !== 'inactive') ? (
          <canvas ref={canvasRef} className="h-full w-full bg-background rounded-lg" />
        ) : (
          <div className="text-muted-foreground">Press mic to start recording</div>
        )}
      </div>

      {/* --- Section for Timer OR Playback Controls --- */}
      <div className="flex w-full min-h-[40px] max-w-5xl items-center justify-center gap-2">
        {recordingStatus !== 'inactive' ? (
          <Timer hours={hours} minutes={minutes} seconds={seconds} />
        ) : audioUrl ? (
          <>
            <Tooltip><TooltipTrigger asChild><Button onClick={handlePlaybackToggle} size="icon">{playbackStatus === 'playing' ? <Pause size={18} /> : <Play size={18} />}</Button></TooltipTrigger><TooltipContent><p>{playbackStatus === 'playing' ? 'Pause' : 'Play'}</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button onClick={startRecording} size="icon"><Mic size={18} /></Button></TooltipTrigger><TooltipContent><p>Record Again</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button onClick={handleDownload} size="icon" variant="outline"><Download size={18} /></Button></TooltipTrigger><TooltipContent><p>Download</p></TooltipContent></Tooltip>
            <VolumeControl volume={volume} onVolumeChange={handleVolumeChange} />
            <Tooltip><TooltipTrigger asChild><Button onClick={toggleLooping} size="icon" variant={isLooping ? "secondary" : "ghost"}><Repeat size={16} /></Button></TooltipTrigger><TooltipContent><p>Loop</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button onClick={discardRecording} size="icon" variant="destructive"><Trash size={18} /></Button></TooltipTrigger><TooltipContent><p>Discard</p></TooltipContent></Tooltip>
          </>
        ) : null}
      </div>

      {audioUrl && recordingStatus === 'inactive' && (
        <div className="flex flex-col gap-3 w-full max-w-5xl">
            <Timeline currentTime={currentTime} duration={duration} onSeek={handleSeek} />
            <div className="flex justify-between items-center">
                <span className="font-mono text-sm">{formatTime(currentTime)}</span>
                <span className="font-mono text-sm">{formatTime(duration)}</span>
            </div>
        </div>
      )}

      {/* --- Main Action Buttons (only visible in initial or recording states) --- */}
      <div className="flex items-center gap-2">
        {recordingStatus === "inactive" && !audioUrl ? (
          <Tooltip><TooltipTrigger asChild><Button onClick={startRecording} size="icon" className="w-12 h-12"><Mic size={24} /></Button></TooltipTrigger><TooltipContent><p>Start Recording</p></TooltipContent></Tooltip>
        ) : recordingStatus !== "inactive" ? (
          <>
            <Tooltip><TooltipTrigger asChild><Button onClick={discardRecording} size="icon" variant="destructive"><Trash size={18} /></Button></TooltipTrigger><TooltipContent><p>Cancel</p></TooltipContent></Tooltip>
            {recordingStatus === "recording" ? (
              <Tooltip><TooltipTrigger asChild><Button onClick={pauseRecording} size="icon" variant="outline" className="w-12 h-12"><Pause size={24} /></Button></TooltipTrigger><TooltipContent><p>Pause</p></TooltipContent></Tooltip>
            ) : (
              <Tooltip><TooltipTrigger asChild><Button onClick={resumeRecording} size="icon" variant="outline" className="w-12 h-12"><Play size={24} /></Button></TooltipTrigger><TooltipContent><p>Resume</p></TooltipContent></Tooltip>
            )}
            <Tooltip><TooltipTrigger asChild><Button onClick={stopRecording} size="icon"><Square size={18} /></Button></TooltipTrigger><TooltipContent><p>Finish</p></TooltipContent></Tooltip>
          </>
        ) : null}
      </div>

      {availableMics.length > 0 && recordingStatus === 'inactive' && (
        <div className="w-full max-w-xs mt-2">
          <MicSelect
            mics={availableMics}
            selectedMicId={selectedMicId}
            onMicChange={setSelectedMicId}
            disabled={recordingStatus !== 'inactive' || playbackStatus !== 'inactive'}
          />
        </div>
      )}
    </div>
  );
};