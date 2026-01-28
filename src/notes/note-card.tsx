import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { 
  BellRing, BellOff, TriangleAlert, 
  Folder, Clock, Sparkles 
} from "lucide-react";
import { getTypeIcon, getNoteLanguageIso } from "./note-utils";
import ProcessingNoteCard from './processing-note-card';
import { GradientProgress } from '@/components/gradient-progress';
import { useFolders } from '@/hooks/use-folders';

// --- HELPER: Track Previous State ---
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

// --- SUB-COMPONENT: The AI Particle Burst ---
// Renders small stars that shoot out from the card
const AiParticleBurst = () => {
  const particles = [
    { x: -10, y: -10, delay: 0 },
    { x: 110, y: -10, delay: 0.1 },
    { x: -10, y: 110, delay: 0.2 },
    { x: 110, y: 110, delay: 0.1 },
    { x: 50, y: -20, delay: 0.05 },
    { x: 50, y: 120, delay: 0.15 },
  ];

  return (
    <>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0, x: "50%", y: "50%" }}
          animate={{ 
            opacity: [0, 1, 0], 
            scale: [0, 1.5, 0],
            left: `${p.x}%`, 
            top: `${p.y}%`,
            rotate: [0, 180]
          }}
          transition={{ duration: 0.8, delay: p.delay, ease: "easeOut" }}
          className="absolute w-4 h-4 text-[#C04796] z-50 pointer-events-none"
        >
          <Sparkles fill="currentColor" className="w-full h-full" />
        </motion.div>
      ))}
    </>
  );
};

export const NoteCard = ({ item, view }) => {
  const { data = [] } = useFolders(); // Uses cached data if available
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isProcessing = item?.status !== "failed" && item?.status !== "transcribed" && item?.status !== "draft";
  const hasError = !!item?.processing_error_message;
  const progress = item?.note_progress || 0;
  const folderName = item.folder_id ? data?.folders?.find(f => f.id === item.folder_id)?.name : t("All notes");

  // Track state transition
  const wasProcessing = usePrevious(isProcessing);
  const justFinished = wasProcessing === true && isProcessing === false;

  const cardBase = "group relative bg-card border border-border transition-all duration-200 hover:border-foreground/30 overflow-hidden cursor-pointer rounded-xl";

  return (
    <div className={cn("relative w-full", view === "grid" ? "h-full min-h-[180px]" : "h-auto")}>
      {/* <AnimatePresence mode="popLayout"> */}
        
        {/* === STATE 1: PROCESSING === */}
        {isProcessing ? (
          <motion.div
            key="processing"
            // Exit: Implode into a singularity (Cyberpunk style)
            exit={{ opacity: 0, scale: 0.8, filter: "brightness(2) blur(10px)" }}
            transition={{ duration: 0.4 }}
            className="h-full w-full"
          >
            <ProcessingNoteCard view={view} id={item.id} />
          </motion.div>
        ) : (
          
          /* === STATE 2: FINISHED === */
          <div key={item.id}  className="h-full w-full">
            <motion.div
              layout
              key="content"
              onClick={() => navigate(`/notes/${item.id}`)}
              
              // Only animate if we just finished processing
              initial={justFinished ? "hidden" : false}
              animate="visible"
              
              variants={{
                hidden: { opacity: 0, scale: 0.9 },
                visible: { 
                  opacity: 1, 
                  scale: 1,
                  transition: { type: "spring", stiffness: 200, damping: 20 }
                }
              }}
              className={cn(
                cardBase,
                view === "grid" ? "flex flex-col p-5 h-full" : "flex items-center p-3 gap-4",
                // If just finished, allow overflow for particles to fly out
                justFinished ? "overflow-visible" : "overflow-hidden"
              )}
            >
              
              {/* === AI EFFECT 1: THE SCANNER BEAM === */}
              {/* A laser beam that wipes down the card to "reveal" it */}
              {justFinished && (
                <motion.div
                  initial={{ top: "-20%", opacity: 1 }}
                  animate={{ top: "120%", opacity: 0 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  className="absolute left-0 right-0 h-12 bg-gradient-to-b from-transparent via-[#FE5E5F]/50 to-transparent z-20 pointer-events-none mix-blend-screen"
                >
                  <div className="w-full h-[2px] bg-[#C04796] shadow-[0_0_10px_#C04796]" />
                </motion.div>
              )}

              {/* === AI EFFECT 2: PRISMATIC BORDER FLASH === */}
              {/* A rotating gradient border that flashes once */}
              {justFinished && (
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 1.5, delay: 0.2 }}
                  className="absolute inset-0 z-10 pointer-events-none rounded-xl"
                  style={{
                    padding: '2px', // Border width
                    background: 'conic-gradient(from 0deg, transparent, #FE5E5F, #C04796, transparent)',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                  }}
                />
              )}

              {/* === AI EFFECT 3: PARTICLE BURST === */}
              {justFinished && <AiParticleBurst />}

              {/* === STANDARD CARD CONTENT === */}
              {/* --- HEADER --- */}
              <div className="relative z-10 flex items-center justify-between w-full mb-4">
                <div className={cn(
                  "flex items-center justify-center rounded-md border border-border/50 bg-muted/50 text-muted-foreground transition-colors group-hover:bg-background group-hover:text-foreground",
                  view === "grid" ? "w-9 h-9" : "w-8 h-8"
                )}>
                  {getTypeIcon(item.note_type, 14)}
                </div>

                <div className="flex items-center gap-1.5 text-muted-foreground/80">
                  <Folder size={12} strokeWidth={2.5} />
                  <span className="text-[10px] font-bold uppercase tracking-widest transition-colors group-hover:text-muted-foreground">
                    {folderName}
                  </span>
                </div>
              </div>

              {/* --- BODY --- */}
              <div className="relative z-10 flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  {hasError && <TriangleAlert className="text-destructive w-4 h-4 shrink-0 mt-0.5" />}
                  <h4 className="text-sm font-bold truncate group-hover:text-foreground transition-colors">
                    {item.name || t("Untitled Note")}
                  </h4>
                </div>

                {progress > 0 && progress < 1 && !isProcessing && (
                  <div className="mt-3 w-full">
                    <GradientProgress value={Math.round(progress * 100)} className="h-1" />
                  </div>
                )}
              </div>

              {/* --- FOOTER --- */}
              <div className={cn(
                "relative z-10 flex items-center",
                view === "grid" ? " pt-4 border-t border-border/40 justify-between mt-4" : "ml-auto gap-6"
              )}>
                <div className="flex items-center gap-3">
                  <span className="text-base select-none grayscale-[0.4] group-hover:grayscale-0 transition-all opacity-90">
                    {getNoteLanguageIso(item.language)}
                  </span>
                  
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock size={11} strokeWidth={2.5} />
                    <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">
                      {new Date(item.created_at)?.toLocaleString("en-US", { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-md transition-colors border",
                      item?.quiz_alerts_enabled 
                        ? "bg-primary border-primary text-primary-foreground" 
                        : "bg-muted border-transparent text-muted-foreground group-hover:border-border group-hover:text-foreground"
                    )}>
                      {item?.quiz_alerts_enabled ? <BellRing size={14} strokeWidth={2.5} /> : <BellOff size={14} />}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="rounded-md bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-2 py-1 border-none">
                    <p>{item?.quiz_alerts_enabled ? t("Alerts Active") : t("Alerts Off")}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </motion.div>
          </div>
        )}
      {/* </AnimatePresence> */}
    </div>
  );
};