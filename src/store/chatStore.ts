import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storage, zustandStorage } from "./storage";

export interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
}

interface ChatState {
  // Map noteId to a conversation history
  chats: Record<string, Message[]>;
  
  // Actions
  addMessage: (noteId: string, message: Message) => void;
  updateMessageContent: (noteId: string, messageId: string, newContent: string) => void;
  clearChat: (noteId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: {},
      addMessage: (noteId, message) =>
        set((state) => {
          const currentMessages = state.chats[noteId] || [];
          
          // SAFETY CHECK: If a message with this ID already exists, do nothing
          if (currentMessages.some(m => m.id === message.id)) {
            return state;
          }

          return {
            chats: {
              ...state.chats,
              [noteId]: [...currentMessages, message],
            },
          };
        }),

      updateMessageContent: (noteId, messageId, newContent) =>
        set((state) => {
          const currentMessages = state.chats[noteId] || [];
          const updatedMessages = currentMessages.map((msg) =>
            msg.id === messageId ? { ...msg, content: newContent } : msg
          );
          return {
            chats: {
              ...state.chats,
              [noteId]: updatedMessages,
            },
          };
        }),

      clearChat: (noteId) =>
        set((state) => {
          const newChats = { ...state.chats };
          delete newChats[noteId];
          return { chats: newChats };
        }),
    }),
    {
      name: "chat-history-storage", // Key in localStorage
      storage: createJSONStorage(() => zustandStorage), // Use your custom storage adapter
    }
  )
);