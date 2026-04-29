import { User } from '../../domain/entities/user.entity';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByLoginId(loginId: string): Promise<User | null>;
  save(user: User): Promise<User>;
}

export const IUserRepository = Symbol('IUserRepository');
