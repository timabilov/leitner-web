import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Folder } from "lucide-react";
import ProcessingNoteCard from "./processing-note-card";
import { useFolders } from "@/hooks/use-folders";
import { useSidebar } from "@/components/ui/sidebar";

function usePrevious(value: any) {
  const ref = useRef<any>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

// Reference-style type icons
function NoteTypeIcon({ type }: { type: string }) {
  if (type === "youtube") {
    return (
      <span className="w-5 h-3.5 rounded-[4.5px] bg-[#E5484D] flex items-center justify-center">
        <svg width="8" height="8" viewBox="0 0 24 24" fill="#fff">
          <path d="M8 5.5v13L19.5 12z" />
        </svg>
      </span>
    );
  }
  if (type === "audio") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8.4" stroke="#E5484D" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="4" fill="#E5484D" />
      </svg>
    );
  }
  // Default: document/layers icon
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round">
      <path d="M12 3 3 8l9 5 9-5zM3 12.5l9 5 9-5M3 17l9 5 9-5" />
    </svg>
  );
}

function getNoteMeta(item: any): string {
  const parts: string[] = [];
  if (item.note_type === "youtube") parts.push("YouTube");
  else if (item.note_type === "audio") parts.push("Audio");
  else if (item.note_type === "pdf") parts.push("PDF");
  else if (item.note_type === "image") parts.push("Image");
  else if (item.note_type === "multi") parts.push("Multi");

  if (item.duration_minutes) parts.push(`${item.duration_minutes} min`);
  if (item.attachment_count) parts.push(`${item.attachment_count} file${item.attachment_count > 1 ? "s" : ""}`);

  return parts.join(" · ") || "";
}

function getScoreInfo(item: any): { label: string; color: string; bg: string } | null {
  if (item.quiz_score !== undefined && item.quiz_score !== null && item.quiz_total) {
    return {
      label: `Quiz ${item.quiz_score}/${item.quiz_total}`,
      color: "var(--v2-ok)",
      bg: "color-mix(in srgb, var(--v2-ok) 12%, transparent)",
    };
  }
  if (item.quiz_alerts_enabled) {
    return {
      label: "New quiz ready",
      color: "var(--v2-ink)",
      bg: "var(--v2-panel2)",
    };
  }
  return null;
}

export const NoteCard = ({ item, view }: { item: any; view: string }) => {
  const { data = [] } = useFolders();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setOpen } = useSidebar();

  const isProcessing =
    item?.status !== "failed" &&
    item?.status !== "transcribed" &&
    item?.status !== "draft";
  const folderName = item.folder_id
    ? (data as any)?.folders?.find((f: any) => f.id === item.folder_id)?.name
    : t("All notes");

  const wasProcessing = usePrevious(isProcessing);
  const justFinished = wasProcessing === true && isProcessing === false;

  const meta = getNoteMeta(item);
  const score = getScoreInfo(item);
  const dateStr = new Date(item.created_at)?.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className={cn("relative max-w-full", view === "grid" ? "h-full" : "h-auto")}>
      {isProcessing ? (
        <motion.div
          key="processing"
          exit={{ opacity: 0, scale: 0.8, filter: "brightness(2) blur(10px)" }}
          transition={{ duration: 0.4 }}
          className="h-full w-full"
        >
          <ProcessingNoteCard view={view} item={item} />
        </motion.div>
      ) : (
        <motion.button
          layout
          key="content"
          onClick={() => {
            setOpen(false);
            navigate(`/notes/${item.id}`);
          }}
          initial={justFinished ? "hidden" : false}
          animate="visible"
          variants={{
            hidden: { opacity: 0, scale: 0.9 },
            visible: {
              opacity: 1,
              scale: 1,
              transition: { type: "spring", stiffness: 200, damping: 20 },
            },
          }}
          className={cn(
            "group relative w-full text-left rounded-2xl border cursor-pointer transition-all duration-150",
            "hover:-translate-y-0.5 hover:shadow-[var(--v2-shadow)]",
            view === "grid"
              ? "flex flex-col p-4 gap-2.5"
              : "flex items-center p-3 gap-4"
          )}
          style={{
            background: "var(--v2-panel)",
            borderColor: "var(--v2-line)",
            color: "var(--v2-ink)",
          }}
        >
          {/* Row 1: Type icon + Folder tag */}
          <div className="flex items-center justify-between w-full">
            <div
              className="w-8 h-8 rounded-[10px] flex items-center justify-center"
              style={{ background: "var(--v2-panel2)", color: "var(--v2-mut)" }}
            >
              <NoteTypeIcon type={item.note_type} />
            </div>
            <span
              className="text-[11px] font-bold tracking-[0.08em] uppercase inline-flex items-center gap-1.5"
              style={{ color: "var(--v2-mut)" }}
            >
              <Folder className="w-3 h-3" strokeWidth={1.8} />
              {folderName}
            </span>
          </div>

          {/* Row 2: Title */}
          <strong className="text-[15px] font-heading font-bold tracking-[-0.01em] leading-snug line-clamp-2">
            {item.name || t("Untitled Note")}
          </strong>

          {/* Row 3: Meta */}
          {meta && (
            <span className="text-[12.5px] text-[var(--v2-mut)]">{meta}</span>
          )}

          {/* Row 4: Score + Date */}
          <div className="flex items-center justify-between w-full mt-auto pt-1">
            {score ? (
              <span
                className="text-[11.5px] font-semibold rounded-full px-2.5 py-0.5"
                style={{ color: score.color, background: score.bg }}
              >
                {score.label}
              </span>
            ) : (
              <span />
            )}
            <span className="text-[11.5px] text-[var(--v2-mut)]">{dateStr}</span>
          </div>
        </motion.button>
      )}
    </div>
  );
};
