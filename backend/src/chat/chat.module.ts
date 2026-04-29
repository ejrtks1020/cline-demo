import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UuidProvider } from '../common/providers/uuid.provider';
import { ChatController } from './application/chat.controller';
import { ChatService } from './application/chat.service';
import { CHAT_COMPLETION_PORT } from './infrastructure/ai/chat-completion.port';
import { OpenAiChatCompletionAdapter } from './infrastructure/ai/openai-chat-completion.adapter';
import { IChatRepository } from './infrastructure/repositories/repository.interface';
import { ChatMessageSchema } from './infrastructure/repositories/postgres/chat-message.schema';
import { ChatRepository } from './infrastructure/repositories/postgres/chat.repository';
import { ChatSessionSchema } from './infrastructure/repositories/postgres/chat-session.schema';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([ChatSessionSchema, ChatMessageSchema])],
  controllers: [ChatController],
  providers: [ChatService, UuidProvider, { provide: IChatRepository, useClass: ChatRepository }, { provide: CHAT_COMPLETION_PORT, useClass: OpenAiChatCompletionAdapter }],
})
export class ChatModule {}
