import { ChatMessage } from '../../domain/entities/chat-message.entity';
import { ChatSession } from '../../domain/entities/chat-session.entity';

export interface IChatRepository {
  createSession(session: ChatSession): Promise<ChatSession>;
  findSessionsByUserId(userId: string): Promise<ChatSession[]>;
  findSessionById(sessionId: string): Promise<ChatSession | null>;
  deleteSessionById(sessionId: string): Promise<void>;
  saveMessage(message: ChatMessage): Promise<ChatMessage>;
  findMessagesBySessionId(sessionId: string): Promise<ChatMessage[]>;
  updateSessionTitleAndTimestamp(sessionId: string, title: string, updatedAt: Date): Promise<void>;
  touchSession(sessionId: string, updatedAt: Date): Promise<void>;
}

export const IChatRepository = Symbol('IChatRepository');
