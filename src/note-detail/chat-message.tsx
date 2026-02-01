import React, { useEffect, useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import CatLogo from "./assets/cat-logo";
import MarkdownTypewriter from "./markdown-typewriter";
import { QuizDisplay } from "@/components/chat/quiz-display";
import type { QuizData } from "@/components/chat/quiz-display";
import { useTranslation } from "react-i18next";
import { usePostHog } from "posthog-js/react";

// 1. CHANGED: Accept primitive types for better Memoization
interface ChatMessageProps {
  role: "ai" | "user" | "system" | string;
  content: string;
  isStreaming: boolean;
  noteId?: string;
  messageId?: string;
  onRetry?: () => void;
  isLastMessage?: boolean;
}

const ChatMessageItem = ({
  role,
  content,
  isStreaming,
  noteId,
  messageId,
  onRetry,
  isLastMessage,
}: ChatMessageProps) => {
  const { t } = useTranslation();
  const isAi = role === "ai";
  const posthog = usePostHog();

  // Detect empty AI message (not streaming = final state)
  const isEmptyAiMessage =
    isAi &&
    !isStreaming &&
    (!content ||
      content === "" ||
      (() => {
        try {
          const parsed = JSON.parse(content);
          return !parsed.content || parsed.content.trim() === "";
        } catch {
          return !content.trim();
        }
      })());
  const contentJSON = useMemo(() => {
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  }, [content]);

  // 2. LOGIC: Detect if content is our Quiz JSON
  const quizData = useMemo<QuizData | null>(() => {
    if (!isAi || !content) return null;

    // Optimization: Quick check before parsing
    // Check for specific signature to avoid parsing normal text
    if (contentJSON.type === "quiz_ui" && contentJSON.content) {
      try {
        const parsed = JSON.parse(contentJSON.content);
        return parsed as QuizData;
      } catch {
        return {
          error: t("Invalid Quiz"),
          chat_questions: [],
        } as unknown as QuizData;
      }
    }
    return null;
  }, [content, isAi]);

  useEffect(() => {
    if (isEmptyAiMessage) {
      posthog.capture("chat_ai_empty_response", {
        note_id: noteId,
        message_id: messageId,
      });
    }
    // Only track if it's a valid quiz (has questions)
    if (quizData && quizData.chat_questions?.length > 0) {
      // Debounce or relying on unique messageId prevents duplicate counts in analysis usually
      posthog.capture("chat_quiz_rendered", {
        note_id: noteId,
        question_count: quizData.chat_questions.length,
      });
    }
  }, [isEmptyAiMessage, quizData, noteId, messageId, posthog]);

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        !isAi ? "flex-row-reverse" : "flex-row",
      )}
    >
      <Avatar
        className={cn(
          "h-10 w-10 border",
          isAi ? "bg-black hidden sm:flex" : "bg-muted",
        )}
      >
        {isAi ? (
          <CatLogo />
        ) : (
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        )}
      </Avatar>

      <div
        className={cn(
          "relative px-4 py-3 text-sm rounded-2xl whitespace-pre-wrap leading-relaxed",
          !isAi
            ? "max-w-[85%] bg-primary text-primary-foreground rounded-tr-sm"
            : quizData
              ? "max-w-full sm:max-w-[85%] text-foreground rounded-tl-sm w-full"
              : "max-w-full sm:max-w-[85%] bg-muted text-foreground rounded-tl-sm w-full",
        )}
      >
        {/* Loading Indicator for empty initial state */}
        {isAi && isStreaming && contentJSON?.content === "" && (
          <div className="flex items-center gap-1.5 mt-1">
            {[
              "from-neutral-400/50 to-stone-400/50",
              "from-stone-400/50 to-neutral-500/50",
              "from-neutral-500/50 to-neutral-400/50",
            ].map((gradient, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${gradient} animate-pulse`}
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        )}

        {isEmptyAiMessage ? (
          <div className="flex items-center gap-2">
            <span className="text-amber-600 dark:text-amber-400">
              {t("Oops! Something went wrong. Let's try again.")}
            </span>
            {onRetry && isLastMessage && (
              <button
                onClick={() => {
                  posthog.capture("chat_retry_clicked", { note_id: noteId, message_id: messageId });
                  onRetry()
                }}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                {t("Retry")}
              </button>
            )}
          </div>
        ) : quizData ? (
          <QuizDisplay data={quizData} noteId={noteId} messageId={messageId} />
        ) : isAi ? (
          <MarkdownTypewriter
            content={contentJSON?.content}
            isStreaming={isStreaming}
          />
        ) : (
          contentJSON?.content || t("<No content>")
        )}
      </div>
    </div>
  );
};

// 3. OPTIMIZATION: React.memo now works perfectly because we pass strings (primitives)
// Previous messages won't re-render when the store updates the *new* message.
export const ChatMessage = React.memo(ChatMessageItem);
