"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import AIIcon from "@/note-detail/assets/ai-icon";

interface AiLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "ripple" | "typing" | "scanner";
  text?: string;
}

export const AiLoader = ({
  variant = "ripple",
  text,
  className,
  ...props
}: AiLoaderProps) => {

  // OPTION 1: The "Ripple" (Best for Voice/Listening or Initial Connection)
  // Creates shockwaves of your brand color expanding outward.
  if (variant === "ripple") {
    return (
      <div className={cn("relative flex flex-col items-center justify-center p-8", className)} {...props}>
        <div className="relative flex items-center justify-center">
          {/* Ripple 1 */}
          <div className="absolute inset-0 rounded-full border border-[#FE5E5F] opacity-0 animate-ripple" />
          {/* Ripple 2 (Delayed) */}
          <div className="absolute inset-0 rounded-full border border-[#C04796] opacity-0 animate-ripple" style={{ animationDelay: "0.5s" }} />
          {/* Ripple 3 (Delayed) */}
          <div className="absolute inset-0 rounded-full border border-[#FE5E5F] opacity-0 animate-ripple" style={{ animationDelay: "1s" }} />
          
          {/* Main Icon */}
          <div className="relative z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 border border-white/10 shadow-lg">
            <AIIcon size={32} />
          </div>
        </div>
        
        {text && (
          <p className="mt-6 text-sm font-medium text-muted-foreground animate-pulse">
            {text}
          </p>
        )}
        <Styles />
      </div>
    );
  }

  // OPTION 2: The "Typing" (Best for Chat/LLM Text Generation)
  // The icon sits next to 3 bouncing dots that use your brand gradient.
  if (variant === "typing") {
    return (
      <div className={cn("flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/30 w-fit", className)} {...props}>
        <AIIcon size={20} className="animate-pulse" />
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full animate-bounce"
              style={{
                background: "linear-gradient(135deg, #FE5E5F 0%, #C04796 100%)",
                animationDelay: `${i * 0.15}s`,
                animationDuration: "1s"
              }}
            />
          ))}
        </div>
        {text && <span className="ml-2 text-sm text-muted-foreground">{text}</span>}
      </div>
    );
  }

  // OPTION 3: The "Scanner" (Best for Analyzing Data/Uploading)
  // A beam of light passes over the icon, revealing it.
  if (variant === "scanner") {
    return (
      <div className={cn("flex flex-col items-center gap-4", className)} {...props}>
        <div className="relative overflow-hidden rounded-xl p-4 bg-muted/20">
          {/* The Icon */}
          <AIIcon size={48} className="opacity-50" />
          
          {/* The Scanning Beam */}
          <div 
            className="absolute inset-0 w-full h-full"
            style={{
              background: "linear-gradient(to bottom, transparent, rgba(254, 94, 95, 0.4), transparent)",
              animation: "scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
              transformOrigin: "top"
            }}
          />
        </div>
        
        {text && (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#FE5E5F] animate-pulse" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              {text}
            </span>
          </div>
        )}
        <Styles />
      </div>
    );
  }

  return null;
};

// CSS Injection for smooth animations
const Styles = () => (
  <style jsx>{`
    @keyframes ripple {
      0% { transform: scale(1); opacity: 0.8; }
      100% { transform: scale(3); opacity: 0; }
    }
    .animate-ripple {
      animation: ripple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite;
    }
    @keyframes scan {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(100%); }
    }
  `}</style>
);