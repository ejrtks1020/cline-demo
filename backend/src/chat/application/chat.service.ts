import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { UuidProvider } from '../../common/providers/uuid.provider';
import { ChatMessage } from '../domain/entities/chat-message.entity';
import { ChatSession } from '../domain/entities/chat-session.entity';
import { CHAT_COMPLETION_PORT, ChatCompletionPort, ModelMessage } from '../infrastructure/ai/chat-completion.port';
import { IChatRepository } from '../infrastructure/repositories/repository.interface';
import { CreateChatSessionCommand, SendChatMessageCommand } from './dto/chat.command';
import { ChatSseEvent } from './dto/chat.dto';
import { ChatMessageResponse, ChatSessionDetailResponse, ChatSessionResponse } from './dto/chat.response';

@Injectable()
export class ChatService {
  constructor(
    @Inject(IChatRepository) private readonly chatRepository: IChatRepository,
    @Inject(CHAT_COMPLETION_PORT) private readonly chatCompletion: ChatCompletionPort,
    private readonly uuidProvider: UuidProvider,
    private readonly configService: ConfigService,
  ) {}

  async listSessions(user: CurrentUserPayload): Promise<ChatSessionResponse[]> {
    return (await this.chatRepository.findSessionsByUserId(user.id)).map((session) => this.toSessionResponse(session));
  }

  async getSession(sessionId: string, user: CurrentUserPayload): Promise<ChatSessionDetailResponse> {
    const session = await this.ensureOwnedSession(sessionId, user.id);
    const messages = await this.chatRepository.findMessagesBySessionId(session.id);
    return { session: this.toSessionResponse(session), messages: messages.map((message) => this.toMessageResponse(message)) };
  }

  async createSession(command: CreateChatSessionCommand, user: CurrentUserPayload): Promise<ChatSessionResponse> {
    const now = new Date();
    const title = command.title || 'New chat';
    const session = await this.chatRepository.createSession(new ChatSession(this.uuidProvider.generate(), user.id, title, now, now));
    return this.toSessionResponse(session);
  }

  async deleteSession(sessionId: string, user: CurrentUserPayload): Promise<void> {
    await this.ensureOwnedSession(sessionId, user.id);
    await this.chatRepository.deleteSessionById(sessionId);
  }

  async streamMessage(sessionId: string, command: SendChatMessageCommand, user: CurrentUserPayload, emit: (event: ChatSseEvent) => void): Promise<void> {
    const session = await this.ensureOwnedSession(sessionId, user.id);
    const previousMessages = await this.chatRepository.findMessagesBySessionId(sessionId);
    const now = new Date();
    await this.chatRepository.saveMessage(new ChatMessage(this.uuidProvider.generate(), user.id, sessionId, 'user', command.content, now));

    let fullContent = '';
    try {
      const modelMessages = this.buildMessagesForModel(previousMessages, command.content);
      for await (const chunk of this.chatCompletion.stream(modelMessages)) {
        fullContent += chunk;
        emit({ type: 'chunk', data: chunk });
      }

      const assistantMessage = await this.chatRepository.saveMessage(new ChatMessage(this.uuidProvider.generate(), user.id, sessionId, 'assistant', fullContent, new Date()));
      if (previousMessages.length === 0 && session.title === 'New chat') {
        await this.chatRepository.updateSessionTitleAndTimestamp(sessionId, this.createDefaultTitle(command.content), new Date());
      } else {
        await this.chatRepository.touchSession(sessionId, new Date());
      }
      emit({ type: 'done', data: fullContent, messageId: assistantMessage.id, sessionId });
    } catch {
      // 내부 에러 세부사항은 client event에 노출하지 않는다.
      emit({ type: 'error', data: 'AI response failed. Please try again.' });
    }
  }

  private async ensureOwnedSession(sessionId: string, userId: string): Promise<ChatSession> {
    const session = await this.chatRepository.findSessionById(sessionId);
    if (!session || session.userId !== userId) throw new NotFoundException('Chat session not found');
    return session;
  }

  private buildMessagesForModel(messages: ChatMessage[], userContent: string): ModelMessage[] {
    const systemPrompt = this.configService.get<string>('OPENAI_SYSTEM_PROMPT') ?? 'You are a helpful assistant.';
    return [{ role: 'system', content: systemPrompt }, ...messages.map((m) => ({ role: m.role, content: m.content })), { role: 'user', content: userContent }];
  }

  private createDefaultTitle(content: string): string {
    return content.slice(0, 40) || 'New chat';
  }

  private toSessionResponse(session: ChatSession): ChatSessionResponse {
    return { id: session.id, title: session.title, createdAt: session.createdAt.toISOString(), updatedAt: session.updatedAt.toISOString() };
  }

  private toMessageResponse(message: ChatMessage): ChatMessageResponse {
    return { id: message.id, sessionId: message.sessionId, role: message.role, content: message.content, createdAt: message.createdAt.toISOString() };
  }
}
