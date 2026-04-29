import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from '../../../domain/entities/chat-message.entity';
import { ChatSession } from '../../../domain/entities/chat-session.entity';
import { IChatRepository } from '../repository.interface';
import { ChatMessageSchema, ChatMessageSchemaRecord } from './chat-message.schema';
import { ChatSessionSchema, ChatSessionSchemaRecord } from './chat-session.schema';

@Injectable()
export class ChatRepository implements IChatRepository {
  constructor(
    @InjectRepository(ChatSessionSchema) private readonly sessionRepository: Repository<ChatSessionSchemaRecord>,
    @InjectRepository(ChatMessageSchema) private readonly messageRepository: Repository<ChatMessageSchemaRecord>,
  ) {}

  async createSession(session: ChatSession): Promise<ChatSession> {
    return this.toSessionDomain(await this.sessionRepository.save(this.toSessionPersistence(session)));
  }

  async findSessionsByUserId(userId: string): Promise<ChatSession[]> {
    const records = await this.sessionRepository.find({ where: { userId }, order: { updatedAt: 'DESC' } });
    return records.map((record) => this.toSessionDomain(record));
  }

  async findSessionById(sessionId: string): Promise<ChatSession | null> {
    const record = await this.sessionRepository.findOneBy({ id: sessionId });
    return record ? this.toSessionDomain(record) : null;
  }

  async deleteSessionById(sessionId: string): Promise<void> {
    await this.messageRepository.delete({ sessionId });
    await this.sessionRepository.delete({ id: sessionId });
  }

  async saveMessage(message: ChatMessage): Promise<ChatMessage> {
    return this.toMessageDomain(await this.messageRepository.save(this.toMessagePersistence(message)));
  }

  async findMessagesBySessionId(sessionId: string): Promise<ChatMessage[]> {
    const records = await this.messageRepository.find({ where: { sessionId }, order: { createdAt: 'ASC' } });
    return records.map((record) => this.toMessageDomain(record));
  }

  async updateSessionTitleAndTimestamp(sessionId: string, title: string, updatedAt: Date): Promise<void> {
    await this.sessionRepository.update({ id: sessionId }, { title, updatedAt });
  }

  async touchSession(sessionId: string, updatedAt: Date): Promise<void> {
    await this.sessionRepository.update({ id: sessionId }, { updatedAt });
  }

  private toSessionDomain(record: ChatSessionSchemaRecord): ChatSession {
    // domain entity와 TypeORM schema 분리를 유지한다.
    return new ChatSession(record.id, record.userId, record.title, record.createdAt, record.updatedAt);
  }

  private toMessageDomain(record: ChatMessageSchemaRecord): ChatMessage {
    return new ChatMessage(record.id, record.userId, record.sessionId, record.role, record.content, record.createdAt);
  }

  private toSessionPersistence(session: ChatSession): ChatSessionSchemaRecord {
    return { id: session.id, userId: session.userId, title: session.title, createdAt: session.createdAt, updatedAt: session.updatedAt };
  }

  private toMessagePersistence(message: ChatMessage): ChatMessageSchemaRecord {
    return { id: message.id, userId: message.userId, sessionId: message.sessionId, role: message.role, content: message.content, createdAt: message.createdAt };
  }
}
