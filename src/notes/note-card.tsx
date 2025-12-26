import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { GradientProgress } from "@/components/gradient-progress";
import { SortableItem } from "./sortable";
import { 
  BellRing, BellOff, TriangleAlert, 
  Folder, Clock 
} from "lucide-react";
import { getTypeIcon, getNoteLanguageIso } from "./note-utils";
import ProcessingNoteCard from './processing-note-card';

export const NoteCard = ({ item, view }) => {
  const { folders } = useUserStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isProcessing = item?.status !== "failed" && item?.status !== "transcribed" && item?.status !== "draft";
  const hasError = !!item?.processing_error_message;
  const progress = item?.note_progress || 0;
  const folderName = item.folder_id ? folders?.find(f => f.id === item.folder_id)?.name : t("All notes");

  // Semantic Shadcn tokens: bg-card, border-border, text-card-foreground
  const cardBase = "group relative bg-card border border-border transition-all duration-200 hover:border-foreground/30 overflow-hidden cursor-pointer rounded-xl";

  if (isProcessing) {
    return <ProcessingNoteCard view={view} />;
  }

  return (
    <SortableItem key={item.id} value={item.id}>
      <motion.div
        layout
        onClick={() => navigate(`/notes/${item.id}`)}
        className={cn(
          cardBase,
          view === "grid" ? "flex flex-col p-5 h-full" : "flex items-center p-3 gap-4"
        )}
      >
        {/* --- HEADER: ICON & FOLDER TEXT --- */}
        <div className="flex items-center justify-between w-full mb-4">
          {/* Icon Box using bg-muted */}
          <div className={cn(
            "flex items-center justify-center rounded-md border border-border/50 bg-muted/50 text-muted-foreground transition-colors group-hover:bg-background group-hover:text-foreground",
            view === "grid" ? "w-9 h-9" : "w-8 h-8"
          )}>
            {getTypeIcon(item.note_type, 16)}
          </div>

          {/* Folder info using text-muted-foreground */}
          <div className="flex items-center gap-1.5 text-muted-foreground/80">
            <Folder size={12} strokeWidth={2.5} />
            <span className="text-[10px] font-bold uppercase tracking-widest transition-colors group-hover:text-muted-foreground">
              {folderName}
            </span>
          </div>
        </div>

        {/* --- CONTENT SECTION --- */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            {hasError && <TriangleAlert className="text-destructive w-4 h-4 shrink-0 mt-0.5" />}
            <h4 className="text-sm font-bold   truncate group-hover:text-foreground transition-colors">
              {item.name || t("Untitled Note")}
            </h4>
          </div>

          {/* PROGRESS BAR */}
          {progress > 0 && progress < 1 && !isProcessing && (
            <div className="mt-3 w-3/4">
               <GradientProgress value={Math.round(progress * 100)} className="h-1" />
            </div>
          )}
        </div>

        {/* --- METADATA SECTION --- */}
        <div className={cn(
          "flex items-center",
          view === "grid" ? "mt-auto pt-4 border-t border-border/40 justify-between" : "ml-auto gap-6"
        )}>
          <div className="flex items-center gap-3">
            {/* Language Flag with grayscale effect */}
            <span className="text-base select-none grayscale-[0.4] group-hover:grayscale-0 transition-all opacity-90">
              {getNoteLanguageIso(item.language)}
            </span>
            
            {/* Date using muted-foreground */}
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

          {/* ALERT TOGGLE (Shadcn Primary/Muted pattern) */}
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
    </SortableItem>
  );
};