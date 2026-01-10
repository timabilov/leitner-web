import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import CatLogo from "./assets/cat-logo";
import MarkdownTypewriter from "./markdown-typewriter";
import type { Message } from "@/store/chatStore";

interface ChatMessageProps {
  message: Message;
  isStreaming: boolean;
}

const ChatMessageItem = ({ message, isStreaming }: ChatMessageProps) => {
  const isAi = message.role === "ai";

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
          "relative max-w-[80%] px-4 py-3 text-sm rounded-2xl whitespace-pre-wrap leading-relaxed",
          !isAi
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted text-foreground rounded-tl-sm"
        )}
      >
        {/* If it's AI, use Markdown with Typewriter effect. If user, show plain text. */}
        {isAi ? (
          <MarkdownTypewriter
            content={message.content}
            isStreaming={isStreaming}
          />
        ) : (
          message.content
        )}

        {/* Fallback for initial loading before first chunk arrives */}
        {isAi && isStreaming && message.content.length === 0 && "..."}
      </div>
    </div>
  );
};

// Memoize to prevent re-renders when parent re-renders
export const ChatMessage = React.memo(ChatMessageItem);
