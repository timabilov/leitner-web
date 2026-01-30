"use client";

import { GradientProgress } from "@/components/gradient-progress";
import { ExternalLink, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Lottie from "lottie-react";
import successAnimation from './assets/done.json';
import sadCat from './assets/sad-cat.jpeg';

interface NoteCreationToastProps {
  step: string;
  progress: number;
  status: "loading" | "success" | "error";
  noteId?: string | number;
  name?: string | null
  onClick?: () => void;
}

export function NoteCreationToast({ step, progress, status, name, onClick }: NoteCreationToastProps) {
  return (
    <div 
      className={cn(
        // Layout & Size (Standard Sonner Width)
        "pointer-events-auto relative flex md:w-[356px] flex-col gap-3 overflow-hidden w-full",
        // Visuals (Shadcn Toast Styles)
        "rounded-xl border bg-background p-4 shadow-lg transition-all",
        // Conditional Border Color
        "border-border"
      )}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden w-full">
          
          {/* Icon Wrapper */}
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-sm",
            status === "loading" && "bg-secondary text-secondary-foreground",
            // Remove bg color for success so Lottie shows clearly on white/dark
            // status === "success" && "border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900", 
            status === "error" && "bg-destructive/10 text-destructive border-destructive/20"
          )}>
            {status === "loading" && (
              <Loader2 className="h-5 w-5 animate-spin" />
            )}
            
            {/* ✅ LOTTIE ANIMATION FOR SUCCESS */}
            {status === "success" && (
              <div className="w-[180%] h-[180%] flex items-center justify-center">
                 <Lottie 
                    animationData={successAnimation} 
                    loop={false} 
                    autoplay={true}
                 />
              </div>
            )}

            {status === "error" && (
              <img src={sadCat} />
              // <XCircle className="h-5 w-5" />
            )}
          </div>

          {/* Text Content */}
          <div className="flex flex-col gap-1 overflow-hidden w-full">
            <span onClick={onClick} className={`w-full text-sm font-semibold leading-none tracking-tight ${status === "success" ? "underline cursor-pointer" : ""}`}>
              {status === "success" ? <div className=" w-full flex justify-between items-center">{`Analyzing ${name}`}  <ExternalLink className="w-3 h-3 ml-2" /> </div> : status === "error" ? "Error" : "Creating Note"}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {step}
            </span>
          </div>
        </div>

        {/* Percentage Badge */}
        {status === "loading" && (
            <div className="flex h-6 min-w-[2.5rem] items-center justify-center rounded-md bg-secondary px-1.5 text-[10px] font-mono font-medium text-secondary-foreground">
            {Math.round(progress)}%
            </div>
        )}
      </div>

      {/* Progress Bar Row */}
      {/* Added padding-left to align visually with the text start, not the icon */}
      <div className="w-full pl-[52px]"> 
        <GradientProgress 
          value={progress} 
          className="h-1.5" 
        />
      </div>
    </div>
  );
}