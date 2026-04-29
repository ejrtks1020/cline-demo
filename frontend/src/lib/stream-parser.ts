import { ChatSseEvent } from '@/types';

export function parseSseBuffer(buffer: string): { events: ChatSseEvent[]; remainingBuffer: string } {
  const lines = buffer.split('\n');
  const remainingBuffer = lines.pop() ?? '';
  const events: ChatSseEvent[] = [];

  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    try {
      events.push(JSON.parse(line.slice(6)) as ChatSseEvent);
    } catch {
      // malformed JSON은 스트림 전체를 중단하지 않고 무시한다.
    }
  }
  return { events, remainingBuffer };
}
