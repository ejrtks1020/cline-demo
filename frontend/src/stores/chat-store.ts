'use client';

import { create } from 'zustand';

interface ChatState {
  isStreaming: boolean;
  streamContent: string;
  error: string | null;
  activeSessionId: string | null;
  startStreaming: (sessionId: string) => void;
  appendChunk: (chunk: string) => void;
  completeStreaming: (_messageId?: string) => void;
  setError: (error: string) => void;
  resetStreaming: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  isStreaming: false,
  streamContent: '',
  error: null,
  activeSessionId: null,
  startStreaming: (sessionId) => set({ isStreaming: true, streamContent: '', error: null, activeSessionId: sessionId }),
  appendChunk: (chunk) => set((state) => ({ streamContent: state.streamContent + chunk })),
  completeStreaming: () => set({ isStreaming: false, streamContent: '', error: null }),
  setError: (error) => set({ isStreaming: false, error }),
  resetStreaming: () => set({ isStreaming: false, streamContent: '', error: null, activeSessionId: null }),
}));
