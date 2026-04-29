import { EntitySchema } from 'typeorm';

export interface ChatSessionSchemaRecord {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ChatSessionSchema = new EntitySchema<ChatSessionSchemaRecord>({
  name: 'ChatSession',
  tableName: 'chat_sessions',
  columns: {
    id: { type: String, primary: true },
    userId: { type: String },
    title: { type: String, length: 100 },
    createdAt: { type: Date, createDate: true },
    updatedAt: { type: Date, updateDate: true },
  },
  indices: [
    { name: 'idx_chat_sessions_user_id', columns: ['userId'] },
    { name: 'idx_chat_sessions_updated_at', columns: ['updatedAt'] },
  ],
});
