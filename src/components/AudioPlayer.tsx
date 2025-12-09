'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Rewind, FastForward } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { usePostHog } from 'posthog-js/react';
import { useUserStore } from '@/store/userStore';


/**
 * A styled audio player for displaying static audio file attachments.
 * @param {object} props
 * @param {{name: string, url: string}} props.audio - The audio file to play.
 */
export function AudioPlayer({ audio }) {
  const posthog = usePostHog();
  const audioRef = useRef(null);
  const { userId, email} = useUserStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Effect to set up audio event listeners
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const setAudioData = () => {
      setDuration(audioElement.duration);
      setCurrentTime(audioElement.currentTime);
    }

    const setAudioTime = () => setCurrentTime(audioElement.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audioElement.addEventListener("loadeddata", setAudioData);
    audioElement.addEventListener("timeupdate", setAudioTime);
    audioElement.addEventListener("play", handlePlay);
    audioElement.addEventListener("pause", handlePause);
    audioElement.addEventListener("ended", handlePause);

    // Cleanup
    return () => {
      audioElement.removeEventListener("loadeddata", setAudioData);
      audioElement.removeEventListener("timeupdate", setAudioTime);
      audioElement.removeEventListener("play", handlePlay);
      audioElement.removeEventListener("pause", handlePause);
      audioElement.removeEventListener("ended", handlePause);
    };
  }, []);

  const togglePlayPause = () => {
    posthog.capture("audio_toggled", { userId, email})
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
  };

  const handleSeek = (value) => {
     posthog.capture("audio_seeked", { userId, email})
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full p-4 space-y-3 border rounded-lg bg-card text-card-foreground">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audio.url} preload="metadata" />

      <p className="text-xs font-semibold truncate">{audio.name}</p>

      {/* --- FAKE Waveform for visual flair --- */}
      {/* This is just a decorative element, not a real visualization */}
     

      {/* --- Progress Bar / Scrubber --- */}
      <div className="space-y-1">
        <Slider
          value={[currentTime]}
          max={duration || 0}
          step={1}
          onValueChange={handleSeek}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* --- Main Controls --- */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => (audioRef.current.currentTime -= 10)}>
          <Rewind className="h-5 w-5" />
        </Button>
        <Button size="sm" className="h-10 w-10 rounded-full" onClick={togglePlayPause}>
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => (audioRef.current.currentTime += 10)}>
          <FastForward className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}