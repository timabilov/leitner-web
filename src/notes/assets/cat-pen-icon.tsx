import { cn } from "@/lib/utils";

const CatPenIcon = ({ size = 32, className }: { size?: number; className?: string }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("transition-all duration-300", className)}
    >
      {/* Head + ears silhouette */}
      <path
        d="M14 30 L20 12 L28 25 Q32 22 36 25 L44 12 L50 30 Q54 34 54 40 C54 52 44 58 32 58 C20 58 10 52 10 40 Q10 34 14 30Z"
        fill="var(--v2-ink)"
      />
      {/* Inner left ear */}
      <path
        d="M19 28 L23 17 L27 26"
        fill="var(--v2-bg)"
        opacity="0.15"
      />
      {/* Inner right ear */}
      <path
        d="M37 26 L41 17 L45 28"
        fill="var(--v2-bg)"
        opacity="0.15"
      />
      {/* Left eye - winking */}
      <path
        d="M21 38 Q25.5 34 30 38"
        stroke="var(--v2-bg)"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Right eye - open */}
      <circle cx="40" cy="36" r="3" fill="var(--v2-bg)" />
      {/* Nose */}
      <ellipse cx="34" cy="42" rx="1.8" ry="1.4" fill="var(--v2-bg)" />
      {/* Smile */}
      <path
        d="M29 45 Q31.5 49 34 45 Q36.5 49 39 45"
        stroke="var(--v2-bg)"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};

export default CatPenIcon;
