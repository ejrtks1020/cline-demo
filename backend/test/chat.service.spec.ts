import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { ChatService } from '../src/chat/application/chat.service';
import { ChatMessage } from '../src/chat/domain/entities/chat-message.entity';
import { ChatSession } from '../src/chat/domain/entities/chat-session.entity';
import { ChatCompletionPort } from '../src/chat/infrastructure/ai/chat-completion.port';
import { IChatRepository } from '../src/chat/infrastructure/repositories/repository.interface';
import { UuidProvider } from '../src/common/providers/uuid.provider';

async function* chunks(...values: string[]): AsyncIterable<string> {
  for (const value of values) yield value;
}

describe('ChatService', () => {
  const user = { id: 'user-id', loginId: 'tester' };
  let sessions: ChatSession[];
  let messages: ChatMessage[];
  let repo: IChatRepository;
  let ai: ChatCompletionPort;
  let service: ChatService;

  beforeEach(() => {
    sessions = [new ChatSession('018f6b8e-7c00-7000-8000-000000000001', user.id, 'New chat', new Date('2024-01-01'), new Date('2024-01-01'))];
    messages = [];
    repo = {
      createSession: jest.fn(async (session) => {
        sessions.push(session);
        return session;
      }),
      findSessionsByUserId: jest.fn(async (userId) => sessions.filter((session) => session.userId === userId)),
      findSessionById: jest.fn(async (id) => sessions.find((session) => session.id === id) ?? null),
      deleteSessionById: jest.fn(async (id) => {
        sessions = sessions.filter((session) => session.id !== id);
        messages = messages.filter((message) => message.sessionId !== id);
      }),
      saveMessage: jest.fn(async (message) => {
        messages.push(message);
        return message;
      }),
      findMessagesBySessionId: jest.fn(async (sessionId) => messages.filter((message) => message.sessionId === sessionId)),
      updateSessionTitleAndTimestamp: jest.fn(async () => undefined),
      touchSession: jest.fn(async () => undefined),
    };
    ai = { stream: jest.fn(() => chunks('안녕', '하세요')) };
    const uuid = { generate: jest.fn().mockReturnValueOnce('msg-user').mockReturnValueOnce('msg-assistant').mockReturnValue('new-session') } as unknown as UuidProvider;
    service = new ChatService(repo, ai, uuid, { get: jest.fn(() => 'system') } as unknown as ConfigService);
  });

  it('creates sessions and verifies ownership', async () => {
    await expect(service.getSession('missing', user)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.createSession({}, user)).resolves.toHaveProperty('title', 'New chat');
  });

  it('streams chunks and saves user/assistant messages', async () => {
    const events: unknown[] = [];
    await service.streamMessage(sessions[0].id, { content: 'hello' }, user, (event) => events.push(event));

    expect(messages.map((message) => message.role)).toEqual(['user', 'assistant']);
    expect(events).toEqual([
      { type: 'chunk', data: '안녕' },
      { type: 'chunk', data: '하세요' },
      { type: 'done', data: '안녕하세요', messageId: 'msg-assistant', sessionId: sessions[0].id },
    ]);
  });

  it('emits error event when AI stream fails', async () => {
    ai.stream = jest.fn(async function* () {
      throw new Error('boom');
    });
    const events: unknown[] = [];
    await service.streamMessage(sessions[0].id, { content: 'hello' }, user, (event) => events.push(event));
    expect(events).toEqual([{ type: 'error', data: 'AI response failed. Please try again.' }]);
  });
});
