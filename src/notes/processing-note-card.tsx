import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

/** Simple file-type icon — all use currentColor */
export function FileTypeIcon({ type, size = 16 }: { type: string; size?: number }) {
  if (type === "audio") {
    // waveform bars – 5 bars, symmetric
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="4" y1="9" x2="4" y2="15" />
        <line x1="8" y1="5" x2="8" y2="19" />
        <line x1="12" y1="3" x2="12" y2="21" />
        <line x1="16" y1="5" x2="16" y2="19" />
        <line x1="20" y1="9" x2="20" y2="15" />
      </svg>
    );
  }
  if (type === "pdf") {
    // text document with lines
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
        <path d="M14 2v6h6" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="13" y2="17" />
      </svg>
    );
  }
  if (type === "image") {
    // mountain + sun landscape
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="3" />
        <circle cx="8.5" cy="8.5" r="2" />
        <path d="M22 16l-5.5-5.5L4 22" />
      </svg>
    );
  }
  // generic file
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

/** Row of attachment status icons — pulsates the active one */
function AttachmentStatusRow({ attachments }: { attachments: any[] }) {
  if (!attachments || attachments.length < 2) return null;

  // Sort by id so order stays stable across refetches
  const sorted = [...attachments].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));

  return (
    <div className="flex items-center gap-2.5 mt-auto pt-1 justify-end">
      {sorted.map((a: any) => {
        const progress = a.progress ?? 0;
        const done = progress >= 1;
        const inProgress = progress > 0 && !done;

        return (
          <span
            key={a.id}
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300",
              inProgress && "v2-pulse-active",
            )}
            style={{
              color: "var(--v2-ink)",
              background: done ? "var(--v2-panel2)" : "transparent",
              opacity: done ? 1 : inProgress ? 0.8 : 0.2,
            }}
            title={a.file_name || a.file_type}
          >
            <FileTypeIcon type={a.file_type} size={16} />
          </span>
        );
      })}
    </div>
  );
}

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

const STAGE_LABELS: Record<string, string[]> = {
  audio: ['Uploading files', 'Transcribing audio', 'Summarizing & structuring', 'Generating quiz & flashcards'],
  pdf: ['Uploading files', 'Processing PDF', 'Summarizing & structuring', 'Generating quiz & flashcards'],
  image: ['Uploading files', 'Processing image', 'Summarizing & structuring', 'Generating quiz & flashcards'],
  multi: ['Uploading files', 'Processing files', 'Summarizing & structuring', 'Generating quiz & flashcards'],
  youtube: ['Uploading files', 'Transcribing video', 'Summarizing & structuring', 'Generating quiz & flashcards'],
  default: ['Uploading files', 'Processing files', 'Summarizing & structuring', 'Generating quiz & flashcards'],
};

const FUN_MSGS: Record<string, string[]> = {
  audio: ['Sending your files up — hold tight…', 'Listening closely… every word makes better quiz questions.', 'Finding the structure: key events, people, causes.', 'Almost there — writing questions you\u2019ll actually enjoy.'],
  pdf: ['Sending your files up — hold tight…', 'Reading through your document…', 'Finding the structure: key events, people, causes.', 'Almost there — writing questions you\u2019ll actually enjoy.'],
  image: ['Sending your files up — hold tight…', 'Analyzing your image…', 'Finding the structure: key events, people, causes.', 'Almost there — writing questions you\u2019ll actually enjoy.'],
  multi: ['Sending your files up — hold tight…', 'Working through your files…', 'Finding the structure: key events, people, causes.', 'Almost there — writing questions you\u2019ll actually enjoy.'],
  youtube: ['Sending your files up — hold tight…', 'Transcribing the video… every word counts.', 'Finding the structure: key events, people, causes.', 'Almost there — writing questions you\u2019ll actually enjoy.'],
  default: ['Sending your files up — hold tight…', 'Working through your files…', 'Finding the structure: key events, people, causes.', 'Almost there — writing questions you\u2019ll actually enjoy.'],
};

function getStages(noteType?: string) {
  const key = noteType && noteType in STAGE_LABELS ? noteType : 'default';
  return { stages: STAGE_LABELS[key], funMessages: FUN_MSGS[key] };
}

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
  const { stages, funMessages } = getStages(item?.note_type);

  // Uploading (before transcription starts)
  if (status === "pending" || status === "uploading") {
    return { stage: 0, pct: Math.min(17, 10), stageLabel: stages[0], funText: funMessages[0] };
  }

  // Summarizing
  if (status === "summarizing") {
    return { stage: 2, pct: 65, stageLabel: stages[2], funText: funMessages[2] };
  }

  // Generating quiz
  if (status === "generating" || status === "generating_quiz") {
    return { stage: 3, pct: 88, stageLabel: stages[3], funText: funMessages[3] };
  }

  // For any other non-final status (processing, transcribing, or unknown),
  // use attachment progress to drive the display
  if (avgProgress !== null) {
    // All attachments done → advance to summarizing stage
    if (avgProgress >= 1.0) {
      return { stage: 2, pct: 55, stageLabel: stages[2], funText: funMessages[2] };
    }
    // Map attachment progress (0-1) to overall pct range 18-52
    const pct = Math.round(18 + avgProgress * 34);
    return { stage: 1, pct: Math.min(52, pct), stageLabel: stages[1], funText: funMessages[1] };
  }

  // No attachments, unknown status — show processing at low progress
  return { stage: 1, pct: 20, stageLabel: stages[1], funText: funMessages[1] };
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
        view === "grid" ? "flex flex-col p-4 gap-2.5 h-full" : "flex items-center p-3 gap-4"
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

      {/* Per-attachment status icons (only when 2+ attachments) */}
      {view === "grid" && <AttachmentStatusRow attachments={item?.attachments} />}
    </div>
  );
};

export default ProcessingNoteCard;
