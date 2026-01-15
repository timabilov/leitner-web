import React, { useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import CatLogo from "./assets/cat-logo"; 
import MarkdownTypewriter from "./markdown-typewriter"; 
import { QuizDisplay } from "@/components/chat/quiz-display"; 
import type { QuizData } from "@/components/chat/quiz-display"; 

// 1. CHANGED: Accept primitive types for better Memoization
interface ChatMessageProps {
  role: "ai" | "user" | "system" | string;
  content: string;
  isStreaming: boolean;
}

const ChatMessageItem = ({ role, content, isStreaming }: ChatMessageProps) => {
  const isAi = role === "ai";

  // 2. LOGIC: Detect if content is our Quiz JSON
  const quizData = useMemo<QuizData | null>(() => {
    if (!isAi || !content) return null;
    
    // Optimization: Quick check before parsing
    const trimmed = content.trim();
    // Check for specific signature to avoid parsing normal text
    if (trimmed.startsWith("{") && trimmed.includes("quiz_ui")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.type === "quiz_ui" && parsed.data) {
          return parsed.data as QuizData;
        }
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [content, isAi]);

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
        {quizData ? (
          <QuizDisplay data={quizData} />
        ) : isAi ? (
          // Typewriter handles the animation based on isStreaming and content updates
          <MarkdownTypewriter
            content={content}
            isStreaming={isStreaming}
          />
        ) : (
          content
        )}

        {/* Loading Indicator for empty initial state */}
        {isAi && isStreaming && content.length === 0 && (
           <span className="animate-pulse">...</span>
        )}
      </div>
    </div>
  );
};

// 3. OPTIMIZATION: React.memo now works perfectly because we pass strings (primitives)
// Previous messages won't re-render when the store updates the *new* message.
export const ChatMessage = React.memo(ChatMessageItem);