import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

// Spinning star matching the reference design
function SpinningStar({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className="v2-spin-star"
    >
      <path d="M12 2.5l2.4 6.1 6.1 2.4-6.1 2.4L12 19.5 9.6 13.4 3.5 11l6.1-2.4z" />
    </svg>
  );
}

const STAGES = [
  'Uploading files',
  'Transcribing audio',
  'Summarizing & structuring',
  'Generating quiz & flashcards',
];

const FUN_MESSAGES = [
  'Sending your files up — hold tight…',
  'Listening closely… every word makes better quiz questions.',
  'Finding the structure: key events, people, causes.',
  'Almost there — writing questions you\u2019ll actually enjoy.',
];

/** Compute average attachment progress (0-1), returns null if no attachments */
function getAttachmentProgress(attachments: any[]): number | null {
  if (!attachments || attachments.length === 0) return null;
  const total = attachments.reduce((sum: number, a: any) => sum + (a.progress ?? 0), 0);
  return total / attachments.length;
}

/** Derive stage & overall percentage from note status + attachments */
export function getNoteProgress(item: any): { stage: number; pct: number; stageLabel: string; funText: string } {
  const status = item?.status;
  const attachments: any[] = item?.attachments || [];
  const avgProgress = getAttachmentProgress(attachments);

  // Uploading (before transcription starts)
  if (status === "pending" || status === "uploading") {
    return { stage: 0, pct: Math.min(17, 10), stageLabel: STAGES[0], funText: FUN_MESSAGES[0] };
  }

  // Summarizing
  if (status === "summarizing") {
    return { stage: 2, pct: 65, stageLabel: STAGES[2], funText: FUN_MESSAGES[2] };
  }

  // Generating quiz
  if (status === "generating" || status === "generating_quiz") {
    return { stage: 3, pct: 88, stageLabel: STAGES[3], funText: FUN_MESSAGES[3] };
  }

  // For any other non-final status (processing, transcribing, or unknown),
  // use attachment progress to drive the display
  if (avgProgress !== null) {
    // All attachments done → advance to summarizing stage
    if (avgProgress >= 1.0) {
      return { stage: 2, pct: 55, stageLabel: STAGES[2], funText: FUN_MESSAGES[2] };
    }
    // Map attachment progress (0-1) to overall pct range 18-52
    const pct = Math.round(18 + avgProgress * 34);
    return { stage: 1, pct: Math.min(52, pct), stageLabel: STAGES[1], funText: FUN_MESSAGES[1] };
  }

  // No attachments, unknown status — show transcribing at low progress
  return { stage: 1, pct: 20, stageLabel: STAGES[1], funText: FUN_MESSAGES[1] };
}

const ProcessingNoteCard = ({ view, item }: { view: string; item: any }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pct, stageLabel, funText } = getNoteProgress(item);

  return (
    <div
      onClick={() => navigate(`/notes/${item.id}`)}
      className={cn(
        "relative cursor-pointer rounded-2xl",
        view === "grid" ? "flex flex-col p-[18px] gap-3" : "flex items-center p-3 gap-4"
      )}
      style={{
        border: "1px dashed var(--v2-mut)",
        background: "var(--v2-panel)",
      }}
    >
      {/* Header: spinning star + stage label + percentage */}
      <div className="flex items-center gap-2.5">
        <span className="text-[var(--v2-ink)]">
          <SpinningStar />
        </span>
        <strong className="text-[14px] text-[var(--v2-ink)] flex-1 truncate">
          {t(stageLabel)}
        </strong>
        <span className="text-[14px] font-bold text-[var(--v2-ink)] tabular-nums shrink-0">
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-[6px] rounded-full overflow-hidden"
        style={{ background: "var(--v2-panel2)" }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${pct}%`,
            background: "var(--v2-ink)",
          }}
        />
      </div>

      {/* Fun motivational text */}
      {view === "grid" && (
        <p className="text-[12.5px] text-[var(--v2-mut)] leading-relaxed">
          {t(funText)}
        </p>
      )}
    </div>
  );
};

export default ProcessingNoteCard;
