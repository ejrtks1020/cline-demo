import { EntitySchema } from 'typeorm';

export interface ChatMessageSchemaRecord {
  id: string;
  userId: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export const ChatMessageSchema = new EntitySchema<ChatMessageSchemaRecord>({
  name: 'ChatMessage',
  tableName: 'chat_messages',
  columns: {
    id: { type: String, primary: true },
    userId: { type: String },
    sessionId: { type: String },
    role: { type: String },
    content: { type: 'text' },
    createdAt: { type: Date, createDate: true },
  },
  indices: [
    { name: 'idx_chat_messages_user_id', columns: ['userId'] },
    { name: 'idx_chat_messages_session_id', columns: ['sessionId'] },
    { name: 'idx_chat_messages_created_at', columns: ['createdAt'] },
  ],
});
