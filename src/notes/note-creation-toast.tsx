"use client";

import { cn } from "@/lib/utils";
import Lottie from "lottie-react";
import successAnimation from "./assets/done.json";
import sadCat from "./assets/sad-cat.jpeg";
import { useTranslation } from "react-i18next";

// Spinning star SVG matching the reference design
function SpinningStar({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 2.5l2.4 6.1 6.1 2.4-6.1 2.4L12 19.5 9.6 13.4 3.5 11l6.1-2.4z" />
    </svg>
  );
}

interface NoteCreationToastProps {
  step: string;
  progress: number;
  status: "loading" | "success" | "error";
  onClick?: () => void;
}

export function NoteCreationToast({
  step,
  progress,
  status,
  onClick,
}: NoteCreationToastProps) {
  const { t } = useTranslation();

  const isDone = status === "success";
  const isError = status === "error";

  return (
    <div
      className={cn(
        "pointer-events-auto relative flex w-[320px] max-w-[calc(100vw-32px)] flex-col overflow-hidden",
        "rounded-2xl border p-[14px_15px] transition-all font-sans",
        "border-[var(--v2-line)] shadow-[var(--v2-shadow)]"
      )}
      style={{ background: "var(--v2-panel)" }}
    >
      {/* Header Row: icon + text + percentage */}
      <div className="flex items-center gap-2.5 mb-[9px]">
        {/* Icon */}
        {isError ? (
          <img
            src={sadCat}
            alt=""
            className="w-5 h-5 rounded-full object-cover shrink-0"
          />
        ) : isDone ? (
          <div className="w-5 h-5 shrink-0 flex items-center justify-center">
            <Lottie
              animationData={successAnimation}
              loop={false}
              autoplay={true}
              style={{ width: 28, height: 28 }}
            />
          </div>
        ) : (
          <span className="text-[var(--v2-ink)] shrink-0">
            <SpinningStar className="v2-spin-star" />
          </span>
        )}

        {/* Title + subtitle */}
        <div className="flex-1 min-w-0">
          <strong className="text-[13.5px] text-[var(--v2-ink)] block leading-tight">
            {isError
              ? t("Error")
              : isDone
                ? t("Note is ready")
                : t("Creating note")}
          </strong>
          <span className="text-[12px] text-[var(--v2-mut)] truncate block">
            {isDone ? t("Everything is ready") : step}
          </span>
        </div>

        {/* Percentage */}
        {!isError && (
          <span className="text-[14px] font-extrabold text-[var(--v2-ink)] tabular-nums shrink-0 ml-auto">
            {isDone ? "100" : Math.round(progress)}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div
        className="h-[6px] rounded-full overflow-hidden mb-[10px]"
        style={{ background: "var(--v2-panel2)" }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${isDone ? 100 : progress}%`,
            background: "var(--v2-ink)",
          }}
        />
      </div>

      {/* Action button */}
      {isDone ? (
        <button
          onClick={onClick}
          className="w-full h-[34px] rounded-[10px] border-none text-[13px] font-bold cursor-pointer transition-all"
          style={{
            background: "var(--v2-ink)",
            color: "var(--v2-bg)",
          }}
        >
          {t("Open note")}
        </button>
      ) : isError ? null : (
        <button
          onClick={onClick}
          className="w-full h-[34px] rounded-[10px] border text-[13px] font-bold cursor-pointer transition-all"
          style={{
            borderColor: "var(--v2-line)",
            background: "var(--v2-panel)",
            color: "var(--v2-ink)",
          }}
        >
          {t("Watch it build")}
        </button>
      )}
    </div>
  );
}
