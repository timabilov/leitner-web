'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, RotateCw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { usePostHog } from 'posthog-js/react';
import { useUserStore } from '@/store/userStore';

export function AudioPlayer({ audio }) {
  const posthog = usePostHog();
  const { userId, email } = useUserStore();
  
  // Refs
  const audioRef = useRef(null);
  const rafRef = useRef(null); // Reference for the Animation Frame ID

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false); // Track if user is currently dragging slider

  // 1. Setup Audio Event Listeners (Duration & End state)
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const setAudioData = () => {
      setDuration(audioElement.duration);
      setCurrentTime(audioElement.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      cancelAnimationFrame(rafRef.current);
    };

    audioElement.addEventListener("loadedmetadata", setAudioData);
    audioElement.addEventListener("ended", handleEnded);

    return () => {
      audioElement.removeEventListener("loadedmetadata", setAudioData);
      audioElement.removeEventListener("ended", handleEnded);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // 2. The Smooth Animation Loop
  const updateProgress = useCallback(() => {
    if (audioRef.current && !isDragging) {
      setCurrentTime(audioRef.current.currentTime);
      rafRef.current = requestAnimationFrame(updateProgress);
    }
  }, [isDragging]);

  // 3. Trigger Animation when Playing
  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(updateProgress);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, updateProgress]);


  // Handlers
  const togglePlayPause = () => {
    posthog.capture("audio_toggled", { userId, email });
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (value) => {
    // When dragging stops or clicks happen
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  // Skip buttons
  const skip = (amount) => {
    if (audioRef.current) {
      audioRef.current.currentTime += amount;
      // Manually update state immediately for snap feel
      setCurrentTime(audioRef.current.currentTime); 
    }
  };

  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds && timeInSeconds !== 0) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-2xl border rounded-md bg-muted/30 px-3 py-2 flex items-center gap-4 transition-colors hover:bg-muted/50">
      <audio ref={audioRef} src={audio.url} preload="metadata" />

      {/* --- Left Side: Controls --- */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => skip(-10)}
          title="-10s"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Button
          size="icon"
          className="h-9 w-9 rounded-full shadow-sm"
          onClick={togglePlayPause}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 fill-current" />
          ) : (
            <Play className="h-4 w-4 fill-current ml-0.5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => skip(10)}
          title="+10s"
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>

      {/* --- Right Side: Info & Scrubber --- */}
      <div className="flex flex-col justify-center flex-1 gap-1 min-w-0">
        <div className="flex justify-between items-center text-xs">
          <span className="font-medium truncate pr-2 text-foreground/90">
            {audio.name}
          </span>
          <span className="font-mono text-muted-foreground shrink-0 tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1} // Lower step allows smoother visual movement
          onValueChange={(val) => {
            // While dragging, update visual state but don't commit to audio yet to prevent stutter
            setIsDragging(true);
            setCurrentTime(val[0]);
          }}
          onValueCommit={(val) => {
            // When drag is released, actually seek the audio
            setIsDragging(false);
            handleSeek(val);
            posthog.capture("audio_seeked", { userId, email });
          }}
          className="w-full cursor-pointer py-1"
        />
      </div>
    </div>
  );
}