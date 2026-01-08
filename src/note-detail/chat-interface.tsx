import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as Sentry from "@sentry/react";
// --- Services & Store ---
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useUserStore } from "@/store/userStore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// --- Icons ---
import {
  User,
  Send,
  Loader2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import CatLogo from "./cat-logo";
import Typewriter from "./type-writter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Message } from "@/components/ui/chat-message";
import { useChatStore } from "@/store/chatStore"; // Import the store
import { cn } from "@/lib/utils";



const ChatInterface = ({
  noteName,
  noteId,
}: {
  noteName?: string;
  noteId: string;
}) => {
  const { t } = useTranslation();
  const { companyId } = useUserStore();
  
  // --- ZUSTAND INTEGRATION ---
  const chats = useChatStore((state) => state.chats);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessageContent = useChatStore((state) => state.updateMessageContent);

  // Get messages for THIS specific note, default to empty array
  const messages = chats[noteId] || [];

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
    const hasInitialized = useRef(false);

  // 0. INIT DEFAULT MESSAGE (Robust Logic)
  useEffect(() => {
    // 1. Reset init flag if noteId changes (so we can init a different note)
    hasInitialized.current = false;

    // 2. Get the current state directly from the store (bypassing React render cycles)
    // This ensures we see data even if hydration just finished milliseconds ago
    const currentMessages = useChatStore.getState().chats[noteId] || [];

    // 3. Only add if empty AND we haven't done it yet in this mount cycle
    if (currentMessages.length === 0 && !hasInitialized.current) {
      const initMsg: Message = {
        id: "init-1",
        role: "ai",
        content: t(
          "Hello! I've analyzed your note '{{name}}'. Ask me anything about it!",
          { name: noteName || "Untitled" }
        ),
      };
      
      addMessage(noteId, initMsg);
      hasInitialized.current = true; // Mark as done
    }
  }, [noteId, addMessage, t, noteName]); // Removed messages.length dependency


  // ... Auto-focus and scroll effects remain the same ...
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isLoading, streamingMessageId]); // Depend on length change

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);


  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();

    // 1. Add User Message via Store
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userText,
    };
    addMessage(noteId, userMsg);
    
    setInputValue("");
    setIsLoading(true);
    inputRef.current?.focus();

    // 2. Add AI Placeholder via Store
    const aiMsgId = (Date.now() + 1).toString();
    setStreamingMessageId(aiMsgId);
    
    addMessage(noteId, { id: aiMsgId, role: "ai", content: "" });

    // Prepare History (using the current store state)
    // Note: We use the local 'messages' variable + the new userMsg we just created
    // because Zustand updates might be async in React rendering cycle
    const currentHistory = [...messages, userMsg].map((m) => ({
      role: m.role === "ai" ? "model" : "user",
      message: m.content,
    }));

    let lastIndex = 0;
    let accumulatedContent = ""; // Track content locally for stream updates

    try {
      await axiosInstance.post(
        `${API_BASE_URL}/company/${companyId}/notes/${noteId}/chat`,
        {
          message: userText,
          history: currentHistory,
        },
        {
          timeout: 120000,
          onDownloadProgress: (progressEvent) => {
            const xhr = progressEvent.event.target;
            const fullResponse = xhr.responseText || "";
            const newChunk = fullResponse.substring(lastIndex);

            if (newChunk) {
              lastIndex = fullResponse.length;
              accumulatedContent += newChunk;
              
              // 3. Update AI Message via Store
              updateMessageContent(noteId, aiMsgId, accumulatedContent);
            }
          },
        }
      );
    } catch (error) {
      console.error("Chat error:", error);
      Sentry.captureException(error);

      // Update with error message via Store
      updateMessageContent(
        noteId, 
        aiMsgId, 
        accumulatedContent || t("Sorry, I encountered an error. Please try again.") // Keep text if any exists, else show error
      );
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
      inputRef.current?.focus();
    }
  };

  return (
    // ... JSX REMAINS EXACTLY THE SAME ...
    // ... just ensure you are mapping over the 'messages' const defined from the store ...
     <div className="flex flex-col h-[600px] w-full max-w-3xl mx-auto">
      <ScrollArea className="flex-1 pr-4">
        <div className="flex flex-col gap-4 py-4">
          {messages.map((message) => { 
             const isAi = message.role === "ai";
            // Check if this specific message is the one currently streaming
            const isStreaming = message.id === streamingMessageId;

            return (
              <div
                key={message.id}
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
                    <CatLogo className="h-4 w-4 text-white m-auto" />
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
                  {/* --- RENDER LOGIC --- */}
                  {/* If it's AI, use the Typewriter. If user, show plain text. */}
                  {isAi ? (
                    <Typewriter
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
          })}
          <div ref={scrollRef} className="h-1" />
        </div>
      </ScrollArea>
       <div className="pt-4 border-t bg-background">
        <form
          onSubmit={handleSendMessage}
          className="relative flex items-center w-full"
        >
          <Input
            placeholder={t("Ask something about this note...")}
            ref={inputRef} // 6. Attach the ref here
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            // disabled={isLoading}
            className="pr-12 py-6 rounded-full shadow-sm border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-1.5 rounded-full h-9 w-9 shrink-0 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          {t("AI can make mistakes. Check important info.")}
        </p>
      </div>

    </div>
  );
};



export default ChatInterface;