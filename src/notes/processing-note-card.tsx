import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router';

const ProcessingNoteCard = ({ view, id }) => {
  // Use semantic tokens: border-border, bg-background
  const cardBase = "group relative bg-background border border-border overflow-hidden rounded-xl h-full cursor-pointer hover:border-foreground/30 ";
  const navigate = useNavigate();
  return (
    <div 
     onClick={() => navigate(`/notes/${id}`)}
     className={cn(
      cardBase,
      view === "grid" ? "flex flex-col p-5 min-h-[200px]" : "flex items-center p-3 gap-4"
    )}>
      
      {/* 1. HEADER: Semantic Placeholders */}
      <div className="flex items-center justify-between w-full mb-6 relative z-10">
        {/* Icon placeholder using bg-muted */}
        <div className="w-9 h-9 rounded-md bg-muted/80 border border-border/50" />

        {/* Folder text placeholder using bg-muted */}
        <div className="h-2 w-16 bg-muted rounded-full" />
      </div>

      {/* 2. CONTENT: Structural Bars */}
      <div className="flex-1 space-y-4 relative z-10">
        <div className="space-y-2">
          {/* Title and Subtitle placeholders */}
          <div className="h-4 w-3/4 bg-muted rounded-md" />
          <div className="h-3 w-1/2 bg-muted/60 rounded-md" />
        </div>

        {/* STATUS: Using Shadcn Foreground for High Contrast */}
        <div className="pt-6 flex items-center gap-2">
          <div className="relative flex h-1.5 w-1.5">
            {/* The pulse uses the foreground (Black in light mode) */}
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground/20 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-foreground"></span>
          </div>
          <span className="text-[10px] font-bold text-foreground uppercase tracking-[0.15em]">
            Processing
          </span>
        </div>
      </div>

      {/* 3. FOOTER: Metadata Placeholders */}
      <div className={cn(
        "flex items-center mt-auto pt-4 border-t border-border/50 justify-between relative z-10",
        view === "list" && "border-none pt-0 mt-0 ml-auto"
      )}>
        <div className="flex items-center gap-4">
          {/* Ghost Flag */}
          <div className="w-5 h-4 bg-muted rounded-sm" />
          
          {/* Ghost Timestamp */}
          <div className="h-2 w-24 bg-muted/50 rounded-full" />
        </div>

        {/* Ghost Bell Toggle */}
        <div className="w-8 h-8 rounded-md bg-muted/80 border border-border/50" />
      </div>

      {/* 4. THE SHIMMER: Synchronized sweep using a very subtle gradient */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          repeat: Infinity,
          duration: 2,
          ease: "linear",
        }}
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)",
        }}
      />
    </div>
  );
};

export default ProcessingNoteCard;