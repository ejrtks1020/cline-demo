export class ChatMessage {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly sessionId: string,
    public readonly role: 'user' | 'assistant',
    public readonly content: string,
    public readonly createdAt: Date,
  ) {}
}
