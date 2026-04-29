import { ChatMessage as ChatMessageType } from '@/types';

export function ChatMessage({ message }: { message: Pick<ChatMessageType, 'role' | 'content'> }) {
  const isUser = message.role === 'user';
  return <div className={isUser ? 'text-right' : 'text-left'}><div className={`inline-block max-w-[75%] whitespace-pre-wrap rounded-lg px-3 py-2 ${isUser ? 'bg-slate-900 text-white' : 'bg-white text-slate-900 shadow'}`}>{message.content}</div></div>;
}
