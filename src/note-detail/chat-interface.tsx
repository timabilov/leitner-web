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
import { Textarea } from "@/components/ui/textarea"; // Change this from Input



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
  const inputRef = useRef<HTMLTextAreaElement>(null);
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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isLoading]);

  // Keep scrolling to bottom during streaming
  useEffect(() => {
    if (!streamingMessageId) return;

    const scrollToBottom = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "auto" });
      }
    };

    // Use requestAnimationFrame for smooth continuous scrolling
    let rafId: number;
    const scroll = () => {
      scrollToBottom();
      rafId = requestAnimationFrame(scroll);
    };
    rafId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(rafId);
  }, [streamingMessageId]);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // SCENARIO 1: Enter (without modifiers) -> SEND
    if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      handleSendMessage();
      return;
    }

    // SCENARIO 2: Cmd+Enter (Mac) or Ctrl+Enter (Windows) -> Add New Line
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault(); // Stop default generic submit
        setInputValue(prev => prev + "\n"); // Append newline
        // Note: Ideally you'd insert at cursor position, but this is the simple way
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
    inputRef.current?.focus();

    // 2. Add AI Placeholder
    const aiMsgId = (Date.now() + 1).toString();
    setStreamingMessageId(aiMsgId);
    addMessage(noteId, { id: aiMsgId, role: "ai", content: "" });

    const currentHistory = [...messages, userMsg].map((m) => ({
      role: m.role === "ai" ? "model" : "user",
      message: m.content, // Note: If history contains raw JSON of previous quiz, model handles it fine as text
    }));

    let accumulatedContent = ""; 
    let lastIndex = 0;
    let isJsonMode = false; // Flag to stop streaming text updates if we detect JSON

    try {
      await axiosInstance.post(
        `${API_BASE_URL}/company/${companyId}/notes/${noteId}/chat-v2`,
        {
          message: userText,
          history: currentHistory,
        },
        {
          timeout: 120000,
          // We use onDownloadProgress to catch Streaming Text
          onDownloadProgress: (progressEvent) => {
            const xhr = progressEvent.event.target;
            const contentType = xhr.getResponseHeader("Content-Type");
            
            // CRITICAL: If Content-Type is application/json, DO NOT treat as text stream.
            // Wait for the full promise to resolve.
            if (contentType && contentType.includes("application/json")) {
              isJsonMode = true;
              return; 
            }

            // Also check buffer start just in case headers aren't ready (rare but safe)
            const fullResponse = xhr.responseText || "";
            if (fullResponse.trim().startsWith('{"type":"quiz_ui"')) {
                isJsonMode = true;
                return;
            }

            if (!isJsonMode) {
              const newChunk = fullResponse.substring(lastIndex);
              if (newChunk) {
                lastIndex = fullResponse.length;
                accumulatedContent += newChunk;
                updateMessageContent(noteId, aiMsgId, accumulatedContent);
              }
            }
          },
        }
      ).then((response) => {
        // 3. FINAL RESOLUTION
        // If the backend sent a JSON object (Quiz), axios parses it into response.data
        if (response.data && typeof response.data === 'object' && response.data.type === 'quiz_ui') {
            // We stringify the structured data so it fits into our 'content' string field.
            // The ChatMessageItem component detects this string structure and renders the UI.
            const quizString = JSON.stringify(response.data);
            updateMessageContent(noteId, aiMsgId, quizString);
        } 
        // If it was a text stream, accumulatedContent is already accurate, 
        // but let's ensure the final text is synced exactly.
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
          <Textarea
            placeholder={t("Ask something about this note...")}
            ref={inputRef}
            name="prompt"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pr-24 py-3 px-3 rounded-2xl shadow-sm border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary"
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