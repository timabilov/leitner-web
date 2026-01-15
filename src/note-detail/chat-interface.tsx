import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import * as Sentry from "@sentry/react";
// --- Services & Store ---
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useUserStore } from "@/store/userStore";

// --- Icons & Components ---
import {
  Send,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { ChatMessage } from "./chat-message";
import { Button } from "@/components/ui/button";
import type { Message } from "@/components/ui/chat-message";
import { useChatStore } from "@/store/chatStore"; 
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";

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

  // Get messages for THIS specific note
  const messages = chats[noteId] || [];

  // --- DERIVE STATE FOR SCROLLING ---
  // Memoize last message check to prevent effect loops
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialized = useRef(false);

  // 0. INIT DEFAULT MESSAGE
  useEffect(() => {
    hasInitialized.current = false;
    const currentMessages = useChatStore.getState().chats[noteId] || [];

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
      hasInitialized.current = true;
    }
  }, [noteId, addMessage, t, noteName]);


  // --- 1. SCROLL LOGIC ---
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior, block: "end" });
    }
  };

  // Effect A: Scroll on new message added
  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages.length, isLoading]);

  // Effect B: Scroll WHILE streaming
  // Only scroll if the content length changes (efficient)
  useEffect(() => {
    if (streamingMessageId && lastMessage?.role === "ai") {
      scrollToBottom("auto"); // Instant scroll to prevent stutter
    }
  }, [lastMessage?.content.length, streamingMessageId]);


  // Focus logic
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);


  const handleClearChat = useCallback(() => {
    if (isLoading) return;
    clearChat(noteId);
    hasInitialized.current = false;
  }, [isLoading, clearChat, noteId]);

  // --- KEYDOWN HANDLER ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      handleSendMessage(); 
      return;
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setInputValue(prev => prev + "\n");
    }
  };

  const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault(); 
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();

    // 1. Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userText,
    };
    addMessage(noteId, userMsg);
    
    setInputValue("");
    setIsLoading(true);
    // Micro-task delay to ensure UI updates before focus
    setTimeout(() => inputRef.current?.focus(), 0);

    // 2. Add AI Placeholder
    const aiMsgId = (Date.now() + 1).toString();
    setStreamingMessageId(aiMsgId);
    addMessage(noteId, { id: aiMsgId, role: "ai", content: "" });

    const currentHistory = [...messages, userMsg].map((m) => ({
      role: m.role === "ai" ? "model" : "user",
      message: m.content,
    }));

    let accumulatedContent = ""; 
    let lastIndex = 0;
    let isJsonMode = false;

    try {
      await axiosInstance.post(
        `${API_BASE_URL}/company/${companyId}/notes/${noteId}/chat-v2`,
        {
          message: userText,
          history: currentHistory,
        },
        {
          timeout: 120000,
          onDownloadProgress: (progressEvent) => {
            const xhr = progressEvent.event.target;
            const contentType = xhr.getResponseHeader("Content-Type");
            
            if (contentType && contentType.includes("application/json")) {
              isJsonMode = true;
              return; 
            }

            const fullResponse = xhr.responseText || "";
            // Check for JSON start pattern in stream
            if (fullResponse.trim().startsWith('{"type":"quiz_ui"')) {
                isJsonMode = true;
                return;
            }

            if (!isJsonMode) {
              const newChunk = fullResponse.substring(lastIndex);
              if (newChunk) {
                lastIndex = fullResponse.length;
                accumulatedContent += newChunk;
                // Store update triggers re-render of ChatInterface
                updateMessageContent(noteId, aiMsgId, accumulatedContent);
              }
            }
          },
        }
      ).then((response) => {
        // Handle final response
        if (response.data && typeof response.data === 'object' && response.data.type === 'quiz_ui') {
            const quizString = JSON.stringify(response.data);
            updateMessageContent(noteId, aiMsgId, quizString);
        } 
        else if (typeof response.data === 'string') {
             updateMessageContent(noteId, aiMsgId, response.data);
        }
      });

    } catch (error) {
      console.error("Chat error:", error);
      Sentry.captureException(error);
      updateMessageContent(
        noteId, 
        aiMsgId, 
        accumulatedContent || t("Sorry, I encountered an error. Please try again.")
      );
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
      setTimeout(() => scrollToBottom("smooth"), 100);
    }
  }, [inputValue, isLoading, messages, noteId, companyId, addMessage, updateMessageContent, t]);

  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto overflow-hidden">
      
      {/* 1. SCROLLABLE AREA */}
      <div className="flex-1 w-full overflow-y-auto pr-2 pl-2">
        <div className="flex flex-col gap-4 py-4 px-2">
          {messages.map((message) => (
            // OPTIMIZED: We pass primitives now so React.memo works
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              isStreaming={message.id === streamingMessageId}
            />
          ))}
          <div ref={scrollRef} className="h-1 w-full" />
        </div>
      </div>
      
      {/* 2. INPUT AREA */}
      <div className="flex-none pt-4 pb-6 border-t border-zinc-200/50 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm z-10 px-2">
        <form
          onSubmit={handleSendMessage}
          className="relative flex items-center w-full"
        >
          <Textarea
            placeholder={t("Ask something about this note...")}
            ref={inputRef}
            name="prompt"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pr-24 py-3 px-3 rounded-2xl shadow-sm border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary min-h-[50px] max-h-[150px] resize-none bg-white dark:bg-zinc-900"
            rows={1}
          />
          <div className="absolute right-1.5 flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger>
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