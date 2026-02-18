import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import * as Sentry from "@sentry/react";
import { API_BASE_URL } from "@/services/config";
import { useUserStore } from "@/store/userStore";
import { Send, Loader2, RotateCcw, MessageCircle } from "lucide-react";
import { ChatMessage } from "./chat-message";
import { Button } from "@/components/ui/button";
import type { Message } from "@/components/ui/chat-message";
import { useChatStore } from "@/store/chatStore"; 
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { streamWithAuth } from "@/services/streamClient";
import { QuizProgressRing } from "@/components/chat/quiz-progress-ring";
import { usePostHog } from "posthog-js/react"; 

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
  const posthog = usePostHog();
  const chats = useChatStore((state) => state.chats);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessageContent = useChatStore((state) => state.updateMessageContent);
  const clearChat = useChatStore((state) => state.clearChat);
  const quizAnswers = useChatStore((state) => state.quizAnswers);

  const messages = chats[noteId] || [];
  const noteQuizAnswers = quizAnswers[noteId] || {};
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  // Calculate quiz progress from messages and answers
  const quizProgress = React.useMemo(() => {
    let totalQuestions = 0;

    // Count total questions from all quiz messages
    for (const msg of messages) {
      if (msg.role !== "ai") continue;
      try {
        const parsed = JSON.parse(msg.content);
        if (parsed.type === "quiz_ui" && parsed.content) {
          const quizData = JSON.parse(parsed.content);
          if (quizData.chat_questions?.length) {
            totalQuestions += quizData.chat_questions.length;
          }
        }
      } catch {
        // Not a quiz message, ignore
      }
    }

    // Count answers from store
    const answeredKeys = Object.keys(noteQuizAnswers);
    const correctCount = answeredKeys.filter((key) => noteQuizAnswers[key] === true).length;

    return { correct: correctCount, total: totalQuestions };
  }, [messages, noteQuizAnswers]);

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
        
        content: JSON.stringify({ type: "message", content: t("Hello! I've analyzed your note '{{name}}'. Ask me anything about it!", { name: noteName || "Untitled" }) }) ,
      };
      addMessage(noteId, initMsg);
      hasInitialized.current = true;
    }
  }, [noteId, addMessage, t, noteName]);

  // --- Scroll Logic ---
  const isInitialMount = useRef(true);

  // Reset on noteId change (tab switch)
  useEffect(() => {
    isInitialMount.current = true;
  }, [noteId]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior, block: "end" });
    }
  };

  useEffect(() => {
    if (isInitialMount.current) {
      scrollToBottom("instant");
      isInitialMount.current = false;
    } else {
      scrollToBottom("smooth");
    }
  }, [messages.length, isLoading]);
  
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
    posthog.capture("chat_cleared", { note_id: noteId });

  }, [isLoading, clearChat, noteId]);

  // --- SEND LOGIC ---
  const executeSendMessage = useCallback(async (textOverride?: string) => {
    const textToSend = textOverride || inputValue.trim();
    if (!textToSend || isLoading) return;
    posthog.capture("chat_message_sent", {
      note_id: noteId,
      is_quick_action: !!textOverride, // True if clicked a button, False if typed
      message_length: textToSend.length
    });


    const userMsg: Message = { 
        id: Date.now().toString(), 
        role: "user", 
        content: JSON.stringify({ type: "message", content: textToSend }) 
    };
    addMessage(noteId, userMsg);
    if (!textOverride) setInputValue("");
    
    setIsLoading(true);

    // --- FIX START: Restore Immediate Loading State ---
    const initialAiId = (Date.now() + 1).toString();
    setStreamingMessageId(initialAiId); // Shows spinner immediately

    // Pre-create the bubble. 
    // We default to 'message'. If the stream sends 'quiz_ui' first, 
    // we will simply overwrite the type in the first update.
    addMessage(noteId, { 
        id: initialAiId, 
        role: "ai", 
        content: JSON.stringify({ type: "message", content: "" }) 
    });
    // --- FIX END ---

    // 2. Abort Control
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // 3. STATE VARIABLES
    let activeMsgId = initialAiId; // Start pointing to the pre-seeded bubble
    let lastEventType: string | null = null; // null = "first byte hasn't arrived"
    let currentRawBuffer = ""; 

    // 4. Prepare History
    const currentStoreMessages = useChatStore.getState().chats[noteId] || [];
    const currentHistory = currentStoreMessages.map((m) => {
        let rawContent = m.content;
        try {
            const parsed = JSON.parse(m.content);
            if (parsed.content) rawContent = parsed.content;
        } catch (e) { }
        return { role: m.role === "ai" ? "model" : "user", message: rawContent };
    });

    await streamWithAuth({
      url: `${API_BASE_URL}/company/${companyId}/notes/${noteId}/chat-v4`,
      body: { message: textToSend, history: currentHistory },
      signal: abortController.signal,
      
      onData: (event, data) => {
        if (event === "done") return; 
        let chunk = "";
        if (event === "message" && !data.args && data.content && data.content.indexOf("type") === 2) {
            posthog.capture("chat_ai_response_quiz_not_parsable", { note_id: noteId, content: data.content });
            Sentry.captureException("chat_ai_response_quiz_not_parsable",  data.content);
        }
        if (event === "message") chunk = data.content || "";
        else if (event === "quiz_ui") chunk = data.args || ""; 
        
        if (!chunk) return; 

        // --- LOGIC UPDATE: Handle Pre-seeded Bubble ---
        
        // Case A: First byte ever. Reuse the pre-seeded bubble.
        if (lastEventType === null) {
            lastEventType = event;
        }
        // Case B: Type switch (Text -> Quiz). Create NEW bubble.
        else if (event !== lastEventType) {
            activeMsgId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            lastEventType = event;
            currentRawBuffer = ""; 

            // Initialize new bubble
            const newPayload = JSON.stringify({ type: event, content: "" });
            addMessage(noteId, { 
                id: activeMsgId, 
                role: "ai", 
                content: newPayload 
            });
            setStreamingMessageId(activeMsgId); 
        }

        // C. ACCUMULATE & WRAP
        if (activeMsgId) {
          currentRawBuffer += chunk;

          // Note: This overwrites the initial "type: message" with "type: quiz_ui" 
          // if the first event was actually a quiz.
          const safePayload = JSON.stringify({
              type: event,          
              content: currentRawBuffer 
          });

          updateMessageContent(noteId, activeMsgId, safePayload);
        }
      },

      onError: (err) => {
        console.error("Streaming error:", err);
        Sentry.captureException(err);
        posthog.capture("chat_ai_streaming_failed", { note_id: noteId });
        const errorMsg = "\n\n" + t("Error: Connection interrupted") + ".";
        
        // If we fail on the very first byte, use the pre-seeded bubble
        const targetId = activeMsgId || initialAiId; 
        
        // If we were typing text, append. Otherwise/If new, hard overwrite or create new.
        // For simplicity: Just append to whatever was active.
        const payload = JSON.stringify({ 
             type: lastEventType || 'message', 
             content: currentRawBuffer + errorMsg 
        });
        updateMessageContent(noteId, targetId, payload);
      },

      onDone: () => {
        setIsLoading(false);
        setStreamingMessageId(null);
        abortControllerRef.current = null;
        setTimeout(() => scrollToBottom("smooth"), 100);
        posthog.capture("chat_ai_response_completed", { note_id: noteId });
      }
    });

}, [inputValue, isLoading, noteId, companyId, addMessage, updateMessageContent, scrollToBottom]);
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
       posthog.capture("chat_action_triggered", {
        note_id: noteId,
        action_type: pendingAction.type
      });

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
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              content={message.content}
              role={message.role}
              isStreaming={message.id === streamingMessageId}
              noteId={noteId}
              messageId={message.id}
              isLastMessage={index === messages.length - 1}
              onRetry={message.role === "ai" ? () => executeSendMessage(t("Please continue with my previous request.")) : undefined}
            />
          ))}
           {/* just fake try to always add ghost bubble to not rely on internal loading as we can have MULTIPLE messages by AI {isLoading && (
              <div className="flex justify-start mb-4 animate-pulse opacity-70">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2 text-xs text-gray-500 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
              </div>
            )}
          */}
          <div ref={scrollRef} className="h-1 w-full" />
        </div>
      </div>
      
      <div className="flex-none pt-4 pb-6 border-t border-zinc-200/50 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm z-10 px-2">
        {/* Quick Action Prefills */}
        {!isLoading && (
          <div className="flex flex-nowrap gap-1.5 mb-3 justify-center">
            {[
              { short: t("Study guide"), full: t("Can you create a study guide?"), id: 1 },
              { short: t("Explain like i'm 5"), full: t("Can you explain like i'm 5?"), id: 2 },
              { short: t("Quiz me"), full: t("Can you generate hard quiz for me?") , id: 3},
            ].map(({ short, full, id }, index) => (
              <button
                key={full}
                type="button"
                onClick={() => {
                  posthog.capture("chat_quick_action_clicked", { action_id: id });
                  executeSendMessage(full)
                }}
                disabled={isLoading}
                className={`
                  items-center gap-1.5 px-3.5 py-1.5 text-[13px] rounded-2xl
                  bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10
                  dark:from-cyan-500/20 dark:via-blue-500/20 dark:to-indigo-500/20
                  border border-blue-200/50 dark:border-blue-500/30
                  text-blue-700 dark:text-blue-300
                  hover:from-cyan-500/20 hover:via-blue-500/20 hover:to-indigo-500/20
                  dark:hover:from-cyan-500/30 dark:hover:via-blue-500/30 dark:hover:to-indigo-500/30
                  hover:border-blue-300/70 dark:hover:border-blue-400/50
                  hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]
                  transition-all duration-300
                  disabled:opacity-50 disabled:cursor-not-allowed
                  min-w-0 shrink
                  ${index === 0 ? "hidden sm:inline-flex" : "inline-flex"}
                `}
              >
                <MessageCircle className="h-3 w-3 opacity-50 shrink-0" />
                <span className="truncate sm:hidden">{short}</span>
                <span className="truncate hidden sm:inline">{full}</span>
              </button>
            ))}
          </div>
        )}
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
            {/* Quiz Progress Ring - only shows when quizzes exist */}
            <QuizProgressRing
              correct={quizProgress.correct}
              total={quizProgress.total}
              size={36}
              strokeWidth={3}
            />
            <Tooltip>
              <TooltipTrigger>
                <Button type="button" size="icon" variant="ghost" onClick={handleClearChat} disabled={isLoading || messages.length === 0} className="rounded-full bg-white dark:bg-zinc-900rounded-full h-9 w-9 shrink-0">
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