import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import * as Sentry from "@sentry/react";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useUserStore } from "@/store/userStore";
import { Send, Loader2, RotateCcw } from "lucide-react";
import { ChatMessage } from "./chat-message";
import { Button } from "@/components/ui/button";
import type { Message } from "@/components/ui/chat-message";
import { useChatStore } from "@/store/chatStore"; 
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { streamWithAuth } from "@/services/streamClient";

interface ChatInterfaceProps {
  noteName?: string;
  noteId: string;
  pendingAction?: { type: 'explain' | 'quiz', text: string } | null;
  onActionComplete?: () => void;
}

const ChatInterface = ({
  noteName,
  noteId,
  pendingAction,
  onActionComplete
}: ChatInterfaceProps) => {
  const { t } = useTranslation();
  const { companyId } = useUserStore();
  
  const chats = useChatStore((state) => state.chats);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessageContent = useChatStore((state) => state.updateMessageContent);
  const clearChat = useChatStore((state) => state.clearChat);

  const messages = chats[noteId] || [];
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialized = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  // --- NEW: Action Processing Guard ---
  // This Ref tracks the last pendingAction object we successfully processed.
  // We use this to compare references and strictly prevent double-firing.
  const processedActionRef = useRef<object | null>(null);

  // --- Init Message ---
  useEffect(() => {
    hasInitialized.current = false;
    const currentMessages = useChatStore.getState().chats[noteId] || [];
    if (currentMessages.length === 0 && !hasInitialized.current) {
      const initMsg: Message = {
        id: "init-1",
        role: "ai",
        content: t("Hello! I've analyzed your note '{{name}}'. Ask me anything about it!", { name: noteName || "Untitled" }),
      };
      addMessage(noteId, initMsg);
      hasInitialized.current = true;
    }
  }, [noteId, addMessage, t, noteName]);

  // --- Scroll Logic ---
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior, block: "end" });
    }
  };

  useEffect(() => { scrollToBottom("smooth"); }, [messages.length, isLoading]);
  
  useEffect(() => {
    if (streamingMessageId && lastMessage?.role === "ai") {
      scrollToBottom("auto"); 
    }
  }, [lastMessage?.content.length, streamingMessageId]);

  useEffect(() => { if (!isLoading) inputRef.current?.focus(); }, [isLoading]);

  const handleClearChat = useCallback(() => {
    if (isLoading) return;
    clearChat(noteId);
    hasInitialized.current = false;
  }, [isLoading, clearChat, noteId]);

  // --- SEND LOGIC ---
  const executeSendMessage = useCallback(async (textOverride?: string) => {
    const textToSend = textOverride || inputValue.trim();
    if (!textToSend || isLoading) return;

    // 1. UI Updates (Optimistic)
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: textToSend };
    addMessage(noteId, userMsg);
    if (!textOverride) setInputValue("");
    
    setIsLoading(true);
    const aiMsgId = (Date.now() + 1).toString();
    setStreamingMessageId(aiMsgId);
    addMessage(noteId, { id: aiMsgId, role: "ai", content: "" });

    // 2. Prepare Data
    const currentStoreMessages = useChatStore.getState().chats[noteId] || [];
    const currentHistory = currentStoreMessages.map((m) => ({
      role: m.role === "ai" ? "model" : "user",
      message: m.content,
    }));

    // 3. Abort Controller
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let accumulatedText = "";

    // 4. CALL THE ROBUST STREAMER
    await streamWithAuth({
      url: `${API_BASE_URL}/company/${companyId}/notes/${noteId}/chat-v4`,
      body: { message: textToSend, history: currentHistory },
      signal: abortController.signal,
      onData: (event, data) => {
        // data is already JSON object here thanks to the helper
        
        if (event === "message" && data.content) {
          accumulatedText += data.content;
          updateMessageContent(noteId, aiMsgId, accumulatedText);
        } 
        else if (event === "quiz_ui" && data.args) {
          // Handle quiz block. 
          // Assuming you parse this JSON string in your ChatMessage component
          // or you can format it here.
          const quizBlock = `${data.args}`;
          accumulatedText += quizBlock;
          updateMessageContent(noteId, aiMsgId, accumulatedText);
        }
      },
      onError: (err) => {
        console.error("Streaming error:", err);
        Sentry.captureException(err);
        updateMessageContent(noteId, aiMsgId, accumulatedText + "\n\n" + t("Error: AI service unavailable."));
      },
      onDone: () => {
        setIsLoading(false);
        setStreamingMessageId(null);
        abortControllerRef.current = null;
        setTimeout(() => scrollToBottom("smooth"), 100);
      }
    });

  }, [inputValue, isLoading, noteId, companyId, addMessage, updateMessageContent, t, scrollToBottom]);
  // --- 3. CRITICAL FIX: STABLE ACTION WATCHER ---
  useEffect(() => {
    // 1. If no action, or already loading, do nothing
    if (!pendingAction || isLoading) return;

    // 2. REF GUARD: If we already processed this EXACT object reference, stop.
    // This prevents the effect from firing multiple times if the parent 
    // re-renders but hasn't cleared the prop yet.
    if (processedActionRef.current === pendingAction) return;

    // 3. Mark as processed IMMEDIATELY
    processedActionRef.current = pendingAction;

    // 4. Construct prompt
    let prompt = "";
    if (pendingAction.type === 'explain') {
      prompt = `${t("Explain this text")}:\n\n"${pendingAction.text}"`;
    } else if (pendingAction.type === 'quiz') {
      prompt = `${t("Generate a quiz based on this text")}:\n\n"${pendingAction.text}"`;
    }

    // 5. Fire & Notify Parent
    if (prompt) {
      // Clear parent state first to minimize race conditions
      if (onActionComplete) onActionComplete();
      
      // Execute logic
      executeSendMessage(prompt);
    }
  }, [pendingAction, isLoading, executeSendMessage, onActionComplete, t]);


  // --- Event Handlers ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      executeSendMessage(); 
      return;
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setInputValue(prev => prev + "\n");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSendMessage();
  };

  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto overflow-hidden">
      <div className="flex-1 w-full overflow-y-auto pr-2 pl-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
        <div className="flex flex-col gap-4 py-4 px-2">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              content={message.content}
              role={message.role}
              isStreaming={message.id === streamingMessageId}
            />
          ))}
          <div ref={scrollRef} className="h-1 w-full" />
        </div>
      </div>
      
      <div className="flex-none pt-4 pb-6 border-t border-zinc-200/50 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm z-10 px-2">
        <form onSubmit={handleSubmit} className="relative flex items-center w-full">
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
                <Button type="button" size="icon" variant="ghost" onClick={handleClearChat} disabled={isLoading || messages.length === 0} className="rounded-full h-9 w-9 shrink-0">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{t("Clear chat history")}</p></TooltipContent>
            </Tooltip>
            <Button type="submit" size="icon" disabled={!inputValue.trim() || isLoading} className="rounded-full h-9 w-9 shrink-0 cursor-pointer">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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