export class User {
  constructor(
    public readonly id: string,
    public readonly loginId: string,
    public readonly passwordHash: string,
    public readonly name: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
