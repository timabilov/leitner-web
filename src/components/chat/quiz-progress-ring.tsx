import React from "react";
import { cn } from "@/lib/utils";

interface QuizProgressRingProps {
  correct: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

// Thresholds - easily adjustable
const THRESHOLD_RED = 0.3;    // <30% = red
const THRESHOLD_YELLOW = 0.65; // <65% = yellow/orange, >=65% = green

function getProgressColor(ratio: number, hasAnswered: boolean): string {
  if (!hasAnswered) {
    return "stroke-muted-foreground/40";
  }
  if (ratio < THRESHOLD_RED) {
    return "stroke-red-400/80 dark:stroke-red-400/70";
  }
  if (ratio < THRESHOLD_YELLOW) {
    return "stroke-amber-400/80 dark:stroke-amber-400/70";
  }
  return "stroke-emerald-400/80 dark:stroke-emerald-400/70";
}

function getTextColor(ratio: number, hasAnswered: boolean): string {
  if (!hasAnswered) {
    return "text-muted-foreground/60";
  }
  if (ratio < THRESHOLD_RED) {
    return "text-red-500/80 dark:text-red-400/70";
  }
  if (ratio < THRESHOLD_YELLOW) {
    return "text-amber-500/80 dark:text-amber-400/70";
  }
  return "text-emerald-500/80 dark:text-emerald-400/70";
}

export const QuizProgressRing: React.FC<QuizProgressRingProps> = ({
  correct,
  total,
  size = 48,
  strokeWidth = 4,
  className,
}) => {
  // No quiz data = render nothing
  if (total === 0) {
    return null;
  }

  const hasAnswered = correct > 0;
  const ratio = correct / total;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = ratio * circumference;
  const offset = circumference - progress;

  const colorClass = getProgressColor(ratio, hasAnswered);
  const textColorClass = getTextColor(ratio, hasAnswered);

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center group",
        "transition-transform duration-300 ease-out hover:scale-105",
        className
      )}
      style={{ width: size, height: size }}
      title={`${correct} / ${total} correct (${Math.round(ratio * 100)}%)`}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle - subtle pulse when no answers */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={cn(
            "stroke-muted-foreground/15 transition-opacity duration-700",
            !hasAnswered && "animate-pulse"
          )}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={cn(
            "transition-all duration-700 ease-out",
            colorClass
          )}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {/* Center text - lighter weight */}
      <span
        className={cn(
          "absolute text-[9px] font-medium leading-none tracking-tight",
          "transition-colors duration-500",
          textColorClass
        )}
      >
        {correct}/{total}
      </span>
    </div>
  );
};
