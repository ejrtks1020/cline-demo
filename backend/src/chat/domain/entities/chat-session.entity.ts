export class ChatSession {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly title: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
