import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { AudioWaveform, Download, StopCircle, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useTranslation } from "react-i18next"; // Import the hook

type Props = {
    file: any,
    onRemove: any;
}

const AudioPreview = ({ file, onRemove }: Props) => {
  const { t } = useTranslation(); // Initialize the hook
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent click events
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
    audio.addEventListener('ended', handlePause); // Also stop when audio finishes

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handlePause);
    };
  }, []);

  return (
    <div className="group relative flex items-center gap-2 bg-muted/50 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted">
      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={file.preview} preload="auto" />

      {/* Play/Pause Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-foreground"
        onClick={togglePlayPause}
      >
        {isPlaying ? <StopCircle className="h-4 w-4" /> : <AudioWaveform className="h-4 w-4" />}
      </Button>
      
      <span className="max-w-[120px] truncate font-medium">{file.name}</span>

      {/* Download Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <a href={file.preview} download={file.name}>
            <Download className="h-4 w-4 text-muted-foreground hover:text-foreground ml-2" />
          </a>
        </TooltipTrigger>
        <TooltipContent><p>{t("Download Recording")}</p></TooltipContent>
      </Tooltip>
      
      {/* Remove Button (from parent) */}
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

export default AudioPreview;