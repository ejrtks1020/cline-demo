export type ChatMessageRole = 'user' | 'assistant';

export interface ChatSseEvent {
  type: 'chunk' | 'done' | 'error';
  data: string;
  messageId?: string;
  sessionId?: string;
}
