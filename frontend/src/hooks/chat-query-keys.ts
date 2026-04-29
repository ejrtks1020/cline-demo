export const chatQueryKeys = {
  sessions: () => ['chat-sessions'] as const,
  detail: (id: string) => ['chat-session', id] as const,
};
