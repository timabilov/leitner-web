import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import * as Sentry from "@sentry/react";
// --- Services & Store ---
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useUserStore } from "@/store/userStore";

// --- Icons ---
import {
  Send,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./chat-message";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Message } from "@/components/ui/chat-message";
import { useChatStore } from "@/store/chatStore"; // Import the store
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";



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
  const clearChat = useChatStore((state) => state.clearChat);

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


  const handleClearChat = useCallback(() => {
    if (isLoading) return; // Don't clear while loading
    clearChat(noteId);
    hasInitialized.current = false; // Reset so init message shows again
  }, [isLoading, clearChat, noteId]);

  const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
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
  }, [inputValue, isLoading, messages, noteId, companyId, addMessage, updateMessageContent, t]);

  return (
     <div className="flex flex-col h-[600px] w-full max-w-3xl mx-auto">
      <ScrollArea className="flex-1 pr-4">
        <div className="flex flex-col gap-4 py-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isStreaming={message.id === streamingMessageId}
            />
          ))}
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
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="pr-24 py-6 rounded-full shadow-sm border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary"
          />
          <div className="absolute right-1.5 flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={handleClearChat}
                  disabled={isLoading || messages.length === 0}
                  className="rounded-full h-9 w-9 shrink-0"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("Clear chat history")}</p>
              </TooltipContent>
            </Tooltip>
            <Button
              type="submit"
              size="icon"
              disabled={!inputValue.trim() || isLoading}
              className="rounded-full h-9 w-9 shrink-0 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          {t("AI can make mistakes. Check important info.")}
        </p>
      </div>

    </div>
  );
};



export default ChatInterface;