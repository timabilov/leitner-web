import React, { useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import CatLogo from "./assets/cat-logo"; // Assuming this exists per your code
import MarkdownTypewriter from "./markdown-typewriter"; // Assuming this exists per your code
import type { Message } from "@/store/chatStore";
import { QuizDisplay } from "@/components/chat/quiz-display"; // Import the new component
import type { QuizData } from "@/components/chat/quiz-display"; // Import the new component

interface ChatMessageProps {
  message: Message;
  isStreaming: boolean;
}

const ChatMessageItem = ({ message, isStreaming }: ChatMessageProps) => {
  const isAi = message.role === "ai";

  // --- LOGIC: Detect if content is our Quiz JSON ---
  const quizData = useMemo<QuizData | null>(() => {
    if (!isAi || !message.content) return null;
    
    // Optimization: Only try to parse if it looks like JSON object start
    // The backend wrapper sends { "type": "quiz_ui", "data": ... }
    const trimmed = message.content.trim();
    if (trimmed.startsWith("{") && trimmed.includes("quiz_ui")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.type === "quiz_ui" && parsed.data) {
          return parsed.data as QuizData;
        }
      } catch (e) {
        // If parsing fails (e.g. streaming chunks incomplete), return null
        // We gracefully fall back to text until stream completes or if it's just text.
        return null;
      }
    }
    return null;
  }, [message.content, isAi]);

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        !isAi ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar
        className={cn(
          "h-10 w-10 border",
          isAi ? "bg-black" : "bg-muted"
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
          "relative max-w-[85%] px-4 py-3 text-sm rounded-2xl whitespace-pre-wrap leading-relaxed",
          !isAi
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted text-foreground rounded-tl-sm w-full"
        )}
      >
        {/* RENDER LOGIC: If we successfully parsed Quiz Data, show Quiz UI. Else Show Text. */}
        {quizData ? (
          <QuizDisplay data={quizData} />
        ) : isAi ? (
          <MarkdownTypewriter
            content={message.content}
            isStreaming={isStreaming}
          />
        ) : (
          message.content
        )}

        {/* Loading Indicator */}
        {isAi && isStreaming && message.content.length === 0 && (
           <span className="animate-pulse">...</span>
        )}
      </div>
    </div>
  );
};

export const ChatMessage = React.memo(ChatMessageItem);