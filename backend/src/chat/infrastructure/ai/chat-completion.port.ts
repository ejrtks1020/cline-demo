export type ModelMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export interface ChatCompletionPort {
  stream(messages: ModelMessage[]): AsyncIterable<string>;
}

export const CHAT_COMPLETION_PORT = Symbol('CHAT_COMPLETION_PORT');
